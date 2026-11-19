//! Places the engine's video window inside the app window.
//!
//! The picture is drawn by GStreamer's Direct3D 11 sink, in a window that
//! belongs to the engine process. A web view cannot show that surface, so
//! instead of pretending otherwise we adopt the window: once the engine opens
//! it, it is made a child of the main window and laid out over the area the
//! interface reserves for it.
//!
//! The adopted window is disabled, so the mouse and keyboard keep going to the
//! interface underneath: double-click, drag and shortcuts all still work.
//!
//! scrcpy's window, which shows an Android phone over Wi-Fi, is adopted the
//! same way but left enabled ([`watch_interactive`]): clicks on it are touches
//! on the phone, and keys typed into it reach the phone.

use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Mutex;
use std::thread;
use std::time::{Duration, Instant};
use tauri::{AppHandle, Manager};

/// A rectangle in physical pixels, relative to the main window's client area.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, serde::Deserialize)]
pub struct Rect {
    pub x: i32,
    pub y: i32,
    pub width: i32,
    pub height: i32,
}

#[derive(Default)]
struct Inner {
    /// The adopted window, or 0.
    hwnd: isize,
    /// True when the window is not the engine's: one of Mirlow's own, or
    /// scrcpy's. Only its keeper puts it away.
    own: bool,
    rect: Rect,
    /// Corner radius of the picture, in physical pixels.
    radius: i32,
    /// Whether the interface wants the picture shown.
    visible: bool,
    /// Kept hidden whatever the interface wants: the device's screen is asleep.
    concealed: bool,
}

impl Inner {
    fn shown(&self) -> bool {
        self.visible && !self.concealed
    }
}

#[derive(Default)]
pub struct Video {
    inner: Mutex<Inner>,
    /// Bumped to cancel a search for the engine's window.
    generation: AtomicU64,
}

/// Starts looking for the video window of process `pid` and adopts it when it
/// appears. Does nothing if a window is already in place.
pub fn watch(app: &AppHandle, pid: u32) {
    let video = app.state::<Video>();
    {
        let inner = video.inner.lock().unwrap();
        if inner.hwnd != 0 && platform::is_window(inner.hwnd) {
            return;
        }
    }
    let generation = video.generation.fetch_add(1, Ordering::SeqCst) + 1;
    let app = app.clone();
    thread::spawn(move || {
        let deadline = Instant::now() + Duration::from_secs(10);
        while Instant::now() < deadline {
            let video = app.state::<Video>();
            if video.generation.load(Ordering::SeqCst) != generation {
                return;
            }
            if let Some(hwnd) = engine_window().or_else(|| platform::find_window(pid)) {
                let Some(parent) = main_hwnd(&app) else { return };
                let mut inner = video.inner.lock().unwrap();
                platform::adopt(hwnd, parent, false);
                inner.hwnd = hwnd;
                inner.own = false;
                platform::place(hwnd, inner.rect, inner.radius, inner.shown());
                return;
            }
            thread::sleep(Duration::from_millis(30));
        }
    });
}

/// Adopts the window of process `pid` when it appears, in place of whatever
/// picture is there, and leaves it taking the mouse and keyboard itself.
/// `shown` is then told the window's handle and the size it opened at, before
/// it was laid out; the window is the caller's to [`release`].
pub fn watch_interactive(app: &AppHandle, pid: u32, shown: impl FnOnce(isize, i32, i32) + Send + 'static) {
    let video = app.state::<Video>();
    let generation = video.generation.fetch_add(1, Ordering::SeqCst) + 1;
    let app = app.clone();
    thread::spawn(move || {
        let deadline = Instant::now() + Duration::from_secs(30);
        while Instant::now() < deadline {
            let video = app.state::<Video>();
            if video.generation.load(Ordering::SeqCst) != generation {
                return;
            }
            if let Some(hwnd) = platform::find_window(pid) {
                let Some(parent) = main_hwnd(&app) else { return };
                let (width, height) = platform::size(hwnd).unwrap_or((0, 0));
                {
                    let mut inner = video.inner.lock().unwrap();
                    if inner.hwnd != 0 && inner.hwnd != hwnd && platform::is_window(inner.hwnd) {
                        platform::place(inner.hwnd, inner.rect, inner.radius, false);
                    }
                    platform::adopt(hwnd, parent, true);
                    inner.hwnd = hwnd;
                    inner.own = true;
                    inner.concealed = false;
                    platform::place(hwnd, inner.rect, inner.radius, inner.shown());
                }
                shown(hwnd, width, height);
                return;
            }
            thread::sleep(Duration::from_millis(15));
        }
    });
}

