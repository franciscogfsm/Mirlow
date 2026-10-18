//! Lets this PC's mouse and keyboard work the phone being mirrored.
//!
//! AirPlay and Miracast carry the picture one way only; neither gives the PC a
//! way to touch the phone. What every phone does accept is a Bluetooth mouse
//! and keyboard, so this module makes the PC one: it publishes the standard
//! HID over GATT service through Windows' own Bluetooth stack, the phone pairs
//! with it like any keyboard, and the interface hands over pointer movement,
//! clicks and keys while the person is working the picture.
//!
//! On an iPhone the keyboard works as soon as it is paired; the pointer is
//! drawn only once AssistiveTouch is on (Settings › Accessibility › Touch).
//!
//! Everything Bluetooth runs on one thread of its own. Windows reports events
//! on other threads; they only ever send that thread a message.

use serde::Serialize;
use std::sync::mpsc::{self, Sender};
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter};

use crate::engine::Engine;

pub const STATUS_EVENT: &str = "remote:status";

/// Whether the phone can be worked from this PC right now, and if not, why.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum RemoteState {
    /// Turned off in Settings.
    Off,
    Starting,
    /// No Bluetooth adapter at all.
    NoBluetooth,
    /// There is an adapter, and it is switched off.
    BluetoothOff,
    /// The adapter cannot act as a peripheral, so it cannot pose as a mouse.
    Unsupported,
    /// Waiting for a phone to pair with, or reconnect to, this PC.
    Waiting,
    /// A phone is connected and listening for input.
    Connected,
}

/// Whether this PC can be a Bluetooth mouse and keyboard at all. Checked on
/// its own, whether or not the feature is turned on, so Settings can say.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum Support {
    Checking,
    Supported,
    /// The adapter is there, and switched off; nothing is known beyond that.
    BluetoothOff,
    NoBluetooth,
    /// The adapter cannot act as a peripheral, or Windows would not publish
    /// the service.
    Unsupported,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RemoteStatus {
    pub state: RemoteState,
    pub support: Support,
    /// The connected device's Bluetooth name.
    pub host: Option<String>,
    /// The name this PC goes by in the phone's Bluetooth list.
    pub pc_name: String,
}

#[cfg(windows)]
mod input;

/// Movement and buttons for the phone, as the input thread reads them.
#[derive(Debug, Clone, Copy)]
pub struct Pointer {
    pub dx: i32,
    pub dy: i32,
    pub wheel: i32,
    /// Bit 0 left, bit 1 right, bit 2 middle: the same layout as HID's.
    pub buttons: u8,
}

enum Command {
    Enable(bool),
    Pointer(Pointer),
    /// A modifier byte and up to six HID key usages, all held at once.
    Keys(u8, [u8; 6]),
    /// Something changed on the Bluetooth side; look again.
    Recheck,
    /// Let go of the phone and stop; says so on the sender when done.
    Shutdown(Sender<()>),
}

pub struct Remote {
    commands: Sender<Command>,
    status: Arc<Mutex<RemoteStatus>>,
    #[cfg(windows)]
    input: input::Input,
}

impl Remote {
    /// Starts the Bluetooth thread. With `enabled` false it waits, doing
    /// nothing, until Settings turns it on.
    pub fn start(app: AppHandle, engine: Engine, enabled: bool) -> Self {
        let (commands, inbox) = mpsc::channel();
        let status = Arc::new(Mutex::new(RemoteStatus {
            state: RemoteState::Off,
            support: Support::Checking,
            host: None,
            pc_name: pc_name(),
        }));
        #[cfg(windows)]
        {
            let shared = status.clone();
            let outbox = commands.clone();
            let _ = std::thread::Builder::new()
                .name("remote".into())
                .spawn(move || peripheral::run(app, engine, shared, inbox, outbox));
        }
        #[cfg(not(windows))]
        {
            let _ = (app, engine, inbox);
            let mut status = status.lock().unwrap();
            status.state = RemoteState::Unsupported;
            status.support = Support::Unsupported;
        }
        let remote = Self {
            #[cfg(windows)]
            input: input::Input::start(commands.clone()),
            commands,
            status,
        };
        remote.enable(enabled);
        remote
    }

    pub fn status(&self) -> RemoteStatus {
        self.status.lock().unwrap().clone()
    }

    pub fn enable(&self, enabled: bool) {
        let _ = self.commands.send(Command::Enable(enabled));
    }

