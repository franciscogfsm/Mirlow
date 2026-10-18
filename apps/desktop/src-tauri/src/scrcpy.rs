//! Mirrors and controls Android phones over Wi-Fi, with almost no delay,
//! through scrcpy.
//!
//! Miracast ([`crate::miracast`]) needs nothing set up on the phone, but it
//! holds the picture back and carries nothing the other way. scrcpy reaches
//! the phone through Android's own "Wireless debugging" (Android 11 and
//! later): the phone encodes its screen as it is drawn, each frame is shown
//! the moment it is decoded, and clicks and keys on the picture go straight
//! back as touches and key presses. It works on every Android phone, Google's
//! Pixel included, and carries the sound too.
//!
//! The phone has to trust this PC once. Mirlow shows a QR code, which the
//! phone's Wireless debugging screen scans (the way Android Studio pairs), or
//! takes the six-digit code the phone shows; the phone then announces itself
//! on the network and Mirlow pairs with it. From then on the phone connects
//! by itself whenever Wireless debugging is on and it is on the same network,
//! and Mirlow lists it, ready to mirror with one click.
//!
//! adb, which carries all of this, runs as a server of Mirlow's own, on a
//! port of its own, so it never trips over a developer's adb.
//!
//! scrcpy draws the phone in a window of its own, which is adopted into the
//! main window like the AirPlay engine's ([`crate::video`]), but left taking
//! the mouse and keyboard.

use crate::engine::{Client, Engine, Guest, ProcessJob, VideoSize};
use crate::settings::Settings;
use serde::Serialize;
use std::collections::HashMap;
use std::io::{BufRead, BufReader, Read};
use std::net::{SocketAddr, TcpStream};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::atomic::{AtomicIsize, AtomicU64, Ordering};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter, Manager};

/// The port Mirlow's adb server listens on (adb's own default is 5037).
const ADB_PORT: u16 = 5137;
/// The event that carries [`Link`] to the interface.
const EVENT: &str = "android:link";
/// How long the phone has to scan the code, or show up with its own.
const PAIRING_TIME: Duration = Duration::from_secs(5 * 60);

/// A phone that is connected and can be mirrored.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Phone {
    /// adb's name for the connection.
    pub serial: String,
    /// What the phone calls itself ("Galaxy S24", or the name its owner gave it).
    pub name: String,
}

/// A QR code, as rows of dark (`1`) and light (`0`) modules, `size` by `size`.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct Qr {
    pub size: u32,
    pub modules: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase", tag = "state")]
pub enum Pairing {
    Idle,
    /// Showing a code for the phone to scan.
    Waiting { qr: Qr },
    /// Looking for the phone that shows the code typed in.
    Searching,
    /// The phone was found; it is being paired.
    Pairing,
    Paired,
    /// The code was wrong, or the phone said no.
    Refused,
    /// No phone turned up in time.
    NotFound,
}

/// Everything the interface shows about Android over Wi-Fi.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Link {
    /// Mirlow is looking for paired phones.
    pub enabled: bool,
    /// scrcpy is part of this build.
    pub available: bool,
    pub phones: Vec<Phone>,
    pub pairing: Pairing,
    /// The serial of the phone being mirrored.
    pub mirroring: Option<String>,
}

/// A phone being mirrored.
struct Session {
    id: u64,
    serial: String,
    client: Client,
    child: Arc<Mutex<Child>>,
    /// scrcpy's window, once it is adopted, or 0.
    hwnd: Arc<AtomicIsize>,
}

struct Shared {
    app: AppHandle,
    engine: Engine,
    settings: Arc<Mutex<Settings>>,
    dir: PathBuf,
    link: Mutex<Link>,
    /// Mirlow's adb server, while it runs.
    server: Mutex<Option<Child>>,
    /// Bumped when the server is stopped, which ends whatever watched it.
    server_generation: AtomicU64,
    /// Bumped to end whatever pairing attempt is running.
    pairing_generation: AtomicU64,
    session: Mutex<Option<Session>>,
    sessions: AtomicU64,
    /// Kills adb and scrcpy should Mirlow die without stopping them.
    job: Mutex<ProcessJob>,
    /// What each connection's phone is called, and the serial number that
    /// tells two connections to the same phone apart.
    known: Mutex<HashMap<String, (String, String)>>,
}

