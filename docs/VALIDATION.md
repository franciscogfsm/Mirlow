# Validating Mirlow with a real iPhone or iPad

Some things can only be confirmed with an Apple device in hand. This is the
checklist to run before a release, and the first time on any new PC. It takes
about ten minutes.

You need: the PC running Mirlow, and an iPhone or iPad on the **same Wi-Fi
network** (not a guest network, no VPN on either device).

## 1. Discovery

1. Open Mirlow. Within a few seconds it should say **Ready to mirror** and show
   the PC's name.
2. On the iPhone, open Control Centre and tap **Screen Mirroring**.
3. **Expected:** the PC's name appears in the list within a few seconds.

If it does not appear, in Mirlow click *Can't see this PC on your iPhone?* and
follow what it says (it checks the firewall and the network type for you).

## 2. Mirroring

1. Tap the PC's name on the iPhone.
2. **Expected:** if Mirlow was tucked away in the notification area, its window
   comes forward. It says *Connecting to (device name)*, then glides to the
   shape of the phone's screen and shows it.
3. Open a few apps and scroll. **Expected:** the picture is smooth and keeps up.

## 3. Sound

1. Play a video with sound (a clip in Photos, or a video in Safari).
2. **Expected:** sound comes from the PC, in step with the picture.

Apps that protect their video (most film and TV services) show a black picture
when mirrored. That is decided by those apps and is expected.

## 4. Rotation

1. With rotation lock off, open Photos and turn the phone sideways.
2. **Expected:** Mirlow's window glides to a landscape shape, and back to
   portrait when the phone is turned upright.

## 5. Full screen and controls

1. Press **F11** (or **F**, or double-click the picture). **Expected:** full
   screen, with the bar fading away after a moment and returning when the mouse
   moves. **Esc** leaves full screen.
2. Drag the window by the picture itself. **Expected:** it moves.
3. Click **Disconnect**. **Expected:** mirroring stops and Mirlow returns to
   *Ready to mirror*; the iPhone shows it is no longer mirroring.

## 6. Ending from the phone, and recovery

1. Mirror again, then on the iPhone tap **Stop Mirroring**. **Expected:** Mirlow
   returns to *Ready to mirror* at its compact size.
2. Mirror again, then turn the phone's Wi-Fi off. **Expected:** within about
   fifteen seconds Mirlow returns to *Ready to mirror* on its own.

## 7. The notification area

1. Close Mirlow's window with **X**. **Expected:** the window goes, the Mirlow
   icon stays next to the clock, and the PC is still listed on the iPhone.
2. Start mirroring from the iPhone. **Expected:** the window reappears.
3. Right-click the icon and choose **Quit Mirlow**. **Expected:** the PC
   disappears from the iPhone's list within a few seconds.

## 8. iPad and Mac

Repeat sections 1 to 4 with an iPad. A Mac can also mirror: in its Control
Centre choose **Screen Mirroring** and pick the PC.

## If something fails

Open **Settings**, turn on **Compatibility mode**, and try again: it rules out
graphics-driver problems. If the receiver stops with an error, Mirlow offers
**Show details**; include that text when reporting a problem.
