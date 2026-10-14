//! Finds the phone's screen inside a frame padded with black bars.
//!
//! Many Android phones, Samsung's among them, always send a landscape stream
//! over Miracast. Held upright, the phone's screen sits in the middle of it
//! between two black bars. Shown as it is, the picture would be a narrow strip
//! in a wide window, and turning the phone would change nothing Windows can
//! report. So small copies of the frames are looked at a few times a second to
//! find where the bars end, and only that part is shown.
//!
//! An app with a black background looks like a bar too. Two rules keep it
//! from being cut away: bars from a phone are always centred, and a smaller
//! picture is only believed once it has been seen for a moment, while a larger
//! one is shown at once.

/// A part of a frame, in pixels.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Rect {
    pub x: u32,
    pub y: u32,
    pub width: u32,
    pub height: u32,
}

impl Rect {
    pub fn full(width: u32, height: u32) -> Self {
        Self { x: 0, y: 0, width, height }
    }

    fn right(&self) -> u32 {
        self.x + self.width
    }

    fn bottom(&self) -> u32 {
        self.y + self.height
    }

    fn contains(&self, other: &Rect) -> bool {
        self.x <= other.x && self.y <= other.y && self.right() >= other.right() && self.bottom() >= other.bottom()
    }

    /// The same within `slack` pixels on every side.
    fn near(&self, other: &Rect, slack: u32) -> bool {
        self.x.abs_diff(other.x) <= slack
            && self.y.abs_diff(other.y) <= slack
            && self.right().abs_diff(other.right()) <= slack
            && self.bottom().abs_diff(other.bottom()) <= slack
    }
}

/// A pixel counts as black when no channel is brighter than this. Bars are
/// pure black, but video compression leaves a little noise in them.
const DARK: u8 = 24;

/// The part of a BGRA image that is not black bars, in the image's pixels.
/// None when the whole image is black, which says nothing about where bars are.
pub fn content(pixels: &[u8], width: u32, height: u32, stride: usize) -> Option<Rect> {
    let (w, h) = (width as usize, height as usize);
    if w == 0 || h == 0 || pixels.len() < stride * (h - 1) + w * 4 {
        return None;
    }
    let lit = |x: usize, y: usize| {
        let at = y * stride + x * 4;
        pixels[at] > DARK || pixels[at + 1] > DARK || pixels[at + 2] > DARK
    };
    // A line belongs to the picture when more than a sliver of it is lit, so a
    // stray bright pixel in a bar does not count.
    let column = |x: usize, top: usize, bottom: usize| (top..bottom).filter(|&y| lit(x, y)).count() > (bottom - top) / 100;
    let row = |y: usize, left: usize, right: usize| (left..right).filter(|&x| lit(x, y)).count() > (right - left) / 100;

    let left = (0..w).find(|&x| column(x, 0, h))?;
    let right = (left..w).rev().find(|&x| column(x, 0, h)).map_or(w, |x| x + 1);
    let top = (0..h).find(|&y| row(y, left, right)).unwrap_or(0);
    let bottom = (top..h).rev().find(|&y| row(y, left, right)).map_or(h, |y| y + 1);
    Some(Rect { x: left as u32, y: top as u32, width: (right - left) as u32, height: (bottom - top) as u32 })
}

/// How many measurements in a row must agree before the picture shrinks.
const SETTLE: u32 = 3;

/// Decides, from measurement to measurement, which part of the frame to show.
#[derive(Debug, Default)]
pub struct Framing {
    shown: Option<Rect>,
    pending: Option<(Rect, u32)>,
}

impl Framing {
    /// The part of the frame being shown, once anything has been measured.
    pub fn shown(&self) -> Option<Rect> {
        self.shown
    }

    /// Takes a measurement of a small copy of the frame (`sample` pixels wide
    /// and high) and returns the part of the full frame (`frame`) to show.
    pub fn update(&mut self, found: Option<Rect>, sample: (u32, u32), frame: (u32, u32)) -> Rect {
        let full = Rect::full(frame.0, frame.1);
        let Some(found) = found else {
            // All black: the phone's screen is off or between apps.
            return self.shown.unwrap_or(full);
        };
        let candidate = scale(centred(found, sample), sample, frame);
        let slack = frame.0.max(frame.1) / 100;

        let Some(shown) = self.shown else {
            self.shown = Some(candidate);
            return candidate;
        };
        if candidate.near(&shown, slack) {
            self.pending = None;
        } else if candidate.contains(&shown) {
            // More of the picture: never wrong to show it.
            self.pending = None;
            self.shown = Some(candidate);
        } else {
            let seen = match self.pending {
                Some((pending, count)) if pending.near(&candidate, slack) => count + 1,
                _ => 1,
            };
            if seen >= SETTLE {
                self.pending = None;
                self.shown = Some(candidate);
            } else {
                self.pending = Some((candidate, seen));
            }
        }
        self.shown.unwrap_or(full)
    }
}