pub struct Scrcpy {
    shared: Arc<Shared>,
}

/// Where the bundled scrcpy lives.
pub fn locate(resource_dir: Option<&Path>) -> PathBuf {
    if let Some(dir) = resource_dir {
        let bundled = dir.join("scrcpy");
        if bundled.join("scrcpy.exe").is_file() {
            return bundled;
        }
    }
    // Running from the source tree.
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("resources").join("scrcpy")
}

/// Ends the phone being mirrored over Wi-Fi, if there is one: another device
/// is taking over.
pub fn stop(app: &AppHandle) {
    if let Some(scrcpy) = app.try_state::<Scrcpy>() {
        scrcpy.stop();
    }
}

impl Scrcpy {
    pub fn start(app: AppHandle, engine: Engine, settings: Arc<Mutex<Settings>>, dir: PathBuf) -> Self {
        let available = dir.join("scrcpy.exe").is_file() && dir.join("adb.exe").is_file();
        let enabled = available && settings.lock().unwrap().android_wifi;
        let shared = Arc::new(Shared {
            app,
            engine,
            settings,
            dir,
            link: Mutex::new(Link {
                enabled: false,
                available,
                phones: Vec::new(),
                pairing: Pairing::Idle,
                mirroring: None,
            }),
            server: Mutex::new(None),
            server_generation: AtomicU64::new(0),
            pairing_generation: AtomicU64::new(0),
            session: Mutex::new(None),
            sessions: AtomicU64::new(0),
            job: Mutex::new(ProcessJob::new()),
            known: Mutex::new(HashMap::new()),
        });
        let scrcpy = Self { shared };
        if enabled {
            scrcpy.enable(true);
        }
        scrcpy
    }

    pub fn link(&self) -> Link {
        self.shared.link.lock().unwrap().clone()
    }

    /// Starts or stops looking for paired phones.
    pub fn enable(&self, enabled: bool) {
        let shared = &self.shared;
        if enabled && shared.link.lock().unwrap().available {
            shared.start_server();
        } else {
            self.cancel_pairing();
            self.stop();
            shared.stop_server();
        }
    }

    /// Shows a code for the phone to scan, and pairs with the phone that does.
    pub fn pair(&self) {
        let shared = self.shared.clone();
        shared.start_server();
        let generation = shared.pairing_generation.fetch_add(1, Ordering::SeqCst) + 1;
        // What the phone looks for on the network once it has read the code,
        // and the password it then pairs with.
        let service = format!("mirlow-{}", random_text(10));
        let password = random_text(12);
        let Some(qr) = qr_code(&format!("WIFI:T:ADB;S:{service};P:{password};;")) else {
            shared.set_pairing(Pairing::NotFound);
            return;
        };
        shared.set_pairing(Pairing::Waiting { qr });
        thread::spawn(move || {
            let found = shared.find_pairing_service(generation, |name| name == service);
            if let Some(address) = found {
                shared.pair_with(generation, &address, &password);
            }
        });
    }

    /// Pairs with the phone showing `code` on its "Pair device with pairing
    /// code" screen.
    pub fn pair_with_code(&self, code: String) {
        let shared = self.shared.clone();
        shared.start_server();
        let generation = shared.pairing_generation.fetch_add(1, Ordering::SeqCst) + 1;
        let code: String = code.chars().filter(char::is_ascii_digit).collect();
        shared.set_pairing(Pairing::Searching);
        thread::spawn(move || {
            // Any phone showing a code will do: there is rarely more than one,
            // and a wrong one refuses the code.
            let found = shared.find_pairing_service(generation, |name| !name.starts_with("mirlow-"));
            if let Some(address) = found {
                shared.pair_with(generation, &address, &code);
            }
        });
    }

