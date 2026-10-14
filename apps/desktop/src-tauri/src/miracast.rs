//! Receives Android screens over Miracast, using the receiver built into Windows.
//!
//! Android phones do not speak AirPlay. Most of them (Samsung "Smart View",
//! Xiaomi, Huawei and others, though not Google's Pixel) can project their
//! screen over Miracast instead, and Windows has had a Miracast receiver of its
//! own since version 1903. This module asks Windows to listen under the same
//! name the AirPlay engine advertises, and shows what arrives in the same place
//! as an iPhone's picture.
//!
//! Windows does the networking and the decoding. What is left to do here is to
//! draw the frames it hands over into a child window of the main window, which
//! [`crate::video`] then lays out exactly as it does the engine's. Each frame
//! passes through here rather than straight to the screen so that the black
//! bars many phones add around an upright picture can be cut away
//! ([`crate::letterbox`]).
//!
//! Everything runs on one thread of its own. Windows reports events on other
//! threads; they are passed to that thread before anything is touched.

use crate::engine::Engine;
use crate::settings::Settings;
use serde::Serialize;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Manager};

/// Whether an Android phone can find this PC right now, and if not, why.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum AndroidStatus {
    Starting,
    Listening,
    /// Windows' "Wireless Display" optional feature, which holds the Miracast
    /// receiver, is missing. It is not installed by default since Windows 10
    /// 2004, so this is the usual reason a phone does not see the PC.
    NeedsFeature,
    /// The Wi-Fi adapter is off, so nothing can be announced.
    WifiOff,
    /// The Wi-Fi adapter cannot do Miracast at all.
    Unsupported,
    /// "Projecting to this PC" is turned off, by the user or by policy.
    Disabled,
}

pub struct Miracast {
    status: Arc<Mutex<AndroidStatus>>,
    #[cfg(windows)]
    queue: Arc<Mutex<Option<windows::System::DispatcherQueue>>>,
}

impl Miracast {
    /// Starts listening for Android devices. Never fails: on a PC that cannot
    /// receive Miracast the reason is noted in the log and nothing else changes.
    pub fn start(app: AppHandle, settings: Arc<Mutex<Settings>>, engine: Engine) -> Self {
        let status = Arc::new(Mutex::new(AndroidStatus::Starting));
        #[cfg(windows)]
        {
            let queue = Arc::new(Mutex::new(None));
            let slot = queue.clone();
            let shared = status.clone();
            let spawned = std::thread::Builder::new().name("miracast".into()).spawn(move || {
                let log = engine.clone();
                if let Err(error) = receiver::run(app, settings, engine, shared.clone(), slot) {
                    log.note(format!("[mirlow] android: receiver stopped: {error}"));
                    *shared.lock().unwrap() = AndroidStatus::NeedsFeature;
                }
            });
            if spawned.is_err() {
                // Nothing to do: the app works without it.
            }
            Self { status, queue }
        }
        #[cfg(not(windows))]
        {
            let _ = (app, settings, engine);
            *status.lock().unwrap() = AndroidStatus::Unsupported;
            Self { status }
        }
    }

    pub fn status(&self) -> AndroidStatus {
        *self.status.lock().unwrap()
    }

    /// Starts listening again from scratch, after Windows' setup changed.
    pub fn retry(&self) {
        *self.status.lock().unwrap() = AndroidStatus::Starting;
        #[cfg(windows)]
        self.post(|state| {
            state.close();
            state.listen();
        });
    }

    /// Applies the current name and sound settings.
    pub fn refresh(&self) {
        #[cfg(windows)]
        self.post(|state| state.refresh());
    }

    /// Ends the Android connection, if there is one.
    pub fn disconnect(&self) {
        #[cfg(windows)]
        self.post(|state| state.disconnect());
    }

    /// Stops listening. Called as the app closes.
    pub fn shutdown(&self) {
        #[cfg(windows)]
        self.post(|state| state.shutdown());
    }

    #[cfg(windows)]
    fn post(&self, action: impl FnOnce(&mut receiver::State) + Send + 'static) {
        if let Some(queue) = self.queue.lock().unwrap().as_ref() {
            receiver::post(queue, action);
        }
    }
}

/// Ends the Android connection, if there is one.
pub fn disconnect(app: &AppHandle) {
    if let Some(miracast) = app.try_state::<Miracast>() {
        miracast.disconnect();
    }
}

