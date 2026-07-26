import {
  Component,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useState,
} from "react";
import Hero from "./components/Hero";
import ResumeModal from "./components/ResumeModal";
import ContactModal from "./components/ContactModal";

const IntroScene = lazy(() => import("./components/intro/IntroScene"));
const INTRO_SESSION_KEY = "salah-portfolio:intro-complete:v2";

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
    navigator.hardwareConcurrency <= 2;
  const savesData = navigator.connection?.saveData === true;

  return (
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
        INITIALIZING SCENE
      </p>
      <button
        className="skip-intro"
        type="button"
        onClick={() => onSkip("keyboard")}
      >
        Skip intro
        <span>ENTER / SPACE</span>
      </button>
    </div>
  );
}

export default function App() {
  const [webglAvailable] = useState(canUseWebGL);
  const [introActive, setIntroActive] = useState(() =>
    shouldPlayIntro(webglAvailable),
  );
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion);
  const [heroCycle, setHeroCycle] = useState(0);
  const [activeModal, setActiveModal] = useState(null);

  const finishIntro = useCallback((reason) => {
    writeIntroSession();
    setIntroActive(false);

    if (reason === "keyboard") {
      window.requestAnimationFrame(() => {
        document.querySelector(".hero-title")?.focus();
      });
    }
  }, []);

  const replayIntro = useCallback(() => {
    if (prefersReducedMotion() || !webglAvailable) return;
    setActiveModal(null);
    setHeroCycle((cycle) => cycle + 1);
    setIntroActive(true);
  }, [webglAvailable]);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = (event) => setReducedMotion(event.matches);
    motionQuery.addEventListener("change", handleChange);
    return () => motionQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (!introActive) return undefined;
    const watchdog = window.setTimeout(
      () => finishIntro("watchdog"),
      3200,
    );
    return () => window.clearTimeout(watchdog);
  }, [finishIntro, introActive]);

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
    <div className="site-shell">
      <div className="ambient-grid" aria-hidden="true" />
      <div className="scanlines" aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />

      {introActive && (
        <IntroErrorBoundary onFailure={finishIntro}>
          <Suspense
            fallback={<IntroLoadingFallback onSkip={finishIntro} />}
          >
            <IntroScene onComplete={finishIntro} />
          </Suspense>
        </IntroErrorBoundary>
      )}

      <main
        className={`hero-stage ${introActive ? "is-intro" : "is-ready"}`}
        inert={introActive || activeModal ? true : undefined}
        aria-hidden={introActive || activeModal ? true : undefined}
      >
        <Hero
          key={heroCycle}
          ready={!introActive}
          animateTyping={!reducedMotion}
          onOpenResume={() => setActiveModal("resume")}
          onOpenContact={() => setActiveModal("contact")}
          onReplayIntro={replayIntro}
          canReplay={!reducedMotion && webglAvailable}
        />
      </main>

      {activeModal === "resume" && (
        <ResumeModal onClose={() => setActiveModal(null)} />
      )}
      {activeModal === "contact" && (
        <ContactModal onClose={() => setActiveModal(null)} />
      )}
    </div>
  );
}