    pub fn cancel_pairing(&self) {
        self.shared.pairing_generation.fetch_add(1, Ordering::SeqCst);
        self.shared.set_pairing(Pairing::Idle);
    }

    /// Starts mirroring the phone connected as `serial`.
    pub fn mirror(&self, serial: &str) -> Result<(), String> {
        self.stop();
        let shared = &self.shared;
        let name = {
            let link = shared.link.lock().unwrap();
            link.phones.iter().find(|phone| phone.serial == serial).map(|phone| phone.name.clone())
        }
        .ok_or_else(|| "That phone is no longer connected.".to_string())?;

        // The newest device takes over, whichever way it connects.
        crate::miracast::disconnect(&shared.app);
        if shared.engine.has_client() {
            shared.engine.restart();
        }

        let natural = shared.screen_size(serial);
        let child = shared.spawn_scrcpy(serial).map_err(|error| {
            shared.note(format!("could not start scrcpy: {error}"));
            error.to_string()
        })?;
        let pid = child.id();
        let id = shared.sessions.fetch_add(1, Ordering::SeqCst) + 1;
        let client = Client { name: name.clone(), model: "Android".into(), pin: None, direct: true };
        let child = Arc::new(Mutex::new(child));
        let hwnd = Arc::new(AtomicIsize::new(0));
        *shared.session.lock().unwrap() = Some(Session {
            id,
            serial: serial.to_string(),
            client: client.clone(),
            child: child.clone(),
            hwnd: hwnd.clone(),
        });
        shared.note(format!("mirroring {name} over Wi-Fi"));
        crate::tray::show_window(&shared.app);
        shared.engine.set_guest(Some(Guest { client: client.clone(), video: None }));
        shared.update(|link| link.mirroring = Some(serial.to_string()));

        // The picture's shape follows the phone: upright or on its side.
        let oriented = move |width: i32, height: i32| -> VideoSize {
            let landscape = width > height;
            match natural {
                Some((w, h)) if (w > h) == landscape => VideoSize { width: w, height: h },
                Some((w, h)) => VideoSize { width: h, height: w },
                None => VideoSize { width: width.max(1) as u32, height: height.max(1) as u32 },
            }
        };

        let shown = {
            let shared = shared.clone();
            let client = client.clone();
            let hwnd = hwnd.clone();
            move |window: isize, width: i32, height: i32| {
                if !shared.is_session(id) {
                    return;
                }
                hwnd.store(window, Ordering::SeqCst);
                shared.engine.set_guest(Some(Guest { client, video: Some(oriented(width, height)) }));
                focus::follow_clicks(window, pid);
                focus::give(window);
            }
        };
        crate::video::watch_interactive(&shared.app, pid, shown);

        let shared = shared.clone();
        thread::spawn(move || {
            let mut video = None;
            loop {
                thread::sleep(Duration::from_millis(100));
                if !shared.is_session(id) {
                    return;
                }
                let exited = child.lock().unwrap().try_wait().ok().flatten();
                if let Some(status) = exited {
                    shared.note(format!("scrcpy ended ({status})"));
                    shared.end(id);
                    return;
                }
                let window = hwnd.load(Ordering::SeqCst);
                if window == 0 {
                    continue;
                }
                // scrcpy resized its window: the phone turned.
                if let Some((width, height)) = crate::video::resized(&shared.app, window) {
                    let size = oriented(width, height);
                    if video != Some(size) {
                        video = Some(size);
                        shared.engine.set_guest(Some(Guest { client: client.clone(), video: Some(size) }));
                    }
                    crate::video::replace(&shared.app);
                }
            }
        });
        Ok(())
    }

    /// Ends the mirroring, if there is any.
    pub fn stop(&self) {
        let id = self.shared.session.lock().unwrap().as_ref().map(|session| session.id);
        if let Some(id) = id {
            self.shared.end(id);
        }
    }

    pub fn shutdown(&self) {
        self.cancel_pairing();
        self.stop();
        self.shared.stop_server();
    }
}

