//! The media side of [`super`]: copying the picture from the screen, the
//! PC's sound, and encoding them. Nothing here knows about the app, so it can
//! be tested on its own (see `apps/desktop/src-tauri/tests-media`).

use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::thread;
use std::time::Duration;

pub const FPS: u32 = 30;
/// The longest side of a recording. Larger pictures are scaled down to it.
const MAX_SIDE: i32 = 1920;

/// Where the picture is now, in screen pixels: its left, top, width and height.
pub type Area = (i32, i32, i32, i32);

/// Where the picture is, while there is one.
pub enum Picture {
    /// In this top-level window (a handle), at this place on the screen.
    Shown { window: isize, area: Area },
    /// Still there, but out of sight for now (paused, or a sheet is open).
    Hidden,
    /// Mirroring has ended.
    Gone,
}

/// The pixels with every one fully opaque, as an image file needs.
pub fn opaque(pixels: &[u8]) -> Vec<u8> {
    let mut out = pixels.to_vec();
    for alpha in out.iter_mut().skip(3).step_by(4) {
        *alpha = 255;
    }
    out
}

/// A recording's size: the picture's, no longer than [`MAX_SIDE`], and even,
/// as H.264 wants.
pub fn fitted(width: i32, height: i32) -> (u32, u32) {
    let scale = (MAX_SIDE as f64 / width.max(height).max(1) as f64).min(1.0);
    let even = |side: i32| (((side as f64 * scale).round() as u32) & !1).max(2);
    (even(width), even(height))
}

/// A new file in `dir`, named for the moment: "Mirlow 2026-11-09 16.40.12.png".
pub fn name_in(dir: &Path, extension: &str) -> Result<PathBuf, String> {
    std::fs::create_dir_all(dir).map_err(|error| error.to_string())?;
    let stamp = platform::local_time();
    let mut path = dir.join(format!("Mirlow {stamp}.{extension}"));
    let mut count = 2;
    while path.exists() {
        path = dir.join(format!("Mirlow {stamp} ({count}).{extension}"));
        count += 1;
    }
    Ok(path)
}

/// Runs `work` on a thread of its own with COM set up, as Media Foundation
/// and the image encoder need, and returns what it did.
pub fn run_with_com<T: Send + 'static>(work: impl FnOnce() -> Result<T, String> + Send + 'static) -> Result<T, String> {
    thread::spawn(move || {
        let _com = platform::Com::new();
        work()
    })
    .join()
    .map_err(|_| "The capture stopped unexpectedly.".to_string())?
}

pub fn record(
    path: &Path,
    width: u32,
    height: u32,
    mut source: impl FnMut() -> Picture,
    stop: &AtomicBool,
) -> Result<(), String> {
    // Without a sound device the recording is silent rather than not made.
    let mut sound = platform::Loopback::new().ok();
    let mut encoder = platform::Encoder::new(path, width, height, FPS, sound.is_some())?;
    let mut grabber = platform::Grabber::new(width as i32, height as i32)?;
    // The recording starts now, once everything is ready: starting the
    // encoder can take a second. Sound played before now is let go.
    let clock = platform::Clock::new();
    let interval = 10_000_000 / FPS as i64;
    let mut next = 0i64;
    let mut frames = 0u64;
    let mut failure = None;

    while !stop.load(Ordering::SeqCst) {
        let now = clock.now();
        match source() {
            Picture::Gone => break,
            Picture::Hidden => {}
            Picture::Shown { window, area } => {
                let written = grabber.grab(window, area).and_then(|pixels| encoder.video(&pixels, now, interval));
                if let Err(error) = written {
                    failure = Some(error);
                    break;
                }
                frames += 1;
            }
        }
        if let Some(loopback) = sound.as_mut() {
            if let Err(error) = loopback.drain(&clock, &mut encoder, false) {
                failure = Some(error);
                break;
            }
        }
        next += interval;
        let wait = next - clock.now();
        if wait > 0 {
            thread::sleep(Duration::from_micros((wait / 10) as u64));
        } else {
            next = clock.now(); // fell behind: carry on from here, not catch up
        }
    }
    if let (Some(loopback), None) = (sound.as_mut(), &failure) {
        failure = loopback.drain(&clock, &mut encoder, true).err();
    }
    let finished = encoder.finish();
    if let Some(error) = failure {
        return Err(error);
    }
    finished?;
    if frames == 0 {
        return Err("The picture was never shown.".into());
    }
    Ok(())
}