    /// The picture has taken the pointer, or let it go. While it has it,
    /// the mouse and keyboard are read straight from Windows and go to the
    /// phone, the mouse's movement multiplied by `scale`.
    pub fn capture(&self, captured: bool, scale: f64) {
        #[cfg(windows)]
        self.input.capture(captured, scale);
        #[cfg(not(windows))]
        let _ = (captured, scale);
    }

    /// Lets go of the phone and stops, as Mirlow quits. Waits for that to
    /// be done (within reason), or the app would be gone before the phone
    /// was let go.
    pub fn shutdown(&self) {
        let (done, finished) = mpsc::channel();
        if self.commands.send(Command::Shutdown(done)).is_ok() {
            let _ = finished.recv_timeout(std::time::Duration::from_secs(3));
        }
    }
}

/// The PC's own name, which is what Windows' Bluetooth goes by.
fn pc_name() -> String {
    std::env::var("COMPUTERNAME").unwrap_or_default().trim().to_string()
}

/// Changes the status, and tells the interface if that changed anything.
fn publish(app: &AppHandle, shared: &Mutex<RemoteStatus>, change: impl FnOnce(&mut RemoteStatus)) {
    let mut status = shared.lock().unwrap();
    let before = status.clone();
    change(&mut status);
    if *status != before {
        let _ = app.emit(STATUS_EVENT, status.clone());
    }
}

#[cfg(windows)]
mod peripheral {
    use super::{publish, Command, Pointer, RemoteState, RemoteStatus, Support};
    use crate::engine::Engine;
    use std::collections::HashMap;
    use std::sync::mpsc::{Receiver, RecvTimeoutError, Sender};
    use std::sync::Mutex;
    use std::time::{Duration, Instant};
    use tauri::AppHandle;
    use windows::core::{Ref, GUID};
    use windows::Devices::Bluetooth::GenericAttributeProfile::{
        GattCharacteristicProperties, GattLocalCharacteristic, GattLocalCharacteristicParameters,
        GattLocalDescriptorParameters, GattLocalService, GattProtectionLevel, GattReadRequestedEventArgs,
        GattServiceProvider, GattServiceProviderAdvertisementStatus, GattServiceProviderAdvertisingParameters,
        GattSession, GattWriteOption, GattWriteRequestedEventArgs,
    };
    use windows::Devices::Bluetooth::{
        BluetoothAdapter, BluetoothConnectionStatus, BluetoothError, BluetoothLEDevice,
        BluetoothLEPreferredConnectionParameters, BluetoothLEPreferredConnectionParametersRequest,
    };
    use windows::Devices::Radios::{Radio, RadioState};
    use windows::Foundation::TypedEventHandler;
    use windows::Security::Cryptography::CryptographicBuffer;
    use windows::Win32::System::Threading::{GetCurrentThread, SetThreadPriority, THREAD_PRIORITY_ABOVE_NORMAL};
    use windows::Win32::System::WinRT::{RoInitialize, RO_INIT_MULTITHREADED};

    /// The Bluetooth SIG's numbers for the HID over GATT profile.
    const HID_SERVICE: u16 = 0x1812;
    const HID_INFORMATION: u16 = 0x2A4A;
    const REPORT_MAP: u16 = 0x2A4B;
    const HID_CONTROL_POINT: u16 = 0x2A4C;
    const REPORT: u16 = 0x2A4D;
    const PROTOCOL_MODE: u16 = 0x2A4E;
    const REPORT_REFERENCE: u16 = 0x2908;

    const KEYBOARD_REPORT: u8 = 1;
    const MOUSE_REPORT: u8 = 2;
    const INPUT: u8 = 1;
    const OUTPUT: u8 = 2;

    /// HID 1.11, no country, may wake the host and is normally connectable.
    const HID_INFORMATION_VALUE: [u8; 4] = [0x11, 0x01, 0x00, 0x03];

