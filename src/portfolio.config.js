/*
 * Portfolio content and quick settings
 * ------------------------------------
 * Edit this file when identity, links, contact details, app labels, intro
 * copy, or user-facing timing should change. Rendering algorithms, geometry,
 * reducer internals, and low-level audio synthesis intentionally stay beside
 * their implementations.
 */

const profile = {
  name: "Salah",
  greeting: "Hello, welcome to my interactive website :D",
  location: "between Cairo and Alexandria, Egypt",
  tags: [],
};

export const portfolioConfig = {
  profile,

  site: {
    lang: "en",
    locale: "en_US",
    url: "https://salah.qzz.io/",
    domainLabel: "salah.qzz.io",
    title: "Salah — Interactive Portfolio",
    description:
      "A tiny 3D world that boots into Salah’s interactive portfolio, résumé, GitHub, and contact details.",
    author: profile.name,
    themeColor: "#0d0714",
    backgroundColor: "#0d0714",
    colorScheme: "dark",
    robots: "index, follow, max-image-preview:large",
    referrerPolicy: "strict-origin-when-cross-origin",
    socialImage: {
      path: "og-image.png",
      width: 1200,
      height: 630,
      type: "image/png",
      alt:
        "Prismatic line-art portrait of Salah beside the words Hello, I’m Salah.",
    },
    pwa: {
      name: "Salah — Interactive Portfolio",
      shortName: "Salah",
      display: "standalone",
      orientation: "any",
      categories: ["portfolio", "productivity"],
    },
  },

  assets: {
    osMark: "salah-os-mark-512.png",
    resumePdf: "nothing/Salah_CV.pdf",
  },

  appearance: {
    mobile: {
      // Comfortable-density multiplier for the unlocked mobile OS.
      // 1 is the base layout; values around 1.1â€“1.25 suit most phones.
      uiScale: 1.15,
    },
    cursors: {
      arrow: {
        asset: "cursors/salah-arrow.svg",
        hotspot: [3, 3],
      },
      link: {
        asset: "cursors/salah-link.svg",
        hotspot: [10, 2],
      },
      move: {
        asset: "cursors/salah-move.svg",
        hotspot: [16, 14],
      },
      moveActive: {
        asset: "cursors/salah-move.svg",
        hotspot: [17, 15],
      },
      text: {
        asset: "cursors/salah-text.svg",
        hotspot: [11, 15],
      },
      finger: {
        asset: "cursors/salah-finger.svg",
        hotspot: [10, 2],
      },
    },
  },

  contacts: [
    {
      id: "email",
      label: "Email",
      value: "salahabdou99@gmail.com",
      href: "mailto:salahabdou99@gmail.com",
    },
    {
      id: "phone",
      label: "Phone",
      value: "+20 120 302 5003",
      href: "tel:+201203025003",
    },
    {
      id: "linkedin",
      label: "LinkedIn",
      value: "linkedin.com/in/salaheldin99",
      href: "https://www.linkedin.com/in/salaheldin99",
      external: true,
    },
  ],

  resume: {
    displayName: "Salah_CV.pdf",
    downloadName: "Salah_CV.pdf",
    browserLabel: "local://documents/Salah_CV.pdf",
    defaultZoom: 1,
    zoom: {
      min: 0.75,
      max: 2,
      step: 0.25,
    },
    controls: {
      groupLabel: "Résumé zoom",
      zoomOut: "Zoom out",
      zoomIn: "Zoom in",
      resetTemplate: "Reset zoom from {percentage}%",
      downloadTemplate: "Download {filename}",
    },
  },

  destinations: {
    github: {
      id: "github",
      title: "Salah’s GitHub",
      label: "github.com/Saladin-99",
      url: "https://github.com/Saladin-99?tab=repositories",
      eyebrow: "Code garden",
      description:
        "Repositories, experiments, and the occasional idea that escaped containment.",
      accent: "violet",
    },
    resume: {
      id: "resume-pdf",
      title: "Salah’s Résumé",
      eyebrow: "Local document",
      desktopDescription:
        "The full résumé as a PDF, ready to open in a regular browser tab.",
      mobileDescription:
        "The complete résumé, ready to continue in a regular tab.",
      accent: "amber",
    },
  },

  applications: {
    welcome: {
      desktopId: "welcome",
      title: "A note from Salah",
      label: "Hello",
      glyph: "spark",
    },
    resume: {
      desktopId: "resume",
      mobileId: "papertrail",
      title: "PaperTrail",
      label: "Résumé",
      subtitle: "Document viewer",
      desktopGlyph: "document",
      mobileGlyph: "document",
      accent: "amber",
    },
    contact: {
      desktopId: "contact",
      mobileId: "signal-book",
      title: "Signal Book",
      label: "Contact",
      subtitle: "People & channels",
      desktopGlyph: "message",
      mobileGlyph: "signal",
      accent: "aqua",
    },
    github: {
      desktopId: "browser",
      mobileId: "salah-browser",
      title: "SalahBrowser",
      label: "GitHub",
      subtitle: "The wider web",
      desktopGlyph: "browser",
      mobileGlyph: "browser",
      accent: "violet",
    },
  },

  copy: {
    common: {
      browserName: "SalahBrowser",
      openNewTab: "Open in a new tab",
      addressLabel: "Address",
      replayIntro: "Replay intro",
      contactLinkEyebrow: "Contact link",
    },
    contactMethods: {
      copy: "Copy",
      copied: "Copied",
      copyLabelTemplate: "Copy {label}",
      copiedStatusTemplate: "{label} copied to clipboard.",
      errorStatusTemplate:
        "{label} could not be copied. Select the value and copy it manually.",
      externalHint: "Open external link",
      applicationHint: "Open with the appropriate application",
    },
    desktop: {
      launcherLabel: profile.name,
      shortcutsLabel: "Desktop applications",
      taskbarLabel: "Open windows",
      welcome: {
        eyebrow: "",
        prompt:
          "Have fun and enjoy your time :)",
        tagsLabel: "System notes",
      },
      resume: {
        saveLabel: "Save",
      },
      contact: {
        heading: "Pick a channel.",
        body: "Every entry can be opened or copied independently.",
      },
      browser: {
        tabsLabel: "Browser tabs",
        disclaimer:
          "External pages stay opt-in, so the desktop never throws you out without asking.",
      },
    },
    mobile: {
      statusBrand: "Salah's",
      homeTitle: "home",
      notification: {
        label: "Welcome notification",
        sender: "Salah",
        timestamp: "now",
        body: "Have fun and enjoy your time :)",
        replayLabel: "Replay",
      },
      homeGridLabel: "Home screen shortcuts",
      dockLabel: "Applications",
      doneLabel: "Done",
      contact: {
        heading: "Pick a channel.",
        body: "Open it or keep a copy for later.",
      },
      browser: {
        disclaimer:
          "External pages stay opt-in, so Salah Mobile never sends you away without asking.",
      },
      recents: {
        eyebrow: "Task switcher",
        title: "Recent apps",
        closeAll: "Close all",
        emptyTitle: "Quiet in here.",
        emptyBody: "Open an app and it will wait here when you leave.",
      },
      navigation: {
        label: "System navigation",
        back: "Back",
        home: "Home",
        recents: "Recent apps",
      },
    },
    boot: {
      osName: "Salah OS",
      desktop: {
        password: "salah!",
        startupStatus: "Starting up…",
        gateLabel: "session gate · 01",
        workstationLabel: "Local workstation",
        accountActionLabel: `Select ${profile.name} to sign in`,
        selectionInstruction: "Please select a user to proceed",
        welcomeLabel: "Welcome back",
        accountName: profile.name,
        accountSubtitle: "creative session",
        passwordLabel: "Password",
        footerSleep: "sleep",
        footerProfilePrefix: "profile loaded from",
        footerAudio: "audio",
        statuses: {
          idle: "Local profile detected",
          awaitingSelection: "Select your profile to continue",
          typing: "Entering saved password…",
          authenticated: "Identity confirmed",
          handoff: "Opening your desktop…",
        },
      },
      mobile: {
        osSuffix: "mobile",
        carrier: "SALAH",
        productName: "Salah mobile",
        productSubtitle: "maybe it's not password protected?",
        slideLabel: "slide to unlock",
        slideActionLabel: "Slide to unlock Salah Mobile",
        slideHint: "Drag the handle all the way to the right",
        patternLabel: "Draw pattern to unlock",
        successLabel: "Loading home screen…",
      },
    },
    intro: {
      loading: "Preparing your entrance…",
      skip: "Skip intro",
      skipHint: "Enter or Space",
      accessibilityDescription:
        "A brief animated device sequence is playing. Follow the on-screen sign-in prompt, or press Escape or use Skip intro to continue immediately.",
    },
    resumePreview: {
      loadingPrefix: "Rendering",
      error: "The preview could not be rendered.",
      openInBrowser: "Open in SalahBrowser",
    },
  },

  behavior: {
    layout: {
      mobileMaxWidth: 760,
      phoneLandscapeShortSide: 600,
      tabletMaxWidth: 1023,
    },
    typewriterMs: 62,
    intro: {
      enabled: true,
      watchdogMs: 14000,
      lowCpuCoreThreshold: 2,
      interactions: {
        desktop: {
          accountPulseMs: 2200,
          accountShineMs: 2650,
        },
        mobile: {
          slideCompletionThreshold: 0.82,
          slideKeyboardStep: 0.16,
          slideResetMs: 240,
        },
      },
      desktop: {
        screenApproachEndMs: 6800,
        deviceUiStartMs: 7150,
        bootMs: 1380,
        loginRevealMs: 440,
        accountRevealMs: 480,
        passwordCharacterMs: [120, 145, 130, 155, 135, 160],
        finalPaintBudgetMs: 32,
        authenticationMs: 360,
        handoffMs: 680,
      },
      mobile: {
        cameraReadyMs: 3650,
        screenHoldMs: 286,
        screenWakeMs: 328,
        logoHoldMs: 820,
        logoGapMs: 246,
        slideSettleMs: 220,
        patternMs: 1050,
        successMs: 240,
        handoffMs: 680,
      },
    },
    mobileLauncher: {
      homeSlotCount: 12,
      columns: 3,
      rows: 4,
      longPressMs: 420,
      dragThresholdPx: 10,
      settleMs: 180,
      hapticMs: 18,
      clickSuppressionMs: 320,
    },
    notification: {
      deliveryDelayMs: 140,
      settleMs: 760,
      audioMaxDelayMs: 15000,
    },
    contactCopyResetMs: 2200,
    audio: {
      enabled: true,
      interfaceVolume: 0.78,
      mobileShellVolume: 0.7,
      desktopLoginVolume: 0.82,
      desktopLoginMaxDelayMs: 15000,
      mobileUnlockVolume: 0.78,
      mobileUnlockMaxDelayMs: 15000,
      mobileNotificationVolume: 0.58,
    },
  },

  storage: {
    introSessionKey: "salah-portfolio:intro-complete:v10",
    mobileLauncher: {
      version: 4,
      currentKey: "salah-mobile-layout-v4",
      previousKey: "salah-mobile-layout-v3",
      legacyKey: "salah-mobile-app-order",
    },
  },
};

export default portfolioConfig;