#[cfg(windows)]
pub mod platform {
    use super::Area;
    use std::path::Path;
    use windows::core::HSTRING;
    use windows::Win32::Foundation::{GENERIC_WRITE, HWND, RECT};
    use windows::Win32::Graphics::Gdi::{
        CreateCompatibleBitmap, CreateCompatibleDC, CreateDIBSection, DeleteDC, DeleteObject, GetDC, ReleaseDC,
        SelectObject, SetStretchBltMode, StretchBlt, BITMAPINFO, BITMAPINFOHEADER, BI_RGB, DIB_RGB_COLORS, HALFTONE,
        HBITMAP, HDC, HGDIOBJ, SRCCOPY,
    };
    use windows::Win32::Storage::Xps::{PrintWindow, PRINT_WINDOW_FLAGS};
    use windows::Win32::UI::WindowsAndMessaging::GetWindowRect;
    use windows::Win32::Graphics::Imaging::{
        CLSID_WICImagingFactory, GUID_ContainerFormatPng, GUID_WICPixelFormat32bppBGRA, IWICImagingFactory,
        WICBitmapEncoderNoCache,
    };
    use windows::Win32::Media::Audio::{
        eConsole, eRender, IAudioCaptureClient, IAudioClient, IMMDeviceEnumerator, MMDeviceEnumerator,
        AUDCLNT_BUFFERFLAGS_SILENT, AUDCLNT_SHAREMODE_SHARED, AUDCLNT_STREAMFLAGS_AUTOCONVERTPCM,
        AUDCLNT_STREAMFLAGS_LOOPBACK, AUDCLNT_STREAMFLAGS_SRC_DEFAULT_QUALITY, WAVEFORMATEX, WAVE_FORMAT_PCM,
    };
    use windows::Win32::Media::MediaFoundation::*;
    use windows::Win32::System::Com::{
        CoCreateInstance, CoInitializeEx, CoUninitialize, CLSCTX_ALL, CLSCTX_INPROC_SERVER, COINIT_MULTITHREADED,
    };
    use windows::Win32::System::Performance::{QueryPerformanceCounter, QueryPerformanceFrequency};
    use windows::Win32::System::SystemInformation::GetLocalTime;

    pub use super::platform_encoder::Encoder;

    fn error(error: windows::core::Error) -> String {
        error.message().trim().to_string()
    }

    pub fn local_time() -> String {
        let time = unsafe { GetLocalTime() };
        format!(
            "{:04}-{:02}-{:02} {:02}.{:02}.{:02}",
            time.wYear, time.wMonth, time.wDay, time.wHour, time.wMinute, time.wSecond
        )
    }

    /// COM for this thread, for as long as it is held.
    pub struct Com(bool);
    impl Com {
        pub fn new() -> Self {
            Self(unsafe { CoInitializeEx(None, COINIT_MULTITHREADED) }.is_ok())
        }
    }
    impl Drop for Com {
        fn drop(&mut self) {
            if self.0 {
                unsafe { CoUninitialize() };
            }
        }
    }

    /// The time since it was made, in 100 ns units, on the clock the sound
    /// card's timestamps use too.
    pub struct Clock {
        start: i64,
        frequency: i64,
    }
    impl Clock {
        pub fn new() -> Self {
            let mut frequency = 0;
            let _ = unsafe { QueryPerformanceFrequency(&mut frequency) };
            let mut clock = Self { start: 0, frequency: frequency.max(1) };
            clock.start = clock.absolute();
            clock
        }
        fn absolute(&self) -> i64 {
            let mut counter = 0;
            let _ = unsafe { QueryPerformanceCounter(&mut counter) };
            (counter as i128 * 10_000_000 / self.frequency as i128) as i64
        }
        pub fn now(&self) -> i64 {
            self.absolute() - self.start
        }
        /// A sound card timestamp (100 ns units of the same counter) on this clock.
        pub fn since_start(&self, position: u64) -> i64 {
            position as i64 - self.start
        }
    }

    /// Draw the window as the screen shows it, Direct3D content included.
    const PW_RENDERFULLCONTENT: PRINT_WINDOW_FLAGS = PRINT_WINDOW_FLAGS(2);

    /// Copies part of a window into a picture of a fixed size, scaled to fit
    /// and centred on black. The window is copied as it draws itself, not from
    /// the screen, so whatever covers it is left out.
    pub struct Grabber {
        screen: HDC,
        memory: HDC,
        bitmap: HBITMAP,
        previous: HGDIOBJ,
        bits: *mut u8,
        width: i32,
        height: i32,
        /// The whole window, copied before the picture is cut out of it.
        window: HDC,
        /// Its bitmap, what it replaced, and its size.
        window_bitmap: Option<(HBITMAP, HGDIOBJ, i32, i32)>,
    }

    impl Grabber {
        pub fn new(width: i32, height: i32) -> Result<Self, String> {
            unsafe {
                let screen = GetDC(None);
                let memory = CreateCompatibleDC(Some(screen));
                let window = CreateCompatibleDC(Some(screen));
                let info = BITMAPINFO {
                    bmiHeader: BITMAPINFOHEADER {
                        biSize: size_of::<BITMAPINFOHEADER>() as u32,
                        biWidth: width,
                        biHeight: -height, // top row first
                        biPlanes: 1,
                        biBitCount: 32,
                        biCompression: BI_RGB.0,
                        ..Default::default()
                    },
                    ..Default::default()
                };
                let mut bits = std::ptr::null_mut();
                let bitmap = match CreateDIBSection(Some(memory), &info, DIB_RGB_COLORS, &mut bits, None, 0) {
                    Ok(bitmap) if !bits.is_null() => bitmap,
                    _ => {
                        let _ = DeleteDC(memory);
                        let _ = DeleteDC(window);
                        ReleaseDC(None, screen);
                        return Err("Could not make room for the picture.".into());
                    }
                };
                let previous = SelectObject(memory, bitmap.into());
                SetStretchBltMode(memory, HALFTONE);
                Ok(Self {
                    screen,
                    memory,
                    bitmap,
                    previous,
                    bits: bits as *mut u8,
                    width,
                    height,
                    window,
                    window_bitmap: None,
                })
            }
        }

