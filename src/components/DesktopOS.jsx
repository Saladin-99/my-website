import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import ContactMethods from "./ContactMethods";
import ResumePreview, {
  preloadResumePreview,
} from "./ResumePreview";
import { portfolioConfig } from "../portfolio.config";
import {
  createPortfolioDestinations,
  formatPortfolioCopy,
  publicAsset,
} from "../portfolio.runtime";

const {
  applications,
  assets,
  copy: {
    common: commonCopy,
    desktop: desktopCopy,
  },
  profile,
  resume,
} = portfolioConfig;
const OS_MARK = publicAsset(assets.osMark);
const {
  github: GITHUB_DESTINATION,
  resume: configuredResumeDestination,
  resumeUrl: RESUME_URL,
} = createPortfolioDestinations();
const RESUME_DESTINATION = {
  ...configuredResumeDestination,
  description: configuredResumeDestination.desktopDescription,
};
const {
  min: RESUME_ZOOM_MIN,
  max: RESUME_ZOOM_MAX,
  step: RESUME_ZOOM_STEP,
} = resume.zoom;
const WINDOW_LAYER_Z = 10;

function warmResumePreview() {
  return preloadResumePreview(RESUME_URL).catch(() => undefined);
}

const WINDOW_META = {
  welcome: {
    title: applications.welcome.title,
    appLabel: applications.welcome.label,
    glyph: applications.welcome.glyph,
  },
  resume: {
    title: applications.resume.title,
    appLabel: applications.resume.label,
    glyph: applications.resume.desktopGlyph,
  },
  contact: {
    title: applications.contact.title,
    appLabel: applications.contact.label,
    glyph: applications.contact.desktopGlyph,
  },
  browser: {
    title: applications.github.title,
    appLabel: applications.github.title,
    glyph: applications.github.desktopGlyph,
  },
};

const INITIAL_WINDOWS = {
  welcome: {
    open: true,
    minimized: false,
    position: null,
    z: 1,
  },
  resume: {
    open: false,
    minimized: false,
    position: null,
    z: 0,
  },
  contact: {
    open: false,
    minimized: false,
    position: null,
    z: 0,
  },
  browser: {
    open: false,
    minimized: false,
    position: null,
    z: 0,
    page: GITHUB_DESTINATION,
  },
};

const INITIAL_DESKTOP_STATE = {
  windows: INITIAL_WINDOWS,
  activeId: "welcome",
  nextZ: 2,
};

function getTopWindowId(windows, excludedId) {
  return (
    Object.entries(windows)
      .filter(
        ([id, windowState]) =>
          id !== excludedId &&
          windowState.open &&
          !windowState.minimized,
      )
      .sort(([, a], [, b]) => b.z - a.z)[0]?.[0] ?? null
  );
}