/// The size of window `hwnd` if it is the picture and something other than
/// Mirlow has resized it since it was laid out. scrcpy does so when the
/// phone turns, which is how Mirlow learns the picture's new shape.
pub fn resized(app: &AppHandle, hwnd: isize) -> Option<(i32, i32)> {
    let video = app.state::<Video>();
    let inner = video.inner.lock().unwrap();
    if inner.hwnd != hwnd {
        return None;
    }
    let size = platform::size(hwnd)?;
    (size != (inner.rect.width.max(1), inner.rect.height.max(1))).then_some(size)
}

/// Puts the picture back where the layout wants it.
pub fn replace(app: &AppHandle) {
    let video = app.state::<Video>();
    let inner = video.inner.lock().unwrap();
    if inner.hwnd != 0 && platform::is_window(inner.hwnd) {
        platform::place(inner.hwnd, inner.rect, inner.radius, inner.shown());
    }
}

/// Forgets the engine's video window. The engine closes it itself when
/// mirroring ends; if it is still around it is hidden so no stale frame lingers.
pub fn detach(app: &AppHandle) {
    let video = app.state::<Video>();
    video.generation.fetch_add(1, Ordering::SeqCst);
    let mut inner = video.inner.lock().unwrap();
    // Whatever comes next is a new picture.
    inner.concealed = false;
    if inner.own {
        return;
    }
    if inner.hwnd != 0 && platform::is_window(inner.hwnd) {
        platform::place(inner.hwnd, inner.rect, inner.radius, false);
    }
    inner.hwnd = 0;
}

/// Puts a window Mirlow made itself (already a child of the main window) where
/// the picture goes, in place of the engine's.
pub fn attach(app: &AppHandle, hwnd: isize) {
    let video = app.state::<Video>();
    video.generation.fetch_add(1, Ordering::SeqCst);
    let mut inner = video.inner.lock().unwrap();
    if inner.hwnd != 0 && inner.hwnd != hwnd && platform::is_window(inner.hwnd) {
        platform::place(inner.hwnd, inner.rect, inner.radius, false);
    }
    inner.hwnd = hwnd;
    inner.own = true;
    inner.concealed = false;
    platform::place(hwnd, inner.rect, inner.radius, inner.visible);
}

/// Hides a window given to [`attach`] and forgets it.
pub fn release(app: &AppHandle, hwnd: isize) {
    let video = app.state::<Video>();
    let mut inner = video.inner.lock().unwrap();
    if platform::is_window(hwnd) {
        platform::place(hwnd, inner.rect, inner.radius, false);
    }
    if inner.hwnd == hwnd {
        inner.hwnd = 0;
        inner.own = false;
    }
}

/// The main window's handle, once it exists.
pub fn main_window(app: &AppHandle) -> Option<isize> {
    main_hwnd(app)
}

/// Hides the engine's picture at once, whatever the layout says, or lets the
/// layout decide again. While a device's screen is asleep its last frame stays
/// in the window, and nobody should be left looking at it.
pub fn conceal(app: &AppHandle, concealed: bool) {
    let video = app.state::<Video>();
    let mut inner = video.inner.lock().unwrap();
    if inner.concealed == concealed {
        return;
    }
    inner.concealed = concealed;
    if inner.hwnd != 0 && !inner.own && platform::is_window(inner.hwnd) {
        platform::place(inner.hwnd, inner.rect, inner.radius, inner.shown());
    }
}