        /// The area of the screen (where it is now) as `window` draws it, as
        /// BGRA pixels, top row first. The alpha bytes are not set: see
        /// [`super::opaque`].
        pub fn grab(&mut self, window: isize, area: Area) -> Result<&[u8], String> {
            let hwnd = HWND(window as *mut core::ffi::c_void);
            let mut rect = RECT::default();
            unsafe { GetWindowRect(hwnd, &mut rect) }.map_err(|_| "The window has gone.")?;
            let size = (rect.right - rect.left, rect.bottom - rect.top);
            if self.window_bitmap.map(|(_, _, w, h)| (w, h)) != Some(size) {
                unsafe {
                    if let Some((bitmap, previous, ..)) = self.window_bitmap.take() {
                        SelectObject(self.window, previous);
                        let _ = DeleteObject(bitmap.into());
                    }
                    let bitmap = CreateCompatibleBitmap(self.screen, size.0.max(1), size.1.max(1));
                    if bitmap.is_invalid() {
                        return Err("Could not make room for the window.".into());
                    }
                    let previous = SelectObject(self.window, bitmap.into());
                    self.window_bitmap = Some((bitmap, previous, size.0, size.1));
                }
            }
            if !unsafe { PrintWindow(hwnd, self.window, PW_RENDERFULLCONTENT) }.as_bool() {
                return Err("Could not copy the window.".into());
            }
            let (x, y, width, height) = (area.0 - rect.left, area.1 - rect.top, area.2, area.3);
            let length = (self.width * self.height * 4) as usize;
            // SAFETY: the section holds width * height 32-bit pixels.
            let pixels = unsafe { std::slice::from_raw_parts_mut(self.bits, length) };
            pixels.fill(0);
            let scale = (self.width as f64 / width.max(1) as f64).min(self.height as f64 / height.max(1) as f64);
            let (fit_width, fit_height) = ((width as f64 * scale).round() as i32, (height as f64 * scale).round() as i32);
            let copied = unsafe {
                StretchBlt(
                    self.memory,
                    (self.width - fit_width) / 2,
                    (self.height - fit_height) / 2,
                    fit_width,
                    fit_height,
                    Some(self.window),
                    x,
                    y,
                    width,
                    height,
                    SRCCOPY,
                )
            };
            if !copied.as_bool() {
                return Err("Could not copy the picture.".into());
            }
            Ok(pixels)
        }
    }

    impl Drop for Grabber {
        fn drop(&mut self) {
            unsafe {
                if let Some((bitmap, previous, ..)) = self.window_bitmap.take() {
                    SelectObject(self.window, previous);
                    let _ = DeleteObject(bitmap.into());
                }
                let _ = DeleteDC(self.window);
                SelectObject(self.memory, self.previous);
                let _ = DeleteObject(self.bitmap.into());
                let _ = DeleteDC(self.memory);
                ReleaseDC(None, self.screen);
            }
        }
    }

    pub fn save_png(path: &Path, width: u32, height: u32, pixels: &[u8]) -> Result<(), String> {
        unsafe {
            let factory: IWICImagingFactory =
                CoCreateInstance(&CLSID_WICImagingFactory, None, CLSCTX_INPROC_SERVER).map_err(error)?;
            let stream = factory.CreateStream().map_err(error)?;
            stream.InitializeFromFilename(&HSTRING::from(path.as_os_str()), GENERIC_WRITE.0).map_err(error)?;
            let encoder = factory.CreateEncoder(&GUID_ContainerFormatPng, std::ptr::null()).map_err(error)?;
            encoder.Initialize(&stream, WICBitmapEncoderNoCache).map_err(error)?;
            let mut frame = None;
            encoder.CreateNewFrame(&mut frame, std::ptr::null_mut()).map_err(error)?;
            let frame = frame.ok_or("No image frame.")?;
            frame.Initialize(None).map_err(error)?;
            frame.SetSize(width, height).map_err(error)?;
            let mut format = GUID_WICPixelFormat32bppBGRA;
            frame.SetPixelFormat(&mut format).map_err(error)?;
            frame.WritePixels(height, width * 4, pixels).map_err(error)?;
            frame.Commit().map_err(error)?;
            encoder.Commit().map_err(error)?;
        }
        Ok(())
    }

    /// The PC's sound as it plays, as 48 kHz 16-bit stereo.
    pub struct Loopback {
        client: IAudioClient,
        capture: IAudioCaptureClient,
        /// Sample frames handed to the encoder so far.
        written: i64,
    }

    pub const RATE: i64 = 48_000;
    const CHANNELS: usize = 2;

