//! Reads the mouse and keyboard straight from Windows while the picture has
//! the pointer.
//!
//! The interface could pass input on, but every move and key would then wait
//! for the web view's event loop and a message across to here, and arrive in
//! bunches whenever the interface is busy. Raw input comes from the drivers to
//! this thread as the devices report it (a thousand times a second for many
//! mice) and goes on to the Bluetooth thread from here, mouse and keys in the
//! order they happened.
//!
//! The web view still captures the pointer, which hides the PC's cursor and
//! keeps it inside the window, and keeps the keys from reaching the rest of
//! the interface. It tells this thread when capturing starts and stops, and
//! how fast the phone's pointer should go. Esc stays with the web view: it is
//! how the person gets their mouse back.
//!
//! Slow, careful movement is slowed down further, so the pointer can be put on
//! a small target (or a game aimed) to the point. An iPhone speeds up quick
//! movement by itself, more the quicker it is, so the quickest sweeps (across
//! a phone on its side, above all) are eased off to make up for it: a sweep
//! then goes as far as the hand does, whatever its pace.
//!
//! An iPhone takes no pinch from a mouse, so Ctrl and the wheel, which zoom
//! on a PC, reach it as ⌘+ and ⌘−: the keys its apps zoom with.

use super::{Command, Pointer};
use std::cell::RefCell;
use std::collections::VecDeque;
use std::sync::atomic::{AtomicBool, AtomicIsize, AtomicU64, Ordering};
use std::sync::mpsc::Sender;
use std::sync::Arc;
use std::time::{Duration, Instant};
use windows::core::w;
use windows::Win32::Foundation::{HWND, LPARAM, LRESULT, WPARAM};
use windows::Win32::Media::{timeBeginPeriod, timeEndPeriod};
use windows::Win32::System::LibraryLoader::GetModuleHandleW;
use windows::Win32::System::Threading::{GetCurrentThread, SetThreadPriority, THREAD_PRIORITY_HIGHEST};
use windows::Win32::UI::Input::{
    GetRawInputData, RegisterRawInputDevices, HRAWINPUT, MOUSE_MOVE_ABSOLUTE, RAWINPUT, RAWINPUTDEVICE,
    RAWINPUTHEADER, RAWKEYBOARD, RAWMOUSE, RIDEV_INPUTSINK, RIDEV_REMOVE, RID_INPUT, RIM_TYPEKEYBOARD,
    RIM_TYPEMOUSE,
};
use windows::Win32::UI::WindowsAndMessaging::{
    CallNextHookEx, CreateWindowExW, DefWindowProcW, DispatchMessageW, GetMessageW, GetSystemMetrics,
    PostMessageW, RegisterClassW, SetWindowsHookExW, TranslateMessage, UnhookWindowsHookEx, HHOOK, HWND_MESSAGE,
    KBDLLHOOKSTRUCT, LLKHF_UP, MSG, RI_KEY_BREAK, RI_KEY_E0, RI_KEY_E1, RI_MOUSE_LEFT_BUTTON_DOWN,
    RI_MOUSE_LEFT_BUTTON_UP, RI_MOUSE_MIDDLE_BUTTON_DOWN, RI_MOUSE_MIDDLE_BUTTON_UP, RI_MOUSE_RIGHT_BUTTON_DOWN,
    RI_MOUSE_RIGHT_BUTTON_UP, RI_MOUSE_WHEEL, SM_CXVIRTUALSCREEN, SM_CYVIRTUALSCREEN, WH_KEYBOARD_LL,
    WINDOW_EX_STYLE, WINDOW_STYLE, WM_APP, WM_INPUT, WNDCLASSW,
};

/// Asks the input thread to start (wParam 1) or stop (0) reading input.
const WM_CAPTURE: u32 = WM_APP + 1;
/// One notch of a wheel, in the units Windows reports it in.
const NOTCH: f64 = 120.0;