/// Sets where the picture goes, how round its corners are, and whether it is shown.
pub fn layout(app: &AppHandle, rect: Rect, radius: i32, visible: bool) {
    let video = app.state::<Video>();
    let mut inner = video.inner.lock().unwrap();
    inner.rect = rect;
    inner.radius = radius.max(0);
    inner.visible = visible;
    if inner.hwnd != 0 {
        if platform::is_window(inner.hwnd) {
            platform::place(inner.hwnd, rect, inner.radius, inner.shown());
        } else {
            inner.hwnd = 0;
        }
    }
}

/// The window the picture is in, and where on the screen it is, while it is
/// being shown.
pub fn picture_on_screen(app: &AppHandle) -> Option<(isize, crate::capture::Area)> {
    match picture_state(app) {
        crate::capture::Picture::Shown { window, area } => Some((window, area)),
        _ => None,
    }
}

/// Whether there is a picture, and where on the screen it is if it is shown.
pub fn picture_state(app: &AppHandle) -> crate::capture::Picture {
    use crate::capture::Picture;
    let Some(window) = main_hwnd(app) else { return Picture::Gone };
    let video = app.state::<Video>();
    let inner = video.inner.lock().unwrap();
    if inner.hwnd == 0 || !platform::is_window(inner.hwnd) {
        return Picture::Gone;
    }
    // A minimised window draws nothing to copy.
    if !inner.shown() || inner.rect.width <= 0 || inner.rect.height <= 0 || platform::is_minimized(window) {
        return Picture::Hidden;
    }
    platform::screen_rect(inner.hwnd).map_or(Picture::Hidden, |area| Picture::Shown { window, area })
}

fn main_hwnd(app: &AppHandle) -> Option<isize> {
    #[cfg(windows)]
    {
        let window = app.get_webview_window("main")?;
        window.hwnd().ok().map(|hwnd| hwnd.0 as isize)
    }
    #[cfg(target_os = "linux")]
    {
        use raw_window_handle::{HasWindowHandle, RawWindowHandle};
        let window = app.get_webview_window("main")?;
        match window.window_handle().ok()?.as_raw() {
            RawWindowHandle::Xlib(handle) => Some(handle.window as isize),
            _ => None,
        }
    }
    #[cfg(not(any(windows, target_os = "linux")))]
    {
        let _ = app;
        None
    }
}

/// The window the engine draws into, on Linux: one Mirlow makes (GStreamer's
/// windows do not say which program they belong to, so the engine's could not
/// be found the way it is on Windows). It is made on its own, since Mirlow's
/// window may not exist yet while it waits in the tray, and is placed inside
/// that window once there is a picture, like the engine's elsewhere.
/// Elsewhere the engine makes its own.
pub fn engine_window() -> Option<isize> {
    #[cfg(target_os = "linux")]
    {
        static WINDOW: std::sync::OnceLock<isize> = std::sync::OnceLock::new();
        let window = *WINDOW.get_or_init(platform::create_window);
        (window != 0).then_some(window)
    }
    #[cfg(not(target_os = "linux"))]
    None
}

#[cfg(windows)]
mod platform {
    use super::Rect;
    use windows::core::BOOL;
    use windows::Win32::Foundation::{HWND, LPARAM, RECT};
    use windows::Win32::Graphics::Gdi::{CreateRoundRectRgn, SetWindowRgn};
    use windows::Win32::UI::WindowsAndMessaging::{
        EnumWindows, GetWindow, GetWindowLongPtrW, GetWindowRect, GetWindowThreadProcessId,
        IsIconic, IsWindow, IsWindowVisible, SetParent, SetWindowLongPtrW, SetWindowPos, GWL_EXSTYLE,
        GWL_STYLE, GW_OWNER, HWND_TOP, SWP_FRAMECHANGED, SWP_HIDEWINDOW, SWP_NOACTIVATE,
        SWP_SHOWWINDOW, WS_CAPTION, WS_CHILD, WS_CLIPSIBLINGS, WS_DISABLED, WS_EX_APPWINDOW,
        WS_EX_CLIENTEDGE, WS_EX_DLGMODALFRAME, WS_EX_NOACTIVATE, WS_EX_WINDOWEDGE,
        WS_MAXIMIZEBOX, WS_MINIMIZEBOX, WS_POPUP, WS_SYSMENU, WS_THICKFRAME,
    };