    /// A keyboard (report 1) and a three-button mouse with a wheel (report 2).
    /// The keyboard's layout is the boot keyboard's, which every host knows;
    /// the mouse moves in 16-bit steps so a fast flick is not cut short.
    #[rustfmt::skip]
    const REPORT_MAP_VALUE: &[u8] = &[
        0x05, 0x01, 0x09, 0x06, 0xA1, 0x01,       // Generic Desktop, Keyboard, Application
        0x85, KEYBOARD_REPORT,
        0x05, 0x07, 0x19, 0xE0, 0x29, 0xE7,       //   modifiers: Left Control to Right GUI
        0x15, 0x00, 0x25, 0x01, 0x75, 0x01, 0x95, 0x08, 0x81, 0x02,
        0x95, 0x01, 0x75, 0x08, 0x81, 0x01,       //   reserved byte
        0x15, 0x00, 0x25, 0x01, 0x95, 0x05, 0x75, 0x01,
        0x05, 0x08, 0x19, 0x01, 0x29, 0x05, 0x91, 0x02, //   five lock lamps, written by the host
        0x95, 0x01, 0x75, 0x03, 0x91, 0x01,
        0x95, 0x06, 0x75, 0x08, 0x15, 0x00, 0x25, 0x65,
        0x05, 0x07, 0x19, 0x00, 0x29, 0x65, 0x81, 0x00, //   six keys held at once
        0xC0,
        0x05, 0x01, 0x09, 0x02, 0xA1, 0x01,       // Generic Desktop, Mouse, Application
        0x85, MOUSE_REPORT,
        0x09, 0x01, 0xA1, 0x00,                   //   Pointer, Physical
        0x05, 0x09, 0x19, 0x01, 0x29, 0x03,       //     three buttons
        0x15, 0x00, 0x25, 0x01, 0x95, 0x03, 0x75, 0x01, 0x81, 0x02,
        0x95, 0x01, 0x75, 0x05, 0x81, 0x01,
        0x05, 0x01, 0x09, 0x30, 0x09, 0x31,       //     X and Y, relative
        0x16, 0x01, 0x80, 0x26, 0xFF, 0x7F, 0x75, 0x10, 0x95, 0x02, 0x81, 0x06,
        0x09, 0x38,                               //     wheel, relative
        0x15, 0x81, 0x25, 0x7F, 0x75, 0x08, 0x95, 0x01, 0x81, 0x06,
        0xC0,
        0xC0,
    ];

    /// How often movement is sent when the link's own pace is unknown.
    /// Sending faster than the link carries piles reports up, and the
    /// pointer trails behind the hand.
    const DEFAULT_PACE: Duration = Duration::from_millis(15);
    /// How often to try again while Bluetooth is off or missing.
    const RETRY: Duration = Duration::from_secs(5);

    enum Failure {
        NoBluetooth,
        BluetoothOff,
        Unsupported,
        Refused(&'static str, BluetoothError),
        Windows(windows::core::Error),
    }

    impl From<windows::core::Error> for Failure {
        fn from(error: windows::core::Error) -> Self {
            Failure::Windows(error)
        }
    }

    type Result<T> = std::result::Result<T, Failure>;

    fn uuid16(id: u16) -> GUID {
        GUID::from_values(id as u32, 0x0000, 0x1000, [0x80, 0x00, 0x00, 0x80, 0x5F, 0x9B, 0x34, 0xFB])
    }

    fn check(what: &'static str, error: BluetoothError) -> Result<()> {
        if error == BluetoothError::Success {
            Ok(())
        } else {
            Err(Failure::Refused(what, error))
        }
    }

    fn has(properties: GattCharacteristicProperties, flag: GattCharacteristicProperties) -> bool {
        properties.0 & flag.0 != 0
    }

    /// Looks at the Bluetooth adapter without publishing anything: is there
    /// one, is it on, and can it play the part of a mouse. Returns its radio
    /// whatever the answer, to hear it being switched on or off.
    fn examine() -> (Option<Radio>, Result<()>) {
        let Ok(adapter) = BluetoothAdapter::GetDefaultAsync().and_then(|found| found.get()) else {
            return (None, Err(Failure::NoBluetooth));
        };
        let radio = adapter.GetRadioAsync().and_then(|radio| radio.get()).ok();
        if radio.as_ref().and_then(|radio| radio.State().ok()) == Some(RadioState::Off) {
            // An adapter that is off says nothing true about what it can do.
            return (radio, Err(Failure::BluetoothOff));
        }
        let capable = adapter.IsLowEnergySupported().unwrap_or(false)
            && adapter.IsPeripheralRoleSupported().unwrap_or(false);
        (radio, if capable { Ok(()) } else { Err(Failure::Unsupported) })
    }

    fn support(failure: &Failure) -> Support {
        match failure {
            Failure::NoBluetooth => Support::NoBluetooth,
            Failure::BluetoothOff => Support::BluetoothOff,
            Failure::Unsupported | Failure::Refused(..) | Failure::Windows(_) => Support::Unsupported,
        }
    }

    /// The published service, and the two characteristics input goes out on.
    struct Published {
        provider: GattServiceProvider,
        keyboard: GattLocalCharacteristic,
        mouse: GattLocalCharacteristic,
    }

