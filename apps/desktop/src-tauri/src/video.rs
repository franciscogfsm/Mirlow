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
    rect: Rect,
    /// Corner radius of the picture, in physical pixels.
    radius: i32,
    visible: bool,
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
            if let Some(hwnd) = platform::find_window(pid) {
                let Some(parent) = main_hwnd(&app) else { return };
                let mut inner = video.inner.lock().unwrap();
                platform::adopt(hwnd, parent);
                inner.hwnd = hwnd;
                platform::place(hwnd, inner.rect, inner.radius, inner.visible);
                return;
            }
            thread::sleep(Duration::from_millis(30));
        }
    });
}

/// Forgets the video window. The engine closes it itself when mirroring ends;
/// if it is still around it is hidden so no stale frame lingers.
pub fn detach(app: &AppHandle) {
    let video = app.state::<Video>();
    video.generation.fetch_add(1, Ordering::SeqCst);
    let mut inner = video.inner.lock().unwrap();
    if inner.hwnd != 0 && platform::is_window(inner.hwnd) {
        platform::place(inner.hwnd, inner.rect, inner.radius, false);
    }
    inner.hwnd = 0;
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
            platform::place(inner.hwnd, rect, inner.radius, visible);
        } else {
            inner.hwnd = 0;
        }
    }
}

fn main_hwnd(app: &AppHandle) -> Option<isize> {
    #[cfg(windows)]
    {
        let window = app.get_webview_window("main")?;
        window.hwnd().ok().map(|hwnd| hwnd.0 as isize)
    }
    #[cfg(not(windows))]
    {
        let _ = app;
        None
    }
}

#[cfg(windows)]
mod platform {
    use super::Rect;
    use windows::core::BOOL;
    use windows::Win32::Foundation::{HWND, LPARAM, RECT};
    use windows::Win32::Graphics::Gdi::{CreateRoundRectRgn, SetWindowRgn};
    use windows::Win32::UI::WindowsAndMessaging::{
        EnumWindows, GetWindow, GetWindowLongPtrW, GetWindowRect, GetWindowThreadProcessId,
        IsWindow, IsWindowVisible, SetParent, SetWindowLongPtrW, SetWindowPos, GWL_EXSTYLE,
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

    /// Turns a top-level window into a borderless, disabled child of `parent`.
    pub fn adopt(hwnd: isize, parent: isize) {
        let hwnd = handle(hwnd);
        unsafe {
            let style = GetWindowLongPtrW(hwnd, GWL_STYLE) as u32;
            let chrome = WS_POPUP | WS_CAPTION | WS_THICKFRAME | WS_MINIMIZEBOX | WS_MAXIMIZEBOX | WS_SYSMENU;
            let style = (style & !chrome.0) | (WS_CHILD | WS_DISABLED | WS_CLIPSIBLINGS).0;
            SetWindowLongPtrW(hwnd, GWL_STYLE, style as isize);

            let ex_style = GetWindowLongPtrW(hwnd, GWL_EXSTYLE) as u32;
            let edges = WS_EX_APPWINDOW | WS_EX_WINDOWEDGE | WS_EX_CLIENTEDGE | WS_EX_DLGMODALFRAME;
            let ex_style = (ex_style & !edges.0) | WS_EX_NOACTIVATE.0;
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

#[cfg(not(windows))]
mod platform {
    use super::Rect;
    pub fn is_window(_hwnd: isize) -> bool {
        false
    }
    pub fn find_window(_pid: u32) -> Option<isize> {
        None
    }
    pub fn adopt(_hwnd: isize, _parent: isize) {}
    pub fn place(_hwnd: isize, _rect: Rect, _radius: i32, _visible: bool) {}
}