    fn handle(hwnd: isize) -> HWND {
        HWND(hwnd as *mut core::ffi::c_void)
    }

    pub fn is_window(hwnd: isize) -> bool {
        unsafe { IsWindow(Some(handle(hwnd))).as_bool() }
    }

    pub fn is_minimized(hwnd: isize) -> bool {
        unsafe { IsIconic(handle(hwnd)).as_bool() }
    }

    struct Search {
        pid: u32,
        found: isize,
    }

    unsafe extern "system" fn visit(hwnd: HWND, lparam: LPARAM) -> BOOL {
        let search = &mut *(lparam.0 as *mut Search);
        let mut pid = 0u32;
        GetWindowThreadProcessId(hwnd, Some(&mut pid));
        if pid != search.pid || !IsWindowVisible(hwnd).as_bool() {
            return true.into();
        }
        // Skip tool and helper windows: the video window is unowned and has a size.
        if GetWindow(hwnd, GW_OWNER).map(|owner| !owner.is_invalid()).unwrap_or(false) {
            return true.into();
        }
        let mut rect = RECT::default();
        if GetWindowRect(hwnd, &mut rect).is_err() || rect.right - rect.left < 16 || rect.bottom - rect.top < 16 {
            return true.into();
        }
        search.found = hwnd.0 as isize;
        false.into()
    }

    /// The visible top-level window owned by process `pid`, if it has one.
    pub fn find_window(pid: u32) -> Option<isize> {
        if pid == 0 {
            return None;
        }
        let mut search = Search { pid, found: 0 };
        unsafe {
            // EnumWindows reports an error when the callback stops it early.
            let _ = EnumWindows(Some(visit), LPARAM(&mut search as *mut Search as isize));
        }
        (search.found != 0).then_some(search.found)
    }

    /// Where the window is on the screen: left, top, width and height, in
    /// physical pixels. Hidden windows have no place.
    pub fn screen_rect(hwnd: isize) -> Option<(i32, i32, i32, i32)> {
        let mut rect = RECT::default();
        unsafe {
            if !IsWindowVisible(handle(hwnd)).as_bool() {
                return None;
            }
            GetWindowRect(handle(hwnd), &mut rect).ok()?;
        }
        let (width, height) = (rect.right - rect.left, rect.bottom - rect.top);
        (width > 0 && height > 0).then_some((rect.left, rect.top, width, height))
    }

    /// The window's size, in physical pixels.
    pub fn size(hwnd: isize) -> Option<(i32, i32)> {
        let mut rect = RECT::default();
        unsafe { GetWindowRect(handle(hwnd), &mut rect).ok()? };
        Some((rect.right - rect.left, rect.bottom - rect.top))
    }

    /// Turns a top-level window into a borderless child of `parent`. Unless
    /// it is `interactive`, it is disabled, so input goes to the interface.
    pub fn adopt(hwnd: isize, parent: isize, interactive: bool) {
        let hwnd = handle(hwnd);
        unsafe {
            let style = GetWindowLongPtrW(hwnd, GWL_STYLE) as u32;
            let chrome = WS_POPUP | WS_CAPTION | WS_THICKFRAME | WS_MINIMIZEBOX | WS_MAXIMIZEBOX | WS_SYSMENU;
            let mut style = (style & !(chrome.0 | WS_DISABLED.0)) | (WS_CHILD | WS_CLIPSIBLINGS).0;
            if !interactive {
                style |= WS_DISABLED.0;
            }
            SetWindowLongPtrW(hwnd, GWL_STYLE, style as isize);

            let ex_style = GetWindowLongPtrW(hwnd, GWL_EXSTYLE) as u32;
            let edges = WS_EX_APPWINDOW | WS_EX_WINDOWEDGE | WS_EX_CLIENTEDGE | WS_EX_DLGMODALFRAME;
            let mut ex_style = ex_style & !(edges.0 | WS_EX_NOACTIVATE.0);
            if !interactive {
                ex_style |= WS_EX_NOACTIVATE.0;
            }
            SetWindowLongPtrW(hwnd, GWL_EXSTYLE, ex_style as isize);

            let _ = SetParent(hwnd, Some(handle(parent)));
        }
    }