    impl Published {
        fn create(outbox: &Sender<Command>) -> Result<Self> {
            examine().1?;

            let created = GattServiceProvider::CreateAsync(uuid16(HID_SERVICE))?.get()?;
            check("the HID service", created.Error()?)?;
            let provider = created.ServiceProvider()?;
            let service = provider.Service()?;

            // HID over GATT asks for an encrypted link, which means the phone
            // pairs with the PC before it reads anything.
            let read = GattCharacteristicProperties::Read;
            let notify = GattCharacteristicProperties::Notify;
            let write = GattCharacteristicProperties::Write;
            let quiet_write = GattCharacteristicProperties::WriteWithoutResponse;

            let information = characteristic(&service, HID_INFORMATION, read)?;
            serve(&information, || HID_INFORMATION_VALUE.to_vec())?;
            let map = characteristic(&service, REPORT_MAP, read)?;
            serve(&map, || REPORT_MAP_VALUE.to_vec())?;
            let control = characteristic(&service, HID_CONTROL_POINT, quiet_write)?;
            accept(&control)?;
            // Report mode, always: there is no boot protocol to switch to.
            let mode = characteristic(&service, PROTOCOL_MODE, read | quiet_write)?;
            serve(&mode, || vec![1])?;
            accept(&mode)?;

            let keyboard = report(&service, read | notify, KEYBOARD_REPORT, INPUT)?;
            serve(&keyboard, || vec![0; 8])?;
            // The lock lamps. Nothing here shows them, but a keyboard without
            // them is not the keyboard the descriptor describes.
            let lamps = report(&service, read | write | quiet_write, KEYBOARD_REPORT, OUTPUT)?;
            serve(&lamps, || vec![0])?;
            accept(&lamps)?;
            let mouse = report(&service, read | notify, MOUSE_REPORT, INPUT)?;
            serve(&mouse, || vec![0; 6])?;

            for input in [&keyboard, &mouse] {
                let outbox = outbox.clone();
                input.SubscribedClientsChanged(&TypedEventHandler::new(move |_, _| {
                    let _ = outbox.send(Command::Recheck);
                    Ok(())
                }))?;
            }
            let recheck = outbox.clone();
            provider.AdvertisementStatusChanged(&TypedEventHandler::new(move |_, _| {
                let _ = recheck.send(Command::Recheck);
                Ok(())
            }))?;

            let parameters = GattServiceProviderAdvertisingParameters::new()?;
            parameters.SetIsDiscoverable(true)?;
            parameters.SetIsConnectable(true)?;
            provider.StartAdvertisingWithParameters(&parameters)?;

            Ok(Self { provider, keyboard, mouse })
        }

        /// Every device listening for input, by Windows' device id.
        fn subscribers(&self) -> Vec<String> {
            let mut ids = Vec::new();
            for input in [&self.keyboard, &self.mouse] {
                let Ok(clients) = input.SubscribedClients() else { continue };
                for client in clients {
                    let id = client.Session().and_then(|session| session.DeviceId()).and_then(|id| id.Id());
                    if let Ok(id) = id.map(|id| id.to_string()) {
                        if !ids.contains(&id) {
                            ids.push(id);
                        }
                    }
                }
            }
            ids
        }

        fn close(self) {
            let _ = self.provider.StopAdvertising();
        }
    }

    fn characteristic(
        service: &GattLocalService,
        uuid: u16,
        properties: GattCharacteristicProperties,
    ) -> Result<GattLocalCharacteristic> {
        let parameters = GattLocalCharacteristicParameters::new()?;
        parameters.SetCharacteristicProperties(properties)?;
        if has(properties, GattCharacteristicProperties::Read) {
            parameters.SetReadProtectionLevel(GattProtectionLevel::EncryptionRequired)?;
        }
        let writes = GattCharacteristicProperties::Write | GattCharacteristicProperties::WriteWithoutResponse;
        if properties.0 & writes.0 != 0 {
            parameters.SetWriteProtectionLevel(GattProtectionLevel::EncryptionRequired)?;
        }
        let created = service.CreateCharacteristicAsync(uuid16(uuid), &parameters)?.get()?;
        check("a HID characteristic", created.Error()?)?;
        Ok(created.Characteristic()?)
    }

    /// A Report characteristic, labelled with which report it carries.
    fn report(
        service: &GattLocalService,
        properties: GattCharacteristicProperties,
        id: u8,
        kind: u8,
    ) -> Result<GattLocalCharacteristic> {
        let report = characteristic(service, REPORT, properties)?;
        let parameters = GattLocalDescriptorParameters::new()?;
        parameters.SetReadProtectionLevel(GattProtectionLevel::EncryptionRequired)?;
        parameters.SetStaticValue(&CryptographicBuffer::CreateFromByteArray(&[id, kind])?)?;
        let created = report.CreateDescriptorAsync(uuid16(REPORT_REFERENCE), &parameters)?.get()?;
        check("a report reference", created.Error()?)?;
        Ok(report)
    }

