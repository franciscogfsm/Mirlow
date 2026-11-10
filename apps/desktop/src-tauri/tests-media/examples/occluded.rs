//! Can a covered window still be copied? A Direct3D window from another
//! process (as the engines' pictures are) is adopted as a child, a blue window
//! is put on top of everything, and the parent is copied with PrintWindow.
//!
//!   cargo run --release --example occluded --manifest-path tests-media/Cargo.toml
use std::io::{BufRead, BufReader, Write};
use std::process::{Command, Stdio};
use std::time::{Duration, Instant};
use windows::core::*;
use windows::Win32::Foundation::*;
use windows::Win32::Graphics::Direct3D::*;
use windows::Win32::Graphics::Direct3D11::*;
use windows::Win32::Graphics::Dxgi::Common::*;
use windows::Win32::Graphics::Dxgi::*;
use windows::Win32::Graphics::Gdi::*;
use windows::Win32::Storage::Xps::{PrintWindow, PRINT_WINDOW_FLAGS};
use windows::Win32::System::LibraryLoader::GetModuleHandleW;
use windows::Win32::UI::HiDpi::{SetProcessDpiAwarenessContext, DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2};
use windows::Win32::UI::WindowsAndMessaging::*;

const PW_RENDERFULLCONTENT: u32 = 2;

unsafe extern "system" fn procedure(hwnd: HWND, message: u32, w: WPARAM, l: LPARAM) -> LRESULT {
    DefWindowProcW(hwnd, message, w, l)
}

unsafe fn window(class: PCWSTR, color: u32, ex: WINDOW_EX_STYLE, x: i32, y: i32, w: i32, h: i32) -> HWND {
    let instance = GetModuleHandleW(None).unwrap();
    let wc = WNDCLASSW {
        lpfnWndProc: Some(procedure),
        hInstance: instance.into(),
        lpszClassName: class,
        hbrBackground: CreateSolidBrush(COLORREF(color)),
        ..Default::default()
    };
    RegisterClassW(&wc);
    CreateWindowExW(ex, class, w!("test"), WS_POPUP | WS_VISIBLE, x, y, w, h, None, None, Some(instance.into()), None)
        .unwrap()
}

fn pump(ms: u64) {
    let end = Instant::now() + Duration::from_millis(ms);
    while Instant::now() < end {
        unsafe {
            let mut msg = MSG::default();
            while PeekMessageW(&mut msg, None, 0, 0, PM_REMOVE).as_bool() {
                let _ = TranslateMessage(&msg);
                DispatchMessageW(&msg);
            }
        }
        std::thread::sleep(Duration::from_millis(5));
    }
}

/// The other process: a green Direct3D 11 window, presenting all the time.
unsafe fn child() {
    let hwnd = window(w!("MirlowTestD3D"), 0x000000ff, WINDOW_EX_STYLE(0), 1400, 100, 400, 500);
    let mut device = None;
    let mut context = None;
    D3D11CreateDevice(None, D3D_DRIVER_TYPE_HARDWARE, HMODULE::default(), D3D11_CREATE_DEVICE_BGRA_SUPPORT, None, D3D11_SDK_VERSION, Some(&mut device), None, Some(&mut context)).unwrap();
    let (device, context) = (device.unwrap(), context.unwrap());
    let factory: IDXGIFactory2 = CreateDXGIFactory1().unwrap();
    let desc = DXGI_SWAP_CHAIN_DESC1 {
        Width: 400,
        Height: 500,
        Format: DXGI_FORMAT_B8G8R8A8_UNORM,
        SampleDesc: DXGI_SAMPLE_DESC { Count: 1, Quality: 0 },
        BufferUsage: DXGI_USAGE_RENDER_TARGET_OUTPUT,
        BufferCount: 2,
        SwapEffect: DXGI_SWAP_EFFECT_FLIP_DISCARD,
        ..Default::default()
    };
    let chain = factory.CreateSwapChainForHwnd(&device, hwnd, &desc, None, None).unwrap();
    let buffer: ID3D11Texture2D = chain.GetBuffer(0).unwrap();
    let mut target = None;
    device.CreateRenderTargetView(&buffer, None, Some(&mut target)).unwrap();
    let target = target.unwrap();
    println!("{}", hwnd.0 as isize);
    std::io::stdout().flush().unwrap();
    loop {
        context.ClearRenderTargetView(&target, &[0.0, 1.0, 0.0, 1.0]);
        let _ = chain.Present(1, DXGI_PRESENT(0));
        pump(10);
    }
}

unsafe fn pixel(dc: HDC, x: i32, y: i32) -> String {
    let c = GetPixel(dc, x, y).0;
    format!("r{} g{} b{}", c & 0xff, (c >> 8) & 0xff, (c >> 16) & 0xff)
}

fn main() {
    unsafe {
        let _ = SetProcessDpiAwarenessContext(DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2);
        if std::env::args().nth(1).as_deref() == Some("child") {
            return child();
        }
        // The parent: white, like the app's window around the picture.
        let parent = window(w!("MirlowTestParent"), 0x00ffffff, WINDOW_EX_STYLE(0), 100, 100, 900, 700);
        let mut process = Command::new(std::env::current_exe().unwrap()).arg("child").stdout(Stdio::piped()).spawn().unwrap();
        let mut line = String::new();
        BufReader::new(process.stdout.take().unwrap()).read_line(&mut line).unwrap();
        let picture = HWND(line.trim().parse::<isize>().unwrap() as *mut _);
        // Adopted as video.rs does it.
        let style = GetWindowLongPtrW(picture, GWL_STYLE) as u32;
        SetWindowLongPtrW(picture, GWL_STYLE, ((style & !WS_POPUP.0) | (WS_CHILD | WS_CLIPSIBLINGS | WS_DISABLED).0) as isize);
        SetParent(picture, Some(parent)).unwrap();
        SetWindowPos(picture, Some(HWND_TOP), 50, 50, 400, 500, SWP_NOACTIVATE | SWP_FRAMECHANGED | SWP_SHOWWINDOW).unwrap();
        pump(600);
        // Something on top of everything, as a chat window might be.
        let _cover = window(w!("MirlowTestCover"), 0x00ff0000, WS_EX_TOPMOST, 0, 0, 1300, 1000);
        pump(600);

        let screen = GetDC(None);
        println!("screen at the picture: {}  (blue = covered)", pixel(screen, 100 + 250, 100 + 300));

        let memory = CreateCompatibleDC(Some(screen));
        let bitmap = CreateCompatibleBitmap(screen, 900, 700);
        SelectObject(memory, bitmap.into());
        let copied = PrintWindow(parent, memory, PRINT_WINDOW_FLAGS(PW_RENDERFULLCONTENT));
        println!("PrintWindow ok: {}", copied.as_bool());
        println!("copy at the picture:   {}  (green = the picture)", pixel(memory, 250, 300));
        println!("copy around it:        {}  (white = the window)", pixel(memory, 20, 20));

        let start = Instant::now();
        for _ in 0..60 {
            let _ = PrintWindow(parent, memory, PRINT_WINDOW_FLAGS(PW_RENDERFULLCONTENT));
        }
        println!("PrintWindow: {:.1} ms each", start.elapsed().as_secs_f64() * 1000.0 / 60.0);
        let _ = process.kill();
    }
}