#[cfg(windows)]
mod receiver {
    use super::AndroidStatus;
    use crate::engine::{Client, Engine, Guest, VideoSize};
    use crate::letterbox::{self, Framing, Rect};
    use crate::settings::Settings;
    use crate::video;
    use std::cell::RefCell;
    use std::sync::{Arc, Mutex};
    use std::time::{Duration, Instant};
    use tauri::AppHandle;
    use windows::core::{w, Error, IInspectable, Interface, Ref, Result, HSTRING};
    use windows_numerics::Vector2;
    use windows::Foundation::{Size, TimeSpan, TypedEventHandler};
    use windows::Graphics::DirectX::Direct3D11::IDirect3DSurface;
    use windows::Graphics::DirectX::{DirectXAlphaMode, DirectXPixelFormat};
    use windows::Media::Core::MediaSource;
    use windows::Media::Miracast::{
        MiracastReceiver, MiracastReceiverApplySettingsStatus, MiracastReceiverAuthorizationMethod,
        MiracastReceiverConnection, MiracastReceiverConnectionCreatedEventArgs,
        MiracastReceiverDisconnectReason, MiracastReceiverDisconnectedEventArgs,
        MiracastReceiverListeningStatus, MiracastReceiverMediaSourceCreatedEventArgs,
        MiracastReceiverSession, MiracastReceiverSessionStartStatus, MiracastReceiverStatus,
        MiracastReceiverWiFiStatus, MiracastTransmitterAuthorizationStatus,
    };
    use windows::Media::Playback::MediaPlayer;
    use windows::System::{DispatcherQueue, DispatcherQueueHandler};
    use windows::Win32::Foundation::{E_FAIL, HMODULE, HWND, LPARAM, LRESULT, POINT, SIZE, WPARAM};
    use windows::Win32::Graphics::Direct3D::D3D_DRIVER_TYPE_HARDWARE;
    use windows::Win32::Graphics::Direct3D11::{
        D3D11CreateDevice, ID3D11Device, ID3D11DeviceContext, ID3D11Multithread, ID3D11Texture2D,
        D3D11_BIND_RENDER_TARGET, D3D11_BIND_SHADER_RESOURCE, D3D11_BOX, D3D11_CPU_ACCESS_READ,
        D3D11_CREATE_DEVICE_BGRA_SUPPORT, D3D11_MAPPED_SUBRESOURCE, D3D11_MAP_READ, D3D11_SDK_VERSION,
        D3D11_TEXTURE2D_DESC, D3D11_USAGE_DEFAULT, D3D11_USAGE_STAGING,
    };
    use windows::Win32::Graphics::Dxgi::Common::{DXGI_FORMAT_B8G8R8A8_UNORM, DXGI_SAMPLE_DESC};
    use windows::Win32::Graphics::Dxgi::IDXGISurface;
    use windows::Win32::Graphics::Gdi::{GetStockObject, BLACK_BRUSH, HBRUSH};
    use windows::Win32::System::LibraryLoader::GetModuleHandleW;
    use windows::Win32::System::WinRT::Composition::{
        ICompositionDrawingSurfaceInterop, ICompositorDesktopInterop, ICompositorInterop,
    };
    use windows::Win32::System::WinRT::Direct3D11::CreateDirect3D11SurfaceFromDXGISurface;
    use windows::Win32::System::WinRT::{
        CreateDispatcherQueueController, DispatcherQueueOptions, RoInitialize, DQTAT_COM_NONE,
        DQTYPE_THREAD_CURRENT, RO_INIT_MULTITHREADED,
    };
    use windows::Win32::UI::WindowsAndMessaging::{
        CreateWindowExW, DefWindowProcW, DestroyWindow, DispatchMessageW, GetMessageW,
        PostQuitMessage, RegisterClassW, TranslateMessage, MSG, WNDCLASSW, WS_CHILD,
        WS_CLIPSIBLINGS, WS_DISABLED, WS_EX_NOACTIVATE,
    };
    use windows::UI::Composition::Desktop::DesktopWindowTarget;
    use windows::UI::Composition::{
        CompositionDrawingSurface, CompositionStretch, Compositor, ICompositionSurface, SpriteVisual,
    };

    thread_local! {
        static STATE: RefCell<Option<State>> = const { RefCell::new(None) };
    }

    /// Runs `action` on the receiver's thread.
    pub fn post(queue: &DispatcherQueue, action: impl FnOnce(&mut State) + Send + 'static) {
        let mut action = Some(action);
        let handler = DispatcherQueueHandler::new(move || {
            if let Some(action) = action.take() {
                STATE.with(|cell| {
                    // Never nested in practice; if it ever were, skipping the
                    // action is better than bringing the whole app down.
                    if let Ok(mut state) = cell.try_borrow_mut() {
                        if let Some(state) = state.as_mut() {
                            action(state);
                        }
                    }
                });
            }
            Ok(())
        });
        let _ = queue.TryEnqueue(&handler);
    }