    impl Loopback {
        pub fn new() -> Result<Self, String> {
            unsafe {
                let devices: IMMDeviceEnumerator =
                    CoCreateInstance(&MMDeviceEnumerator, None, CLSCTX_ALL).map_err(error)?;
                let device = devices.GetDefaultAudioEndpoint(eRender, eConsole).map_err(error)?;
                let client: IAudioClient = device.Activate(CLSCTX_ALL, None).map_err(error)?;
                let format = WAVEFORMATEX {
                    wFormatTag: WAVE_FORMAT_PCM as u16,
                    nChannels: CHANNELS as u16,
                    nSamplesPerSec: RATE as u32,
                    nAvgBytesPerSec: RATE as u32 * 4,
                    nBlockAlign: 4,
                    wBitsPerSample: 16,
                    cbSize: 0,
                };
                // Windows converts from whatever the output plays at.
                client
                    .Initialize(
                        AUDCLNT_SHAREMODE_SHARED,
                        AUDCLNT_STREAMFLAGS_LOOPBACK
                            | AUDCLNT_STREAMFLAGS_AUTOCONVERTPCM
                            | AUDCLNT_STREAMFLAGS_SRC_DEFAULT_QUALITY,
                        10_000_000,
                        0,
                        &format,
                        None,
                    )
                    .map_err(error)?;
                let capture: IAudioCaptureClient = client.GetService().map_err(error)?;
                client.Start().map_err(error)?;
                Ok(Self { client, capture, written: 0 })
            }
        }

        /// Hands what has been played since the last call to the encoder, at
        /// the moment it was played. Nothing at all is played while the PC is
        /// quiet, so that is filled with silence, up to a moment ago (or up to
        /// now, at the `end`), so the sound never lags the picture.
        pub fn drain(&mut self, clock: &Clock, encoder: &mut Encoder, end: bool) -> Result<(), String> {
            loop {
                let pending = unsafe { self.capture.GetNextPacketSize() }.map_err(error)?;
                if pending == 0 {
                    break;
                }
                let mut data = std::ptr::null_mut();
                let mut count = 0u32;
                let mut flags = 0u32;
                let mut position = 0u64;
                unsafe { self.capture.GetBuffer(&mut data, &mut count, &mut flags, None, Some(&mut position)) }
                    .map_err(error)?;
                let at = clock.since_start(position) * RATE / 10_000_000;
                let samples = if flags & AUDCLNT_BUFFERFLAGS_SILENT.0 as u32 != 0 || data.is_null() {
                    vec![0i16; count as usize * CHANNELS]
                } else {
                    // SAFETY: the packet holds `count` frames in the format asked for.
                    unsafe { std::slice::from_raw_parts(data as *const i16, count as usize * CHANNELS) }.to_vec()
                };
                unsafe { self.capture.ReleaseBuffer(count) }.map_err(error)?;
                // Played before recording began.
                if at + count as i64 <= 0 {
                    continue;
                }
                self.silence_until(at, encoder)?;
                encoder.audio(&samples, self.written)?;
                self.written += count as i64;
            }
            let margin = if end { 0 } else { RATE / 5 };
            self.silence_until(clock.now() * RATE / 10_000_000 - margin, encoder)
        }

        fn silence_until(&mut self, frame: i64, encoder: &mut Encoder) -> Result<(), String> {
            // A little ahead is let be; it is the sound card's timing, not a gap.
            while frame - self.written > RATE / 100 {
                let count = (frame - self.written).min(RATE / 10);
                encoder.audio(&vec![0i16; count as usize * CHANNELS], self.written)?;
                self.written += count;
            }
            Ok(())
        }
    }

    impl Drop for Loopback {
        fn drop(&mut self) {
            let _ = unsafe { self.client.Stop() };
        }
    }

    fn pack(high: u32, low: u32) -> u64 {
        ((high as u64) << 32) | low as u64
    }

    pub(super) fn video_type(subtype: &windows::core::GUID, width: u32, height: u32, fps: u32) -> windows::core::Result<IMFMediaType> {
        unsafe {
            let kind = MFCreateMediaType()?;
            kind.SetGUID(&MF_MT_MAJOR_TYPE, &MFMediaType_Video)?;
            kind.SetGUID(&MF_MT_SUBTYPE, subtype)?;
            kind.SetUINT32(&MF_MT_INTERLACE_MODE, MFVideoInterlace_Progressive.0 as u32)?;
            kind.SetUINT64(&MF_MT_FRAME_SIZE, pack(width, height))?;
            kind.SetUINT64(&MF_MT_FRAME_RATE, pack(fps, 1))?;
            kind.SetUINT64(&MF_MT_PIXEL_ASPECT_RATIO, pack(1, 1))?;
            Ok(kind)
        }
    }

    pub(super) fn audio_type(subtype: &windows::core::GUID, bytes_per_second: u32) -> windows::core::Result<IMFMediaType> {
        unsafe {
            let kind = MFCreateMediaType()?;
            kind.SetGUID(&MF_MT_MAJOR_TYPE, &MFMediaType_Audio)?;
            kind.SetGUID(&MF_MT_SUBTYPE, subtype)?;
            kind.SetUINT32(&MF_MT_AUDIO_BITS_PER_SAMPLE, 16)?;
            kind.SetUINT32(&MF_MT_AUDIO_SAMPLES_PER_SECOND, RATE as u32)?;
            kind.SetUINT32(&MF_MT_AUDIO_NUM_CHANNELS, CHANNELS as u32)?;
            kind.SetUINT32(&MF_MT_AUDIO_AVG_BYTES_PER_SECOND, bytes_per_second)?;
            Ok(kind)
        }
    }

