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
//! play the stream it hands over into a child window of the main window, which
//! [`crate::video`] then lays out exactly as it does the engine's.
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
    use crate::settings::Settings;
    use crate::video;
    use std::cell::RefCell;
    use std::sync::{Arc, Mutex};
    use tauri::AppHandle;
    use windows::core::{w, Error, IInspectable, Interface, Ref, Result, HSTRING};
    use windows_numerics::Vector2;
    use windows::Foundation::{Size, TypedEventHandler};
    use windows::Media::Core::MediaSource;
    use windows::Media::Miracast::{
        MiracastReceiver, MiracastReceiverApplySettingsStatus, MiracastReceiverAuthorizationMethod,
        MiracastReceiverConnection, MiracastReceiverConnectionCreatedEventArgs,
        MiracastReceiverDisconnectReason, MiracastReceiverDisconnectedEventArgs,
        MiracastReceiverListeningStatus, MiracastReceiverMediaSourceCreatedEventArgs,
        MiracastReceiverSession, MiracastReceiverSessionStartStatus, MiracastReceiverWiFiStatus,
    };
    use windows::Media::Playback::{MediaPlaybackSession, MediaPlayer, MediaPlayerSurface};
    use windows::System::{DispatcherQueue, DispatcherQueueHandler};
    use windows::Win32::Foundation::{E_FAIL, HWND, LPARAM, LRESULT, WPARAM};
    use windows::Win32::Graphics::Gdi::{GetStockObject, BLACK_BRUSH, HBRUSH};
    use windows::Win32::System::LibraryLoader::GetModuleHandleW;
    use windows::Win32::System::WinRT::Composition::ICompositorDesktopInterop;
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
    use windows::UI::Composition::{CompositionStretch, Compositor, SpriteVisual};

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
        surface: Option<MediaPlayerSurface>,
        stage: Option<Stage>,
    }

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
            surface: None,
            stage: None,
        };
        state.listen();
        #[cfg(debug_assertions)]
        state.rehearse();
        STATE.with(|cell| *cell.borrow_mut() = Some(state));
        *slot.lock().unwrap() = Some(queue);

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
            self.engine.note(format!("[mirlow] android: {}", text.as_ref()));
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
            // Like AirPlay in the engine: no code to type on the phone.
            settings.SetAuthorizationMethod(MiracastReceiverAuthorizationMethod::None)?;
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
                    if let Some(connection) = args.as_ref().and_then(|args| args.Connection().ok()) {
                        let name = connection
                            .Transmitter()
                            .and_then(|transmitter| transmitter.Name())
                            .map(|name| name.to_string())
                            .unwrap_or_default();
                        post(&queue, move |state| state.connected(connection, name));
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

        /// Windows' view of the receiver changed. If the Wi-Fi has just been
        /// turned on, try again; otherwise there is nothing to do.
        fn status_changed(&mut self) {
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

        fn connected(&mut self, connection: MiracastReceiverConnection, name: String) {
            self.end();
            self.note(format!("{name} is connecting"));
            // The newest device takes over, whichever way it connects.
            if self.engine.has_client() {
                self.engine.restart();
            }
            let client = Client {
                name: if name.trim().is_empty() { "Android".into() } else { name.trim().to_string() },
                model: "Android".into(),
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
            if self.stage.is_none() {
                self.stage = Some(Stage::create(&self.app)?);
            }
            let Some(stage) = &self.stage else { return Ok(()) };

            let player = MediaPlayer::new()?;
            // Show each frame as it arrives instead of buffering ahead.
            player.SetRealTimePlayback(true)?;
            player.SetIsMuted(!self.settings.lock().unwrap().sound)?;

            let queue = self.queue.clone();
            player.PlaybackSession()?.NaturalVideoSizeChanged(&TypedEventHandler::new(
                move |session: Ref<MediaPlaybackSession>, _| {
                    if let Some(session) = session.as_ref() {
                        let (width, height) = (session.NaturalVideoWidth()?, session.NaturalVideoHeight()?);
                        post(&queue, move |state| state.sized(width, height));
                    }
                    Ok(())
                },
            ))?;

            player.SetSource(&source)?;
            player.SetSurfaceSize(Size { Width: 1920.0, Height: 1080.0 })?;
            let surface = player.GetSurface(&stage.compositor)?;
            let brush = stage.compositor.CreateSurfaceBrushWithSurface(&surface.CompositionSurface()?)?;
            brush.SetStretch(CompositionStretch::Uniform)?;
            stage.visual.SetBrush(&brush)?;
            player.Play()?;

            self.player = Some(player);
            self.surface = Some(surface);
            Ok(())
        }

        /// The size of the picture is known, or changed (the phone was turned).
        fn sized(&mut self, width: u32, height: u32) {
            let (Some(client), Some(stage), Some(player)) = (&self.client, &self.stage, &self.player) else {
                return;
            };
            if width == 0 || height == 0 {
                return;
            }
            let _ = player.SetSurfaceSize(Size { Width: width as f32, Height: height as f32 });
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
            if let Some(surface) = self.surface.take() {
                let _ = surface.Close();
            }
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
                    let client = Client { name: "Android (rehearsal)".into(), model: "Android".into() };
                    self.client = Some(client.clone());
                    self.engine.set_guest(Some(Guest { client, video: None }));
                    self.play(source);
                }
                Err(error) => self.note(format!("rehearsal file could not be opened: {error}")),
            }
        }
    }
}