    /// The window the picture is drawn in, and what draws it.
    struct Stage {
        hwnd: isize,
        compositor: Compositor,
        visual: SpriteVisual,
        _target: DesktopWindowTarget,
    }

    impl Stage {
        fn create(app: &AppHandle) -> Result<Self> {
            let parent = video::main_window(app).ok_or_else(|| Error::from(E_FAIL))?;
            let class = w!("MirlowAndroidVideo");
            unsafe {
                let instance = GetModuleHandleW(None)?;
                // Registering twice fails harmlessly.
                RegisterClassW(&WNDCLASSW {
                    lpfnWndProc: Some(window_proc),
                    hInstance: instance.into(),
                    lpszClassName: class,
                    hbrBackground: HBRUSH(GetStockObject(BLACK_BRUSH).0),
                    ..Default::default()
                });
                // Disabled, so the mouse and keyboard keep going to the interface.
                let hwnd = CreateWindowExW(
                    WS_EX_NOACTIVATE,
                    class,
                    w!(""),
                    WS_CHILD | WS_DISABLED | WS_CLIPSIBLINGS,
                    0,
                    0,
                    16,
                    16,
                    Some(HWND(parent as *mut core::ffi::c_void)),
                    None,
                    Some(instance.into()),
                    None,
                )?;

                let compositor = Compositor::new()?;
                let interop: ICompositorDesktopInterop = compositor.cast()?;
                let target = interop.CreateDesktopWindowTarget(hwnd, false)?;
                let visual = compositor.CreateSpriteVisual()?;
                visual.SetRelativeSizeAdjustment(Vector2 { X: 1.0, Y: 1.0 })?;
                target.SetRoot(&visual)?;
                Ok(Self { hwnd: hwnd.0 as isize, compositor, visual, _target: target })
            }
        }
    }

    impl Drop for Stage {
        fn drop(&mut self) {
            unsafe {
                let _ = DestroyWindow(HWND(self.hwnd as *mut core::ffi::c_void));
            }
        }
    }

    unsafe extern "system" fn window_proc(hwnd: HWND, message: u32, wparam: WPARAM, lparam: LPARAM) -> LRESULT {
        DefWindowProcW(hwnd, message, wparam, lparam)
    }

    /// How often a small copy of the frame is looked at for black bars.
    const MEASURE_EVERY: Duration = Duration::from_millis(250);
    /// Width of that copy: enough to place the bars within a few pixels.
    const SAMPLE_WIDTH: u32 = 480;

    /// A texture, and the same texture as Windows' media classes see it.
    struct Texture {
        texture: ID3D11Texture2D,
        surface: IDirect3DSurface,
        width: u32,
        height: u32,
    }

    impl Texture {
        fn new(device: &ID3D11Device, width: u32, height: u32) -> Result<Self> {
            let texture = create_texture(device, width, height, false)?;
            let dxgi: IDXGISurface = texture.cast()?;
            let surface = unsafe { CreateDirect3D11SurfaceFromDXGISurface(&dxgi)? }.cast()?;
            Ok(Self { texture, surface, width, height })
        }
    }

    fn create_texture(device: &ID3D11Device, width: u32, height: u32, staging: bool) -> Result<ID3D11Texture2D> {
        let desc = D3D11_TEXTURE2D_DESC {
            Width: width,
            Height: height,
            MipLevels: 1,
            ArraySize: 1,
            Format: DXGI_FORMAT_B8G8R8A8_UNORM,
            SampleDesc: DXGI_SAMPLE_DESC { Count: 1, Quality: 0 },
            Usage: if staging { D3D11_USAGE_STAGING } else { D3D11_USAGE_DEFAULT },
            BindFlags: if staging { 0 } else { (D3D11_BIND_RENDER_TARGET.0 | D3D11_BIND_SHADER_RESOURCE.0) as u32 },
            CPUAccessFlags: if staging { D3D11_CPU_ACCESS_READ.0 as u32 } else { 0 },
            MiscFlags: 0,
        };
        let mut texture = None;
        unsafe { device.CreateTexture2D(&desc, None, Some(&mut texture))? };
        texture.ok_or_else(|| Error::from(E_FAIL))
    }

    /// Draws each frame the phone sends into the stage, without black bars.
    /// Runs on the media player's own thread, as frames arrive.
    struct Renderer {
        device: ID3D11Device,
        context: ID3D11DeviceContext,
        target: ICompositionDrawingSurfaceInterop,
        target_size: (u32, u32),
        frame: Option<Texture>,
        /// The small copy, and where it is read back from.
        sample: Option<(Texture, ID3D11Texture2D)>,
        measured: Option<Instant>,
        framing: Framing,
        queue: DispatcherQueue,
    }