/// Keeps the bars only along an axis where they are the same on both sides
/// and wide enough to be bars at all; otherwise shows that axis in full.
fn centred(found: Rect, sample: (u32, u32)) -> Rect {
    let axis = |start: u32, length: u32, total: u32| {
        let before = start;
        let after = total - (start + length);
        let tolerance = (total / 50).max(2);
        if before.abs_diff(after) <= tolerance && before + after > total / 25 {
            (start, length)
        } else {
            (0, total)
        }
    };
    let (x, width) = axis(found.x, found.width, sample.0);
    let (y, height) = axis(found.y, found.height, sample.1);
    Rect { x, y, width, height }
}

/// From the small copy's pixels to the full frame's, rounding inwards so no
/// sliver of bar is left at the edges.
fn scale(rect: Rect, sample: (u32, u32), frame: (u32, u32)) -> Rect {
    if rect == Rect::full(sample.0, sample.1) {
        return Rect::full(frame.0, frame.1);
    }
    let along = |start: u32, length: u32, from: u32, to: u32| {
        if start == 0 && length == from {
            return (0, to);
        }
        let first = (u64::from(start) * u64::from(to)).div_ceil(u64::from(from)) as u32;
        let end = (u64::from(start + length) * u64::from(to) / u64::from(from)) as u32;
        // Even sizes, which video surfaces prefer.
        let first = first + (first & 1);
        let end = (end - (end & 1)).max(first + 2).min(to);
        (first, end - first)
    };
    let (x, width) = along(rect.x, rect.width, sample.0, frame.0);
    let (y, height) = along(rect.y, rect.height, sample.1, frame.1);
    Rect { x, y, width, height }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// A black BGRA image with a lit rectangle in it.
    fn image(width: u32, height: u32, lit: Rect) -> Vec<u8> {
        let mut pixels = vec![0u8; (width * height * 4) as usize];
        for y in lit.y..lit.y + lit.height {
            for x in lit.x..lit.x + lit.width {
                let at = ((y * width + x) * 4) as usize;
                pixels[at..at + 4].copy_from_slice(&[40, 30, 90, 255]);
            }
        }
        pixels
    }

    #[test]
    fn finds_a_phone_between_bars() {
        let phone = Rect { x: 140, y: 0, width: 200, height: 270 };
        let pixels = image(480, 270, phone);
        assert_eq!(content(&pixels, 480, 270, 480 * 4), Some(phone));
    }

    #[test]
    fn all_black_says_nothing() {
        let pixels = vec![0u8; 480 * 270 * 4];
        assert_eq!(content(&pixels, 480, 270, 480 * 4), None);
    }

    #[test]
    fn a_stray_pixel_is_not_the_picture() {
        let phone = Rect { x: 140, y: 0, width: 200, height: 270 };
        let mut pixels = image(480, 270, phone);
        let at = (100 * 480 + 10) * 4;
        pixels[at..at + 3].copy_from_slice(&[255, 255, 255]);
        assert_eq!(content(&pixels, 480, 270, 480 * 4), Some(phone));
    }

    #[test]
    fn crops_centred_bars_from_the_start() {
        let mut framing = Framing::default();
        let found = Rect { x: 140, y: 0, width: 200, height: 270 };
        let shown = framing.update(Some(found), (480, 270), (1920, 1080));
        assert_eq!(shown, Rect { x: 560, y: 0, width: 800, height: 1080 });
    }

    #[test]
    fn ignores_dark_on_one_side_only() {
        let mut framing = Framing::default();
        let found = Rect { x: 0, y: 0, width: 300, height: 270 };
        assert_eq!(framing.update(Some(found), (480, 270), (1920, 1080)), Rect::full(1920, 1080));
    }

    #[test]
    fn grows_at_once_but_shrinks_only_when_steady() {
        let mut framing = Framing::default();
        let upright = Rect { x: 140, y: 0, width: 200, height: 270 };
        let full = Rect::full(480, 270);
        let cropped = framing.update(Some(upright), (480, 270), (1920, 1080));

        // Turned sideways: the whole frame, straight away.
        assert_eq!(framing.update(Some(full), (480, 270), (1920, 1080)), Rect::full(1920, 1080));

        // Upright again, or an app with a black background: only once it stays.
        for _ in 1..SETTLE {
            assert_eq!(framing.update(Some(upright), (480, 270), (1920, 1080)), Rect::full(1920, 1080));
        }
        assert_eq!(framing.update(Some(upright), (480, 270), (1920, 1080)), cropped);
    }

    #[test]
    fn a_black_screen_keeps_the_picture() {
        let mut framing = Framing::default();
        let upright = Rect { x: 140, y: 0, width: 200, height: 270 };
        let cropped = framing.update(Some(upright), (480, 270), (1920, 1080));
        assert_eq!(framing.update(None, (480, 270), (1920, 1080)), cropped);
    }
}