    pub fn place(hwnd: isize, rect: Rect, radius: i32, visible: bool) {
        let show = visible && rect.width > 0 && rect.height > 0;
        let flags = SWP_NOACTIVATE | SWP_FRAMECHANGED | if show { SWP_SHOWWINDOW } else { SWP_HIDEWINDOW };
        unsafe {
            // Clip the window to a rounded rectangle; the system takes ownership
            // of the region. No region means square corners (full screen).
            let region = (radius > 0).then(|| {
                CreateRoundRectRgn(0, 0, rect.width + 1, rect.height + 1, radius * 2, radius * 2)
            });
            SetWindowRgn(handle(hwnd), region, true);
            let _ = SetWindowPos(
                handle(hwnd),
                Some(HWND_TOP),
                rect.x,
                rect.y,
                rect.width.max(1),
                rect.height.max(1),
                flags,
            );
        }
    }
}

/// The same on Linux, with X11 (Mirlow asks for XWayland under Wayland, see
/// `lib.rs`), where one program's window can be made a child of another's.
#[cfg(target_os = "linux")]
pub(crate) mod platform {
    use super::Rect;
    use std::os::raw::{c_int, c_uchar, c_uint, c_ulong};
    use std::sync::atomic::{AtomicPtr, Ordering};
    use std::sync::{Mutex, OnceLock};
    use x11::xlib;

    struct Connection(*mut xlib::Display);
    // Only ever used under its mutex.
    unsafe impl Send for Connection {}

    static OURS: AtomicPtr<xlib::Display> = AtomicPtr::new(std::ptr::null_mut());
    static PREVIOUS: OnceLock<Option<unsafe extern "C" fn(*mut xlib::Display, *mut xlib::XErrorEvent) -> c_int>> =
        OnceLock::new();

    /// A window that went away under us is an error Xlib's default handler
    /// ends the program for. Ours are ignored; the rest go to GTK's handler.
    unsafe extern "C" fn on_error(display: *mut xlib::Display, error: *mut xlib::XErrorEvent) -> c_int {
        if display == OURS.load(Ordering::SeqCst) {
            return 0;
        }
        match PREVIOUS.get().copied().flatten() {
            Some(previous) => previous(display, error),
            None => 0,
        }
    }

    /// Runs `f` on Mirlow's own connection to the X server.
    fn with<T: Default>(f: impl FnOnce(*mut xlib::Display) -> T) -> T {
        static CONNECTION: OnceLock<Option<Mutex<Connection>>> = OnceLock::new();
        let connection = CONNECTION.get_or_init(|| unsafe {
            let display = xlib::XOpenDisplay(std::ptr::null());
            if display.is_null() {
                return None;
            }
            OURS.store(display, Ordering::SeqCst);
            let _ = PREVIOUS.set(xlib::XSetErrorHandler(Some(on_error)));
            Some(Mutex::new(Connection(display)))
        });
        let Some(connection) = connection else { return T::default() };
        let connection = connection.lock().unwrap();
        let result = f(connection.0);
        unsafe { xlib::XSync(connection.0, 0) };
        result
    }

    fn attributes(display: *mut xlib::Display, window: isize) -> Option<xlib::XWindowAttributes> {
        let mut attributes: xlib::XWindowAttributes = unsafe { std::mem::zeroed() };
        (unsafe { xlib::XGetWindowAttributes(display, window as c_ulong, &mut attributes) } != 0).then_some(attributes)
    }