/// How fast the hand moves, in mouse counts per millisecond, below which the
/// pointer slows down for precision, and at which it is back to full speed.
/// About 0.8 and 4 cm a second on an 800 DPI mouse: only fine adjustments.
const CAREFUL: f64 = 0.25;
const BRISK: f64 = 1.2;
/// The pointer's speed, as a share of the speed set, at its most careful.
const FINEST: f64 = 0.5;
/// The hand's speed is what it moved over this long. Over a fixed stretch of
/// time, not between reports: Windows hands reports over in bunches when it
/// is busy, and the gaps between them then say nothing.
const WINDOW: Duration = Duration::from_millis(32);
/// How fast, in an iPhone's points per millisecond, the pointer may go before
/// it is eased off to make up for the iPhone's own acceleration, and from what
/// speed it is eased off fully, to `TAMED` of the speed set. A quick sweep
/// across a phone held upright stays under the first; across one on its
/// side, more than twice as far, it goes well over.
const BRISK_POINTS: f64 = 0.9;
const QUICKEST_POINTS: f64 = 3.0;
const TAMED: f64 = 0.62;
/// How long the pointer takes to settle into a new pace, so that slowing
/// down or speeding up is a glide and never a jump.
const EASE_MS: f64 = 40.0;
/// A pause this long starts a new movement.
const STILL_MS: f64 = 60.0;

const VK_LWIN: u32 = 0x5B;
const VK_RWIN: u32 = 0x5C;
/// HID's bits for the left and right GUI keys: ⌘ on an iPhone.
const LEFT_GUI: u8 = 0x08;
const RIGHT_GUI: u8 = 0x80;
/// Both Ctrl keys, in the same layout.
const CTRL: u8 = 0x01 | 0x10;
/// The keypad's + and −, which are the same keys on every keyboard layout.
const KEYPAD_PLUS: u8 = 0x57;
const KEYPAD_MINUS: u8 = 0x56;

pub struct Input {
    window: Arc<AtomicIsize>,
    /// How far the phone's pointer goes per count of the mouse, as f64 bits.
    scale: Arc<AtomicU64>,
    /// The phone is an iPhone or iPad: Ctrl and the wheel zoom it, and its
    /// acceleration is made up for.
    apple: Arc<AtomicBool>,
    /// When Esc was last pressed while capturing, in milliseconds since `epoch`.
    escaped: Arc<AtomicU64>,
    epoch: Instant,
}

impl Input {
    pub fn start(commands: Sender<Command>) -> Self {
        let window = Arc::new(AtomicIsize::new(0));
        let scale = Arc::new(AtomicU64::new(1f64.to_bits()));
        let apple = Arc::new(AtomicBool::new(false));
        let escaped = Arc::new(AtomicU64::new(0));
        let epoch = Instant::now();
        let shared = Shared { scale: scale.clone(), apple: apple.clone(), escaped: escaped.clone(), epoch };
        let slot = window.clone();
        let _ = std::thread::Builder::new()
            .name("remote-input".into())
            .spawn(move || run(commands, slot, shared));
        Self { window, scale, apple, escaped, epoch }
    }

    /// Whether Esc was pressed in the last `within`: the person let go of
    /// the phone on purpose, so the pointer must not be taken back.
    pub fn escaped_within(&self, within: Duration) -> bool {
        let at = self.escaped.load(Ordering::Relaxed);
        at != 0 && (self.epoch.elapsed().as_millis() as u64).saturating_sub(at) < within.as_millis() as u64
    }

    /// Starts or stops reading input for the phone. Called again with a new
    /// `scale` while capturing, it only changes the pointer's speed.
    pub fn capture(&self, captured: bool, scale: f64, apple: bool) {
        self.scale.store(scale.to_bits(), Ordering::Relaxed);
        self.apple.store(apple, Ordering::Relaxed);
        let window = self.window.load(Ordering::SeqCst);
        if window != 0 {
            unsafe {
                let _ = PostMessageW(
                    Some(HWND(window as *mut core::ffi::c_void)),
                    WM_CAPTURE,
                    WPARAM(captured as usize),
                    LPARAM(0),
                );
            }
        }
    }
}