impl Shared {
    fn note(&self, line: impl AsRef<str>) {
        self.engine.note(format!("android: {}", line.as_ref()));
    }

    fn update(&self, change: impl FnOnce(&mut Link)) {
        let link = {
            let mut link = self.link.lock().unwrap();
            let before = link.clone();
            change(&mut link);
            (*link != before).then(|| link.clone())
        };
        if let Some(link) = link {
            let _ = self.app.emit(EVENT, link);
        }
    }

    fn set_pairing(&self, pairing: Pairing) {
        self.update(|link| link.pairing = pairing);
    }

    fn is_session(&self, id: u64) -> bool {
        self.session.lock().unwrap().as_ref().is_some_and(|session| session.id == id)
    }

    /// Puts session `id` away: the window, the picture, and scrcpy itself.
    fn end(&self, id: u64) {
        let Some(session) = self.session.lock().unwrap().take_if(|session| session.id == id) else { return };
        let hwnd = session.hwnd.load(Ordering::SeqCst);
        if hwnd != 0 {
            focus::stop_following();
            crate::video::release(&self.app, hwnd);
        }
        self.engine.end_guest(&session.client);
        self.update(|link| {
            if link.mirroring.as_deref() == Some(session.serial.as_str()) {
                link.mirroring = None;
            }
        });
        // Asked to close, scrcpy tidies up on the phone; it is made to go if
        // it takes too long.
        let child = session.child;
        thread::spawn(move || {
            if hwnd != 0 {
                focus::close(hwnd);
            }
            let deadline = Instant::now() + Duration::from_secs(2);
            while Instant::now() < deadline {
                if child.lock().unwrap().try_wait().ok().flatten().is_some() {
                    return;
                }
                thread::sleep(Duration::from_millis(50));
            }
            let mut child = child.lock().unwrap();
            let _ = child.kill();
            let _ = child.wait();
        });
    }

    fn command(&self, program: &str) -> Command {
        let mut command = Command::new(self.dir.join(program));
        command
            .current_dir(&self.dir)
            .env("ANDROID_ADB_SERVER_PORT", ADB_PORT.to_string())
            .env("ADB", self.dir.join("adb.exe"))
            .env("SCRCPY_SERVER_PATH", self.dir.join("scrcpy-server"))
            .env("SCRCPY_ICON_DIR", &self.dir)
            .stdin(Stdio::null());
        #[cfg(windows)]
        {
            use std::os::windows::process::CommandExt;
            const CREATE_NO_WINDOW: u32 = 0x0800_0000;
            command.creation_flags(CREATE_NO_WINDOW);
        }
        command
    }

    /// The adb server is up and answering.
    fn server_up(&self) -> bool {
        let address = SocketAddr::from(([127, 0, 0, 1], ADB_PORT));
        TcpStream::connect_timeout(&address, Duration::from_millis(300)).is_ok()
    }

    /// Runs adb with `args` and returns what it printed, or nothing if it
    /// failed or took longer than `limit`. Never starts a server of its own.
    fn adb(&self, args: &[&str], limit: Duration) -> Option<String> {
        if !self.server_up() {
            return None;
        }
        let mut command = self.command("adb.exe");
        command.args(args).stdout(Stdio::piped()).stderr(Stdio::piped());
        let mut child = command.spawn().ok()?;
        let mut stdout = child.stdout.take()?;
        let mut stderr = child.stderr.take()?;
        let reader = thread::spawn(move || {
            let mut text = String::new();
            let _ = stdout.read_to_string(&mut text);
            let mut errors = String::new();
            let _ = stderr.read_to_string(&mut errors);
            text + &errors
        });
        let deadline = Instant::now() + limit;
        loop {
            match child.try_wait() {
                Ok(Some(_)) => break,
                Ok(None) if Instant::now() < deadline => thread::sleep(Duration::from_millis(20)),
                _ => {
                    let _ = child.kill();
                    let _ = child.wait();
                    return None;
                }
            }
        }
        reader.join().ok()
    }

