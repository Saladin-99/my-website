import {
  Component,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useState,
} from "react";
import Hero from "./components/Hero";
import { useSalahAudio } from "./hooks/useSalahAudio";
import { portfolioConfig } from "./portfolio.config";
import { createPortfolioCursorStyle } from "./portfolio.runtime";

const loadIntroScene = () => import("./components/intro/IntroScene");
const IntroScene = lazy(loadIntroScene);
const {
  behavior,
  copy,
  storage,
} = portfolioConfig;
const INTRO_SESSION_KEY = storage.introSessionKey;
const PORTFOLIO_CURSOR_STYLE = createPortfolioCursorStyle();

function readIntroSession() {
  try {
    return window.sessionStorage.getItem(INTRO_SESSION_KEY) === "true";
  } catch {
    return false;
  }
}

function writeIntroSession() {
  try {
    window.sessionStorage.setItem(INTRO_SESSION_KEY, "true");
  } catch {
    // Privacy modes can disable session storage; the interface still works.
  }
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function canUseWebGL() {
  try {
    const canvas = document.createElement("canvas");
    const context =
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl"));
    const available = Boolean(context);
    context?.getExtension("WEBGL_lose_context")?.loseContext();
    return available;
  } catch {
    return false;
  }
}

function shouldPlayIntro(webglAvailable) {
  if (typeof window === "undefined") return false;

  const hasCompletedIntro = readIntroSession();
  const reducedMotion = prefersReducedMotion();
  const hasVeryLimitedCpu =
    typeof navigator.hardwareConcurrency === "number" &&
    navigator.hardwareConcurrency <=
      behavior.intro.lowCpuCoreThreshold;
  const savesData = navigator.connection?.saveData === true;

  return (
    behavior.intro.enabled &&
    !hasCompletedIntro &&
    !reducedMotion &&
    !hasVeryLimitedCpu &&
    !savesData &&
    webglAvailable
  );
}

class IntroErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onFailure("webgl-error");
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

function IntroLoadingFallback({ onSkip }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (
        !event.repeat &&
        (event.key === "Enter" ||
          event.key === " " ||
          event.key === "Escape")
      ) {
        event.preventDefault();
        onSkip("keyboard");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onSkip]);

  return (
    <div
      className="intro-layer intro-loading"
      onPointerDown={(event) => {
        if (event.target.closest("button")) return;
        onSkip("pointer");
      }}
    >
      <div className="intro-loading-mark" aria-hidden="true">
        <span />
        <span />
      </div>
      <p className="intro-loading-label" aria-hidden="true">
        {copy.intro.loading}
      </p>
      <button
        className="skip-intro"
        type="button"
        onClick={() => onSkip("keyboard")}
      >
        {copy.intro.skip}
        <span>{copy.intro.skipHint}</span>
      </button>
    </div>
  );
}

export default function App() {
  const {
    activate: activateAudio,
    playDesktopClick,
    playMobileTap,
  } = useSalahAudio({
    enabled: behavior.audio.enabled,
    volume: behavior.audio.interfaceVolume,
  });
  const [webglAvailable] = useState(canUseWebGL);
  const [introActive, setIntroActive] = useState(() =>
    shouldPlayIntro(webglAvailable),
  );
  const [introAwaitingInteraction, setIntroAwaitingInteraction] =
    useState(false);
  const [introHandoff, setIntroHandoff] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion);
  const [heroCycle, setHeroCycle] = useState(0);

  const finishIntro = useCallback((reason) => {
    writeIntroSession();
    setIntroActive(false);
    setIntroAwaitingInteraction(false);
    setIntroHandoff(false);

    if (reason === "keyboard") {
      window.requestAnimationFrame(() => {
        document.querySelector(".hero-title")?.focus();
      });
    }
  }, []);

  const beginIntroHandoff = useCallback(() => {
    setIntroHandoff(true);
  }, []);

  const replayIntro = useCallback(() => {
    if (prefersReducedMotion() || !webglAvailable) return;
    void activateAudio({ fromGesture: true });
    setIntroAwaitingInteraction(false);
    setIntroHandoff(false);
    setHeroCycle((cycle) => cycle + 1);
    setIntroActive(true);
  }, [activateAudio, webglAvailable]);

  const handleInterfaceClick = useCallback(
    (event) => {
      if (!(event.target instanceof Element)) return;

      const control = event.target.closest(
        "button:not(:disabled), a[href], [role='button']:not([aria-disabled='true'])",
      );
      if (!control) return;

      if (control.closest(".salah-mobile-os")) {
        void playMobileTap();
        return;
      }

      if (control.closest(".salah-desktop")) {
        void playDesktopClick();
      }
    },
    [playDesktopClick, playMobileTap],
  );

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = (event) => setReducedMotion(event.matches);
    motionQuery.addEventListener("change", handleChange);
    return () => motionQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (!introActive || introAwaitingInteraction) return undefined;
    const watchdog = window.setTimeout(
      () => finishIntro("watchdog"),
      behavior.intro.watchdogMs,
    );
    return () => window.clearTimeout(watchdog);
  }, [finishIntro, introActive, introAwaitingInteraction]);

  useEffect(() => {
    if (introActive) return undefined;

    let animationFrame;
    const handlePointerMove = (event) => {
      if (event.pointerType === "touch") return;

      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(() => {
        const x = event.clientX / window.innerWidth - 0.5;
        const y = event.clientY / window.innerHeight - 0.5;
        document.documentElement.style.setProperty("--pointer-x", `${x}`);
        document.documentElement.style.setProperty("--pointer-y", `${y}`);
      });
    };

    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, [introActive]);

  return (
    <div
      className={`site-shell ${
        introActive ? "is-intro-active" : ""
      }`}
      style={PORTFOLIO_CURSOR_STYLE}
      onClick={handleInterfaceClick}
    >
      <div className="color-field" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="grain" aria-hidden="true" />

      {introActive && (
        <IntroErrorBoundary onFailure={finishIntro}>
          <Suspense
            fallback={<IntroLoadingFallback onSkip={finishIntro} />}
          >
            <IntroScene
              onComplete={finishIntro}
              onHandoffStart={beginIntroHandoff}
              onInteractionWaitChange={setIntroAwaitingInteraction}
            />
          </Suspense>
        </IntroErrorBoundary>
      )}

      <main
        className={`hero-stage ${
          introActive
            ? introHandoff
              ? "is-handoff"
              : "is-intro"
            : "is-ready"
        }`}
        inert={introActive ? true : undefined}
        aria-hidden={introActive ? true : undefined}
      >
        <Hero
          key={heroCycle}
          ready={!introActive}
          animateTyping={!reducedMotion}
          onReplayIntro={replayIntro}
          canReplay={!reducedMotion && webglAvailable}
        />
      </main>
    </div>
  );
}