/// What the interface's side shares with the input thread.
struct Shared {
    scale: Arc<AtomicU64>,
    apple: Arc<AtomicBool>,
    escaped: Arc<AtomicU64>,
    epoch: Instant,
}

struct State {
    commands: Sender<Command>,
    shared: Shared,
    captured: bool,
    /// Keeps the Windows key from opening Start while it is the phone's ⌘.
    hook: Option<HHOOK>,
    buttons: u8,
    /// Movement and wheel too small to send yet, kept so slow moves add up.
    x: f64,
    y: f64,
    wheel: f64,
    /// The mouse's latest moves and when they came, over the last `WINDOW`.
    recent: VecDeque<(Instant, f64)>,
    /// The share of the speed set the pointer moves at, and when it was
    /// last worked out.
    gain: f64,
    gain_at: Option<Instant>,
    /// Where an absolute pointing device last was (remote desktops, pens).
    position: Option<(i32, i32)>,
    modifiers: u8,
    /// Keys held down, as HID usages, oldest first.
    keys: Vec<u8>,
}

thread_local! {
    static STATE: RefCell<Option<State>> = const { RefCell::new(None) };
}

fn run(commands: Sender<Command>, slot: Arc<AtomicIsize>, shared: Shared) {
    unsafe {
        // Nothing here takes long, and everything waits on it.
        let _ = SetThreadPriority(GetCurrentThread(), THREAD_PRIORITY_HIGHEST);
        let Ok(instance) = GetModuleHandleW(None) else { return };
        let class = w!("MirlowRemoteInput");
        RegisterClassW(&WNDCLASSW {
            lpfnWndProc: Some(window_proc),
            hInstance: instance.into(),
            lpszClassName: class,
            ..Default::default()
        });
        // A message-only window: never shown, there only to receive input.
        let Ok(window) = CreateWindowExW(
            WINDOW_EX_STYLE(0),
            class,
            w!(""),
            WINDOW_STYLE(0),
            0,
            0,
            0,
            0,
            Some(HWND_MESSAGE),
            None,
            Some(instance.into()),
            None,
        ) else {
            return;
        };
        STATE.with(|cell| {
            *cell.borrow_mut() = Some(State {
                commands,
                shared,
                captured: false,
                hook: None,
                buttons: 0,
                x: 0.0,
                y: 0.0,
                wheel: 0.0,
                recent: VecDeque::new(),
                gain: FINEST,
                gain_at: None,
                position: None,
                modifiers: 0,
                keys: Vec::new(),
            })
        });
        slot.store(window.0 as isize, Ordering::SeqCst);

        let mut message = MSG::default();
        while GetMessageW(&mut message, None, 0, 0).as_bool() {
            let _ = TranslateMessage(&message);
            DispatchMessageW(&message);
        }
    }
}

unsafe extern "system" fn window_proc(window: HWND, message: u32, wparam: WPARAM, lparam: LPARAM) -> LRESULT {
    match message {
        WM_CAPTURE => {
            with_state(|state| state.capture(window, wparam.0 != 0));
            LRESULT(0)
        }
        WM_INPUT => {
            with_state(|state| state.input(HRAWINPUT(lparam.0 as *mut core::ffi::c_void)));
            // Windows tidies up after raw input here.
            DefWindowProcW(window, message, wparam, lparam)
        }
        _ => DefWindowProcW(window, message, wparam, lparam),
    }
}

fn with_state(action: impl FnOnce(&mut State)) {
    STATE.with(|cell| {
        if let Ok(mut state) = cell.try_borrow_mut() {
            if let Some(state) = state.as_mut() {
                action(state);
            }
        }
    });
}