    /// Answers reads of `characteristic` with `value`. Windows turns away a
    /// read nobody answers, which some hosts take as a broken device.
    fn serve(characteristic: &GattLocalCharacteristic, value: fn() -> Vec<u8>) -> Result<()> {
        characteristic.ReadRequested(&TypedEventHandler::new(
            move |_, args: Ref<GattReadRequestedEventArgs>| {
                let Some(args) = args.as_ref() else { return Ok(()) };
                let deferral = args.GetDeferral()?;
                let request = args.GetRequestAsync()?.get()?;
                request.RespondWithValue(&CryptographicBuffer::CreateFromByteArray(&value())?)?;
                deferral.Complete()
            },
        ))?;
        Ok(())
    }

    /// Accepts writes to `characteristic`, whose content Mirlow has no use for.
    fn accept(characteristic: &GattLocalCharacteristic) -> Result<()> {
        characteristic.WriteRequested(&TypedEventHandler::new(
            |_, args: Ref<GattWriteRequestedEventArgs>| {
                let Some(args) = args.as_ref() else { return Ok(()) };
                let deferral = args.GetDeferral()?;
                let request = args.GetRequestAsync()?.get()?;
                if request.Option()? == GattWriteOption::WriteWithResponse {
                    request.Respond()?;
                }
                deferral.Complete()
            },
        ))?;
        Ok(())
    }

    fn notify(characteristic: &GattLocalCharacteristic, report: &[u8]) {
        if let Ok(buffer) = CryptographicBuffer::CreateFromByteArray(report) {
            if let Ok(sent) = characteristic.NotifyValueAsync(&buffer) {
                let _ = sent.get();
            }
        }
    }

    /// Movement not sent yet. Motion is merged between reports; button
    /// changes and keys never are.
    #[derive(Default)]
    struct Motion {
        dx: i32,
        dy: i32,
        wheel: i32,
        buttons: u8,
    }

    impl Motion {
        fn pending(&self) -> bool {
            self.dx != 0 || self.dy != 0 || self.wheel != 0
        }

        /// The next report, keeping whatever does not fit in one for later.
        fn take(&mut self) -> [u8; 6] {
            let dx = self.dx.clamp(-32767, 32767);
            let dy = self.dy.clamp(-32767, 32767);
            let wheel = self.wheel.clamp(-127, 127);
            self.dx -= dx;
            self.dy -= dy;
            self.wheel -= wheel;
            let [x0, x1] = (dx as i16).to_le_bytes();
            let [y0, y1] = (dy as i16).to_le_bytes();
            [self.buttons, x0, x1, y0, y1, wheel as i8 as u8]
        }
    }

    struct Host {
        device: BluetoothLEDevice,
        token: i64,
        /// Heard when the link's pace changes (Windows 11 only).
        pace_token: Option<i64>,
        /// Windows' request for the quickest link the phone allows. It lasts
        /// only as long as it is kept.
        quick: Option<BluetoothLEPreferredConnectionParametersRequest>,
    }

    impl Host {
        /// Stops listening to the phone and lets go of the link. Windows keeps
        /// a Bluetooth link up while anything on the PC holds on to it, so
        /// nothing here may: the session is told not to keep the connection,
        /// then everything is closed, and Windows ends the link.
        fn forget(self) {
            let _ = self.device.RemoveConnectionStatusChanged(self.token);
            if let Some(token) = self.pace_token {
                let _ = self.device.RemoveConnectionParametersChanged(token);
            }
            if let Some(quick) = self.quick {
                let _ = quick.Close();
            }
            let session = self
                .device
                .BluetoothDeviceId()
                .and_then(|id| GattSession::FromDeviceIdAsync(&id))
                .and_then(|found| found.get());
            if let Ok(session) = session {
                let _ = session.SetMaintainConnection(false);
                let _ = session.Close();
            }
            let _ = self.device.Close();
        }