    pub(super) fn mf_error(error: windows::core::Error) -> String {
        self::error(error)
    }
}

/// Media Foundation's sink writer, writing an MP4.
#[cfg(windows)]
mod platform_encoder {
    use super::platform::{audio_type, mf_error, video_type, RATE};
    use std::path::Path;
    use windows::core::HSTRING;
    use windows::Win32::Media::MediaFoundation::*;

    pub struct Encoder {
        writer: IMFSinkWriter,
        video: u32,
        audio: Option<u32>,
        frame_bytes: u32,
        stride: u32,
        started: bool,
    }

    impl Encoder {
        pub fn new(path: &Path, width: u32, height: u32, fps: u32, audio: bool) -> Result<Self, String> {
            unsafe { MFStartup(MF_VERSION, MFSTARTUP_FULL) }.map_err(mf_error)?;
            // The graphics card's encoder if it will, Windows' own otherwise.
            Self::open(path, width, height, fps, audio, true)
                .or_else(|_| Self::open(path, width, height, fps, audio, false))
                .inspect_err(|_| {
                    let _ = unsafe { MFShutdown() };
                })
        }

        fn open(path: &Path, width: u32, height: u32, fps: u32, audio: bool, hardware: bool) -> Result<Self, String> {
            unsafe {
                let mut attributes = None;
                MFCreateAttributes(&mut attributes, 2).map_err(mf_error)?;
                let attributes = attributes.ok_or("No attributes.")?;
                attributes.SetUINT32(&MF_READWRITE_ENABLE_HARDWARE_TRANSFORMS, hardware as u32).map_err(mf_error)?;
                attributes.SetGUID(&MF_TRANSCODE_CONTAINERTYPE, &MFTranscodeContainerType_MPEG4).map_err(mf_error)?;
                let writer =
                    MFCreateSinkWriterFromURL(&HSTRING::from(path.as_os_str()), None, &attributes).map_err(mf_error)?;

                let out = video_type(&MFVideoFormat_H264, width, height, fps).map_err(mf_error)?;
                // About 0.15 bits a pixel: sharp text, sensible files.
                let bitrate = (width as u64 * height as u64 * fps as u64 * 15 / 100).clamp(2_000_000, 20_000_000);
                out.SetUINT32(&MF_MT_AVG_BITRATE, bitrate as u32).map_err(mf_error)?;
                let video = writer.AddStream(&out).map_err(mf_error)?;
                let input = video_type(&MFVideoFormat_RGB32, width, height, fps).map_err(mf_error)?;
                // Positive: the top row comes first, as the grabber writes it.
                input.SetUINT32(&MF_MT_DEFAULT_STRIDE, width * 4).map_err(mf_error)?;
                writer.SetInputMediaType(video, &input, None).map_err(mf_error)?;

                let audio = if audio {
                    let out = audio_type(&MFAudioFormat_AAC, 24_000).map_err(mf_error)?;
                    let stream = writer.AddStream(&out).map_err(mf_error)?;
                    let input = audio_type(&MFAudioFormat_PCM, RATE as u32 * 4).map_err(mf_error)?;
                    input.SetUINT32(&MF_MT_AUDIO_BLOCK_ALIGNMENT, 4).map_err(mf_error)?;
                    writer.SetInputMediaType(stream, &input, None).map_err(mf_error)?;
                    Some(stream)
                } else {
                    None
                };
                writer.BeginWriting().map_err(mf_error)?;
                Ok(Self { writer, video, audio, frame_bytes: width * height * 4, stride: width * 4, started: true })
            }
        }

        fn write(&self, stream: u32, bytes: &[u8], time: i64, duration: i64) -> Result<(), String> {
            unsafe {
                let buffer = MFCreateMemoryBuffer(bytes.len() as u32).map_err(mf_error)?;
                let mut data = std::ptr::null_mut();
                buffer.Lock(&mut data, None, None).map_err(mf_error)?;
                std::ptr::copy_nonoverlapping(bytes.as_ptr(), data, bytes.len());
                buffer.Unlock().map_err(mf_error)?;
                buffer.SetCurrentLength(bytes.len() as u32).map_err(mf_error)?;
                let sample = MFCreateSample().map_err(mf_error)?;
                sample.AddBuffer(&buffer).map_err(mf_error)?;
                sample.SetSampleTime(time).map_err(mf_error)?;
                sample.SetSampleDuration(duration).map_err(mf_error)?;
                self.writer.WriteSample(stream, &sample).map_err(mf_error)
            }
        }

        /// One picture, BGRA top row first, shown at `time` (100 ns units).
        pub fn video(&mut self, pixels: &[u8], time: i64, duration: i64) -> Result<(), String> {
            if pixels.len() != self.frame_bytes as usize || self.stride == 0 {
                return Err("The picture changed size.".into());
            }
            self.write(self.video, pixels, time, duration)
        }

        /// Interleaved 16-bit stereo, starting at sample frame `at`.
        pub fn audio(&mut self, samples: &[i16], at: i64) -> Result<(), String> {
            let Some(stream) = self.audio else { return Ok(()) };
            if samples.is_empty() {
                return Ok(());
            }
            // SAFETY: plain integers viewed as their bytes.
            let bytes = unsafe { std::slice::from_raw_parts(samples.as_ptr() as *const u8, samples.len() * 2) };
            let frames = (samples.len() / 2) as i64;
            self.write(stream, bytes, at * 10_000_000 / RATE, frames * 10_000_000 / RATE)
        }

