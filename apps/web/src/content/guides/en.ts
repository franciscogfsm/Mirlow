import type { Guides } from "./index";

export const en: Guides = {
  iphone: {
    title: "How to mirror your iPhone to a Windows PC",
    short: "Mirror an iPhone to a PC",
    metaTitle: "How to mirror an iPhone to a Windows PC for free, wirelessly",
    description:
      "Step by step: show your iPhone screen on a Windows 10 or 11 PC over Wi-Fi, with sound, with no cable and nothing to install on the phone. Free.",
    lead: "Windows cannot receive an iPhone's screen on its own, but a small free app fixes that. With Mirlow on your PC, the Screen Mirroring button that is already on your iPhone does the rest: no cable, no app on the phone, no account.",
    steps: [
      {
        title: "Install Mirlow on your PC",
        body: "Download Mirlow for Windows 10 or 11 and run the installer. It is free and there is nothing to sign up for.",
      },
      {
        title: "Put both devices on the same network",
        body: "Connect the iPhone to the same Wi-Fi as the PC. A PC plugged into the same router with a cable counts too.",
      },
      {
        title: "Open Mirlow",
        body: "The window says Ready to mirror and shows the name your PC will have on the iPhone.",
      },
      {
        title: "Open Control Centre on the iPhone",
        body: "Swipe down from the top-right corner of the screen. On an iPhone with a Home button, swipe up from the bottom edge.",
      },
      {
        title: "Tap Screen Mirroring and choose your PC",
        body: "It is the button with two overlapping rectangles. Pick the name Mirlow showed you.",
      },
      {
        title: "Your iPhone is on your PC",
        body: "The picture and the sound appear in the Mirlow window, and the picture turns when you rotate the phone. Use the full-screen button to fill the display.",
      },
    ],
    sections: [
      {
        title: "What you need",
        body: [
          "A PC with Windows 10 or Windows 11 (64-bit), an iPhone, and one network that both are connected to. That is the whole list: no cable, no adapter, no Apple TV and no app from the App Store.",
        ],
      },
      {
        title: "How to stop mirroring",
        body: [
          "Open Control Centre again, tap Screen Mirroring and choose Stop Mirroring. You can also press Disconnect in the Mirlow window. Closing the window keeps Mirlow in the notification area, ready for next time.",
        ],
      },
      {
        title: "What it is good for",
        body: [
          "Showing photos to a room, walking someone through an app, following a recipe or a workout on a bigger screen, or simply reading your phone without holding it.",
          "Mirlow shows what the phone shows. It does not control the iPhone from the PC: you still tap and type on the phone itself.",
        ],
      },
    ],
    faq: [
      {
        q: "Can I mirror my iPhone to a PC without a cable?",
        a: "Yes. Mirroring travels over your Wi-Fi network, so there is no USB or HDMI cable involved. The two devices only need to be on the same network.",
      },
      {
        q: "Do I need to install an app on the iPhone?",
        a: "No. Screen Mirroring is part of iOS. The only thing you install is Mirlow, on the PC.",
      },
      {
        q: "Screen mirroring, casting, AirPlay: are they the same thing?",
        a: "People use the words interchangeably. AirPlay is the name of Apple's wireless technology, Screen Mirroring is the button in Control Centre that uses it to send the whole screen, and casting is the everyday word for both. Mirlow is the receiving end on Windows.",
      },
      {
        q: "Does it work on both Windows 10 and Windows 11?",
        a: "Yes, on 64-bit versions of both, on desktops and laptops.",
      },
      {
        q: "Windows warned me when I opened the installer. Is that normal?",
        a: "It can happen. Windows shows a caution for installers that are not yet digitally signed, and Mirlow's is not. You can compare the file's SHA-256 checksum with the one published on the Mirlow home page, and read the source code, before running it.",
      },
    ],
  },

  airplay: {
    title: "A free AirPlay receiver for Windows",
    short: "AirPlay receiver for Windows",
    metaTitle: "Free AirPlay receiver for Windows 10 and 11 (open source)",
    description:
      "Turn a Windows PC into an AirPlay screen-mirroring receiver. Free and open source, with sound, no account and no app on your iPhone, iPad or Mac.",
    lead: "An AirPlay receiver is the thing your iPhone sends its screen to. Windows does not include one, so the Screen Mirroring list on your phone stays empty until you add one. Mirlow is a free, open-source receiver that makes your PC appear in that list.",
    sections: [
      {
        title: "What an AirPlay receiver does",
        body: [
          "When you tap Screen Mirroring, your iPhone looks for receivers on the local network and sends the picture and sound to the one you choose. An Apple TV is one such receiver. With Mirlow open, your Windows PC is another.",
          "Nothing changes on the phone. The receiver announces itself on the network, the phone finds it, and the two talk to each other directly.",
        ],
      },
      {
        title: "Setting it up",
        body: [
          "Install Mirlow on a PC with Windows 10 or 11 and open it. The PC is now discoverable. On your iPhone or iPad, open Control Centre, tap Screen Mirroring and choose the PC. On a Mac, Screen Mirroring is in Control Centre in the menu bar.",
          "You can rename the PC in Mirlow's settings, which is handy when there are several receivers in the same house or office.",
        ],
      },
      {
        title: "What works, and what does not",
        body: [
          "Screen mirroring with sound works, in portrait and in landscape, windowed or full screen.",
          "Apps that protect their video, such as most film and TV services, show a black picture while mirrored. That is the app's decision and Mirlow does not try to get around it.",
          "Mirlow receives. It does not send your Windows screen to an Apple TV or to another device.",
        ],
      },
      {
        title: "Why it is free",
        body: [
          "Mirlow is built on UxPlay, an open-source AirPlay receiver, and is itself published under the GPL-3.0 licence. There is no paid tier, no trial period, no watermark and no advertising, and the app makes no internet connections.",
        ],
      },
    ],
    faq: [
      {
        q: "Does Windows have AirPlay built in?",
        a: "No. Windows has its own wireless display feature, based on Miracast, which iPhones do not use. To receive AirPlay you need a receiver app such as Mirlow.",
      },
      {
        q: "Is an AirPlay receiver safe to run?",
        a: "Mirlow only listens on your local network, has no account and sends nothing to the internet. Its source code is public and the installer's checksum is published, so both can be checked.",
      },
      {
        q: "Do the iPhone and the PC have to be on the same Wi-Fi?",
        a: "They have to be on the same local network. The PC may be connected by cable as long as it is the same router. Guest networks usually keep devices apart, so avoid those.",
      },
      {
        q: "Is Mirlow made or approved by Apple?",
        a: "No. Mirlow is an independent open-source project. It is not affiliated with, endorsed by or certified by Apple. AirPlay is a trademark of Apple Inc.",
      },
    ],
  },

  ipad: {
    title: "How to mirror your iPad to a Windows PC",
    short: "Mirror an iPad to a PC",
    metaTitle: "How to mirror an iPad to a Windows PC or laptop for free",
    description:
      "Show your iPad screen on a Windows 10 or 11 PC over Wi-Fi with the Screen Mirroring button iPadOS already has. Free, with sound, no cable, no app on the iPad.",
    lead: "An iPad mirrors to a Windows PC the same way an iPhone does: with the Screen Mirroring button in Control Centre, and a receiver on the PC. Mirlow is that receiver, and it is free.",
    steps: [
      {
        title: "Install and open Mirlow on the PC",
        body: "Download Mirlow for Windows 10 or 11, run the installer and open the app. It shows the name your PC will have on the iPad.",
      },
      {
        title: "Connect the iPad to the same network",
        body: "The iPad and the PC must be on the same Wi-Fi, or the PC on the same router by cable.",
      },
      {
        title: "Open Control Centre on the iPad",
        body: "Swipe down from the top-right corner of the screen.",
      },
      {
        title: "Tap Screen Mirroring and choose your PC",
        body: "The iPad's screen appears in the Mirlow window, with its sound.",
      },
    ],
    sections: [
      {
        title: "Landscape suits a PC screen",
        body: [
          "Turn the iPad sideways and the picture fills most of a monitor; Mirlow follows the rotation. In full screen the iPad's picture is scaled to fit the display without being stretched.",
        ],
      },
      {
        title: "Things people use it for",
        body: [
          "Putting handwritten notes or a drawing on a larger screen while you work on the iPad, showing slides or a document to a room, or letting a class or a family see what is on the tablet.",
          "Mirroring is one-way. The PC shows the iPad's screen, and you keep using the iPad by touch or with a pencil; the PC's mouse and keyboard do not control it.",
        ],
      },
    ],
    faq: [
      {
        q: "Does it work with every iPad?",
        a: "It works with iPads that have Screen Mirroring in Control Centre, which covers iPad, iPad mini, iPad Air and iPad Pro models on current versions of iPadOS.",
      },
      {
        q: "Can I use my PC monitor as a second screen for the iPad?",
        a: "Mirlow shows a copy of the iPad's screen. It does not extend the iPad's desktop onto the monitor as a separate display.",
      },
      {
        q: "Do I need a cable or an adapter?",
        a: "No. Mirroring goes over your local network. You do not need a USB-C or Lightning cable, or an HDMI adapter.",
      },
      {
        q: "Is the sound mirrored too?",
        a: "Yes. The iPad's audio plays through the PC's speakers. You can turn that off in Mirlow's settings if you would rather keep the sound on the iPad.",
      },
    ],
  },

  "not-showing": {
    title: "Your PC is not showing in Screen Mirroring: how to fix it",
    short: "PC not showing in Screen Mirroring",
    metaTitle: "PC not showing up in Screen Mirroring on iPhone? How to fix it",
    description:
      "If your Windows PC does not appear in the Screen Mirroring list on your iPhone or iPad, check these causes in order: network, firewall, network type and VPN.",
    lead: "When the Screen Mirroring list on your iPhone is empty, or your PC is missing from it, the phone and the PC cannot see each other on the network. It is almost always one of four things, and each takes a moment to check.",
    steps: [
      {
        title: "Check both devices are on the same network",
        body: "The iPhone and the PC must use the same router. A phone on mobile data, or on a guest network, will not find the PC. Guest networks are designed to keep devices apart.",
      },
      {
        title: "Allow Mirlow through the Windows firewall",
        body: "In Mirlow, open the link \"Can't see this PC on your iPhone?\" and press Allow Mirlow. Windows asks you to confirm. A blocked firewall is the most common cause.",
      },
      {
        title: "Set the network to Private",
        body: "Windows hides your PC on networks marked Public. If you are at home or at work on a network you trust, the same help panel in Mirlow opens the Windows network settings, where you can switch it to Private.",
      },
      {
        title: "Turn off any VPN",
        body: "A VPN on the iPhone or on the PC often routes traffic away from the local network. Pause it and look again.",
      },
      {
        title: "Restart the receiver and look again",
        body: "Press Restart receiver in Mirlow's help panel, then close and reopen Control Centre on the iPhone so that it searches again.",
      },
    ],
    sections: [
      {
        title: "If it still does not appear",
        body: [
          "Turn Wi-Fi off and on again on the iPhone, and restart the router if you can. Some routers, especially on shared or office networks, have a setting often called client isolation or AP isolation that stops devices from talking to each other; it has to be off for any kind of screen mirroring to work.",
          "On a work or school network you may not be able to change these things. In that case mirroring is being blocked on purpose by the network, not by your phone or PC.",
        ],
      },
      {
        title: "The PC appears, but will not connect",
        body: [
          "If the PC is in the list and choosing it does nothing, restart the receiver from Mirlow and try again. If the picture is black once connected, turn on Compatibility mode in Mirlow's settings.",
        ],
      },
    ],
    faq: [
      {
        q: "Why is the Screen Mirroring list empty on my iPhone?",
        a: "The list only shows receivers the iPhone can find on its current network. An empty list means there is no receiver running, or that something between the two devices, usually a firewall or a guest network, is stopping the phone from finding it.",
      },
      {
        q: "Does the PC have to be on Wi-Fi?",
        a: "No. A PC connected by Ethernet works, as long as it is on the same router as the iPhone's Wi-Fi.",
      },
      {
        q: "Does Bluetooth need to be on?",
        a: "Mirroring itself goes over the network, not Bluetooth. What matters is that both devices are on the same network.",
      },
      {
        q: "It worked yesterday and not today. What changed?",
        a: "Usually the network: the phone joined a different Wi-Fi, a VPN was switched on, or Windows marked a new network as Public. Go through the steps above in order.",
      },
    ],
  },

  "black-screen": {
    title: "Black screen when mirroring your iPhone to a PC",
    short: "Black screen when mirroring",
    metaTitle: "Black screen when mirroring an iPhone to a PC: why, and what to do",
    description:
      "A black picture while screen mirroring has two usual causes: the app protects its video, or the PC's video decoder is struggling. Here is how to tell which.",
    lead: "A black picture while mirroring means one of two things. Either the app on your iPhone refuses to be mirrored, which no receiver can change, or the PC is having trouble decoding the video, which a setting fixes. Telling them apart takes ten seconds.",
    sections: [
      {
        title: "First, find out which one it is",
        body: [
          "Go to the Home Screen on your iPhone while mirroring. If the Home Screen shows on the PC and only one app turns black, that app is protecting its video. If everything is black, including the Home Screen, the problem is on the PC.",
        ],
      },
      {
        title: "Only one app is black: protected video",
        body: [
          "Most film, TV and live-sport apps mark their video as protected. iOS then sends a black picture to anything that mirrors or records the screen, often while the sound and the subtitles carry on. It is the same reason a screen recording of those apps comes out black.",
          "This is a decision made by those apps and enforced by the iPhone. Mirlow does not try to get around it, and neither can any other mirroring receiver. Menus, photos, your own videos, browsers, games and most other apps mirror normally.",
        ],
      },
      {
        title: "Everything is black: turn on Compatibility mode",
        body: [
          "Mirlow normally asks the PC's graphics card to decode the video. On some graphics drivers that goes wrong, and the result is a black or frozen picture. Open Mirlow's settings and turn on Compatibility mode, which decodes the video in software instead. It uses a little more power and works on practically any PC.",
          "Updating the graphics driver often fixes the original problem, after which Compatibility mode can be turned off again.",
        ],
      },
      {
        title: "The picture freezes or breaks up",
        body: [
          "That is usually the Wi-Fi rather than the PC. Move closer to the router, or connect the PC by cable, and avoid heavy downloads on the same network while mirroring.",
        ],
      },
    ],
    faq: [
      {
        q: "Why is a streaming app black when I mirror, but everything else works?",
        a: "The app protects its video against copying, so iOS blanks it for mirroring and screen recording. It is not a fault in your phone, your PC or Mirlow.",
      },
      {
        q: "Is there a setting that unblocks protected apps?",
        a: "No. Mirlow does not bypass copy protection and has no setting that would.",
      },
      {
        q: "I hear sound but see no picture. What is that?",
        a: "If it happens in one app only, it is protected video. If it happens everywhere, turn on Compatibility mode in Mirlow's settings.",
      },
      {
        q: "Does Compatibility mode lower the quality?",
        a: "No. The picture is the same; the PC simply does the decoding on its processor instead of its graphics card, which uses a little more power.",
      },
    ],
  },

  "built-in": {
    title: "Does Windows support AirPlay?",
    short: "Does Windows support AirPlay?",
    metaTitle: "Does Windows 11 support AirPlay? Miracast, Phone Link and what works",
    description:
      "Windows cannot receive an iPhone's screen by itself. Why Miracast, Phone Link and a USB cable do not mirror an iPhone, and the free way that does.",
    lead: "Not on its own. Windows 10 and 11 can receive a wireless display, but they speak a different language from the iPhone. Here is what each built-in option actually does, and the simple way to get an iPhone's screen onto a PC.",
    sections: [
      {
        title: "Wireless display in Windows is Miracast",
        body: [
          "Windows has a feature for projecting to a PC, found in the settings under projecting to this PC. It is built on Miracast, the standard used by many Android phones and Windows laptops. iPhones and iPads do not support Miracast, so they never see a Windows PC as a place to mirror to.",
        ],
      },
      {
        title: "Phone Link does not mirror an iPhone",
        body: [
          "Phone Link, Microsoft's app for connecting a phone to Windows, can show an iPhone's calls, messages and notifications on Windows 11. At the time of writing it does not show the iPhone's screen. Its screen feature is for certain Android phones only.",
        ],
      },
      {
        title: "A USB cable gives you files, not the screen",
        body: [
          "Plug an iPhone into a PC and Windows shows its photos and videos as files. Apple's software for Windows can back up and sync the phone. Neither puts the live screen on the PC.",
        ],
      },
      {
        title: "What works: an AirPlay receiver",
        body: [
          "The iPhone's Screen Mirroring button sends the screen over AirPlay, so the PC needs something that receives AirPlay. Mirlow is a free, open-source receiver for Windows 10 and 11: open it, and the PC appears in the Screen Mirroring list on your iPhone, iPad or Mac.",
          "It works over your local network, with sound, with nothing to install on the phone.",
        ],
      },
    ],
    faq: [
      {
        q: "Can I AirPlay from an iPhone to Windows 11?",
        a: "Yes, once the PC has an AirPlay receiver such as Mirlow running. Windows 11 does not include one.",
      },
      {
        q: "Can an iPhone use Miracast?",
        a: "No. iPhones and iPads use AirPlay for wireless mirroring and do not support Miracast.",
      },
      {
        q: "Do I need an Apple TV?",
        a: "No. An Apple TV is one kind of AirPlay receiver; a PC running Mirlow is another.",
      },
      {
        q: "Can I send my Windows screen to an iPhone or an Apple TV with Mirlow?",
        a: "No. Mirlow receives a screen from an Apple device. It does not send the PC's screen anywhere.",
      },
    ],
  },

  audio: {
    title: "How to play your iPhone's sound through your PC speakers",
    short: "Play iPhone audio on a PC",
    metaTitle: "Play iPhone audio through PC speakers with AirPlay, free",
    description:
      "Send music, podcasts or any sound from an iPhone or iPad to the speakers of a Windows PC over Wi-Fi with AirPlay. Free, with no cable and no Bluetooth pairing.",
    lead: "A PC with good speakers makes a fine AirPlay speaker. With Mirlow open on Windows, your iPhone can send just its sound to the PC, without showing its screen, the same way it would to a wireless speaker.",
    steps: [
      {
        title: "Open Mirlow on the PC",
        body: "Install Mirlow for Windows 10 or 11 and open it. Check that Play sound is switched on in its settings; it is by default.",
      },
      {
        title: "Start playing something on the iPhone",
        body: "Music, a podcast, a video: anything with sound. The iPhone must be on the same network as the PC.",
      },
      {
        title: "Open Control Centre and tap the AirPlay icon",
        body: "It is the small icon of circles with a triangle in the corner of the playback controls. Many apps show the same icon on their own player screen.",
      },
      {
        title: "Choose your PC",
        body: "The sound moves to the PC's speakers and Mirlow shows that it is playing sound from your iPhone. To move it back, open the same list and choose iPhone.",
      },
    ],
    sections: [
      {
        title: "Sound with the screen, or sound alone",
        body: [
          "When you mirror the screen, its sound comes along automatically. The steps above are for when you want the sound only, and would rather keep the phone's screen to yourself.",
          "If you prefer the opposite, a mirrored picture with the sound staying on the phone, switch off Play sound in Mirlow's settings.",
        ],
      },
      {
        title: "Why not Bluetooth?",
        body: [
          "Bluetooth works when the PC supports receiving audio, which many do not without extra setup. AirPlay goes over your Wi-Fi network instead, so there is no pairing and the phone can be anywhere in the house that the network reaches.",
        ],
      },
    ],
    faq: [
      {
        q: "Can I use my PC as an AirPlay speaker?",
        a: "Yes. While Mirlow is open, the PC appears among the AirPlay speakers on your iPhone, iPad or Mac.",
      },
      {
        q: "Which sound comes out of the PC?",
        a: "Whatever the iPhone would have played: music, videos, games. Phone calls stay on the phone.",
      },
      {
        q: "There is no sound when I mirror. What should I check?",
        a: "That Play sound is on in Mirlow's settings, that the PC's volume is up and the right output is selected in Windows, and that the iPhone's volume is not at zero.",
      },
      {
        q: "Does it cost anything?",
        a: "No. Mirlow is free and open source, with no account and no advertising.",
      },
    ],
  },

  lag: {
    title: "Screen mirroring is laggy or choppy: how to make it smooth",
    short: "Fix laggy screen mirroring",
    metaTitle: "iPhone screen mirroring to PC is laggy or choppy? How to fix it",
    description:
      "Stutter, delay or a blocky picture while mirroring an iPhone or iPad to a Windows PC is nearly always the network. Six things to check, most effective first.",
    lead: "Mirroring sends live video across your network many times a second, so anything that slows the network shows up at once as stutter, blocks or delay. The fixes are simple, and the first two solve most cases.",
    steps: [
      {
        title: "Connect the PC to the router with a cable",
        body: "This is the biggest single improvement. With the PC on Ethernet, only the phone's half of the journey is wireless.",
      },
      {
        title: "Move closer to the router, and use the 5 GHz band",
        body: "Walls and distance cut Wi-Fi speed sharply. If your router has separate 2.4 GHz and 5 GHz networks, put the iPhone, and the PC if it is wireless, on the 5 GHz one.",
      },
      {
        title: "Pause heavy use of the network",
        body: "Large downloads, cloud backups and video streaming on other devices compete with the mirrored picture.",
      },
      {
        title: "Turn off any VPN",
        body: "A VPN on the phone or the PC can send local traffic the long way round, or block it.",
      },
      {
        title: "Check Compatibility mode",
        body: "If Compatibility mode is on in Mirlow's settings and you do not need it, turn it off, so the graphics card does the decoding. If the picture freezes with it off, turn it on.",
      },
      {
        title: "Give the PC room to work",
        body: "On a laptop, plug in the charger and leave battery saver off. Close programs that keep the processor or the graphics card busy.",
      },
    ],
    sections: [
      {
        title: "A little delay is normal",
        body: [
          "The phone has to capture, compress and send each frame, and the PC has to decode and show it. On a good network the delay is small enough for browsing, photos, video and presentations. Games that depend on split-second timing are better played looking at the phone.",
        ],
      },
      {
        title: "Blocks and smearing mean lost data",
        body: [
          "When the picture breaks into squares for a moment and then recovers, some of the video did not arrive in time. That points at the Wi-Fi signal rather than at the PC, so the first two steps are the ones to try.",
        ],
      },
    ],
    faq: [
      {
        q: "Does a faster internet connection help?",
        a: "No. Mirroring never leaves your home network, so your internet speed does not matter. What matters is the Wi-Fi between the phone, the router and the PC.",
      },
      {
        q: "Is a mesh network or a Wi-Fi extender a problem?",
        a: "It can be, when the phone and the PC are connected to different units and the link between those units is weak. Try with both devices near the main router.",
      },
      {
        q: "The sound and the picture are out of step. What can I do?",
        a: "Stop mirroring and start it again, so that they line up afresh. If they keep drifting apart, the network is dropping data, so go through the steps above.",
      },
      {
        q: "Does the picture quality depend on my monitor?",
        a: "Mirlow asks the iPhone for a picture sized to your screen, and the iPhone decides what it sends. A sharper picture also needs more of the network, which is one more reason to prefer a cable for the PC.",
      },
    ],
  },

  "no-wifi": {
    title: "Mirroring an iPhone to a PC without Wi-Fi, or with a USB cable",
    short: "Mirror without Wi-Fi or with USB",
    metaTitle: "Mirror an iPhone to a PC without Wi-Fi or with USB: what is possible",
    description:
      "Screen mirroring needs a local network, not the internet. What works without Wi-Fi or an internet connection, and why a USB cable or Bluetooth will not do it.",
    lead: "Screen mirroring needs the iPhone and the PC to be on the same local network. It does not need the internet. That difference answers most questions about mirroring without Wi-Fi, and about cables.",
    sections: [
      {
        title: "Without internet: yes",
        body: [
          "The picture goes straight from the phone to the PC through your router and never touches the internet. A router with no internet connection at all, such as an old one you have in a drawer or a small travel router, is enough. Connect both devices to it and mirror as usual.",
        ],
      },
      {
        title: "Without Wi-Fi on the PC: yes",
        body: [
          "The PC does not need Wi-Fi. Plugged into the router by Ethernet cable, it is on the same network as the phone's Wi-Fi, and mirroring is usually smoother that way.",
        ],
      },
      {
        title: "Without any network: no",
        body: [
          "The iPhone finds receivers by looking on the network it is connected to. With no network between the two devices, the PC cannot appear in the Screen Mirroring list.",
          "Some people connect the PC to the iPhone's Personal Hotspot to make a network of two. Whether the phone then lists the PC depends on the phone and the version of iOS; we do not promise it works, and a router is the dependable choice.",
        ],
      },
      {
        title: "With a USB cable: not with Mirlow",
        body: [
          "Mirlow receives the screen wirelessly, the way an Apple TV does, and does not mirror over USB. Plugging the iPhone into the PC gives Windows access to its photos and lets it charge, nothing more.",
        ],
      },
      {
        title: "With Bluetooth: no",
        body: [
          "Bluetooth is far too slow for live video. Screen mirroring does not use it to carry the picture.",
        ],
      },
    ],
    faq: [
      {
        q: "Does screen mirroring use mobile data?",
        a: "No. Mirroring to a PC on the same network stays on that network. Apps you use while mirroring use data as they normally would.",
      },
      {
        q: "Can I mirror in a hotel, or on public Wi-Fi?",
        a: "Often not. Hotel and public networks usually stop devices from seeing each other. A small travel router of your own gets round that.",
      },
      {
        q: "Do the phone and the PC have to be on the same Wi-Fi name?",
        a: "They have to be on the same network, which normally means the same router. Its 2.4 GHz and 5 GHz names are the same network; its guest network is not.",
      },
      {
        q: "Is there a wired way to show an iPhone on a screen?",
        a: "Apple sells adapters that connect an iPhone to a monitor or TV by HDMI. That goes to a display's HDMI input, not into Windows.",
      },
    ],
  },

  safe: {
    title: "Is screen mirroring safe?",
    short: "Is screen mirroring safe?",
    metaTitle: "Is screen mirroring an iPhone to a PC safe and private?",
    description:
      "What screen mirroring shares and what it does not, who can connect to your PC, and five habits for mirroring an iPhone to a Windows PC privately.",
    lead: "Mirroring shows your screen. It does not hand over your phone. Knowing exactly what is shared, and with whom, makes it easy to use without surprises.",
    sections: [
      {
        title: "What the PC receives",
        body: [
          "The picture on your iPhone's screen and its sound, and nothing else. The PC gets no access to your photos, messages, passwords or files, and cannot control the phone. When you stop mirroring, it receives nothing.",
          "Everything on the screen is shown, though, including notifications that pop up and anything you type in view. Turn on a Focus such as Do Not Disturb before mirroring in front of other people.",
        ],
      },
      {
        title: "Where the picture travels",
        body: [
          "From the phone to the PC across your local network. It does not go through the internet or through any server. Mirlow has no servers, no account and no analytics, and does not record or save what it shows.",
        ],
      },
      {
        title: "Who can connect to your PC",
        body: [
          "While Mirlow is open, your PC is listed as a receiver for devices on the same network, and someone on that network could send their screen to it. They would be showing you their screen; they would not gain access to your PC.",
          "On a home network that means the people you live with. On a shared or public network, quit Mirlow from its icon in the notification area when you are not using it.",
        ],
      },
      {
        title: "Five good habits",
        body: [
          "Mirror on networks you trust. Turn on Do Not Disturb first. Stop mirroring before opening your banking app or your passwords. Quit Mirlow when you are finished on a shared network. Download Mirlow only from its own site or its GitHub page, and compare the checksum if in doubt.",
        ],
      },
    ],
    faq: [
      {
        q: "Can someone see my iPhone screen without my knowing?",
        a: "Mirroring starts only when you choose a receiver in Control Centre on your own phone, and iOS shows an indicator at the top of the screen for as long as it lasts.",
      },
      {
        q: "Is Mirlow itself safe to install?",
        a: "Its source code is public, it makes no internet connections, and the checksum of each installer is published so you can confirm the file is the genuine one. The installer is not yet digitally signed, so Windows may show a caution when you open it.",
      },
      {
        q: "Why does Mirlow need a firewall permission?",
        a: "So that your iPhone can find and reach the PC on your local network. The permission covers the receiver only.",
      },
      {
        q: "Does Mirlow collect any data?",
        a: "No. There is nothing to send it to: no account, no telemetry, no advertising.",
      },
    ],
  },
};