/// Sees every key before Windows acts on it. Only the Windows keys are kept
/// back, and only while capturing, so they reach the phone as ⌘ instead of
/// opening Start. Everything else carries on as usual.
unsafe extern "system" fn keyboard_hook(code: i32, wparam: WPARAM, lparam: LPARAM) -> LRESULT {
    if code >= 0 {
        let key = &*(lparam.0 as *const KBDLLHOOKSTRUCT);
        let bit = match key.vkCode {
            VK_LWIN => LEFT_GUI,
            VK_RWIN => RIGHT_GUI,
            _ => 0,
        };
        if bit != 0 {
            let mut kept = false;
            with_state(|state| {
                if state.captured {
                    kept = true;
                    state.modifier(bit, key.flags.0 & LLKHF_UP.0 == 0);
                }
            });
            if kept {
                return LRESULT(1);
            }
        }
    }
    CallNextHookEx(None, code, wparam, lparam)
}

impl State {
    fn capture(&mut self, window: HWND, captured: bool) {
        if captured == self.captured {
            return;
        }
        let devices = [0x02u16, 0x06].map(|usage| RAWINPUTDEVICE {
            usUsagePage: 0x01, // Generic Desktop: mouse (2) and keyboard (6)
            usUsage: usage,
            // Even while another window of this app has the focus.
            dwFlags: if captured { RIDEV_INPUTSINK } else { RIDEV_REMOVE },
            hwndTarget: if captured { window } else { HWND::default() },
        });
        let registered =
            unsafe { RegisterRawInputDevices(&devices, std::mem::size_of::<RAWINPUTDEVICE>() as u32) }.is_ok();
        if captured {
            if !registered {
                return;
            }
            // Windows' timers tick every 15.6 ms unless asked otherwise, and
            // the Bluetooth thread's pacing waits on them. While the phone is
            // being worked, they tick every millisecond.
            unsafe { timeBeginPeriod(1) };
            let instance = unsafe { GetModuleHandleW(None) }.ok().map(Into::into);
            self.hook = unsafe { SetWindowsHookExW(WH_KEYBOARD_LL, Some(keyboard_hook), instance, 0) }.ok();
        } else {
            unsafe { timeEndPeriod(1) };
            if let Some(hook) = self.hook.take() {
                let _ = unsafe { UnhookWindowsHookEx(hook) };
            }
            // Let go of everything, so nothing stays held on the phone.
            if self.buttons != 0 {
                self.buttons = 0;
                self.pointer(0, 0, 0, true);
            }
            if self.modifiers != 0 || !self.keys.is_empty() {
                self.modifiers = 0;
                self.keys.clear();
                self.send_keys();
            }
            self.x = 0.0;
            self.y = 0.0;
            self.wheel = 0.0;
            self.recent.clear();
            self.gain = FINEST;
            self.gain_at = None;
            self.position = None;
        }
        self.captured = captured;
    }

    fn input(&mut self, handle: HRAWINPUT) {
        if !self.captured {
            return;
        }
        let mut raw = RAWINPUT::default();
        let mut size = std::mem::size_of::<RAWINPUT>() as u32;
        let read = unsafe {
            GetRawInputData(
                handle,
                RID_INPUT,
                Some(&mut raw as *mut RAWINPUT as *mut core::ffi::c_void),
                &mut size,
                std::mem::size_of::<RAWINPUTHEADER>() as u32,
            )
        };
        if read == u32::MAX {
            return;
        }
        if raw.header.dwType == RIM_TYPEMOUSE.0 {
            self.mouse(unsafe { raw.data.mouse });
        } else if raw.header.dwType == RIM_TYPEKEYBOARD.0 {
            self.keyboard(unsafe { raw.data.keyboard });
        }
    }