        pub fn finish(mut self) -> Result<(), String> {
            self.started = false;
            let finished = unsafe { self.writer.Finalize() }.map_err(mf_error);
            let _ = unsafe { MFShutdown() };
            finished
        }
    }

    impl Drop for Encoder {
        fn drop(&mut self) {
            if self.started {
                let _ = unsafe { MFShutdown() };
            }
        }
    }
}

#[cfg(not(windows))]
pub mod platform {
    use super::Area;
    use std::path::Path;
    pub struct Com;
    impl Com {
        pub fn new() -> Self {
            Self
        }
    }
    pub fn local_time() -> String {
        "now".into()
    }
    pub struct Clock;
    impl Clock {
        pub fn new() -> Self {
            Self
        }
        pub fn now(&self) -> i64 {
            0
        }
    }
    pub struct Grabber;
    impl Grabber {
        pub fn new(_width: i32, _height: i32) -> Result<Self, String> {
            Err("Not supported here.".into())
        }
        pub fn grab(&mut self, _window: isize, _area: Area) -> Result<&[u8], String> {
            Err("Not supported here.".into())
        }
    }
    pub fn save_png(_path: &Path, _width: u32, _height: u32, _pixels: &[u8]) -> Result<(), String> {
        Err("Not supported here.".into())
    }
    pub struct Loopback;
    impl Loopback {
        pub fn new() -> Result<Self, String> {
            Err("Not supported here.".into())
        }
        pub fn drain(&mut self, _clock: &Clock, _encoder: &mut Encoder, _end: bool) -> Result<(), String> {
            Ok(())
        }
    }
    pub struct Encoder;
    impl Encoder {
        pub fn new(_path: &Path, _width: u32, _height: u32, _fps: u32, _audio: bool) -> Result<Self, String> {
            Err("Not supported here.".into())
        }
        pub fn video(&mut self, _pixels: &[u8], _time: i64, _duration: i64) -> Result<(), String> {
            Ok(())
        }
        pub fn finish(self) -> Result<(), String> {
            Ok(())
        }
    }
}

#[cfg(all(test, windows))]
mod tests {
    use super::platform::{save_png, Com, Encoder, Grabber};
    use super::*;
    use windows::core::HSTRING;
    use windows::Win32::Graphics::Imaging::{CLSID_WICImagingFactory, IWICImagingFactory, WICDecodeMetadataCacheOnDemand};
    use windows::Win32::Media::MediaFoundation::*;
    use windows::Win32::System::Com::{CoCreateInstance, CLSCTX_INPROC_SERVER};
    use windows::Win32::Foundation::{COLORREF, HWND, LPARAM, LRESULT, RECT, WPARAM};
    use windows::Win32::Graphics::Gdi::CreateSolidBrush;
    use windows::Win32::System::LibraryLoader::GetModuleHandleW;
    use windows::Win32::UI::WindowsAndMessaging::*;

    unsafe extern "system" fn procedure(hwnd: HWND, message: u32, w: WPARAM, l: LPARAM) -> LRESULT {
        DefWindowProcW(hwnd, message, w, l)
    }

    /// A window filled with one colour (0x00BBGGRR), drawn and ready to copy.
    fn window(colour: u32, style: WINDOW_STYLE, ex: WINDOW_EX_STYLE, parent: Option<HWND>, area: Area) -> HWND {
        unsafe {
            let instance = GetModuleHandleW(None).unwrap();
            let class = HSTRING::from(format!("MirlowTest{colour:06x}"));
            RegisterClassW(&WNDCLASSW {
                lpfnWndProc: Some(procedure),
                hInstance: instance.into(),
                lpszClassName: windows::core::PCWSTR(class.as_ptr()),
                hbrBackground: CreateSolidBrush(COLORREF(colour)),
                ..Default::default()
            });
            let (x, y, width, height) = area;
            let hwnd = CreateWindowExW(
                ex,
                &class,
                &class,
                style | WS_VISIBLE,
                x,
                y,
                width,
                height,
                parent,
                None,
                Some(instance.into()),
                None,
            )
            .unwrap();
            let end = std::time::Instant::now() + Duration::from_millis(400);
            while std::time::Instant::now() < end {
                let mut message = MSG::default();
                while PeekMessageW(&mut message, None, 0, 0, PM_REMOVE).as_bool() {
                    DispatchMessageW(&message);
                }
                thread::sleep(Duration::from_millis(5));
            }
            hwnd
        }
    }

    fn screen_area(hwnd: HWND) -> Area {
        let mut rect = RECT::default();
        unsafe { GetWindowRect(hwnd, &mut rect).unwrap() };
        (rect.left, rect.top, rect.right - rect.left, rect.bottom - rect.top)
    }