    fn start_server(self: &Arc<Self>) {
        let mut server = self.server.lock().unwrap();
        if server.as_mut().is_some_and(|child| child.try_wait().ok().flatten().is_none()) {
            return;
        }
        let mut command = self.command("adb.exe");
        command.args(["server", "nodaemon"]).stdout(Stdio::null()).stderr(Stdio::null());
        match command.spawn() {
            Ok(child) => {
                self.job.lock().unwrap().assign(&child);
                *server = Some(child);
            }
            Err(error) => {
                self.note(format!("could not start adb: {error}"));
                return;
            }
        }
        drop(server);
        self.update(|link| link.enabled = true);
        let generation = self.server_generation.load(Ordering::SeqCst);
        let shared = self.clone();
        thread::spawn(move || shared.track(generation));
    }

    fn stop_server(&self) {
        self.server_generation.fetch_add(1, Ordering::SeqCst);
        if let Some(mut child) = self.server.lock().unwrap().take() {
            let _ = child.kill();
            let _ = child.wait();
        }
        self.known.lock().unwrap().clear();
        self.update(|link| {
            link.enabled = false;
            link.phones.clear();
        });
    }

    /// Follows the phones adb is connected to, for as long as the server runs.
    fn track(self: Arc<Self>, generation: u64) {
        while self.server_generation.load(Ordering::SeqCst) == generation {
            if !self.server_up() {
                thread::sleep(Duration::from_millis(250));
                continue;
            }
            let mut command = self.command("adb.exe");
            command.args(["track-devices", "-l"]).stdout(Stdio::piped()).stderr(Stdio::null());
            let Ok(mut child) = command.spawn() else {
                thread::sleep(Duration::from_secs(1));
                continue;
            };
            if let Some(stdout) = child.stdout.take() {
                let mut reader = BufReader::new(stdout);
                // Each report is the whole list, after its length in four hex digits.
                loop {
                    let mut length = [0u8; 4];
                    if reader.read_exact(&mut length).is_err() {
                        break;
                    }
                    let Some(length) = std::str::from_utf8(&length).ok().and_then(|hex| usize::from_str_radix(hex, 16).ok())
                    else {
                        break;
                    };
                    let mut report = vec![0u8; length];
                    if reader.read_exact(&mut report).is_err() {
                        break;
                    }
                    if self.server_generation.load(Ordering::SeqCst) != generation {
                        break;
                    }
                    self.devices_changed(&String::from_utf8_lossy(&report));
                }
            }
            let _ = child.kill();
            let _ = child.wait();
            thread::sleep(Duration::from_millis(500));
        }
    }

    /// adb's list of connections changed.
    fn devices_changed(&self, report: &str) {
        let mut phones: Vec<Phone> = Vec::new();
        let mut seen = Vec::new();
        for line in report.lines() {
            let mut fields = line.split_whitespace();
            let (Some(serial), Some(state)) = (fields.next(), fields.next()) else { continue };
            if state != "device" {
                continue;
            }
            let model = fields
                .find_map(|field| field.strip_prefix("model:"))
                .map(|model| model.replace('_', " "))
                .unwrap_or_else(|| "Android".into());
            let (name, number) = self.identify(serial, &model);
            // The same phone can be reached two ways at once (found on the
            // network, and connected to by address); it is listed once.
            if !number.is_empty() && seen.contains(&number) {
                continue;
            }
            seen.push(number);
            phones.push(Phone { serial: serial.to_string(), name });
        }
        // A phone that goes away while mirrored ends scrcpy, and the session
        // ends with it.
        self.update(|link| link.phones = phones);
    }

    /// The phone's name and serial number, asked once per connection.
    fn identify(&self, serial: &str, model: &str) -> (String, String) {
        if let Some(known) = self.known.lock().unwrap().get(serial) {
            return known.clone();
        }
        let answer = self
            .adb(
                &["-s", serial, "shell", "getprop ro.serialno; settings get global device_name"],
                Duration::from_secs(5),
            )
            .unwrap_or_default();
        let mut lines = answer.lines().map(str::trim);
        let number = lines.next().unwrap_or_default().to_string();
        let name = lines
            .next()
            .filter(|name| !name.is_empty() && *name != "null")
            .map(str::to_string)
            .unwrap_or_else(|| model.to_string());
        let found = (name, number);
        self.known.lock().unwrap().insert(serial.to_string(), found.clone());
        found
    }