        /// Asks for the shortest connection interval the phone will take:
        /// every interval is a moment input waits for its turn on the air.
        fn hurry(&mut self) -> Option<&'static str> {
            let quick = BluetoothLEPreferredConnectionParameters::ThroughputOptimized()
                .and_then(|parameters| self.device.RequestPreferredConnectionParameters(&parameters))
                .ok()?;
            let answer = match quick.Status().map(|status| status.0) {
                Ok(1) => "asked the phone for a quicker link",
                Ok(2) => "the phone is gone, so no quicker link",
                Ok(3) => "Windows would not ask for a quicker link",
                _ => "could not ask for a quicker link",
            };
            self.quick = Some(quick);
            Some(answer)
        }
    }

    struct Worker {
        app: AppHandle,
        engine: Engine,
        status: std::sync::Arc<Mutex<RemoteStatus>>,
        outbox: Sender<Command>,
        enabled: bool,
        /// The adapter's radio, listened to for being switched on or off.
        radio: Option<(Radio, i64)>,
        published: Option<Published>,
        /// The last reason it could not be published, to log each one once.
        failure: Option<String>,
        retry_at: Option<Instant>,
        /// What Windows last said about advertising, to log only changes.
        advertising: Option<GattServiceProviderAdvertisementStatus>,
        hosts: HashMap<String, Host>,
        /// The device input goes to, while one is connected.
        connected: Option<String>,
        motion: Motion,
        sent_at: Instant,
        pace: Duration,
    }

    pub fn run(
        app: AppHandle,
        engine: Engine,
        status: std::sync::Arc<Mutex<RemoteStatus>>,
        inbox: Receiver<Command>,
        outbox: Sender<Command>,
    ) {
        unsafe {
            let _ = RoInitialize(RO_INIT_MULTITHREADED);
            // Input waits on nothing else: a busy PC should not hold up a click.
            let _ = SetThreadPriority(GetCurrentThread(), THREAD_PRIORITY_ABOVE_NORMAL);
        }
        let mut worker = Worker {
            app,
            engine,
            status,
            outbox,
            enabled: false,
            radio: None,
            published: None,
            failure: None,
            retry_at: None,
            advertising: None,
            hosts: HashMap::new(),
            connected: None,
            motion: Motion::default(),
            sent_at: Instant::now(),
            pace: DEFAULT_PACE,
        };
        worker.probe();
        loop {
            let command = match worker.wait() {
                Some(wait) => match inbox.recv_timeout(wait) {
                    Ok(command) => Some(command),
                    Err(RecvTimeoutError::Timeout) => None,
                    Err(RecvTimeoutError::Disconnected) => break,
                },
                None => match inbox.recv() {
                    Ok(command) => Some(command),
                    Err(_) => break,
                },
            };
            match command {
                Some(Command::Enable(enabled)) => worker.enable(enabled),
                Some(Command::Pointer(pointer)) => worker.pointer(pointer),
                Some(Command::Keys(modifiers, keys)) => worker.keys(modifiers, keys),
                Some(Command::Recheck) => worker.recheck(),
                Some(Command::Shutdown(done)) => {
                    worker.close();
                    if let Some((radio, token)) = worker.radio.take() {
                        let _ = radio.RemoveStateChanged(token);
                    }
                    let _ = done.send(());
                    break;
                }
                None => worker.tick(),
            }
        }
    }

    impl Worker {
        fn note(&self, text: impl AsRef<str>) {
            self.engine.note(format!("[mirlow] remote: {}", text.as_ref()));
        }

        fn set(&self, state: RemoteState) {
            let host = self
                .connected
                .as_ref()
                .and_then(|id| self.hosts.get(id))
                .and_then(|host| host.device.Name().ok())
                .map(|name| name.to_string())
                .filter(|name| !name.is_empty())
                .filter(|_| state == RemoteState::Connected);
            publish(&self.app, &self.status, |status| {
                status.state = state;
                status.host = host;
            });
        }

        fn set_support(&self, support: Support) {
            publish(&self.app, &self.status, |status| status.support = support);
        }

        /// Finds out whether this PC can do it, without publishing anything.
        /// Runs at start, whenever the radio is switched on or off, and every
        /// few seconds while there is no radio to listen to.
        fn probe(&mut self) {
            let (radio, verdict) = examine();
            if self.radio.is_none() {
                self.radio = radio.and_then(|radio| {
                    let outbox = self.outbox.clone();
                    let token = radio
                        .StateChanged(&TypedEventHandler::new(move |_, _| {
                            let _ = outbox.send(Command::Recheck);
                            Ok(())
                        }))
                        .ok()?;
                    Some((radio, token))
                });
            }
            self.set_support(match &verdict {
                Ok(()) => Support::Supported,
                Err(failure) => support(failure),
            });
            if self.enabled {
                self.open();
            } else if verdict.is_err() && self.radio.is_none() {
                // Nothing to listen to, so look again later: an adapter may
                // be plugged in.
                self.retry_at = Some(Instant::now() + RETRY);
            }
        }