    #[test]
    fn copies_the_picture_even_when_a_window_covers_it() {
        let _com = Com::new();
        // As in the app: a picture (red) inside a window with a title bar (white)...
        let parent = window(0xffffff, WS_OVERLAPPEDWINDOW, WINDOW_EX_STYLE(0), None, (120, 120, 640, 480));
        let picture = window(0x0000ff, WS_CHILD, WINDOW_EX_STYLE(0), Some(parent), (40, 30, 200, 150));
        // ...and something on top of all of it (blue).
        let cover = window(0xff0000, WS_POPUP, WS_EX_TOPMOST, None, (0, 0, 1000, 800));

        let area = screen_area(picture);
        let pixels = opaque(Grabber::new(area.2, area.3).unwrap().grab(parent.0 as isize, area).unwrap());
        let at = |x: i32, y: i32| {
            let index = ((y * area.2 + x) * 4) as usize;
            (pixels[index], pixels[index + 1], pixels[index + 2])
        };
        // Red everywhere, right up to each edge: the picture, exactly, and nothing
        // of the window around it (white) or on top of it (blue). The scaling
        // softens the outermost pixels a little; a pixel off would make them white.
        let (right, bottom) = (area.2 - 1, area.3 - 1);
        for (x, y) in [(right / 2, 0), (0, bottom / 2), (right, bottom / 2), (right / 2, bottom), (right / 2, bottom / 2)] {
            let (b, g, r) = at(x, y);
            assert!(r == 255 && g < 100 && b < 100, "at {x},{y}: {:?}", (b, g, r));
        }
        unsafe {
            let _ = DestroyWindow(cover);
            let _ = DestroyWindow(parent);
        }
    }

    fn temp(name: &str) -> PathBuf {
        let path = std::env::temp_dir().join(format!("mirlow-test-{}-{name}", std::process::id()));
        let _ = std::fs::remove_file(&path);
        path
    }

    /// What a file holds: its length in seconds, and the subtype of each stream.
    fn probe(path: &Path) -> (f64, Vec<windows::core::GUID>) {
        unsafe {
            MFStartup(MF_VERSION, MFSTARTUP_FULL).unwrap();
            let reader = MFCreateSourceReaderFromURL(&HSTRING::from(path.as_os_str()), None).unwrap();
            let duration = reader
                .GetPresentationAttribute(MF_SOURCE_READER_MEDIASOURCE.0 as u32, &MF_PD_DURATION)
                .unwrap();
            let duration = duration.Anonymous.Anonymous.Anonymous.uhVal as f64 / 1e7;
            let mut subtypes = Vec::new();
            for stream in 0.. {
                match reader.GetNativeMediaType(stream, 0) {
                    Ok(kind) => subtypes.push(kind.GetGUID(&MF_MT_SUBTYPE).unwrap()),
                    Err(_) => break,
                }
            }
            let _ = MFShutdown();
            (duration, subtypes)
        }
    }

    /// The colour (B, G, R) at the middle of rows `rows` of the first frame.
    fn first_frame(path: &Path, rows: &[u32]) -> Vec<(u8, u8, u8)> {
        unsafe {
            MFStartup(MF_VERSION, MFSTARTUP_FULL).unwrap();
            let mut attributes = None;
            MFCreateAttributes(&mut attributes, 1).unwrap();
            let attributes = attributes.unwrap();
            attributes.SetUINT32(&MF_SOURCE_READER_ENABLE_VIDEO_PROCESSING, 1).unwrap();
            let reader = MFCreateSourceReaderFromURL(&HSTRING::from(path.as_os_str()), &attributes).unwrap();
            let stream = MF_SOURCE_READER_FIRST_VIDEO_STREAM.0 as u32;
            let kind = MFCreateMediaType().unwrap();
            kind.SetGUID(&MF_MT_MAJOR_TYPE, &MFMediaType_Video).unwrap();
            kind.SetGUID(&MF_MT_SUBTYPE, &MFVideoFormat_RGB32).unwrap();
            reader.SetCurrentMediaType(stream, None, &kind).unwrap();
            let (mut flags, mut sample) = (0u32, None);
            reader.ReadSample(stream, 0, None, Some(&mut flags), None, Some(&mut sample)).unwrap();
            let buffer = sample.expect("a frame").ConvertToContiguousBuffer().unwrap();
            let current = reader.GetCurrentMediaType(stream).unwrap();
            let size = current.GetUINT64(&MF_MT_FRAME_SIZE).unwrap();
            let (width, height) = ((size >> 32) as isize, (size & 0xffff_ffff) as isize);
            // Media Foundation's RGB is top row first unless its stride says otherwise.
            let pitch = current.GetUINT32(&MF_MT_DEFAULT_STRIDE).map_or(width as i32 * 4, |stride| stride as i32);
            let mut data = std::ptr::null_mut();
            buffer.Lock(&mut data, None, None).unwrap();
            let first = if pitch < 0 { data.offset(-(pitch as isize) * (height - 1)) } else { data };
            eprintln!("decoded {width}x{height}, stride {pitch}");
            let colours = rows
                .iter()
                .map(|&row| {
                    let pixel = first.offset(row as isize * pitch as isize + width / 2 * 4);
                    (*pixel, *pixel.add(1), *pixel.add(2))
                })
                .collect();
            buffer.Unlock().unwrap();
            let _ = MFShutdown();
            colours
        }
    }