    // The Direct3D device is multithread-protected, and the renderer is only
    // ever used behind a mutex.
    unsafe impl Send for Renderer {}

    impl Renderer {
        /// Returns the renderer and the surface it draws on.
        fn new(compositor: &Compositor, queue: DispatcherQueue) -> Result<(Self, CompositionDrawingSurface)> {
            let mut device = None;
            let mut context = None;
            unsafe {
                D3D11CreateDevice(
                    None,
                    D3D_DRIVER_TYPE_HARDWARE,
                    HMODULE::default(),
                    D3D11_CREATE_DEVICE_BGRA_SUPPORT,
                    None,
                    D3D11_SDK_VERSION,
                    Some(&mut device),
                    None,
                    Some(&mut context),
                )?;
            }
            let device = device.ok_or_else(|| Error::from(E_FAIL))?;
            let context = context.ok_or_else(|| Error::from(E_FAIL))?;
            // Composition uses the device from its own thread too.
            unsafe {
                let _ = context.cast::<ID3D11Multithread>()?.SetMultithreadProtected(true);
            }

            let interop: ICompositorInterop = compositor.cast()?;
            let graphics = unsafe { interop.CreateGraphicsDevice(&device)? };
            let surface = graphics.CreateDrawingSurface(
                Size { Width: 16.0, Height: 16.0 },
                DirectXPixelFormat::B8G8R8A8UIntNormalized,
                DirectXAlphaMode::Ignore,
            )?;
            let renderer = Self {
                device,
                context,
                target: surface.cast()?,
                target_size: (16, 16),
                frame: None,
                sample: None,
                measured: None,
                framing: Framing::default(),
                queue,
            };
            Ok((renderer, surface))
        }

        fn draw(&mut self, player: &MediaPlayer) -> Result<()> {
            let session = player.PlaybackSession()?;
            let (width, height) = (session.NaturalVideoWidth()?, session.NaturalVideoHeight()?);
            if width == 0 || height == 0 {
                return Ok(());
            }
            if self.frame.as_ref().is_none_or(|frame| (frame.width, frame.height) != (width, height)) {
                self.frame = Some(Texture::new(&self.device, width, height)?);
                self.sample = None;
                self.measured = None;
                self.framing = Framing::default();
            }
            let Some(frame) = &self.frame else { return Ok(()) };
            player.CopyFrameToVideoSurface(&frame.surface)?;

            if self.measured.is_none_or(|at| at.elapsed() >= MEASURE_EVERY) {
                self.measured = Some(Instant::now());
                self.measure(player, width, height)?;
            }
            let crop = self.framing.shown().unwrap_or(Rect::full(width, height));

            if (crop.width, crop.height) != self.target_size {
                unsafe { self.target.Resize(SIZE { cx: crop.width as i32, cy: crop.height as i32 })? };
                self.target_size = (crop.width, crop.height);
                let (width, height) = self.target_size;
                post(&self.queue, move |state| state.sized(width, height));
            }

            let Some(frame) = &self.frame else { return Ok(()) };
            let mut offset = POINT::default();
            unsafe {
                let drawing: IDXGISurface = self.target.BeginDraw(None, &mut offset)?;
                let texture: ID3D11Texture2D = drawing.cast()?;
                let area = D3D11_BOX {
                    left: crop.x,
                    top: crop.y,
                    front: 0,
                    right: crop.x + crop.width,
                    bottom: crop.y + crop.height,
                    back: 1,
                };
                self.context.CopySubresourceRegion(
                    &texture,
                    0,
                    offset.x as u32,
                    offset.y as u32,
                    0,
                    &frame.texture,
                    0,
                    Some(&area),
                );
                self.target.EndDraw()?;
            }
            Ok(())
        }