        fn radio_off(&self) -> bool {
            self.radio.as_ref().and_then(|(radio, _)| radio.State().ok()) == Some(RadioState::Off)
        }

        /// How long to wait for the next command before there is something
        /// to do anyway: send merged motion, or try Bluetooth again.
        fn wait(&self) -> Option<Duration> {
            let now = Instant::now();
            let motion = self.motion.pending().then(|| (self.sent_at + self.pace).saturating_duration_since(now));
            let retry = self.retry_at.map(|at| at.saturating_duration_since(now));
            match (motion, retry) {
                (Some(a), Some(b)) => Some(a.min(b)),
                (a, b) => a.or(b),
            }
        }

        fn tick(&mut self) {
            if self.motion.pending() && self.sent_at.elapsed() >= self.pace {
                self.send_motion();
            }
            if self.retry_at.is_some_and(|at| Instant::now() >= at) {
                self.retry_at = None;
                if self.enabled {
                    self.open();
                } else {
                    self.probe();
                }
            }
        }

        fn enable(&mut self, enabled: bool) {
            if enabled == self.enabled {
                return;
            }
            self.enabled = enabled;
            if enabled {
                self.set(RemoteState::Starting);
                self.open();
            } else {
                self.close();
                self.set(RemoteState::Off);
            }
        }

        fn open(&mut self) {
            if !self.enabled || self.published.is_some() {
                return;
            }
            match Published::create(&self.outbox) {
                Ok(published) => {
                    self.note("this PC is now a Bluetooth keyboard and mouse");
                    self.set_support(Support::Supported);
                    self.failure = None;
                    self.published = Some(published);
                    self.recheck();
                }
                Err(failure) => {
                    self.set_support(support(&failure));
                    let (state, reason) = match failure {
                        Failure::NoBluetooth => (RemoteState::NoBluetooth, "there is no Bluetooth adapter".to_string()),
                        Failure::BluetoothOff => (RemoteState::BluetoothOff, "Bluetooth is off".to_string()),
                        Failure::Unsupported => (
                            RemoteState::Unsupported,
                            "this Bluetooth adapter cannot act as a keyboard or mouse".to_string(),
                        ),
                        Failure::Refused(what, error) => {
                            (RemoteState::Unsupported, format!("Windows would not publish {what} ({})", error.0))
                        }
                        Failure::Windows(error) => (RemoteState::Unsupported, format!("Bluetooth failed: {error}")),
                    };
                    if self.failure.as_deref() != Some(reason.as_str()) {
                        self.note(&reason);
                        self.failure = Some(reason);
                    }
                    self.set(state);
                    self.retry_at = Some(Instant::now() + RETRY);
                }
            }
        }

        /// Lets go of every key and button, takes the keyboard and mouse off
        /// the air, and lets go of the phone, which then disconnects.
        fn close(&mut self) {
            self.release();
            // The service first: with it gone the phone has nothing left here
            // to use, and the link has no reason to stay.
            if let Some(published) = self.published.take() {
                published.close();
            }
            if self.connected.is_some() {
                self.note("letting go of the phone");
            }
            for (_, host) in self.hosts.drain() {
                host.forget();
            }
            self.connected = None;
            self.retry_at = None;
            self.advertising = None;
        }