    /// Waits for a phone to offer pairing under a name `wanted` accepts, and
    /// returns its address.
    fn find_pairing_service(&self, generation: u64, wanted: impl Fn(&str) -> bool) -> Option<String> {
        let deadline = Instant::now() + PAIRING_TIME;
        while Instant::now() < deadline {
            if self.pairing_generation.load(Ordering::SeqCst) != generation {
                return None;
            }
            let services = self.adb(&["mdns", "services"], Duration::from_secs(5)).unwrap_or_default();
            let found = services_of(&services, "_adb-tls-pairing").into_iter().find(|(name, _)| wanted(name));
            if let Some((_, address)) = found {
                return Some(address);
            }
            thread::sleep(Duration::from_millis(400));
        }
        if self.pairing_generation.load(Ordering::SeqCst) == generation {
            self.set_pairing(Pairing::NotFound);
        }
        None
    }

    fn pair_with(&self, generation: u64, address: &str, password: &str) {
        if self.pairing_generation.load(Ordering::SeqCst) != generation {
            return;
        }
        self.set_pairing(Pairing::Pairing);
        let answer = self.adb(&["pair", address, password], Duration::from_secs(20)).unwrap_or_default();
        if self.pairing_generation.load(Ordering::SeqCst) != generation {
            return;
        }
        if !answer.contains("Successfully paired") {
            self.note(format!("pairing failed: {}", answer.trim()));
            self.set_pairing(Pairing::Refused);
            return;
        }
        self.note("paired with a phone");
        self.set_pairing(Pairing::Paired);
        // The phone normally connects by itself once it is announced on the
        // network; if it has not after a few seconds, connect to it.
        let host = address.rsplit_once(':').map(|(host, _)| host.to_string()).unwrap_or_default();
        let count = self.link.lock().unwrap().phones.len();
        let started = Instant::now();
        while started.elapsed() < Duration::from_secs(30) {
            thread::sleep(Duration::from_millis(500));
            if self.link.lock().unwrap().phones.len() > count {
                return;
            }
            if started.elapsed() < Duration::from_secs(5) {
                continue;
            }
            let services = self.adb(&["mdns", "services"], Duration::from_secs(5)).unwrap_or_default();
            for (_, address) in services_of(&services, "_adb-tls-connect") {
                if address.rsplit_once(':').is_some_and(|(found, _)| found == host) {
                    let _ = self.adb(&["connect", &address], Duration::from_secs(10));
                }
            }
        }
    }

    /// The phone's screen size, upright, in pixels.
    fn screen_size(&self, serial: &str) -> Option<(u32, u32)> {
        let answer = self.adb(&["-s", serial, "shell", "wm", "size"], Duration::from_secs(5))?;
        // An "Override size" line, if there is one, comes last and is the one in use.
        answer.lines().filter_map(|line| line.rsplit(' ').next()).filter_map(parse_size).last()
    }

    fn spawn_scrcpy(&self, serial: &str) -> std::io::Result<Child> {
        let sound = self.settings.lock().unwrap().sound;
        let mut command = self.command("scrcpy.exe");
        command.args([
            "--serial",
            serial,
            "--window-title",
            "Mirlow Android",
            "--window-borderless",
            // Mirlow decides the window's shape; scrcpy only tells it when
            // the phone turns, by resizing.
            "--no-window-aspect-ratio-lock",
            "--background-color=#000000",
            // Each frame as soon as it is decoded. These are scrcpy's
            // defaults, stated so they stay so.
            "--video-buffer=0",
            "--video-codec=h264",
            "--verbosity=info",
        ]);
        if !sound {
            command.arg("--no-audio");
        }
        command.stdout(Stdio::piped()).stderr(Stdio::piped());
        let mut child = command.spawn()?;
        self.job.lock().unwrap().assign(&child);
        // What scrcpy says goes in the log shown in the help sheet.
        for stream in [
            child.stdout.take().map(|out| Box::new(out) as Box<dyn Read + Send>),
            child.stderr.take().map(|err| Box::new(err) as Box<dyn Read + Send>),
        ]
        .into_iter()
        .flatten()
        {
            let engine = self.engine.clone();
            thread::spawn(move || {
                for line in BufReader::new(stream).lines().map_while(Result::ok) {
                    let line = line.trim();
                    if !line.is_empty() {
                        engine.note(format!("scrcpy: {line}"));
                    }
                }
            });
        }
        Ok(child)
    }
}