        /// Copies the frame small, reads it back, and updates where the bars are.
        fn measure(&mut self, player: &MediaPlayer, width: u32, height: u32) -> Result<()> {
            if self.sample.is_none() {
                let sample_width = SAMPLE_WIDTH.min(width);
                let sample_height = ((u64::from(height) * u64::from(sample_width)) / u64::from(width)).max(1) as u32;
                let texture = Texture::new(&self.device, sample_width, sample_height)?;
                let staging = create_texture(&self.device, sample_width, sample_height, true)?;
                self.sample = Some((texture, staging));
            }
            let Some((sample, staging)) = &self.sample else { return Ok(()) };
            let area = windows::Foundation::Rect {
                X: 0.0,
                Y: 0.0,
                Width: sample.width as f32,
                Height: sample.height as f32,
            };
            player.CopyFrameToVideoSurfaceWithTargetRectangle(&sample.surface, area)?;
            let found = unsafe {
                self.context.CopyResource(staging, &sample.texture);
                let mut mapped = D3D11_MAPPED_SUBRESOURCE::default();
                self.context.Map(staging, 0, D3D11_MAP_READ, 0, Some(&mut mapped))?;
                let stride = mapped.RowPitch as usize;
                let pixels = std::slice::from_raw_parts(mapped.pData as *const u8, stride * sample.height as usize);
                let found = letterbox::content(pixels, sample.width, sample.height, stride);
                self.context.Unmap(staging, 0);
                found
            };
            self.framing.update(found, (sample.width, sample.height), (width, height));
            Ok(())
        }
    }

    pub struct State {
        app: AppHandle,
        settings: Arc<Mutex<Settings>>,
        engine: Engine,
        status: Arc<Mutex<AndroidStatus>>,
        queue: DispatcherQueue,
        receiver: Option<MiracastReceiver>,
        watch: Option<i64>,
        session: Option<MiracastReceiverSession>,
        connection: Option<MiracastReceiverConnection>,
        client: Option<Client>,
        player: Option<MediaPlayer>,
        renderer: Option<Arc<Mutex<Renderer>>>,
        stage: Option<Stage>,
        /// Set while checking again in the background, so a check that
        /// changes nothing leaves nothing in the log.
        quiet: bool,
        /// What Windows last said about the receiver, to log only changes.
        reported: Option<(i32, i32)>,
    }

    /// How often to look again when phones cannot find this PC: the Wi-Fi may
    /// have come on, Wireless Display may have finished installing, the PC may
    /// have woken from sleep.
    const RECHECK_SECONDS: i64 = 10;

    pub fn run(
        app: AppHandle,
        settings: Arc<Mutex<Settings>>,
        engine: Engine,
        status: Arc<Mutex<AndroidStatus>>,
        slot: Arc<Mutex<Option<DispatcherQueue>>>,
    ) -> Result<()> {
        // The picture is drawn through Windows' compositor, which needs a
        // dispatcher queue and a message loop on the thread that uses it.
        let controller = unsafe {
            RoInitialize(RO_INIT_MULTITHREADED)?;
            CreateDispatcherQueueController(DispatcherQueueOptions {
                dwSize: std::mem::size_of::<DispatcherQueueOptions>() as u32,
                threadType: DQTYPE_THREAD_CURRENT,
                apartmentType: DQTAT_COM_NONE,
            })?
        };
        let queue = controller.DispatcherQueue()?;

        let mut state = State {
            app,
            settings,
            engine,
            status,
            queue: queue.clone(),
            receiver: None,
            watch: None,
            session: None,
            connection: None,
            client: None,
            player: None,
            renderer: None,
            stage: None,
            quiet: false,
            reported: None,
        };
        state.listen();
        #[cfg(debug_assertions)]
        state.rehearse();
        STATE.with(|cell| *cell.borrow_mut() = Some(state));
        *slot.lock().unwrap() = Some(queue.clone());

        let timer = queue.CreateTimer()?;
        timer.SetInterval(TimeSpan { Duration: RECHECK_SECONDS * 10_000_000 })?;
        let recheck = queue.clone();
        timer.Tick(&TypedEventHandler::new(move |_, _| {
            post(&recheck, |state| state.recheck());
            Ok(())
        }))?;
        timer.Start()?;

        let mut message = MSG::default();
        unsafe {
            while GetMessageW(&mut message, None, 0, 0).as_bool() {
                let _ = TranslateMessage(&message);
                DispatchMessageW(&message);
            }
        }
        STATE.with(|cell| cell.borrow_mut().take());
        Ok(())
    }

    impl State {
        fn note(&self, text: impl AsRef<str>) {
            if !self.quiet {
                self.engine.note(format!("[mirlow] android: {}", text.as_ref()));
            }
        }

        /// Starts over if phones cannot find this PC, in case whatever stood
        /// in the way has gone. Says nothing unless the outcome changes.
        fn recheck(&mut self) {
            let before = *self.status.lock().unwrap();
            // A session that is listening is left alone: starting it over
            // takes the PC off the phone's list while the phone is looking.
            if matches!(before, AndroidStatus::Starting | AndroidStatus::Listening) {
                return;
            }
            self.quiet = true;
            self.close();
            self.listen();
            self.quiet = false;
            let after = *self.status.lock().unwrap();
            if after != before {
                self.note(format!("now {after:?} (was {before:?})"));
            }
        }