    fn mouse(&mut self, mouse: RAWMOUSE) {
        let (dx, dy) = if mouse.usFlags.0 & MOUSE_MOVE_ABSOLUTE.0 != 0 {
            // Positions on a 0 to 65535 grid across the screens, not moves.
            let at = (mouse.lLastX, mouse.lLastY);
            let moved = self.position.map_or((0.0, 0.0), |(x, y)| {
                let width = unsafe { GetSystemMetrics(SM_CXVIRTUALSCREEN) } as f64;
                let height = unsafe { GetSystemMetrics(SM_CYVIRTUALSCREEN) } as f64;
                ((at.0 - x) as f64 * width / 65535.0, (at.1 - y) as f64 * height / 65535.0)
            });
            self.position = Some(at);
            moved
        } else {
            (mouse.lLastX as f64, mouse.lLastY as f64)
        };

        let (flags, data) =
            unsafe { (mouse.Anonymous.Anonymous.usButtonFlags as u32, mouse.Anonymous.Anonymous.usButtonData) };
        let before = self.buttons;
        for (down, up, bit) in [
            (RI_MOUSE_LEFT_BUTTON_DOWN, RI_MOUSE_LEFT_BUTTON_UP, 0x01),
            (RI_MOUSE_RIGHT_BUTTON_DOWN, RI_MOUSE_RIGHT_BUTTON_UP, 0x02),
            (RI_MOUSE_MIDDLE_BUTTON_DOWN, RI_MOUSE_MIDDLE_BUTTON_UP, 0x04),
        ] {
            if flags & down != 0 {
                self.buttons |= bit;
            }
            if flags & up != 0 {
                self.buttons &= !bit;
            }
        }
        if flags & RI_MOUSE_WHEEL != 0 {
            // Up is positive for both Windows and HID.
            self.wheel += data as i16 as f64 / NOTCH;
        }

        let scale = f64::from_bits(self.shared.scale.load(Ordering::Relaxed));
        let scale = scale * self.precision(dx, dy, scale);
        self.x += dx * scale;
        self.y += dy * scale;
        let (x, y, wheel) = (self.x.trunc(), self.y.trunc(), self.wheel.trunc());
        self.x -= x;
        self.y -= y;
        self.wheel -= wheel;
        let zooming = wheel != 0.0 && self.modifiers & CTRL != 0 && self.shared.apple.load(Ordering::Relaxed);
        if zooming {
            self.pointer(x as i32, y as i32, 0, self.buttons != before);
            self.zoom(wheel as i32);
        } else {
            self.pointer(x as i32, y as i32, wheel as i32, self.buttons != before);
        }
    }

    /// How much of the speed set the pointer moves at for this movement:
    /// less while the hand moves slowly, all of it once it moves briskly.
    fn precision(&mut self, dx: f64, dy: f64, scale: f64) -> f64 {
        let distance = dx.hypot(dy);
        if distance == 0.0 {
            return self.gain;
        }
        let now = Instant::now();
        self.recent.push_back((now, distance));
        while self.recent.front().is_some_and(|&(at, _)| now.duration_since(at) > WINDOW) {
            self.recent.pop_front();
        }
        let speed = self.recent.iter().map(|&(_, moved)| moved).sum::<f64>() / (WINDOW.as_secs_f64() * 1000.0);
        let mut target = FINEST + (1.0 - FINEST) * ease(CAREFUL, BRISK, speed);
        if self.shared.apple.load(Ordering::Relaxed) {
            // The pointer's own speed on the phone, before easing off.
            let points = speed * scale;
            target *= 1.0 - (1.0 - TAMED) * ease(BRISK_POINTS, QUICKEST_POINTS, points);
        }

        let elapsed = self.gain_at.map_or(f64::INFINITY, |at| now.duration_since(at).as_secs_f64() * 1000.0);
        self.gain_at = Some(now);
        if elapsed > STILL_MS {
            self.gain = target;
        } else {
            self.gain += (target - self.gain) * (elapsed / EASE_MS).min(1.0);
        }
        self.gain
    }

