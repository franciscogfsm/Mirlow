export const en = {
  brand: {
    name: "Mirlow",
    tagline: "Your iPhone. On your PC. Just like that.",
  },

  app: {
    status: {
      starting: "Getting ready…",
      ready: "Ready",
      connecting: "Connecting…",
      mirroring: "Mirroring",
      audio: "Playing sound",
      recovering: "Reconnecting…",
      error: "Something needs attention",
    },
    waiting: {
      headline: "Ready to mirror",
      nameLabel: "This PC appears as",
      step1: "Open Control Centre on your iPhone",
      step2: "Tap Screen Mirroring",
      step3: "Choose {name}",
      hint: "Your iPhone and this PC need to be on the same Wi‑Fi.",
    },
    starting: {
      headline: "Getting ready",
      body: "Starting the receiver. This only takes a moment.",
    },
    connecting: {
      headline: "Connecting to {device}",
      headlineUnknown: "Connecting",
      body: "Your screen will appear in a moment.",
    },
    mirroring: {
      from: "Mirroring {device}",
      fromUnknown: "Mirroring",
      fullscreen: "Full screen",
      exitFullscreen: "Exit full screen",
      disconnect: "Disconnect",
    },
    audio: {
      headline: "Playing sound from {device}",
      headlineUnknown: "Playing sound",
      body: "To show your screen, tap Screen Mirroring on your iPhone.",
    },
    recovering: {
      headline: "One moment",
      body: "The receiver stopped unexpectedly. Mirlow is starting it again.",
    },
    ended: "Mirroring ended",
    error: {
      headline: "Mirlow couldn't start the receiver",
      engineMissing: "A part of Mirlow is missing. Reinstalling Mirlow will fix this.",
      discovery: "Mirlow couldn't announce this PC on your network. Check that you're connected to Wi‑Fi or Ethernet.",
      crashed: "The receiver keeps stopping. Trying compatibility mode in Settings often helps.",
      unknown: "Something unexpected happened.",
      retry: "Try again",
      details: "Show details",
      hideDetails: "Hide details",
      copy: "Copy details",
      copied: "Copied",
    },
    help: {
      toggle: "Can't see this PC on your iPhone?",
      title: "If this PC doesn't show up",
      sameNetwork: {
        title: "Use the same Wi‑Fi",
        body: "Your iPhone and this PC must be on the same network. Guest networks often keep devices apart.",
      },
      firewall: {
        title: "Allow Mirlow through the firewall",
        body: "Windows may be blocking your iPhone from finding this PC.",
        action: "Allow Mirlow",
        done: "Mirlow is allowed",
        working: "Waiting for Windows…",
        failed: "Windows didn't apply the change. You can try again.",
      },
      publicNetwork: {
        title: "This network is set to Public",
        body: "Windows hides your PC on public networks. If you're at home, set this network to Private in Windows settings.",
        action: "Open network settings",
      },
      noNetwork: {
        title: "This PC isn't connected",
        body: "Connect to Wi‑Fi or Ethernet, then try again.",
      },
      vpn: {
        title: "Turn off any VPN",
        body: "A VPN on your iPhone or PC can stop them from seeing each other.",
      },
      restart: {
        title: "Still nothing?",
        body: "Restart the receiver and look again on your iPhone.",
        action: "Restart receiver",
      },
      network: "Network: {name}",
    },
    settings: {
      title: "Settings",
      open: "Settings",
      close: "Close",
      name: {
        label: "Name",
        description: "How this PC appears on your iPhone.",
        placeholder: "Mirlow",
        save: "Save",
      },
      sound: {
        label: "Play sound",
        description: "Hear your iPhone's audio through this PC.",
      },
      compatibility: {
        label: "Compatibility mode",
        description: "Turn on if the picture is black or keeps freezing. Uses a little more power.",
      },
      theme: {
        label: "Appearance",
        system: "Auto",
        light: "Light",
        dark: "Dark",
      },
      language: {
        label: "Language",
        system: "Auto",
      },
      about: {
        version: "Version {version}",
        licenses: "Open‑source licences",
        source: "Source code",
        website: "Website",
        free: "Free and open source. Your screen never leaves your network.",
        disclaimer:
          "Mirlow is an independent project and is not affiliated with or endorsed by Apple Inc.",
      },
    },
    shortcuts: {
      fullscreen: "Full screen",
      settings: "Settings",
    },
    tray: {
      open: "Open Mirlow",
      quit: "Quit Mirlow",
      ready: "Ready as {name}",
    },
    window: {
      minimize: "Minimise",
      maximize: "Maximise",
      restore: "Restore",
      close: "Close",
    },
  },

  site: {
    meta: {
      title: "Mirror your iPhone to a Windows PC, free — AirPlay receiver | Mirlow",
      description:
        "Free AirPlay receiver for Windows 10 and 11. Mirror your iPhone or iPad screen to your PC over Wi‑Fi, with sound. No app on your phone, no account, no cable.",
      ogAlt: "An iPhone screen appearing on a Windows PC with Mirlow",
    },
    nav: {
      how: "How it works",
      features: "Features",
      faq: "Questions",
      download: "Download",
      github: "GitHub",
      language: "Language",
      skip: "Skip to content",
    },
    hero: {
      eyebrow: "Free · Windows · Open source",
      titleLine1: "Mirror your iPhone",
      titleLine2: "to Windows.",
      titleAccent: "For free.",
      body: "Open Mirlow, tap Screen Mirroring on your iPhone, and your screen is on your PC. Nothing to install on your phone.",
      cta: "Download for Windows — Free",
      ctaShort: "Download — Free",
      promises: ["100% free", "No app on your iPhone", "No cables", "No account"],
      worksWith: "Works over AirPlay with",
      devices: ["iPhone", "iPad", "Mac"],
      requires: "Windows 10 and 11 · 12 MB download",
      sceneLabel:
        "Animation: an iPhone sends its screen wirelessly to a Windows PC, where it appears in the Mirlow window.",
      sceneReady: "Ready to mirror",
      sceneMirroring: "Mirroring",
      sceneSheet: "Screen Mirroring",
      pause: "Pause the animation",
      play: "Play the animation",
      scroll: "Scroll",
    },
    how: {
      eyebrow: "How it works",
      title: "Three taps. That's all.",
      steps: [
        {
          title: "Open Mirlow",
          body: "Your PC becomes discoverable the moment the app opens. There's nothing to set up.",
        },
        {
          title: "Tap Screen Mirroring",
          body: "Swipe down to Control Centre on your iPhone or iPad and choose your PC from the list.",
        },
        {
          title: "See it on your PC",
          body: "Your screen appears with its sound, and follows along as you rotate your phone.",
        },
      ],
    },
    showcase: {
      eyebrow: "The app",
      title: "So simple it barely has a screen.",
      body: "One window. It waits, it mirrors, and it gets out of the way.",
      tabs: {
        waiting: "Waiting",
        mirroring: "Mirroring",
        settings: "Settings",
      },
      captions: {
        waiting: "Mirlow tells you what to do in one sentence.",
        mirroring: "Your screen fills the window. Controls fade away until you need them.",
        settings: "A name, sound, and appearance. That's the whole list.",
      },
    },
    features: {
      eyebrow: "What you get",
      title: "Everything you need. Nothing you don't.",
      items: [
        {
          title: "Wireless mirroring",
          body: "Uses the Screen Mirroring built into your iPhone and iPad. No app, no cable.",
        },
        {
          title: "Sound included",
          body: "Hear your phone's audio through your PC speakers, in step with the picture.",
        },
        {
          title: "Full screen",
          body: "One key takes your phone edge to edge. Portrait and landscape both fit.",
        },
        {
          title: "Private by design",
          body: "Everything stays on your own network. No servers, no account, no tracking.",
        },
        {
          title: "Free, for real",
          body: "No trial, no watermark, no subscription. The code is open for anyone to read.",
        },
      ],
    },
    trust: {
      eyebrow: "Safe to install",
      title: "Don't take our word for it.",
      body: "Mirlow is free because it is open, not because it is selling something. Everything below can be checked by you, or by anyone you trust.",
      items: [
        {
          title: "Open source",
          body: "Every line of Mirlow is public. Anyone can read it, build it and confirm that the download matches.",
          action: "How to get the source",
        },
        {
          title: "Scan it yourself",
          body: "Look up this exact installer on VirusTotal, where dozens of independent antivirus engines examine it.",
          action: "Open the VirusTotal report",
        },
        {
          title: "Nothing leaves your network",
          body: "Mirlow makes no internet connections. No account, no analytics, no updates fetched behind your back.",
          action: "Read the privacy note",
        },
      ],
      checksumLabel: "SHA-256 of Mirlow {version} for Windows",
      checksumHint: "Compare it with the file you downloaded: in PowerShell, run Get-FileHash on the installer.",
      copy: "Copy",
      copied: "Copied",
    },
    faq: {
      eyebrow: "Questions",
      title: "Good to know",
      items: [
        {
          q: "What do I need?",
          a: "A PC with Windows 10 or 11 (64‑bit) and an iPhone or iPad. Both need to be on the same Wi‑Fi or wired network.",
        },
        {
          q: "Do I need to install anything on my iPhone?",
          a: "No. Mirlow works with the Screen Mirroring button that's already in Control Centre.",
        },
        {
          q: "Is it really free?",
          a: "Yes. There's no paid version, no account and no ads. Mirlow is open source under the GPL‑3.0 licence.",
        },
        {
          q: "My PC doesn't appear on my iPhone. What now?",
          a: "Check that both devices are on the same network, then use the “Can't see this PC?” link inside Mirlow. It can allow the app through the Windows firewall for you, which is the usual cause.",
        },
        {
          q: "Can it play films from streaming apps?",
          a: "Mirlow mirrors your screen. Apps that protect their video, such as most film and TV services, will show a black picture when mirrored. That's decided by those apps, not by Mirlow.",
        },
        {
          q: "Does my screen go through the internet?",
          a: "No. Your iPhone sends its screen straight to your PC over your local network. Mirlow has no servers and collects nothing.",
        },
        {
          q: "Does it work with a Mac, or on Mac and Linux?",
          a: "A Mac can mirror to Mirlow the same way an iPhone does. The Mirlow app itself is for Windows only.",
        },
        {
          q: "Is Mirlow made by Apple?",
          a: "No. Mirlow is an independent open‑source project built on UxPlay. It isn't affiliated with, endorsed by or certified by Apple.",
        },
      ],
    },
    finalCta: {
      title: "Your iPhone. On your PC.",
      accent: "Just like that.",
      body: "Free, private, and ready in under a minute.",
      cta: "Download for Windows — Free",
      note: "Windows 10 and 11 · 64‑bit",
    },
    guides: {
      title: "Guides",
      metaTitle: "Guides: mirror an iPhone or iPad to a Windows PC | Mirlow",
      intro: "Short, practical answers about getting an iPhone or iPad screen onto a Windows PC.",
      steps: "Step by step",
      questions: "Common questions",
      more: "More guides",
      all: "All guides",
      ctaTitle: "Try it on your own PC",
      ctaBody: "Mirlow is free and open source, and needs no account.",
    },
    contact: {
      label: "Contact us",
      hint: "A problem, or an idea for a new feature? Send us an email.",
      subject: "Mirlow",
    },
    footer: {
      guides: "Guides",
      privacy: "Privacy",
      licenses: "Licences",
      source: "Source code",
      releases: "All downloads",
      rights: "Free software, released under GPL‑3.0.",
      disclaimer:
        "Mirlow is an independent project. It is not affiliated with, endorsed by or certified by Apple Inc. iPhone, iPad, Mac and AirPlay are trademarks of Apple Inc. Windows is a trademark of the Microsoft group of companies.",
    },
    privacy: {
      title: "Privacy",
      updated: "Last updated: October 2026",
      intro: "The short version: Mirlow doesn't collect anything about you.",
      sections: [
        {
          title: "The app",
          body: "Mirlow receives your iPhone's screen and sound directly over your local network and shows them on your PC. Nothing is recorded, stored or sent anywhere else. The app has no accounts, no analytics and no advertising, and it doesn't need the internet to work.",
        },
        {
          title: "What stays on your PC",
          body: "Mirlow saves your settings (the PC's name, sound, appearance and language) and a pairing key that lets your devices recognise this PC. These files stay in your Windows user folder and are removed when you uninstall.",
        },
        {
          title: "This website",
          body: "This site is a set of static pages. It uses no cookies and no tracking scripts. It remembers your language choice in your browser only. Downloads are served by GitHub, which may log requests under its own privacy policy.",
        },
        {
          title: "Questions",
          body: "Mirlow is open source, so you can check all of this yourself. If something is unclear, open an issue on GitHub.",
        },
      ],
    },
    licenses: {
      title: "Open‑source licences",
      intro:
        "Mirlow is free software. You may use, study, share and change it under the terms of the GNU General Public License, version 3 or later.",
      sections: [
        {
          title: "Mirlow",
          body: "Copyright © the Mirlow contributors. Licensed under GPL‑3.0‑or‑later. It comes with no warranty, to the extent permitted by law.",
        },
        {
          title: "UxPlay",
          body: "Mirroring is powered by UxPlay, an open‑source AirPlay receiver licensed under GPL‑3.0. Mirlow ships a lightly modified build; the exact changes are published as patch files in the Mirlow repository.",
        },
        {
          title: "Bundled libraries",
          body: "The installer includes GStreamer, OpenSSL, libplist, GLib and their dependencies, unmodified, as packaged by the MSYS2 project, and FFmpeg, which we build from its official source with only the decoders Mirlow uses. A full list with versions and licences is installed alongside the app and published with each release.",
        },
        {
          title: "Getting the source",
          body: "The complete source for Mirlow, the UxPlay revision it uses, the patches and the build scripts are in the Mirlow repository. The sources for the bundled libraries are available from the MSYS2 project and, for FFmpeg, from ffmpeg.org, and we will provide them on request for any release we have distributed.",
        },
      ],
      viewSource: "View the source on GitHub",
      back: "Back to home",
    },
    notFound: {
      title: "This page doesn't exist",
      back: "Back to home",
    },
  },
};

export type Dictionary = typeof en;