function desktopReducer(state, action) {
  const current = state.windows[action.id];

  switch (action.type) {
    case "OPEN": {
      if (!current) return state;

      return {
        windows: {
          ...state.windows,
          [action.id]: {
            ...current,
            ...action.payload,
            open: true,
            minimized: false,
            z: state.nextZ,
          },
        },
        activeId: action.id,
        nextZ: state.nextZ + 1,
      };
    }

    case "FOCUS": {
      if (
        !current?.open ||
        current.minimized ||
        state.activeId === action.id
      ) {
        return state;
      }

      return {
        windows: {
          ...state.windows,
          [action.id]: {
            ...current,
            z: state.nextZ,
          },
        },
        activeId: action.id,
        nextZ: state.nextZ + 1,
      };
    }

    case "MOVE": {
      if (!current) return state;
      return {
        ...state,
        windows: {
          ...state.windows,
          [action.id]: {
            ...current,
            position: action.position,
          },
        },
      };
    }

    case "MINIMIZE": {
      if (!current?.open) return state;
      const windows = {
        ...state.windows,
        [action.id]: {
          ...current,
          minimized: true,
        },
      };

      return {
        ...state,
        windows,
        activeId:
          state.activeId === action.id
            ? getTopWindowId(windows, action.id)
            : state.activeId,
      };
    }

    case "CLOSE": {
      if (!current?.open) return state;
      const windows = {
        ...state.windows,
        [action.id]: {
          ...current,
          open: false,
          minimized: false,
        },
      };

      return {
        ...state,
        windows,
        activeId:
          state.activeId === action.id
            ? getTopWindowId(windows, action.id)
            : state.activeId,
      };
    }

    case "TASK_TOGGLE": {
      if (!current?.open) return state;
      if (current.minimized) {
        return desktopReducer(state, {
          type: "OPEN",
          id: action.id,
        });
      }
      if (state.activeId === action.id) {
        return desktopReducer(state, {
          type: "MINIMIZE",
          id: action.id,
        });
      }
      return desktopReducer(state, {
        type: "FOCUS",
        id: action.id,
      });
    }

    default:
      return state;
  }
}

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function AppGlyph({ type }) {
  if (type === "document") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M8 3h11l6 6v20H8zM19 3v7h6M12 16h9M12 21h7" />
      </svg>
    );
  }

  if (type === "message") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M5 6h22v16H14l-7 6v-6H5z" />
        <path d="M11 14h.01M16 14h.01M21 14h.01" />
      </svg>
    );
  }

  if (type === "browser") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="16" cy="16" r="12" />
        <path d="M4 16h24M16 4c4 4 5.5 8 5.5 12S20 24 16 28c-4-4-5.5-8-5.5-12S12 8 16 4z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="m16 3 2.3 8.2L27 9l-6.4 6 6.4 6-8.7-2.2L16 29l-2.3-10.2L5 21l6.4-6L5 9l8.7 2.2z" />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14 5h5v5M19 5l-9 9M19 14v5H5V5h5" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
    </svg>
  );
}

function DesktopShortcut({ type, label, hint, onOpen, onWarm }) {
  return (
    <button
      className={`salah-shortcut salah-shortcut--${type}`}
      type="button"
      onClick={onOpen}
      onFocus={onWarm}
      onPointerEnter={onWarm}
    >
      <span className="salah-shortcut-icon">
        <AppGlyph type={type} />
      </span>
      <span className="salah-shortcut-label">{label}</span>
      <span className="salah-shortcut-hint">{hint}</span>
    </button>
  );
}

function DesktopWindow({
  id,
  state,
  active,
  workspaceRef,
  onClose,
  onFocus,
  onMinimize,
  onMove,
  children,
}) {
  const windowRef = useRef(null);
  const dragRef = useRef(null);
  const meta = WINDOW_META[id];

  const handleDragStart = (event) => {
    if (
      event.button !== 0 ||
      event.target.closest("button, a, input, iframe")
    ) {
      return;
    }

    const workspace = workspaceRef.current;
    const windowElement = windowRef.current;
    if (!workspace || !windowElement) return;

    const windowRect = windowElement.getBoundingClientRect();
    dragRef.current = {
      pointerId: event.pointerId,
      grabOffsetX: event.clientX - windowRect.left,
      grabOffsetY: event.clientY - windowRect.top,
    };

    onFocus(id);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleDragMove = (event) => {
    const drag = dragRef.current;
    const workspace = workspaceRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !workspace) return;

    const workspaceRect = workspace.getBoundingClientRect();
    const pointerX = clamp(
      event.clientX - workspaceRect.left,
      0,
      workspaceRect.width,
    );
    const pointerY = clamp(
      event.clientY - workspaceRect.top,
      0,
      workspaceRect.height,
    );

    onMove(id, {
      x: pointerX - drag.grabOffsetX,
      y: pointerY - drag.grabOffsetY,
    });
  };

  const handleDragEnd = (event) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const positionStyle = state.position
    ? {
        left: `${state.position.x}px`,
        top: `${state.position.y}px`,
        transform: "none",
      }
    : undefined;

  return (
    <section
      ref={windowRef}
      id={`salah-window-${id}`}
      className={`salah-window salah-window--${id} ${
        active ? "is-active" : "is-inactive"
      }`}
      style={{ ...positionStyle, zIndex: WINDOW_LAYER_Z + state.z }}
      role="dialog"
      aria-modal="false"
      aria-label={meta.title}
      hidden={state.minimized}
      inert={state.minimized ? true : undefined}
      onPointerDown={() => onFocus(id)}
    >
      <header
        className="salah-window-bar"
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
        onPointerCancel={handleDragEnd}
      >
        <span className="salah-window-controls">
          <button
            className="salah-window-control salah-window-control--close"
            type="button"
            aria-label={`Close ${meta.title}`}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => onClose(id)}
          >
            ×
          </button>
          <button
            className="salah-window-control salah-window-control--minimize"
            type="button"
            aria-label={`Minimize ${meta.title}`}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => onMinimize(id)}
          >
            −
          </button>
        </span>
        <span className="salah-window-title">
          <span className={`salah-mini-glyph salah-mini-glyph--${meta.glyph}`}>
            <AppGlyph type={meta.glyph} />
          </span>
          {meta.title}
        </span>
        <span className="salah-window-grip" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      </header>
      <div className="salah-window-content">{children}</div>
    </section>
  );
}