/// The services of `kind` in what `adb mdns services` printed: each one's
/// name and address.
fn services_of(listing: &str, kind: &str) -> Vec<(String, String)> {
    listing
        .lines()
        .filter(|line| line.contains(kind))
        .filter_map(|line| {
            let fields: Vec<&str> = line.split_whitespace().collect();
            let name = fields.first()?.to_string();
            let address = fields.last()?.to_string();
            address.contains(':').then_some((name, address))
        })
        .collect()
}

/// "1080x2400" as a width and height.
fn parse_size(text: &str) -> Option<(u32, u32)> {
    let (width, height) = text.trim().split_once('x')?;
    Some((width.parse().ok()?, height.parse().ok()?))
}

fn qr_code(text: &str) -> Option<Qr> {
    use qrcodegen::{QrCode, QrCodeEcc};
    let code = QrCode::encode_text(text, QrCodeEcc::Medium).ok()?;
    let size = code.size();
    let mut modules = String::with_capacity((size * size) as usize);
    for y in 0..size {
        for x in 0..size {
            modules.push(if code.get_module(x, y) { '1' } else { '0' });
        }
    }
    Some(Qr { size: size as u32, modules })
}

/// Letters and digits from the system's secure random source.
fn random_text(length: usize) -> String {
    const ALPHABET: &[u8] = b"abcdefghijkmnpqrstuvwxyz23456789";
    (0..length)
        .map(|_| ALPHABET[random_number() as usize % ALPHABET.len()] as char)
        .collect()
}

#[cfg(windows)]
fn random_number() -> u32 {
    windows::Security::Cryptography::CryptographicBuffer::GenerateRandomNumber().unwrap_or_else(|_| {
        std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map_or(0, |time| time.subsec_nanos())
    })
}

#[cfg(not(windows))]
fn random_number() -> u32 {
    std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map_or(0, |time| time.subsec_nanos())
}

/// Keyboard focus for scrcpy's window.
///
/// The window takes clicks by itself, but it never takes the keyboard: SDL,
/// which scrcpy draws with, leaves that to whoever owns the window. So Mirlow
/// watches for scrcpy taking hold of the mouse, which it does on every click,
/// and gives its window the keyboard then. Keys typed afterwards go to the
/// phone until something else in Mirlow is clicked.
#[cfg(windows)]
mod focus {
    use std::sync::atomic::{AtomicIsize, AtomicU32, Ordering};
    use windows::Win32::Foundation::{HWND, LPARAM, WPARAM};
    use windows::Win32::System::Threading::{AttachThreadInput, GetCurrentThreadId};
    use windows::Win32::UI::Accessibility::{SetWinEventHook, UnhookWinEvent, HWINEVENTHOOK};
    use windows::Win32::UI::Input::KeyboardAndMouse::SetFocus;
    use windows::Win32::UI::WindowsAndMessaging::{
        DispatchMessageW, GetMessageW, GetWindowThreadProcessId, IsChild, PostMessageW, PostThreadMessageW,
        TranslateMessage, EVENT_SYSTEM_CAPTURESTART, MSG, WINEVENT_OUTOFCONTEXT, WM_CLOSE, WM_QUIT,
    };

    /// The window being followed, and the thread that follows it.
    static WINDOW: AtomicIsize = AtomicIsize::new(0);
    static THREAD: AtomicU32 = AtomicU32::new(0);