    #[test]
    fn records_video_and_sound_the_right_way_up() {
        let _com = Com::new();
        let path = temp("encoded.mp4");
        let (width, height) = (320u32, 240u32);
        // Red over blue, so an upside-down encoding shows.
        let mut frame = Vec::with_capacity((width * height * 4) as usize);
        for row in 0..height {
            let pixel: [u8; 4] = if row < height / 2 { [0, 0, 255, 255] } else { [255, 0, 0, 255] };
            for _ in 0..width {
                frame.extend_from_slice(&pixel);
            }
        }
        let mut encoder = Encoder::new(&path, width, height, FPS, true).unwrap();
        let interval = 10_000_000 / FPS as i64;
        for index in 0..45 {
            encoder.video(&frame, index * interval, interval).unwrap();
        }
        // 1.5 s of a quiet tone.
        let tone: Vec<i16> = (0..72_000)
            .flat_map(|n| {
                let value = ((n as f64 * 440.0 * std::f64::consts::TAU / 48_000.0).sin() * 3000.0) as i16;
                [value, value]
            })
            .collect();
        encoder.audio(&tone, 0).unwrap();
        encoder.finish().unwrap();

        let (seconds, subtypes) = probe(&path);
        assert!((seconds - 1.5).abs() < 0.15, "lasts {seconds} s");
        assert!(subtypes.contains(&MFVideoFormat_H264), "{subtypes:?}");
        assert!(subtypes.contains(&MFAudioFormat_AAC), "{subtypes:?}");

        let colours = first_frame(&path, &[20, 220]);
        let (top, bottom) = (colours[0], colours[1]);
        assert!(top.2 > 180 && top.0 < 80, "top should be red, is {top:?}");
        assert!(bottom.0 > 180 && bottom.2 < 80, "bottom should be blue, is {bottom:?}");
        let _ = std::fs::remove_file(&path);
    }

    #[test]
    fn records_a_window_with_the_pcs_sound() {
        let _com = Com::new();
        let path = temp("screen.mp4");
        let shown = window(0x00ff00, WS_POPUP, WINDOW_EX_STYLE(0), None, (0, 0, 400, 300));
        let area = screen_area(shown);
        // Timed from the first frame: starting the encoder can take a while.
        let mut started = None;
        let source = move || {
            if started.get_or_insert_with(std::time::Instant::now).elapsed() < Duration::from_millis(1200) {
                Picture::Shown { window: shown.0 as isize, area }
            } else {
                Picture::Gone
            }
        };
        let stop = AtomicBool::new(false);
        let (width, height) = fitted(400, 300);
        record(&path, width, height, source, &stop).unwrap();
        unsafe { DestroyWindow(shown).unwrap() };
        let (seconds, subtypes) = probe(&path);
        assert!((seconds - 1.2).abs() < 0.3, "lasts {seconds} s");
        assert!(subtypes.contains(&MFVideoFormat_H264), "{subtypes:?}");
        // Only when this PC has a sound output to record from.
        if platform::Loopback::new().is_ok() {
            assert!(subtypes.contains(&MFAudioFormat_AAC), "{subtypes:?}");
        }
        let _ = std::fs::remove_file(&path);
    }

    #[test]
    fn saves_a_screenshot_as_png() {
        let _com = Com::new();
        let path = temp("shot.png");
        let shown = window(0x00ff00, WS_POPUP, WINDOW_EX_STYLE(0), None, (0, 0, 64, 48));
        let pixels = opaque(Grabber::new(64, 48).unwrap().grab(shown.0 as isize, screen_area(shown)).unwrap());
        unsafe { DestroyWindow(shown).unwrap() };
        assert_eq!(pixels.len(), 64 * 48 * 4);
        save_png(&path, 64, 48, &pixels).unwrap();
        unsafe {
            let factory: IWICImagingFactory =
                CoCreateInstance(&CLSID_WICImagingFactory, None, CLSCTX_INPROC_SERVER).unwrap();
            let decoder = factory
                .CreateDecoderFromFilename(
                    &HSTRING::from(path.as_os_str()),
                    None,
                    windows::Win32::Foundation::GENERIC_READ,
                    WICDecodeMetadataCacheOnDemand,
                )
                .unwrap();
            let (mut width, mut height) = (0, 0);
            decoder.GetFrame(0).unwrap().GetSize(&mut width, &mut height).unwrap();
            assert_eq!((width, height), (64, 48));
        }
        let _ = std::fs::remove_file(&path);
    }

    #[test]
    fn sizes_recordings_evenly_and_within_bounds() {
        assert_eq!(fitted(1170, 2532), (886, 1920));
        assert_eq!(fitted(641, 481), (640, 480));
        let (width, height) = fitted(3000, 1001);
        assert!(width <= 1920 && width % 2 == 0 && height % 2 == 0);
    }

    #[test]
    fn names_files_after_the_moment_without_overwriting() {
        let dir = std::env::temp_dir().join(format!("mirlow-test-names-{}", std::process::id()));
        let first = name_in(&dir, "png").unwrap();
        std::fs::write(&first, b"x").unwrap();
        let second = name_in(&dir, "png").unwrap();
        assert_ne!(first, second);
        assert!(first.file_name().unwrap().to_string_lossy().starts_with("Mirlow "));
        let _ = std::fs::remove_dir_all(&dir);
    }
}