        /// Works out who is connected after Windows said something changed.
        fn recheck(&mut self) {
            let Some(published) = &self.published else {
                // Not published: the radio may have come on, so ask again.
                self.probe();
                return;
            };
            if self.radio_off() {
                self.note("Bluetooth was switched off");
                self.close();
                self.set(RemoteState::BluetoothOff);
                self.set_support(Support::BluetoothOff);
                return;
            }
            let advertising = published.provider.AdvertisementStatus().ok();
            if advertising != self.advertising {
                if let Some(status) = advertising {
                    self.note(format!("advertising: {}", advertisement(status)));
                }
                self.advertising = advertising;
            }

            let subscribers = published.subscribers();
            for id in &subscribers {
                if self.hosts.contains_key(id) {
                    continue;
                }
                let Ok(device) = BluetoothLEDevice::FromIdAsync(&id.into()).and_then(|found| found.get()) else {
                    continue;
                };
                let outbox = self.outbox.clone();
                let Ok(token) = device.ConnectionStatusChanged(&TypedEventHandler::new(move |_, _| {
                    let _ = outbox.send(Command::Recheck);
                    Ok(())
                })) else {
                    continue;
                };
                let outbox = self.outbox.clone();
                let pace_token = device
                    .ConnectionParametersChanged(&TypedEventHandler::new(move |_, _| {
                        let _ = outbox.send(Command::Recheck);
                        Ok(())
                    }))
                    .ok();
                self.hosts.insert(id.clone(), Host { device, token, pace_token, quick: None });
            }
            // Windows keeps a paired phone among the subscribers after it
            // walks away, so only one that is actually connected counts.
            let live = subscribers.into_iter().find(|id| {
                self.hosts
                    .get(id)
                    .and_then(|host| host.device.ConnectionStatus().ok())
                    .is_some_and(|status| status == BluetoothConnectionStatus::Connected)
            });
            if live != self.connected {
                match live.as_ref().and_then(|id| self.hosts.get_mut(id)) {
                    Some(host) => {
                        let name = host.device.Name().map(|name| name.to_string()).unwrap_or_default();
                        let hurried = host.hurry();
                        self.note(format!("{name} connected"));
                        if let Some(hurried) = hurried {
                            self.note(hurried);
                        }
                    }
                    None => self.note("the phone disconnected"),
                }
                self.connected = live;
            }
            // Movement goes out once per connection interval: sooner only
            // queues up, later only waits.
            if let Some(host) = self.connected.as_ref().and_then(|id| self.hosts.get(id)) {
                let pace = pace(&host.device);
                if pace != self.pace {
                    self.note(format!("sending every {:.2} ms", pace.as_secs_f64() * 1000.0));
                    self.pace = pace;
                }
            }
            self.set(if self.connected.is_some() { RemoteState::Connected } else { RemoteState::Waiting });
        }

        fn pointer(&mut self, pointer: Pointer) {
            if self.connected.is_none() {
                return;
            }
            if pointer.buttons != self.motion.buttons {
                // A click must not be merged away: what moved before it goes
                // first, then the click on its own.
                if self.motion.pending() {
                    self.send_motion();
                }
                self.motion.buttons = pointer.buttons;
                self.motion.dx += pointer.dx;
                self.motion.dy += pointer.dy;
                self.motion.wheel += pointer.wheel;
                self.send_motion();
                return;
            }
            self.motion.dx += pointer.dx;
            self.motion.dy += pointer.dy;
            self.motion.wheel += pointer.wheel;
            if self.sent_at.elapsed() >= self.pace {
                self.send_motion();
            }
        }

        fn send_motion(&mut self) {
            let Some(published) = &self.published else { return };
            let report = self.motion.take();
            notify(&published.mouse, &report);
            self.sent_at = Instant::now();
        }

        fn keys(&mut self, modifiers: u8, keys: [u8; 6]) {
            if self.connected.is_none() {
                return;
            }
            if self.motion.pending() {
                self.send_motion();
            }
            let Some(published) = &self.published else { return };
            let mut report = [0u8; 8];
            report[0] = modifiers;
            report[2..].copy_from_slice(&keys);
            notify(&published.keyboard, &report);
        }

        /// Lets go of every key and button, so nothing stays held on the phone.
        fn release(&mut self) {
            if self.connected.is_none() {
                return;
            }
            if let Some(published) = &self.published {
                self.motion = Motion::default();
                notify(&published.mouse, &[0; 6]);
                notify(&published.keyboard, &[0; 8]);
            }
        }
    }

    fn advertisement(status: GattServiceProviderAdvertisementStatus) -> &'static str {
        match status {
            GattServiceProviderAdvertisementStatus::Created => "created",
            GattServiceProviderAdvertisementStatus::Stopped => "stopped",
            GattServiceProviderAdvertisementStatus::Started => "started",
            // Said once on the way up, even when all is well.
            GattServiceProviderAdvertisementStatus::Aborted => "aborted",
            GattServiceProviderAdvertisementStatus::StartedWithoutAllAdvertisementData => {
                "started, without all its data"
            }
            _ => "unknown",
        }
    }

    /// The link's own pace, where Windows says what it is (Windows 11).
    fn pace(device: &BluetoothLEDevice) -> Duration {
        device
            .GetConnectionParameters()
            .and_then(|parameters| parameters.ConnectionInterval())
            .ok()
            .filter(|&interval| interval > 0)
            // In units of 1.25 ms.
            .map(|interval| Duration::from_micros(interval as u64 * 1250))
            .map(|pace| pace.clamp(Duration::from_micros(7500), Duration::from_millis(50)))
            .unwrap_or(DEFAULT_PACE)
    }
}