    /// Zooms in (`steps` above 0) or out by that many notches of the wheel:
    /// ⌘ and the keypad's + or −, pressed and let go, with Ctrl let go for
    /// the moment, then the keys as they really are held.
    fn zoom(&self, steps: i32) {
        let key = if steps > 0 { KEYPAD_PLUS } else { KEYPAD_MINUS };
        let modifiers = (self.modifiers & !CTRL) | LEFT_GUI;
        for _ in 0..steps.unsigned_abs().min(8) {
            for keys in [[0; 6], [key, 0, 0, 0, 0, 0], [0; 6]] {
                let _ = self.commands.send(Command::Keys(modifiers, keys));
            }
        }
        self.send_keys();
    }

    fn keyboard(&mut self, key: RAWKEYBOARD) {
        let flags = key.Flags as u32;
        // Pause sends a two-part sequence nothing on a phone uses.
        if flags & RI_KEY_E1 != 0 {
            return;
        }
        let down = flags & RI_KEY_BREAK == 0;
        if key.MakeCode == 0x01 && down {
            // Esc: the web view lets go of the pointer; noted so it stays let go.
            let now = (self.shared.epoch.elapsed().as_millis() as u64).max(1);
            self.shared.escaped.store(now, Ordering::Relaxed);
        }
        let Some(usage) = usage(key.MakeCode, flags & RI_KEY_E0 != 0) else { return };
        match usage {
            Usage::Modifier(bit) => self.modifier(bit, down),
            Usage::Key(usage) => {
                let held = self.keys.contains(&usage);
                if down && !held {
                    self.keys.push(usage);
                } else if !down && held {
                    self.keys.retain(|&key| key != usage);
                } else {
                    // A key held down repeats; the phone repeats it itself.
                    return;
                }
                self.send_keys();
            }
        }
    }

    fn modifier(&mut self, bit: u8, down: bool) {
        let next = if down { self.modifiers | bit } else { self.modifiers & !bit };
        if next != self.modifiers {
            self.modifiers = next;
            self.send_keys();
        }
    }

    fn pointer(&self, dx: i32, dy: i32, wheel: i32, clicked: bool) {
        if dx != 0 || dy != 0 || wheel != 0 || clicked {
            let pointer = Pointer { dx, dy, wheel, buttons: self.buttons, at: Instant::now() };
            let _ = self.commands.send(Command::Pointer(pointer));
        }
    }

    fn send_keys(&self) {
        let mut held = [0u8; 6];
        for (slot, key) in held.iter_mut().zip(&self.keys) {
            *slot = *key;
        }
        let _ = self.commands.send(Command::Keys(self.modifiers, held));
    }
}

/// 0 below `from`, 1 above `to`, and a smooth curve between.
fn ease(from: f64, to: f64, value: f64) -> f64 {
    let t = ((value - from) / (to - from)).clamp(0.0, 1.0);
    t * t * (3.0 - 2.0 * t)
}

enum Usage {
    Modifier(u8),
    Key(u8),
}

