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
};