    fn handle(hwnd: isize) -> HWND {
        HWND(hwnd as *mut core::ffi::c_void)
    }

    /// Gives `hwnd` the keyboard. Only a thread sharing its input can, so
    /// this one joins it for the moment it takes.
    pub fn give(hwnd: isize) {
        unsafe {
            let theirs = GetWindowThreadProcessId(handle(hwnd), None);
            let ours = GetCurrentThreadId();
            if theirs == 0 {
                return;
            }
            let joined = theirs != ours && AttachThreadInput(ours, theirs, true).as_bool();
            let _ = SetFocus(Some(handle(hwnd)));
            if joined {
                let _ = AttachThreadInput(ours, theirs, false);
            }
        }
    }

    /// Asks the window to close, as its close button would.
    pub fn close(hwnd: isize) {
        unsafe {
            let _ = PostMessageW(Some(handle(hwnd)), WM_CLOSE, WPARAM(0), LPARAM(0));
        }
    }

    unsafe extern "system" fn captured(
        _hook: HWINEVENTHOOK,
        _event: u32,
        hwnd: HWND,
        _object: i32,
        _child: i32,
        _thread: u32,
        _time: u32,
    ) {
        let window = WINDOW.load(Ordering::SeqCst);
        if window != 0 && (hwnd.0 as isize == window || IsChild(handle(window), hwnd).as_bool()) {
            give(window);
        }
    }

    /// From now on, a click on `hwnd` (of process `pid`) gives it the keyboard.
    pub fn follow_clicks(hwnd: isize, pid: u32) {
        stop_following();
        WINDOW.store(hwnd, Ordering::SeqCst);
        let _ = std::thread::Builder::new().name("android-focus".into()).spawn(move || unsafe {
            THREAD.store(GetCurrentThreadId(), Ordering::SeqCst);
            let hook = SetWinEventHook(
                EVENT_SYSTEM_CAPTURESTART,
                EVENT_SYSTEM_CAPTURESTART,
                None,
                Some(captured),
                pid,
                0,
                WINEVENT_OUTOFCONTEXT,
            );
            let mut message = MSG::default();
            while GetMessageW(&mut message, None, 0, 0).as_bool() {
                let _ = TranslateMessage(&message);
                DispatchMessageW(&message);
            }
            if !hook.is_invalid() {
                let _ = UnhookWinEvent(hook);
            }
        });
    }

    pub fn stop_following() {
        WINDOW.store(0, Ordering::SeqCst);
        let thread = THREAD.swap(0, Ordering::SeqCst);
        if thread != 0 {
            unsafe {
                let _ = PostThreadMessageW(thread, WM_QUIT, WPARAM(0), LPARAM(0));
            }
        }
    }
}

#[cfg(not(windows))]
mod focus {
    pub fn give(_hwnd: isize) {}
    pub fn close(_hwnd: isize) {}
    pub fn follow_clicks(_hwnd: isize, _pid: u32) {}
    pub fn stop_following() {}
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn reads_mdns_services() {
        let listing = "List of discovered mdns services\n\
            mirlow-abc\t_adb-tls-pairing._tcp\t192.168.1.20:37000\n\
            adb-R58N-xyz\t_adb-tls-connect._tcp\t192.168.1.20:41235\n";
        assert_eq!(
            services_of(listing, "_adb-tls-pairing"),
            vec![("mirlow-abc".to_string(), "192.168.1.20:37000".to_string())]
        );
        assert_eq!(services_of(listing, "_adb-tls-connect").len(), 1);
    }

    #[test]
    fn reads_screen_sizes() {
        assert_eq!(parse_size("1080x2400"), Some((1080, 2400)));
        assert_eq!(parse_size("wide"), None);
    }

    #[test]
    fn makes_a_qr_code() {
        let qr = qr_code("WIFI:T:ADB;S:mirlow-abc;P:secret;;").unwrap();
        assert_eq!(qr.modules.len() as u32, qr.size * qr.size);
    }
}
