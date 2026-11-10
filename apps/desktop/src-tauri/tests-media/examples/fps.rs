use mirlow_media_tests::media::{fitted, platform::Com, record, Picture};
use std::sync::atomic::AtomicBool;
use std::time::{Duration, Instant};
use windows::core::HSTRING;
use windows::Win32::Media::MediaFoundation::*;
fn main() {
    let _com = Com::new();
    let path = std::env::temp_dir().join("mirlow-fps.mp4");
    let _ = std::fs::remove_file(&path);
    let (w, h) = fitted(886, 1920);
    let mut started = None;
    let source = move || {
        if started.get_or_insert_with(Instant::now).elapsed() < Duration::from_secs(3) { Picture::Shown((0, 0, 886, 1440)) } else { Picture::Gone }
    };
    record(&path, w, h, source, &AtomicBool::new(false)).unwrap();
    unsafe {
        MFStartup(MF_VERSION, MFSTARTUP_FULL).unwrap();
        let reader = MFCreateSourceReaderFromURL(&HSTRING::from(path.as_os_str()), None).unwrap();
        let stream = MF_SOURCE_READER_FIRST_VIDEO_STREAM.0 as u32;
        let mut frames = 0;
        loop {
            let (mut flags, mut sample) = (0u32, None);
            reader.ReadSample(stream, 0, None, Some(&mut flags), None, Some(&mut sample)).unwrap();
            if flags & MF_SOURCE_READERF_ENDOFSTREAM.0 as u32 != 0 { break; }
            if sample.is_some() { frames += 1; }
        }
        let size = std::fs::metadata(&path).unwrap().len();
        println!("{w}x{h}: {frames} frames in 3 s = {:.1} fps, {:.1} MB", frames as f64 / 3.0, size as f64 / 1e6);
    }
    let _ = std::fs::remove_file(&path);
}