        fn set_status(&self, status: AndroidStatus) {
            *self.status.lock().unwrap() = status;
        }

        pub fn listen(&mut self) {
            let status = match self.open() {
                Ok(status) => status,
                Err(error) => {
                    self.note(format!("could not start the receiver: {error}"));
                    AndroidStatus::NeedsFeature
                }
            };
            if status == AndroidStatus::Listening {
                self.note("listening for Miracast devices");
            }
            self.set_status(status);
        }

        /// Starts a receiver session, and says whether phones can now find this
        /// PC. When they cannot, the reason has been noted.
        fn open(&mut self) -> Result<AndroidStatus> {
            let receiver = MiracastReceiver::new()?;
            // Kept even when listening fails, to hear when the Wi-Fi comes back.
            let queue = self.queue.clone();
            self.watch = receiver
                .StatusChanged(&TypedEventHandler::new(move |_, _: Ref<IInspectable>| {
                    post(&queue, |state| state.status_changed());
                    Ok(())
                }))
                .ok();
            self.receiver = Some(receiver.clone());

            let status = receiver.GetStatus()?;
            self.review_transmitters(&status);
            let wifi = status.WiFiStatus()?;
            if wifi == MiracastReceiverWiFiStatus::MiracastNotSupported {
                self.note("this PC's Wi-Fi adapter does not support Miracast");
                return Ok(AndroidStatus::Unsupported);
            }
            if status.ListeningStatus()? == MiracastReceiverListeningStatus::DisabledByPolicy {
                self.note("projecting to this PC is turned off in Windows");
                return Ok(AndroidStatus::Disabled);
            }

            let name = self.settings.lock().unwrap().name.clone();
            let settings = receiver.GetDefaultSettings()?;
            settings.SetFriendlyName(&HSTRING::from(name))?;
            // Like AirPlay in the engine: no code to type on the phone, unless
            // the phone insists on one. Recent Samsung phones do, and with no
            // PIN on offer they wait forever after the PC is tapped; the PIN
            // is then shown in the app.
            settings.SetAuthorizationMethod(MiracastReceiverAuthorizationMethod::PinDisplayIfRequested)?;
            settings.SetRequireAuthorizationFromKnownTransmitters(false)?;
            let applied = receiver.DisconnectAllAndApplySettings(&settings)?.Status()?;
            if applied != MiracastReceiverApplySettingsStatus::Success {
                self.note(format!("settings were not applied ({})", applied.0));
            }

            let session = receiver.CreateSession(None)?;
            session.SetAllowConnectionTakeover(true)?;
            session.SetMaxSimultaneousConnections(1)?;

            let queue = self.queue.clone();
            session.ConnectionCreated(&TypedEventHandler::new(
                move |_, args: Ref<MiracastReceiverConnectionCreatedEventArgs>| {
                    let Some(args) = args.as_ref() else { return Ok(()) };
                    if let Ok(connection) = args.Connection() {
                        let name = connection
                            .Transmitter()
                            .and_then(|transmitter| transmitter.Name())
                            .map(|name| name.to_string())
                            .unwrap_or_default();
                        let pin = args.Pin().map(|pin| pin.to_string()).unwrap_or_default();
                        post(&queue, move |state| state.connected(connection, name, pin));
                    }
                    Ok(())
                },
            ))?;
            let queue = self.queue.clone();
            session.MediaSourceCreated(&TypedEventHandler::new(
                move |_, args: Ref<MiracastReceiverMediaSourceCreatedEventArgs>| {
                    if let Some(source) = args.as_ref().and_then(|args| args.MediaSource().ok()) {
                        post(&queue, move |state| state.play(source));
                    }
                    Ok(())
                },
            ))?;
            let queue = self.queue.clone();
            session.Disconnected(&TypedEventHandler::new(
                move |_, _: Ref<MiracastReceiverDisconnectedEventArgs>| {
                    post(&queue, |state| state.end());
                    Ok(())
                },
            ))?;

            let started = session.Start()?;
            let status = started.Status()?;
            if status != MiracastReceiverSessionStartStatus::Success {
                let error = started.ExtendedError().map(|error| error.0).unwrap_or_default();
                self.note(format!("Windows would not start listening ({}, {error:#010x})", status.0));
                let _ = session.Close();
                return Ok(match status {
                    MiracastReceiverSessionStartStatus::AccessDenied => AndroidStatus::Disabled,
                    MiracastReceiverSessionStartStatus::MiracastNotSupported => AndroidStatus::Unsupported,
                    // An adapter that cannot say whether it does Miracast is
                    // one that is switched off.
                    _ if wifi == MiracastReceiverWiFiStatus::MiracastSupportUndetermined => {
                        AndroidStatus::WifiOff
                    }
                    // The adapter can do it, so what is missing is the
                    // receiver itself: the Wireless Display feature.
                    _ => AndroidStatus::NeedsFeature,
                });
            }
            self.session = Some(session);
            Ok(AndroidStatus::Listening)
        }