/// The HID usage of the key with this scan code, as a keyboard sends it: by
/// its place on the keyboard, so the phone applies its own layout. Esc is
/// left out: it belongs to the PC, to take the mouse back.
fn usage(code: u16, extended: bool) -> Option<Usage> {
    use Usage::{Key, Modifier};
    let usage = match (code, extended) {
        (0x1D, false) => return Some(Modifier(0x01)), // left Ctrl
        (0x2A, false) => return Some(Modifier(0x02)), // left Shift
        (0x38, false) => return Some(Modifier(0x04)), // left Alt
        (0x1D, true) => return Some(Modifier(0x10)),  // right Ctrl
        (0x36, false) => return Some(Modifier(0x20)), // right Shift
        (0x38, true) => return Some(Modifier(0x40)),  // right Alt (AltGr)
        // Windows sends a made-up Shift around some keys; the keyboard did not.
        (0x2A | 0x36, true) => return None,
        (0x02..=0x0A, false) => 0x1E + (code - 0x02) as u8, // 1 to 9
        (0x0B, false) => 0x27,                              // 0
        (0x0C, false) => 0x2D,
        (0x0D, false) => 0x2E,
        (0x0E, false) => 0x2A, // Backspace
        (0x0F, false) => 0x2B, // Tab
        (0x10, false) => 0x14, // Q
        (0x11, false) => 0x1A, // W
        (0x12, false) => 0x08, // E
        (0x13, false) => 0x15, // R
        (0x14, false) => 0x17, // T
        (0x15, false) => 0x1C, // Y
        (0x16, false) => 0x18, // U
        (0x17, false) => 0x0C, // I
        (0x18, false) => 0x12, // O
        (0x19, false) => 0x13, // P
        (0x1A, false) => 0x2F,
        (0x1B, false) => 0x30,
        (0x1C, false) => 0x28, // Enter
        (0x1C, true) => 0x58,  // keypad Enter
        (0x1E, false) => 0x04, // A
        (0x1F, false) => 0x16, // S
        (0x20, false) => 0x07, // D
        (0x21, false) => 0x09, // F
        (0x22, false) => 0x0A, // G
        (0x23, false) => 0x0B, // H
        (0x24, false) => 0x0D, // J
        (0x25, false) => 0x0E, // K
        (0x26, false) => 0x0F, // L
        (0x27, false) => 0x33,
        (0x28, false) => 0x34,
        (0x29, false) => 0x35,
        (0x2B, false) => 0x31,
        (0x2C, false) => 0x1D, // Z
        (0x2D, false) => 0x1B, // X
        (0x2E, false) => 0x06, // C
        (0x2F, false) => 0x19, // V
        (0x30, false) => 0x05, // B
        (0x31, false) => 0x11, // N
        (0x32, false) => 0x10, // M
        (0x33, false) => 0x36,
        (0x34, false) => 0x37,
        (0x35, false) => 0x38,
        (0x35, true) => 0x54, // keypad /
        (0x37, false) => 0x55, // keypad *
        (0x37, true) => 0x46,  // Print Screen
        (0x39, false) => 0x2C, // Space
        (0x3A, false) => 0x39, // Caps Lock
        (0x3B..=0x44, false) => 0x3A + (code - 0x3B) as u8, // F1 to F10
        (0x45, false) => 0x53, // Num Lock
        (0x46, false) => 0x47, // Scroll Lock
        (0x47, false) => 0x5F,
        (0x47, true) => 0x4A, // Home
        (0x48, false) => 0x60,
        (0x48, true) => 0x52, // Up
        (0x49, false) => 0x61,
        (0x49, true) => 0x4B, // Page Up
        (0x4A, false) => 0x56,
        (0x4B, false) => 0x5C,
        (0x4B, true) => 0x50, // Left
        (0x4C, false) => 0x5D,
        (0x4D, false) => 0x5E,
        (0x4D, true) => 0x4F, // Right
        (0x4E, false) => 0x57,
        (0x4F, false) => 0x59,
        (0x4F, true) => 0x4D, // End
        (0x50, false) => 0x5A,
        (0x50, true) => 0x51, // Down
        (0x51, false) => 0x5B,
        (0x51, true) => 0x4E, // Page Down
        (0x52, false) => 0x62,
        (0x52, true) => 0x49, // Insert
        (0x53, false) => 0x63,
        (0x53, true) => 0x4C, // Delete
        (0x56, false) => 0x64, // the extra key by left Shift on many European keyboards
        (0x57, false) => 0x44, // F11
        (0x58, false) => 0x45, // F12
        (0x5D, true) => 0x65,  // Menu
        _ => return None,
    };
    Some(Key(usage))
}