function WelcomeContent({ typedIntroduction }) {
  const { welcome } = desktopCopy;

  return (
    <div className="salah-welcome">
      <div className="salah-welcome-portrait">
        <img src={OS_MARK} alt="" />
        <span aria-hidden="true" />
      </div>
      <div className="salah-welcome-copy">
        <p className="hero-eyebrow">{welcome.eyebrow}</p>
        <h1 className="hero-title" tabIndex="-1">
          <span className="sr-only">{profile.greeting}</span>
          <span aria-hidden="true">{typedIntroduction}</span>
          <span
            className={`typing-cursor ${
              typedIntroduction === profile.greeting ? "is-idle" : ""
            }`}
            aria-hidden="true"
          />
        </h1>
        <p className="hero-prompt">{welcome.prompt}</p>
        <div
          className="salah-welcome-tags"
          aria-label={welcome.tagsLabel}
        >
          {profile.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ResumeContent({ onOpenBrowser }) {
  const [zoom, setZoom] = useState(resume.defaultZoom);
  const zoomPercentage = Math.round(zoom * 100);
  const updateZoom = (direction) => {
    setZoom((current) =>
      clamp(
        Number((current + direction * RESUME_ZOOM_STEP).toFixed(2)),
        RESUME_ZOOM_MIN,
        RESUME_ZOOM_MAX,
      ),
    );
  };

  return (
    <div className="salah-document">
      <div className="salah-document-toolbar">
        <span className="salah-document-status">
          <i aria-hidden="true" />
          {resume.displayName}
        </span>
        <div className="salah-document-tools">
          <div
            className="salah-document-zoom"
            role="group"
            aria-label={resume.controls.groupLabel}
          >
            <button
              type="button"
              aria-label={resume.controls.zoomOut}
              disabled={zoom <= RESUME_ZOOM_MIN}
              onClick={() => updateZoom(-1)}
            >
              −
            </button>
            <button
              className="salah-document-zoom-level"
              type="button"
              aria-label={formatPortfolioCopy(
                resume.controls.resetTemplate,
                { percentage: zoomPercentage },
              )}
              disabled={zoom === resume.defaultZoom}
              onClick={() => setZoom(resume.defaultZoom)}
            >
              {zoomPercentage}%
            </button>
            <button
              type="button"
              aria-label={resume.controls.zoomIn}
              disabled={zoom >= RESUME_ZOOM_MAX}
              onClick={() => updateZoom(1)}
            >
              +
            </button>
          </div>
          <div className="salah-document-actions">
            <button
              type="button"
              onClick={() => onOpenBrowser(RESUME_DESTINATION)}
            >
              <ExternalIcon />
              {commonCopy.browserName}
            </button>
            <a href={RESUME_URL} download={resume.downloadName}>
              <DownloadIcon />
              {desktopCopy.resume.saveLabel}
            </a>
          </div>
        </div>
      </div>
      <div className="salah-document-preview">
        <ResumePreview
          source={RESUME_URL}
          zoom={zoom}
          onOpenBrowser={() => onOpenBrowser(RESUME_DESTINATION)}
        />
      </div>
    </div>
  );
}

function ContactContent({ onOpenBrowser }) {
  const handleOpenLink = useCallback(
    (method) => {
      if (method.external) {
        onOpenBrowser({
          id: method.label.toLowerCase(),
          title: `${method.label} — ${profile.name}`,
          label: method.value,
          url: method.href,
          eyebrow: commonCopy.contactLinkEyebrow,
          description: desktopCopy.contact.body,
          accent: applications.contact.accent,
        });
        return;
      }

      window.location.href = method.href;
    },
    [onOpenBrowser],
  );

  return (
    <div className="salah-contact-panel">
      <div className="salah-contact-intro">
        <span aria-hidden="true">◌</span>
        <div>
          <p>{applications.contact.title}</p>
          <h2>{desktopCopy.contact.heading}</h2>
          <span>{desktopCopy.contact.body}</span>
        </div>
      </div>
      <ContactMethods onOpenLink={handleOpenLink} />
    </div>
  );
}

function SalahBrowser({ page }) {
  return (
    <div className="salah-browser">
      <div
        className="salah-browser-tabs"
        aria-label={desktopCopy.browser.tabsLabel}
      >
        <span className="salah-browser-tab is-selected">
          <i aria-hidden="true" />
          {page.title}
          <span aria-hidden="true">×</span>
        </span>
        <span className="salah-browser-new-tab" aria-hidden="true">
          +
        </span>
      </div>
      <div className="salah-browser-toolbar">
        <span className="salah-browser-navigation" aria-hidden="true">
          <i>←</i>
          <i>→</i>
          <i>↻</i>
        </span>
        <label className="salah-browser-address">
          <span className="sr-only">{commonCopy.addressLabel}</span>
          <span aria-hidden="true">◇</span>
          <input value={page.label} readOnly />
        </label>
      </div>
      <div className={`salah-browser-page salah-browser-page--${page.accent}`}>
        <div className="salah-browser-page-icon">
          <AppGlyph
            type={page.id === "resume-pdf" ? "document" : "browser"}
          />
        </div>
        <p>{page.eyebrow}</p>
        <h2>{page.title}</h2>
        <span>{page.description}</span>
        <a
          href={page.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {commonCopy.openNewTab}
          <ExternalIcon />
        </a>
        <small>{desktopCopy.browser.disclaimer}</small>
      </div>
    </div>
  );
}

function useSystemClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(interval);
  }, []);

  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(now);
}

export default function DesktopOS({
  ready,
  typedIntroduction,
  onReplayIntro,
  canReplay,
}) {
  const [desktop, dispatch] = useReducer(
    desktopReducer,
    INITIAL_DESKTOP_STATE,
  );
  const workspaceRef = useRef(null);
  const time = useSystemClock();

  const openWindow = useCallback((id, payload) => {
    dispatch({ type: "OPEN", id, payload });
  }, []);

  const openBrowser = useCallback(
    (page) => openWindow("browser", { page }),
    [openWindow],
  );

  useEffect(() => {
    if (!ready) return undefined;

    const handleKeyDown = (event) => {
      if (event.key !== "Escape" || !desktop.activeId) return;
      event.preventDefault();
      dispatch({ type: "CLOSE", id: desktop.activeId });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [desktop.activeId, ready]);

  useEffect(() => {
    if (!ready) return undefined;

    const warmPreview = () => warmResumePreview();

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(warmPreview, {
        timeout: 1200,
      });
      return () => window.cancelIdleCallback(idleId);
    }

    const warmTimer = window.setTimeout(warmPreview, 350);
    return () => window.clearTimeout(warmTimer);
  }, [ready]);

  const openWindows = Object.entries(desktop.windows).filter(
    ([, windowState]) => windowState.open,
  );

  return (
    <div className="hero-content salah-desktop">
      <div className="salah-wallpaper" aria-hidden="true">
        <span className="salah-wallpaper-orbit salah-wallpaper-orbit--one" />
        <span className="salah-wallpaper-orbit salah-wallpaper-orbit--two" />
        <span className="salah-wallpaper-sun" />
        <span className="salah-wallpaper-dune salah-wallpaper-dune--back" />
        <span className="salah-wallpaper-dune salah-wallpaper-dune--front" />
      </div>

      <main ref={workspaceRef} className="salah-workspace" id="home">
        <nav
          className="salah-shortcuts"
          aria-label={desktopCopy.shortcutsLabel}
        >
          <DesktopShortcut
            type={applications.resume.desktopGlyph}
            label={applications.resume.label}
            hint={applications.resume.title}
            onOpen={() => openWindow("resume")}
            onWarm={warmResumePreview}
          />
          <DesktopShortcut
            type={applications.contact.desktopGlyph}
            label={applications.contact.label}
            hint={applications.contact.title}
            onOpen={() => openWindow("contact")}
          />
          <DesktopShortcut
            type={applications.github.desktopGlyph}
            label={applications.github.label}
            hint={applications.github.subtitle}
            onOpen={() => openBrowser(GITHUB_DESTINATION)}
          />
        </nav>

        {openWindows.map(([id, windowState]) => (
          <DesktopWindow
            key={id}
            id={id}
            state={windowState}
            active={desktop.activeId === id && !windowState.minimized}
            workspaceRef={workspaceRef}
            onClose={(windowId) =>
              dispatch({ type: "CLOSE", id: windowId })
            }
            onFocus={(windowId) =>
              dispatch({ type: "FOCUS", id: windowId })
            }
            onMinimize={(windowId) =>
              dispatch({ type: "MINIMIZE", id: windowId })
            }
            onMove={(windowId, position) =>
              dispatch({
                type: "MOVE",
                id: windowId,
                position,
              })
            }
          >
            {id === "welcome" && (
              <WelcomeContent typedIntroduction={typedIntroduction} />
            )}
            {id === "resume" && (
              <ResumeContent onOpenBrowser={openBrowser} />
            )}
            {id === "contact" && (
              <ContactContent onOpenBrowser={openBrowser} />
            )}
            {id === "browser" && (
              <SalahBrowser page={windowState.page} />
            )}
          </DesktopWindow>
        ))}
      </main>

      <footer className="salah-system-rail">
        <button
          className="salah-launcher"
          type="button"
          onClick={() => openWindow("welcome")}
        >
          <img src={OS_MARK} alt="" />
          <span>{desktopCopy.launcherLabel}</span>
        </button>
        <div
          className="salah-task-seats"
          aria-label={desktopCopy.taskbarLabel}
        >
          {openWindows.map(([id, windowState]) => {
            const meta = WINDOW_META[id];
            const active =
              desktop.activeId === id && !windowState.minimized;
            return (
              <button
                key={`task-${id}`}
                className={`salah-task-seat ${
                  active ? "is-active" : ""
                } ${windowState.minimized ? "is-minimized" : ""}`}
                type="button"
                aria-controls={`salah-window-${id}`}
                aria-pressed={active}
                onClick={() =>
                  dispatch({ type: "TASK_TOGGLE", id })
                }
              >
                <span
                  className={`salah-mini-glyph salah-mini-glyph--${meta.glyph}`}
                >
                  <AppGlyph type={meta.glyph} />
                </span>
                <span>{meta.appLabel}</span>
                <i aria-hidden="true" />
              </button>
            );
          })}
        </div>
        <div className="salah-system-tray">
          {canReplay && (
            <button
              className="replay-button"
              type="button"
              onClick={onReplayIntro}
            >
              ↻ <span>{commonCopy.replayIntro}</span>
            </button>
          )}
          <span className="salah-tray-light" aria-hidden="true" />
          <time>{time}</time>
        </div>
      </footer>
    </div>
  );
}