        pub fn close(&mut self) {
            self.end();
            if let Some(session) = self.session.take() {
                let _ = session.Close();
            }
            if let Some(receiver) = self.receiver.take() {
                if let Some(token) = self.watch.take() {
                    let _ = receiver.RemoveStatusChanged(token);
                }
            }
        }

        /// The phones Windows remembers. One it was once told to block is
        /// turned away without a word, which looks to the person holding it
        /// as if tapping the PC did nothing. Mirlow lets any device in, as the
        /// AirPlay engine does, so such a block is lifted.
        fn review_transmitters(&self, status: &MiracastReceiverStatus) {
            let Ok(known) = status.KnownTransmitters() else { return };
            for index in 0..known.Size().unwrap_or(0) {
                let Ok(transmitter) = known.GetAt(index) else { continue };
                let name = transmitter.Name().map(|name| name.to_string()).unwrap_or_default();
                let Ok(authorization) = transmitter.AuthorizationStatus() else { continue };
                if authorization == MiracastTransmitterAuthorizationStatus::Blocked
                    || authorization == MiracastTransmitterAuthorizationStatus::AlwaysPrompt
                {
                    let lifted = transmitter.SetAuthorizationStatus(MiracastTransmitterAuthorizationStatus::Undecided);
                    self.note(format!(
                        "{name} was {} by Windows; {}",
                        if authorization == MiracastTransmitterAuthorizationStatus::Blocked { "blocked" } else { "set to ask" },
                        if lifted.is_ok() { "allowed again" } else { "could not change that" },
                    ));
                } else {
                    self.note(format!("known device: {name} ({})", authorization.0));
                }
            }
        }

        /// Windows' view of the receiver changed. Noted in the log, since it
        /// shows a phone trying to connect even when no connection follows.
        /// If the Wi-Fi has just been turned on, try again.
        fn status_changed(&mut self) {
            let current = self
                .receiver
                .as_ref()
                .and_then(|receiver| receiver.GetStatus().ok())
                .and_then(|status| Some((status.ListeningStatus().ok()?.0, status.WiFiStatus().ok()?.0)));
            if let Some(current) = current.filter(|current| Some(*current) != self.reported) {
                self.reported = Some(current);
                let listening = match current.0 {
                    0 => "not listening",
                    1 => "listening",
                    2 => "a device is connecting",
                    3 => "connected",
                    4 => "disabled by policy",
                    5 => "temporarily disabled",
                    _ => "unknown",
                };
                self.note(format!("Windows reports: {listening} (Wi-Fi {})", current.1));
            }
            if *self.status.lock().unwrap() != AndroidStatus::WifiOff {
                return;
            }
            let wifi = self
                .receiver
                .as_ref()
                .and_then(|receiver| receiver.GetStatus().ok())
                .and_then(|status| status.WiFiStatus().ok());
            if wifi.is_some_and(|wifi| wifi != MiracastReceiverWiFiStatus::MiracastSupportUndetermined) {
                self.close();
                self.listen();
            }
        }

        /// The name changed, or the sound setting did.
        pub fn refresh(&mut self) {
            let (name, sound) = {
                let settings = self.settings.lock().unwrap();
                (settings.name.clone(), settings.sound)
            };
            if let Some(player) = &self.player {
                let _ = player.SetIsMuted(!sound);
            }
            let current = self
                .receiver
                .as_ref()
                .and_then(|receiver| receiver.GetCurrentSettings().ok())
                .and_then(|settings| settings.FriendlyName().ok())
                .map(|current| current.to_string());
            if current.as_deref() != Some(name.as_str()) {
                self.close();
                self.listen();
            }
        }

        pub fn disconnect(&mut self) {
            if let Some(connection) = &self.connection {
                let _ = connection.Disconnect(MiracastReceiverDisconnectReason::DisconnectedByUser);
            }
            self.end();
        }

        pub fn shutdown(&mut self) {
            self.close();
            self.stage = None;
            unsafe { PostQuitMessage(0) };
        }