    fn parent_of(display: *mut xlib::Display, window: c_ulong) -> Option<c_ulong> {
        let (mut root, mut parent, mut children, mut count) = (0, 0, std::ptr::null_mut(), 0 as c_uint);
        unsafe {
            if xlib::XQueryTree(display, window, &mut root, &mut parent, &mut children, &mut count) == 0 {
                return None;
            }
            if !children.is_null() {
                xlib::XFree(children.cast());
            }
        }
        Some(parent)
    }

    fn children_of(display: *mut xlib::Display, window: c_ulong) -> Vec<c_ulong> {
        let (mut root, mut parent, mut children, mut count) = (0, 0, std::ptr::null_mut(), 0 as c_uint);
        unsafe {
            if xlib::XQueryTree(display, window, &mut root, &mut parent, &mut children, &mut count) == 0
                || children.is_null()
            {
                return Vec::new();
            }
            let list = std::slice::from_raw_parts(children, count as usize).to_vec();
            xlib::XFree(children.cast());
            list
        }
    }

    fn atom(display: *mut xlib::Display, name: &str) -> c_ulong {
        let name = std::ffi::CString::new(name).unwrap();
        unsafe { xlib::XInternAtom(display, name.as_ptr(), 0) }
    }

    fn pid_of(display: *mut xlib::Display, window: c_ulong, property: c_ulong) -> Option<u32> {
        let (mut kind, mut format, mut count, mut after) = (0, 0, 0, 0);
        let mut data: *mut c_uchar = std::ptr::null_mut();
        unsafe {
            let status = xlib::XGetWindowProperty(
                display, window, property, 0, 1, 0, xlib::XA_CARDINAL,
                &mut kind, &mut format, &mut count, &mut after, &mut data,
            );
            if data.is_null() {
                return None;
            }
            let pid = (status == 0 && format == 32 && count == 1).then(|| *(data as *const std::os::raw::c_long) as u32);
            xlib::XFree(data.cast());
            pid
        }
    }

    pub fn is_window(hwnd: isize) -> bool {
        with(|display| attributes(display, hwnd).is_some())
    }

    /// Minimised, or put away in the tray: either way not on the screen.
    pub fn is_minimized(hwnd: isize) -> bool {
        with(|display| attributes(display, hwnd).map_or(true, |a| a.map_state != xlib::IsViewable))
    }

    /// The visible top-level window of process `pid`, as the program itself
    /// reports it (`_NET_WM_PID`, which SDL sets and scrcpy draws with).
    /// Window managers put each window in a frame of theirs, hence two levels.
    pub fn find_window(pid: u32) -> Option<isize> {
        if pid == 0 {
            return None;
        }
        with(|display| unsafe {
            let property = atom(display, "_NET_WM_PID");
            let root = xlib::XDefaultRootWindow(display);
            children_of(display, root)
                .into_iter()
                .flat_map(|top| std::iter::once(top).chain(children_of(display, top)))
                .find(|&window| {
                    pid_of(display, window, property) == Some(pid)
                        && attributes(display, window as isize)
                            .is_some_and(|a| a.map_state == xlib::IsViewable && a.width >= 16 && a.height >= 16)
                })
                .map(|window| window as isize)
        })
    }

    pub fn screen_rect(hwnd: isize) -> Option<(i32, i32, i32, i32)> {
        with(|display| unsafe {
            let a = attributes(display, hwnd)?;
            if a.map_state != xlib::IsViewable || a.width <= 0 || a.height <= 0 {
                return None;
            }
            let (mut x, mut y, mut child) = (0, 0, 0);
            xlib::XTranslateCoordinates(display, hwnd as c_ulong, a.root, 0, 0, &mut x, &mut y, &mut child);
            Some((x, y, a.width, a.height))
        })
    }

    pub fn size(hwnd: isize) -> Option<(i32, i32)> {
        with(|display| attributes(display, hwnd).map(|a| (a.width, a.height)))
    }

