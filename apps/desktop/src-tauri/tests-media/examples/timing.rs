use mirlow_media_tests::media::platform::{Com, Grabber, Encoder};
use std::time::Instant;
fn main() {
    let _com = Com::new();
    for (w, h) in [(400, 300), (886, 1920)] {
        let mut g = Grabber::new(w, h).unwrap();
        let t = Instant::now();
        for _ in 0..30 { g.grab((0, 0, w, h)).unwrap(); }
        println!("grab {w}x{h}: {:.1} ms", t.elapsed().as_secs_f64() * 1000.0 / 30.0);
        let path = std::env::temp_dir().join("mirlow-timing.mp4");
        let mut e = Encoder::new(&path, w as u32, h as u32, 30, false).unwrap();
        let frame = g.grab((0, 0, w, h)).unwrap().to_vec();
        let t = Instant::now();
        for i in 0..30 { e.video(&frame, i * 333_333, 333_333).unwrap(); }
        println!("encode {w}x{h}: {:.1} ms", t.elapsed().as_secs_f64() * 1000.0 / 30.0);
        e.finish().unwrap();
        let _ = std::fs::remove_file(&path);
    }
}