        fn connected(&mut self, connection: MiracastReceiverConnection, name: String, pin: String) {
            self.end();
            let pin = Some(pin.trim().to_string()).filter(|pin| !pin.is_empty());
            if pin.is_some() {
                self.note(format!("{name} is connecting and asked for a PIN"));
            } else {
                self.note(format!("{name} is connecting"));
            }
            // The newest device takes over, whichever way it connects.
            if self.engine.has_client() {
                self.engine.restart();
            }
            let client = Client {
                name: if name.trim().is_empty() { "Android".into() } else { name.trim().to_string() },
                model: "Android".into(),
                pin,
            };
            self.connection = Some(connection);
            self.client = Some(client.clone());
            crate::tray::show_window(&self.app);
            self.engine.set_guest(Some(Guest { client, video: None }));
        }

        fn play(&mut self, source: MediaSource) {
            if let Err(error) = self.try_play(source) {
                self.note(format!("could not show the picture: {error}"));
                self.disconnect();
            }
        }

        fn try_play(&mut self, source: MediaSource) -> Result<()> {
            if let Some(client) = self.client.as_mut().filter(|client| client.pin.is_some()) {
                client.pin = None;
                self.engine.set_guest(Some(Guest { client: client.clone(), video: None }));
            }
            if self.stage.is_none() {
                self.stage = Some(Stage::create(&self.app)?);
            }
            let Some(stage) = &self.stage else { return Ok(()) };

            let (renderer, surface) = Renderer::new(&stage.compositor, self.queue.clone())?;
            let renderer = Arc::new(Mutex::new(renderer));

            let player = MediaPlayer::new()?;
            // Show each frame as it arrives instead of buffering ahead, and
            // hand each one over instead of drawing it.
            player.SetRealTimePlayback(true)?;
            player.SetIsVideoFrameServerEnabled(true)?;
            player.SetIsMuted(!self.settings.lock().unwrap().sound)?;

            let drawing = renderer.clone();
            let engine = self.engine.clone();
            let mut failed = false;
            player.VideoFrameAvailable(&TypedEventHandler::new(move |player: Ref<MediaPlayer>, _| {
                if let (Some(player), Ok(mut renderer)) = (player.as_ref(), drawing.lock()) {
                    if let Err(error) = renderer.draw(player) {
                        // Once is enough: this would repeat for every frame.
                        if !failed {
                            failed = true;
                            engine.note(format!("[mirlow] android: could not draw a frame: {error}"));
                        }
                    }
                }
                Ok(())
            }))?;

            let brush = stage.compositor.CreateSurfaceBrushWithSurface(&surface.cast::<ICompositionSurface>()?)?;
            brush.SetStretch(CompositionStretch::Uniform)?;
            stage.visual.SetBrush(&brush)?;
            player.SetSource(&source)?;
            player.Play()?;

            self.player = Some(player);
            self.renderer = Some(renderer);
            Ok(())
        }

        /// The size of the picture is known, or changed: the phone was turned,
        /// or black bars around it appeared or went away.
        fn sized(&mut self, width: u32, height: u32) {
            let (Some(client), Some(stage), Some(_)) = (&self.client, &self.stage, &self.player) else {
                return;
            };
            if width == 0 || height == 0 {
                return;
            }
            self.engine.set_guest(Some(Guest {
                client: client.clone(),
                video: Some(VideoSize { width, height }),
            }));
            video::attach(&self.app, stage.hwnd);
        }

        /// The connection is over: put everything away.
        fn end(&mut self) {
            if let Some(player) = self.player.take() {
                let _ = player.Close();
            }
            self.renderer = None;
            if let Some(stage) = &self.stage {
                video::release(&self.app, stage.hwnd);
                let _ = stage.visual.SetBrush(None);
            }
            self.connection = None;
            if self.client.take().is_some() {
                self.note("disconnected");
                self.engine.set_guest(None);
            }
        }

        /// Development only: plays a video file as if an Android phone had
        /// connected, to exercise the picture and the interface without one.
        #[cfg(debug_assertions)]
        fn rehearse(&mut self) {
            let Some(path) = std::env::var_os("MIRLOW_DEV_ANDROID_MEDIA") else { return };
            let uri = format!("file:///{}", path.to_string_lossy().replace('\\', "/"));
            let source = windows::Foundation::Uri::CreateUri(&HSTRING::from(uri))
                .and_then(|uri| MediaSource::CreateFromUri(&uri));
            match source {
                Ok(source) => {
                    let client = Client { name: "Android (rehearsal)".into(), model: "Android".into(), pin: None };
                    self.client = Some(client.clone());
                    self.engine.set_guest(Some(Guest { client, video: None }));
                    self.play(source);
                }
                Err(error) => self.note(format!("rehearsal file could not be opened: {error}")),
            }
        }
    }
}