    /// Makes `hwnd` a child of `parent`. The window manager is first let go of
    /// it (by unmapping), or it would put the window back in its frame.
    /// Input needs nothing here: the engine draws without taking any, and scrcpy
    /// takes its own.
    pub fn adopt(hwnd: isize, parent: isize, _interactive: bool) {
        let (window, parent) = (hwnd as c_ulong, parent as c_ulong);
        if with(|display| parent_of(display, window)) == Some(parent) {
            return;
        }
        with(|display| unsafe {
            let mut change: xlib::XSetWindowAttributes = std::mem::zeroed();
            change.override_redirect = 1;
            xlib::XChangeWindowAttributes(display, window, xlib::CWOverrideRedirect, &mut change);
            xlib::XUnmapWindow(display, window);
        });
        std::thread::sleep(std::time::Duration::from_millis(100));
        with(|display| unsafe { xlib::XReparentWindow(display, window, parent, 0, 0) });
    }

    /// shortcut: square corners on Linux, the radius is ignored; round them with
    /// the X Shape extension if it looks out of place.
    pub fn place(hwnd: isize, rect: Rect, _radius: i32, visible: bool) {
        let show = visible && rect.width > 0 && rect.height > 0;
        with(|display| unsafe {
            let window = hwnd as c_ulong;
            if show {
                xlib::XMoveResizeWindow(display, window, rect.x, rect.y, rect.width as c_uint, rect.height as c_uint);
                xlib::XMapRaised(display, window);
            } else {
                xlib::XUnmapWindow(display, window);
            }
        });
    }

    /// A black window, not shown yet, that the window manager leaves alone.
    pub fn create_window() -> isize {
        with(|display| unsafe {
            let screen = xlib::XDefaultScreen(display);
            let black = xlib::XBlackPixel(display, screen);
            let mut attributes: xlib::XSetWindowAttributes = std::mem::zeroed();
            attributes.background_pixel = black;
            attributes.override_redirect = 1;
            xlib::XCreateWindow(
                display,
                xlib::XRootWindow(display, screen),
                0, 0, 1, 1, 0,
                xlib::CopyFromParent,
                xlib::InputOutput as c_uint,
                std::ptr::null_mut(),
                xlib::CWBackPixel | xlib::CWOverrideRedirect,
                &mut attributes,
            ) as isize
        })
    }

    /// Gives `hwnd` the keyboard.
    pub fn focus(hwnd: isize) {
        with(|display| unsafe {
            xlib::XSetInputFocus(display, hwnd as c_ulong, xlib::RevertToParent, xlib::CurrentTime);
        });
    }

    /// Asks the window to close, as its close button would.
    pub fn close(hwnd: isize) {
        with(|display| unsafe {
            let mut event: xlib::XClientMessageEvent = std::mem::zeroed();
            event.type_ = xlib::ClientMessage;
            event.window = hwnd as c_ulong;
            event.message_type = atom(display, "WM_PROTOCOLS");
            event.format = 32;
            event.data.set_long(0, atom(display, "WM_DELETE_WINDOW") as std::os::raw::c_long);
            event.data.set_long(1, xlib::CurrentTime as std::os::raw::c_long);
            let mut event = xlib::XEvent { client_message: event };
            xlib::XSendEvent(display, hwnd as c_ulong, 0, xlib::NoEventMask, &mut event);
        });
    }
}

#[cfg(not(any(windows, target_os = "linux")))]
mod platform {
    use super::Rect;
    pub fn is_window(_hwnd: isize) -> bool {
        false
    }
    pub fn is_minimized(_hwnd: isize) -> bool {
        false
    }
    pub fn find_window(_pid: u32) -> Option<isize> {
        None
    }
    pub fn size(_hwnd: isize) -> Option<(i32, i32)> {
        None
    }
    pub fn screen_rect(_hwnd: isize) -> Option<(i32, i32, i32, i32)> {
        None
    }
    pub fn adopt(_hwnd: isize, _parent: isize, _interactive: bool) {}
    pub fn place(_hwnd: isize, _rect: Rect, _radius: i32, _visible: bool) {}
}
