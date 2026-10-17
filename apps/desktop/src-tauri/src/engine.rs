//! Runs and supervises the AirPlay engine (a patched UxPlay) as a child process.
//!
//! The engine reports what it is doing as `@@mirlow <event>` lines on stdout
//! (see `engine/patches`). This module turns those into a single [`Status`]
//! the interface can render, restarts the engine if it dies, and makes sure it
//! never outlives the app.

use crate::settings::Settings;
use crate::video;
use serde::Serialize;
use std::collections::VecDeque;
use std::io::{BufRead, BufReader, Read};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::atomic::{AtomicU32, Ordering};
use std::sync::mpsc::{self, Receiver, RecvTimeoutError, Sender};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter};

pub const STATUS_EVENT: &str = "engine:status";

/// How many unexpected exits within [`FAILURE_WINDOW`] before giving up.
const MAX_FAILURES: usize = 4;
const FAILURE_WINDOW: Duration = Duration::from_secs(60);
const LOG_LINES: usize = 300;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum Phase {
    /// The engine is launching.
    Starting,
    /// Advertised on the network and waiting for a device.
    Ready,
    /// A device has connected but has not sent a picture yet.
    Connecting,
    /// A screen is being mirrored.
    Mirroring,
    /// A screen was being mirrored and the device is still connected, but its
    /// picture has stopped: it was locked, or stopped sending it. The last
    /// frame is hidden, and the window keeps its shape for when it comes back.
    Paused,
    /// A device is playing audio only.
    Audio,
    /// The engine stopped unexpectedly and is being restarted.
    Recovering,
    /// The engine cannot run; see `error`.
    Error,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum ErrorKind {
    /// The engine's files are not where they should be.
    EngineMissing,
    /// The engine could not announce itself on the network.
    Discovery,
    /// The engine keeps exiting.
    Crashed,
    Unknown,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Client {
    pub name: String,
    pub model: String,
    /// A code to type on the device to let it connect, while it waits for one.
    pub pin: Option<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VideoSize {
    pub width: u32,
    pub height: u32,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Status {
    pub phase: Phase,
    /// The name being advertised.
    pub name: String,
    pub client: Option<Client>,
    pub video: Option<VideoSize>,
    pub error: Option<ErrorKind>,
    /// True while video is decoded in software because the GPU path failed.
    pub software_decoding: bool,
    /// The device is sending sound that can be heard.
    pub sound: bool,
    /// The device said its screen went to sleep: it was locked, or its screen
    /// turned off. The picture comes back when it wakes.
    pub locked: bool,
}

/// A device mirroring through something other than the AirPlay engine (an
/// Android phone over Miracast). While there is one, it is what the interface
/// shows.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Guest {
    pub client: Client,
    /// Unknown until the first picture arrives.
    pub video: Option<VideoSize>,
}

enum Message {
    Line(String),
    Restart,
    Shutdown,
}

enum Outcome {
    Restart,
    Shutdown,
    Exited,
}

/// What the engine has said about the connected device beyond what [`Status`]
/// shows. Cleared when the device goes.
#[derive(Default)]
struct Session {
    /// The device's screen is asleep, so the picture is paused.
    locked: bool,
    /// The newest picture size while asleep, applied when the device wakes, so
    /// the window does not change shape behind the pause.
    held: Option<VideoSize>,
    /// The device is streaming music (AirPlay audio) rather than its screen.
    audio_only: bool,
}

struct Shared {
    app: AppHandle,
    engine_dir: PathBuf,
    data_dir: PathBuf,
    settings: Arc<Mutex<Settings>>,
    /// What the engine itself is doing.
    status: Mutex<Status>,
    guest: Mutex<Option<Guest>>,
    /// The status the interface was last told about.
    shown: Mutex<Option<Status>>,
    log: Mutex<VecDeque<String>>,
    pid: AtomicU32,
    connections: AtomicU32,
}

#[derive(Clone)]
pub struct Engine {
    shared: Arc<Shared>,
    tx: Sender<Message>,
}

impl Engine {
    pub fn start(
        app: AppHandle,
        engine_dir: PathBuf,
        data_dir: PathBuf,
        settings: Arc<Mutex<Settings>>,
    ) -> Self {
        let name = settings.lock().unwrap().name.clone();
        let shared = Arc::new(Shared {
            app,
            engine_dir,
            data_dir,
            settings,
            status: Mutex::new(Status {
                phase: Phase::Starting,
                name,
                client: None,
                video: None,
                error: None,
                software_decoding: false,
                sound: false,
                locked: false,
            }),
            guest: Mutex::new(None),
            shown: Mutex::new(None),
            log: Mutex::new(VecDeque::with_capacity(LOG_LINES)),
            pid: AtomicU32::new(0),
            connections: AtomicU32::new(0),
        });

        let (tx, rx) = mpsc::channel();
        let supervisor = Supervisor {
            shared: shared.clone(),
            tx: tx.clone(),
            rx,
            job: ProcessJob::new(),
            session: Session::default(),
        };
        thread::Builder::new()
            .name("engine-supervisor".into())
            .spawn(move || supervisor.run())
            .expect("failed to start the engine supervisor thread");

        Self { shared, tx }
    }

    pub fn status(&self) -> Status {
        self.shared.current()
    }

    /// Sets or clears the device mirroring outside the engine.
    pub fn set_guest(&self, guest: Option<Guest>) {
        *self.shared.guest.lock().unwrap() = guest;
        self.shared.publish();
    }

    /// True while a device is connected to the engine itself.
    pub fn has_client(&self) -> bool {
        self.shared.connections.load(Ordering::Relaxed) > 0
    }

    /// Adds a line to the log shown in the help sheet.
    pub fn note(&self, line: String) {
        self.shared.log_line(line);
    }

    /// Process id of the running engine, or 0.
    pub fn pid(&self) -> u32 {
        self.shared.pid.load(Ordering::Relaxed)
    }

    pub fn log(&self) -> String {
        let log = self.shared.log.lock().unwrap();
        log.iter().cloned().collect::<Vec<_>>().join("\n")
    }

    /// Stops the engine and starts it again with the current settings.
    pub fn restart(&self) {
        let _ = self.tx.send(Message::Restart);
    }

    /// Stops the engine for good. Returns once it has been asked to exit.
    pub fn shutdown(&self) {
        let _ = self.tx.send(Message::Shutdown);
        // Give the supervisor a moment to close the engine cleanly, so its
        // network announcement is withdrawn; the job object covers the rest.
        let deadline = Instant::now() + Duration::from_millis(1500);
        while self.pid() != 0 && Instant::now() < deadline {
            thread::sleep(Duration::from_millis(20));
        }
    }
}

impl Shared {
    /// The engine's status, with the guest device laid over it if there is one.
    fn current(&self) -> Status {
        let mut status = self.status.lock().unwrap().clone();
        if let Some(guest) = self.guest.lock().unwrap().clone() {
            status.phase = if guest.video.is_some() { Phase::Mirroring } else { Phase::Connecting };
            status.client = Some(guest.client);
            status.video = guest.video;
            status.error = None;
            status.sound = false;
            status.locked = false;
        }
        status
    }

    /// Tells the interface about the status, if it changed.
    fn publish(&self) {
        let mut shown = self.shown.lock().unwrap();
        let status = self.current();
        if shown.as_ref() != Some(&status) {
            *shown = Some(status.clone());
            let _ = self.app.emit(STATUS_EVENT, status);
        }
    }

    fn log_line(&self, line: String) {
        let mut log = self.log.lock().unwrap();
        if log.len() == LOG_LINES {
            log.pop_front();
        }
        log.push_back(line);
    }
}

struct Supervisor {
    shared: Arc<Shared>,
    tx: Sender<Message>,
    rx: Receiver<Message>,
    job: ProcessJob,
    session: Session,
}

impl Supervisor {
    fn run(mut self) {
        let mut failures: Vec<Instant> = Vec::new();
        // Set when the GPU decoder fails mid-session; lasts until the app closes.
        let mut software_fallback = false;

        loop {
            let settings = self.shared.settings.lock().unwrap().clone();
            let software = settings.compatibility || software_fallback;
            self.shared.connections.store(0, Ordering::Relaxed);
            self.session = Session::default();
            self.update(|status| {
                status.phase = if failures.is_empty() { Phase::Starting } else { Phase::Recovering };
                status.name = settings.name.clone();
                status.client = None;
                status.video = None;
                status.error = None;
                status.software_decoding = software && !settings.compatibility;
                status.sound = false;
                status.locked = false;
            });

            let mut child = match self.spawn(&settings, software) {
                Ok(child) => child,
                Err(error) => {
                    self.log_line(format!("[mirlow] could not start the engine: {error}"));
                    self.fail(if error.kind() == std::io::ErrorKind::NotFound {
                        ErrorKind::EngineMissing
                    } else {
                        ErrorKind::Unknown
                    });
                    match self.wait_for_command() {
                        Outcome::Shutdown => return,
                        _ => {
                            failures.clear();
                            continue;
                        }
                    }
                }
            };

            self.shared.pid.store(child.id(), Ordering::Relaxed);
            self.job.assign(&child);
            self.read_output(&mut child);

            let started = Instant::now();
            let mut hint: Option<ErrorKind> = None;
            let mut video_failed = false;
            let outcome = loop {
                match self.rx.recv_timeout(Duration::from_millis(200)) {
                    Ok(Message::Line(line)) => {
                        self.handle_line(&line, &mut hint, &mut video_failed);
                    }
                    Ok(Message::Restart) => break Outcome::Restart,
                    Ok(Message::Shutdown) => break Outcome::Shutdown,
                    Err(RecvTimeoutError::Timeout) => {
                        if matches!(child.try_wait(), Ok(Some(_)) | Err(_)) {
                            break Outcome::Exited;
                        }
                    }
                    Err(RecvTimeoutError::Disconnected) => break Outcome::Shutdown,
                }
            };

            stop(&mut child);
            self.shared.pid.store(0, Ordering::Relaxed);
            video::detach(&self.shared.app);
            // Lines the engine printed on its way out.
            while let Ok(message) = self.rx.try_recv() {
                match message {
                    Message::Line(line) => self.handle_line(&line, &mut hint, &mut video_failed),
                    Message::Shutdown => return,
                    Message::Restart => {}
                }
            }

            match outcome {
                Outcome::Shutdown => return,
                Outcome::Restart => {
                    failures.clear();
                    continue;
                }
                Outcome::Exited => {}
            }

            self.log_line("[mirlow] the engine exited unexpectedly".into());
            if video_failed && !software {
                self.log_line("[mirlow] switching to software video decoding".into());
                software_fallback = true;
            }

            let now = Instant::now();
            if now.duration_since(started) > FAILURE_WINDOW {
                failures.clear();
            }
            failures.retain(|at| now.duration_since(*at) < FAILURE_WINDOW);
            failures.push(now);

            if failures.len() > MAX_FAILURES {
                self.fail(hint.unwrap_or(ErrorKind::Crashed));
                match self.wait_for_command() {
                    Outcome::Shutdown => return,
                    _ => {
                        failures.clear();
                        continue;
                    }
                }
            }

            self.update(|status| {
                status.phase = Phase::Recovering;
                status.client = None;
                status.video = None;
                status.sound = false;
                status.locked = false;
            });
            let backoff = Duration::from_millis(400 * (1 << (failures.len() - 1).min(4)) as u64);
            match self.rx.recv_timeout(backoff) {
                Ok(Message::Shutdown) | Err(RecvTimeoutError::Disconnected) => return,
                Ok(Message::Restart) => failures.clear(),
                Ok(Message::Line(_)) | Err(RecvTimeoutError::Timeout) => {}
            }
        }
    }

    fn spawn(&self, settings: &Settings, software: bool) -> std::io::Result<Child> {
        let dir = &self.shared.engine_dir;
        let bin = dir.join("bin");
        let exe = bin.join("mirlow-engine.exe");
        if !exe.is_file() {
            return Err(std::io::Error::new(
                std::io::ErrorKind::NotFound,
                format!("{} is missing", exe.display()),
            ));
        }
        std::fs::create_dir_all(&self.shared.data_dir)?;

        // Development builds can run a stand-in engine (scripts/dev/fake-engine.c)
        // to exercise the interface without a phone. Release builds cannot.
        #[cfg(debug_assertions)]
        let exe = std::env::var_os("MIRLOW_DEV_ENGINE_EXE").map(PathBuf::from).unwrap_or(exe);

        let mut command = Command::new(&exe);
        command
            // Run in the data folder, not the install folder: graphics drivers
            // drop cache folders into the working directory.
            .current_dir(&self.shared.data_dir)
            .arg("-n")
            .arg(&settings.name)
            .arg("-nh") // advertise the name as given, without "@hostname"
            .arg("-nohold") // a new device may take over from the current one
            // When a device drops off the network, close its picture rather
            // than leave the last frame up: Mirlow hides it anyway, and a
            // window left behind could not be found again for the next device.
            .arg("-nofreeze")
            .args(["-fps", "60"])
            .arg("-key")
            .arg(self.shared.data_dir.join("receiver.pem"))
            .arg("-m")
            .arg(device_id(&self.shared.data_dir))
            // Direct3D 11 output in the engine's own window, which `video`
            // then places inside ours. No Alt+Enter handling of its own.
            .args(["-vs", "d3d11videosink fullscreen-toggle-mode=none"]);
        if software {
            command.arg("-avdec");
        } else {
            // Ask the device for a picture as tall as this screen, so full
            // screen is sharp. Software decoding keeps the engine's 1080p.
            command.args(["-s", &requested_resolution()]);
            // Above 1080p an iPhone sends HEVC rather than H.264, and drops
            // the connection if the receiver has not said it accepts that.
            command.arg("-h265");
        }
        if !settings.sound {
            command.args(["-as", "0"]);
        }

        // The engine must find only the libraries and plugins shipped with it.
        let system_root = std::env::var("SystemRoot").unwrap_or_else(|_| r"C:\Windows".into());
        let path = format!(r"{};{}\System32;{}", bin.display(), system_root, system_root);
        for (key, _) in std::env::vars() {
            if key.starts_with("GST_") || key.starts_with("GSTREAMER_") {
                command.env_remove(key);
            }
        }
        command
            .env("PATH", path)
            .env("MIRLOW_SUPERVISED", "1")
            .env("HOME", &self.shared.data_dir)
            .env("GST_PLUGIN_SYSTEM_PATH_1_0", dir.join("lib").join("gstreamer-1.0"))
            .env(
                "GST_PLUGIN_SCANNER_1_0",
                dir.join("libexec").join("gstreamer-1.0").join("gst-plugin-scanner.exe"),
            )
            .env("GST_REGISTRY_1_0", self.shared.data_dir.join("gstreamer-registry.bin"))
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());

        #[cfg(windows)]
        {
            use std::os::windows::process::CommandExt;
            const CREATE_NO_WINDOW: u32 = 0x0800_0000;
            command.creation_flags(CREATE_NO_WINDOW);
        }

        command.spawn()
    }

    fn read_output(&self, child: &mut Child) {
        if let Some(stdout) = child.stdout.take() {
            forward_lines(stdout, self.tx.clone());
        }
        if let Some(stderr) = child.stderr.take() {
            forward_lines(stderr, self.tx.clone());
        }
    }

    fn handle_line(&mut self, line: &str, hint: &mut Option<ErrorKind>, video_failed: &mut bool) {
        let line = line.trim_end();
        if line.is_empty() {
            return;
        }
        self.log_line(line.to_string());

        if let Some(event) = line.strip_prefix("@@mirlow ") {
            self.handle_event(event);
            return;
        }

        if line.contains("GStreamer error (video)") {
            *video_failed = true;
        }
        let lower = line.to_ascii_lowercase();
        if lower.contains("dnssd") && (lower.contains("fail") || lower.contains("could not")) {
            *hint = Some(ErrorKind::Discovery);
        }
        // "ct=2" is Apple Lossless, which only audio-only AirPlay uses.
        if line.starts_with("ct=2 ") {
            self.session.audio_only = true;
            self.update(|status| settle(status, true));
        }
    }

    fn handle_event(&mut self, event: &str) {
        let (kind, rest) = event.split_once(' ').unwrap_or((event, ""));
        match kind {
            "ready" => self.update(|status| {
                status.phase = Phase::Ready;
                status.error = None;
            }),
            "client" => {
                let (model, name) = rest.split_once('\t').unwrap_or(("", rest));
                let client = Client { name: name.trim().to_string(), model: model.trim().to_string(), pin: None };
                // Mirlow may be tucked away in the notification area: come
                // forward now, so the connection is seen from its first moment.
                crate::tray::show_window(&self.shared.app);
                // The newest device takes over, whichever way it connects.
                crate::miracast::disconnect(&self.shared.app);
                let audio_only = self.session.audio_only;
                self.update(|status| {
                    status.client = Some(client);
                    if status.phase == Phase::Ready {
                        status.phase = Phase::Connecting;
                    }
                    settle(status, audio_only);
                });
            }
            "connections" => {
                let count: u32 = rest.trim().parse().unwrap_or(0);
                self.shared.connections.store(count, Ordering::Relaxed);
                if count == 0 {
                    video::detach(&self.shared.app);
                    self.session = Session::default();
                    self.update(|status| {
                        if status.phase != Phase::Error {
                            status.phase = Phase::Ready;
                        }
                        status.client = None;
                        status.video = None;
                        status.sound = false;
                        status.locked = false;
                    });
                } else {
                    let audio_only = self.session.audio_only;
                    self.update(|status| {
                        if status.phase == Phase::Ready {
                            status.phase = Phase::Connecting;
                        }
                        settle(status, audio_only);
                    });
                }
            }
            "video-size" => {
                let mut numbers = rest.split_whitespace().filter_map(|n| n.parse::<u32>().ok());
                if let (Some(width), Some(height)) = (numbers.next(), numbers.next()) {
                    if width > 0 && height > 0 {
                        let size = VideoSize { width, height };
                        if self.session.locked {
                            // Asleep: keep the window's shape until the device
                            // wakes, which reports its size again anyway.
                            self.session.held = Some(size);
                            self.update(|status| {
                                if status.video.is_none() {
                                    status.video = Some(size);
                                    status.phase = Phase::Paused;
                                }
                            });
                        } else {
                            self.session.held = None;
                            self.update(|status| {
                                status.phase = Phase::Mirroring;
                                status.video = Some(size);
                            });
                        }
                        video::watch(&self.shared.app, self.shared.pid.load(Ordering::Relaxed));
                    }
                }
            }
            "video-pause" => {
                // The device's screen went to sleep, usually because it was
                // locked. Its last frame must not stay on show (it may be on a
                // projector), so it is hidden before anything else happens.
                video::conceal(&self.shared.app, true);
                self.session.locked = true;
                self.update(|status| {
                    status.locked = true;
                    if status.video.is_some() {
                        status.phase = Phase::Paused;
                    }
                });
            }
            "video-resume" => {
                // Awake again. The picture is revealed once the interface has
                // laid it out, by which time a fresh frame has replaced the old one.
                video::conceal(&self.shared.app, false);
                self.session.locked = false;
                let held = self.session.held.take();
                self.update(|status| {
                    status.locked = false;
                    if let Some(size) = held {
                        status.video = Some(size);
                    }
                    if status.phase == Phase::Paused && status.video.is_some() {
                        status.phase = Phase::Mirroring;
                    }
                });
            }
            "video-reset" => {
                // The picture stopped. The device may stay connected: to carry
                // on later, or to keep playing sound in the meantime.
                video::detach(&self.shared.app);
                let connected = self.shared.connections.load(Ordering::Relaxed) > 0;
                // Type 0 means another device is taking over from this one.
                let takeover = rest.trim() == "0";
                self.session.locked = false;
                self.session.held = None;
                if takeover {
                    self.session = Session::default();
                }
                let audio_only = self.session.audio_only;
                self.update(|status| {
                    status.locked = false;
                    if takeover {
                        status.client = None;
                        status.sound = false;
                    }
                    if connected && !takeover && status.video.is_some() {
                        // Keep the window as it was, with the picture hidden,
                        // rather than claim to be connecting all over again.
                        status.phase = Phase::Paused;
                    } else {
                        status.video = None;
                        if matches!(status.phase, Phase::Mirroring | Phase::Paused) {
                            status.phase = if connected { Phase::Connecting } else { Phase::Ready };
                        }
                        settle(status, audio_only);
                    }
                });
            }
            "sound" => {
                let sound = rest.trim() == "1";
                let audio_only = self.session.audio_only;
                self.update(|status| {
                    status.sound = sound;
                    settle(status, audio_only);
                });
            }
            _ => {}
        }
    }

    fn fail(&self, kind: ErrorKind) {
        self.update(|status| {
            status.phase = Phase::Error;
            status.error = Some(kind);
            status.client = None;
            status.video = None;
        });
    }

    /// Blocks until the interface asks for a restart or the app closes.
    fn wait_for_command(&self) -> Outcome {
        loop {
            match self.rx.recv() {
                Ok(Message::Restart) => return Outcome::Restart,
                Ok(Message::Shutdown) | Err(_) => return Outcome::Shutdown,
                Ok(Message::Line(_)) => {}
            }
        }
    }

    fn update(&self, change: impl FnOnce(&mut Status)) {
        change(&mut self.shared.status.lock().unwrap());
        self.shared.publish();
    }

    fn log_line(&self, line: String) {
        self.shared.log_line(line);
    }
}

/// A device with no picture that is sending sound is playing sound, not
/// connecting; once the sound stops (and it is not streaming music, where a
/// quiet moment between songs means nothing) it is back to waiting for a picture.
fn settle(status: &mut Status, audio_only: bool) {
    let sound = status.sound || audio_only;
    match status.phase {
        Phase::Connecting if sound => status.phase = Phase::Audio,
        Phase::Audio if !sound => status.phase = Phase::Connecting,
        _ => {}
    }
}

fn forward_lines(stream: impl Read + Send + 'static, tx: Sender<Message>) {
    thread::spawn(move || {
        let mut reader = BufReader::new(stream);
        let mut buffer = Vec::new();
        loop {
            buffer.clear();
            match reader.read_until(b'\n', &mut buffer) {
                Ok(0) | Err(_) => break,
                Ok(_) => {
                    // Device names are UTF-8, but nothing guarantees every byte
                    // the engine prints is.
                    let line = String::from_utf8_lossy(&buffer).into_owned();
                    if tx.send(Message::Line(line)).is_err() {
                        break;
                    }
                }
            }
        }
    });
}

/// Asks the engine to exit by closing its stdin, then insists.
fn stop(child: &mut Child) {
    drop(child.stdin.take());
    let deadline = Instant::now() + Duration::from_millis(1200);
    while Instant::now() < deadline {
        if matches!(child.try_wait(), Ok(Some(_)) | Err(_)) {
            return;
        }
        thread::sleep(Duration::from_millis(20));
    }
    let _ = child.kill();
    let _ = child.wait();
}

/// The receiver's identity on the network, in the form of a MAC address.
///
/// Left to itself the engine borrows the address of the first network adapter
/// it finds, which on many PCs is a virtual adapter whose address is the same
/// on every machine. Mirlow instead makes one up on first run and keeps it, so
/// each installation is distinct and iPhones recognise this PC next time.
fn device_id(data_dir: &Path) -> String {
    let file = data_dir.join("device-id");
    if let Ok(saved) = std::fs::read_to_string(&file) {
        let saved = saved.trim();
        let valid = saved.len() == 17
            && saved.split(':').count() == 6
            && saved.split(':').all(|part| part.len() == 2 && u8::from_str_radix(part, 16).is_ok());
        if valid {
            return saved.to_string();
        }
    }

    use std::hash::{BuildHasher, Hasher};
    let mut hasher = std::collections::hash_map::RandomState::new().build_hasher();
    hasher.write_u32(std::process::id());
    if let Ok(elapsed) = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH) {
        hasher.write_u128(elapsed.as_nanos());
    }
    let mut bytes = hasher.finish().to_be_bytes();
    // Mark the address as locally administered and unicast, as made-up
    // addresses must be.
    bytes[0] = (bytes[0] | 0x02) & 0xfe;
    let id = bytes[..6].iter().map(|byte| format!("{byte:02x}")).collect::<Vec<_>>().join(":");
    let _ = std::fs::write(&file, &id);
    id
}

/// The picture size to request from the device: the primary screen's, kept
/// between 1080p and 4K. The device treats it as an upper limit and the
/// height is what it goes by.
fn requested_resolution() -> String {
    #[cfg(windows)]
    let (width, height) = {
        use windows::Win32::UI::WindowsAndMessaging::{GetSystemMetrics, SM_CXSCREEN, SM_CYSCREEN};
        // SAFETY: plain queries with no pointers involved.
        unsafe { (GetSystemMetrics(SM_CXSCREEN), GetSystemMetrics(SM_CYSCREEN)) }
    };
    #[cfg(not(windows))]
    let (width, height) = (1920, 1080);
    // A screen turned on its side still wants a landscape request.
    let (width, height) = (width.max(height), width.min(height));
    format!("{}x{}", width.clamp(1920, 3840), height.clamp(1080, 2160))
}

/// Where the bundled engine lives.
pub fn locate(resource_dir: Option<&Path>) -> PathBuf {
    if let Some(dir) = resource_dir {
        let bundled = dir.join("engine");
        if bundled.join("bin").join("mirlow-engine.exe").is_file() {
            return bundled;
        }
    }
    // Running from the source tree.
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("resources").join("engine")
}

/// A Windows job object that kills the engine if the app dies without
/// stopping it, so a crash never leaves a receiver advertised on the network.
struct ProcessJob {
    #[cfg(windows)]
    handle: Option<windows::Win32::Foundation::HANDLE>,
}

// The handle is only ever used from the supervisor thread.
unsafe impl Send for ProcessJob {}

impl ProcessJob {
    #[cfg(windows)]
    fn new() -> Self {
        use windows::Win32::System::JobObjects::{
            CreateJobObjectW, JobObjectExtendedLimitInformation, SetInformationJobObject,
            JOBOBJECT_EXTENDED_LIMIT_INFORMATION, JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE,
        };
        let handle = unsafe {
            let Ok(handle) = CreateJobObjectW(None, None) else {
                return Self { handle: None };
            };
            let mut info = JOBOBJECT_EXTENDED_LIMIT_INFORMATION::default();
            info.BasicLimitInformation.LimitFlags = JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE;
            let _ = SetInformationJobObject(
                handle,
                JobObjectExtendedLimitInformation,
                &info as *const _ as *const core::ffi::c_void,
                std::mem::size_of::<JOBOBJECT_EXTENDED_LIMIT_INFORMATION>() as u32,
            );
            handle
        };
        Self { handle: Some(handle) }
    }

    #[cfg(windows)]
    fn assign(&self, child: &Child) {
        use std::os::windows::io::AsRawHandle;
        use windows::Win32::Foundation::HANDLE;
        use windows::Win32::System::JobObjects::AssignProcessToJobObject;
        if let Some(job) = self.handle {
            unsafe {
                let _ = AssignProcessToJobObject(job, HANDLE(child.as_raw_handle() as _));
            }
        }
    }

    #[cfg(not(windows))]
    fn new() -> Self {
        Self {}
    }

    #[cfg(not(windows))]
    fn assign(&self, _child: &Child) {}
}

#[cfg(test)]
mod tests {
    use super::*;

    fn status(phase: Phase, sound: bool) -> Status {
        Status {
            phase,
            name: "PC".into(),
            client: None,
            video: None,
            error: None,
            software_decoding: false,
            sound,
            locked: false,
        }
    }

    #[test]
    fn sound_without_a_picture_is_not_connecting() {
        let mut playing = status(Phase::Connecting, true);
        settle(&mut playing, false);
        assert_eq!(playing.phase, Phase::Audio);

        let mut quiet = status(Phase::Audio, false);
        settle(&mut quiet, false);
        assert_eq!(quiet.phase, Phase::Connecting);
    }

    #[test]
    fn music_between_songs_is_still_music() {
        let mut between = status(Phase::Audio, false);
        settle(&mut between, true);
        assert_eq!(between.phase, Phase::Audio);
    }

    #[test]
    fn a_picture_is_left_alone() {
        for phase in [Phase::Mirroring, Phase::Paused, Phase::Ready] {
            let mut shown = status(phase, true);
            settle(&mut shown, true);
            assert_eq!(shown.phase, phase);
        }
    }
}
