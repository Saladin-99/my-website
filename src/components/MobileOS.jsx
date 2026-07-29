import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import { useSalahAudio } from "../hooks/useSalahAudio";
import { portfolioConfig } from "../portfolio.config";
import {
  createPortfolioDestinations,
  formatPortfolioCopy,
  publicAsset,
} from "../portfolio.runtime";
import ContactMethods from "./ContactMethods";
import ResumePreview, {
  preloadResumePreview,
} from "./ResumePreview";

const {
  applications,
  assets,
  behavior,
  copy,
  profile,
  resume,
  storage,
} = portfolioConfig;
const {
  github: GITHUB_PAGE,
  resume: resumeDestination,
  resumeUrl: RESUME_URL,
} = createPortfolioDestinations();
const RESUME_PAGE = {
  ...resumeDestination,
  description: resumeDestination.mobileDescription,
};
const OS_MARK = publicAsset(assets.osMark);

const {
  currentKey: LAYOUT_STORAGE_KEY,
  legacyKey: LEGACY_ORDER_STORAGE_KEY,
  previousKey: PREVIOUS_LAYOUT_STORAGE_KEY,
  version: LAYOUT_VERSION,
} = storage.mobileLauncher;
const {
  columns: HOME_GRID_COLUMNS,
  dragThresholdPx: DRAG_THRESHOLD_PX,
  hapticMs: HAPTIC_MS,
  homeSlotCount: HOME_SLOT_COUNT,
  longPressMs: LONG_PRESS_MS,
  settleMs: DRAG_SETTLE_MS,
} = behavior.mobileLauncher;
const {
  max: RESUME_ZOOM_MAX,
  min: RESUME_ZOOM_MIN,
  step: RESUME_ZOOM_STEP,
} = resume.zoom;
const { common: COMMON_COPY, mobile: MOBILE_COPY } = copy;

function createMobileApp(application) {
  return {
    id: application.mobileId,
    title: application.title,
    shortTitle: application.label,
    subtitle: application.subtitle,
    icon: application.mobileGlyph,
    accent: application.accent,
  };
}

const APPS = Object.fromEntries(
  [applications.resume, applications.contact, applications.github].map(
    (application) => {
      const app = createMobileApp(application);
      return [app.id, app];
    },
  ),
);
const PAPERTRAIL_APP_ID = applications.resume.mobileId;
const SIGNAL_BOOK_APP_ID = applications.contact.mobileId;
const BROWSER_APP_ID = applications.github.mobileId;

const DEFAULT_APP_ORDER = Object.keys(APPS);
const DOCK_SLOT_COUNT = DEFAULT_APP_ORDER.length;

function parseStoredValue(value) {
  let candidate = value;

  if (typeof candidate === "string") {
    try {
      candidate = JSON.parse(candidate);
    } catch {
      return null;
    }
  }

  return candidate;
}

function sanitizeAppOrder(value) {
  const candidate = parseStoredValue(value);
  const valid = Array.isArray(candidate)
    ? candidate.filter(
        (id, index, order) =>
          typeof id === "string" &&
          Object.prototype.hasOwnProperty.call(APPS, id) &&
          order.indexOf(id) === index,
      )
    : [];

  return [...valid, ...DEFAULT_APP_ORDER.filter((id) => !valid.includes(id))];
}

function sanitizeHomeSlots(value) {
  const candidate = parseStoredValue(value);
  const source = Array.isArray(candidate) ? candidate : [];
  const seen = new Set();

  return Array.from({ length: HOME_SLOT_COUNT }, (_, index) => {
    const id = source[index];
    if (
      typeof id !== "string" ||
      !Object.prototype.hasOwnProperty.call(APPS, id) ||
      seen.has(id)
    ) {
      return null;
    }

    seen.add(id);
    return id;
  });
}

function sanitizeDockSlots(value) {
  const candidate = parseStoredValue(value);
  const source = Array.isArray(candidate) ? candidate : DEFAULT_APP_ORDER;
  const seen = new Set();

  return Array.from({ length: DOCK_SLOT_COUNT }, (_, index) => {
    const id = source[index];
    if (
      typeof id !== "string" ||
      !Object.prototype.hasOwnProperty.call(APPS, id) ||
      seen.has(id)
    ) {
      return null;
    }

    seen.add(id);
    return id;
  });
}

function createDefaultLauncherLayout(order = DEFAULT_APP_ORDER) {
  return {
    homeSlots: Array.from({ length: HOME_SLOT_COUNT }, () => null),
    dockOrder: sanitizeDockSlots(order),
  };
}

function normalizeLauncherLayout(homeValue, dockValue) {
  const homeSlots = sanitizeHomeSlots(homeValue);
  const dockOrder = sanitizeDockSlots(dockValue);
  const homeIds = new Set(homeSlots.filter(Boolean));

  if (dockOrder.some((id) => id && homeIds.has(id))) {
    return createDefaultLauncherLayout();
  }

  const assignedIds = new Set([
    ...homeSlots.filter(Boolean),
    ...dockOrder.filter(Boolean),
  ]);
  const missingIds = DEFAULT_APP_ORDER.filter((id) => !assignedIds.has(id));

  for (const id of missingIds) {
    const openDockIndex = dockOrder.indexOf(null);
    if (openDockIndex >= 0) {
      dockOrder[openDockIndex] = id;
      continue;
    }

    const openHomeIndex = homeSlots.indexOf(null);
    if (openHomeIndex >= 0) {
      homeSlots[openHomeIndex] = id;
    }
  }

  return { homeSlots, dockOrder };
}

function getStoredLauncherLayout() {
  let storedLayout = null;
  let previousLayout = null;
  let legacyOrder = null;

  try {
    if (typeof window !== "undefined") {
      storedLayout = parseStoredValue(
        window.localStorage.getItem(LAYOUT_STORAGE_KEY),
      );
      previousLayout = parseStoredValue(
        window.localStorage.getItem(PREVIOUS_LAYOUT_STORAGE_KEY),
      );
      legacyOrder = window.localStorage.getItem(
        LEGACY_ORDER_STORAGE_KEY,
      );
    }
  } catch {
    // Storage is an optional enhancement.
  }

  if (
    storedLayout &&
    storedLayout.version === LAYOUT_VERSION &&
    typeof storedLayout === "object"
  ) {
    const homeSlots = sanitizeHomeSlots(storedLayout.homeSlots);
    const dockOrder = sanitizeDockSlots(storedLayout.dockOrder);
    const homeIds = new Set(homeSlots.filter(Boolean));
    const hasLegacyDuplicates = dockOrder.some(
      (id) => id && homeIds.has(id),
    );

    // The first v3 launcher populated both surfaces with every application.
    // Reset that invalid state once so each app begins in the dock and can
    // subsequently live in exactly one place.
    if (hasLegacyDuplicates) {
      return createDefaultLauncherLayout();
    }

    return normalizeLauncherLayout(homeSlots, dockOrder);
  }

  const migratedOrder = sanitizeAppOrder(
    previousLayout?.drawerOrder ?? legacyOrder,
  );
  return createDefaultLauncherLayout(migratedOrder);
}

function getInitialState() {
  const launcherLayout = getStoredLauncherLayout();

  return {
    view: "home",
    activeAppId: null,
    appStack: [],
    recentIds: [],
    browserPage: GITHUB_PAGE,
    launcher: {
      editMode: false,
      selectedAppId: null,
      ...launcherLayout,
    },
    greetingPhase: "queued",
    motionKey: 0,
  };
}

function commitLauncherDrop(launcher, action) {
  const {
    id,
    sourceSurface,
    targetSurface,
    targetIndex,
  } = action;

  if (
    !Object.prototype.hasOwnProperty.call(APPS, id) ||
    !["home", "dock"].includes(sourceSurface) ||
    !["home", "dock"].includes(targetSurface)
  ) {
    return launcher;
  }

  const normalized = normalizeLauncherLayout(
    launcher.homeSlots,
    launcher.dockOrder,
  );
  const homeSlots = [...normalized.homeSlots];
  const dockOrder = [...normalized.dockOrder];
  const resolvedHomeIndex = homeSlots.indexOf(id);
  const resolvedDockIndex = dockOrder.indexOf(id);
  const resolvedSourceSurface =
    resolvedHomeIndex >= 0
      ? "home"
      : resolvedDockIndex >= 0
        ? "dock"
        : null;
  const resolvedSourceIndex =
    resolvedSourceSurface === "home"
      ? resolvedHomeIndex
      : resolvedDockIndex;
  const targetSlotCount =
    targetSurface === "home" ? HOME_SLOT_COUNT : DOCK_SLOT_COUNT;

  if (
    !resolvedSourceSurface ||
    targetIndex < 0 ||
    targetIndex >= targetSlotCount
  ) {
    return launcher;
  }

  if (
    resolvedSourceSurface === targetSurface &&
    resolvedSourceIndex === targetIndex
  ) {
    return {
      ...launcher,
      homeSlots,
      dockOrder,
      selectedAppId: id,
    };
  }

  const sourceSlots =
    resolvedSourceSurface === "home" ? homeSlots : dockOrder;
  const targetSlots = targetSurface === "home" ? homeSlots : dockOrder;
  const displacedId = targetSlots[targetIndex] ?? null;

  sourceSlots[resolvedSourceIndex] = displacedId;
  targetSlots[targetIndex] = id;

  return {
    ...launcher,
    ...normalizeLauncherLayout(homeSlots, dockOrder),
    selectedAppId: id,
  };
}

function mobileReducer(state, action) {
  switch (action.type) {
    case "OPEN_APP": {
      if (!Object.prototype.hasOwnProperty.call(APPS, action.id)) return state;
      const nested =
        action.nested && state.view === "app" && state.activeAppId;
      const stack = nested
        ? [...state.appStack.filter((id) => id !== action.id), action.id]
        : [action.id];

      return {
        ...state,
        view: "app",
        activeAppId: action.id,
        appStack: stack,
        recentIds: [
          action.id,
          ...state.recentIds.filter((id) => id !== action.id),
        ],
        browserPage: action.page ?? state.browserPage,
        launcher: {
          ...state.launcher,
          editMode: false,
          selectedAppId: null,
        },
        greetingPhase: "queued",
        motionKey: state.motionKey + 1,
      };
    }

    case "BACK": {
      if (state.view === "home" && state.launcher.editMode) {
        return {
          ...state,
          launcher: {
            ...state.launcher,
            editMode: false,
            selectedAppId: null,
          },
        };
      }

      if (state.view === "recents") {
        const activeStillOpen = state.recentIds.includes(state.activeAppId);
        return {
          ...state,
          view: activeStillOpen ? "app" : "home",
          activeAppId: activeStillOpen ? state.activeAppId : null,
          greetingPhase: "queued",
          motionKey: state.motionKey + 1,
        };
      }

      if (state.view !== "app") return state;
      if (state.appStack.length > 1) {
        const appStack = state.appStack.slice(0, -1);
        return {
          ...state,
          activeAppId: appStack[appStack.length - 1],
          appStack,
          greetingPhase: "queued",
          motionKey: state.motionKey + 1,
        };
      }

      return {
        ...state,
        view: "home",
        activeAppId: null,
        appStack: [],
        greetingPhase: "queued",
        motionKey: state.motionKey + 1,
      };
    }

    case "HOME":
      return {
        ...state,
        view: "home",
        activeAppId: null,
        appStack: [],
        launcher: {
          ...state.launcher,
          editMode: false,
          selectedAppId: null,
        },
        greetingPhase: "queued",
        motionKey: state.motionKey + 1,
      };

    case "SHOW_RECENTS":
      return {
        ...state,
        view: "recents",
        launcher: {
          ...state.launcher,
          editMode: false,
          selectedAppId: null,
        },
        greetingPhase: "queued",
        motionKey: state.motionKey + 1,
      };

    case "CLOSE_RECENT": {
      const recentIds = state.recentIds.filter((id) => id !== action.id);
      const appStack = state.appStack.filter((id) => id !== action.id);
      const activeAppId =
        state.activeAppId === action.id
          ? (appStack[appStack.length - 1] ?? null)
          : state.activeAppId;

      return {
        ...state,
        recentIds,
        appStack,
        activeAppId,
      };
    }

    case "CLOSE_ALL":
      return {
        ...state,
        activeAppId: null,
        appStack: [],
        recentIds: [],
      };

    case "SET_EDIT_MODE":
      return state.view === "home"
        ? {
            ...state,
            launcher: {
              ...state.launcher,
              editMode: Boolean(action.value),
              selectedAppId: action.value
                ? state.launcher.selectedAppId
                : null,
            },
          }
        : state;

    case "SELECT_APP":
      return state.view === "home"
        ? {
            ...state,
            launcher: {
              ...state.launcher,
              selectedAppId: action.id ?? null,
            },
          }
        : state;

    case "COMMIT_DROP":
      return state.view === "home"
        ? {
            ...state,
            launcher: commitLauncherDrop(state.launcher, action),
          }
        : state;

    case "REMOVE_HOME_SHORTCUT": {
      const homeSlots = [...state.launcher.homeSlots];
      const index = homeSlots.indexOf(action.id);
      if (index < 0) return state;
      const dockIndex = state.launcher.dockOrder.indexOf(null);
      if (dockIndex < 0) return state;
      return {
        ...state,
        launcher: commitLauncherDrop(state.launcher, {
          id: action.id,
          sourceSurface: "home",
          sourceIndex: index,
          targetSurface: "dock",
          targetIndex: dockIndex,
        }),
      };
    }

    case "DELIVER_GREETING":
      return state.greetingPhase === "queued"
        ? { ...state, greetingPhase: "entering" }
        : state;

    case "SETTLE_GREETING":
      return state.greetingPhase === "entering"
        ? { ...state, greetingPhase: "settled" }
        : state;

    case "RESET_GREETING":
      return state.greetingPhase === "queued"
        ? state
        : { ...state, greetingPhase: "queued" };

    default:
      return state;
  }
}

function AppGlyph({ type }) {
  if (type === "document") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M8 3h11l6 6v20H8zM19 3v7h6" />
        <path d="M12 16h9M12 21h7M12 25h5" />
      </svg>
    );
  }

  if (type === "signal") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M5 6h22v16H14l-7 6v-6H5z" />
        <path d="M11 14h.01M16 14h.01M21 14h.01" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="12" />
      <path d="M4 16h24M16 4c4 4 4 20 0 24M16 4c-4 4-4 20 0 24" />
    </svg>
  );
}

function BackGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m15 5-7 7 7 7" />
    </svg>
  );
}

function HomeGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="6" />
    </svg>
  );
}

function RecentsGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

function ExternalGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 18 18 6M9 6h9v9" />
    </svg>
  );
}

function DownloadGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3v12m-5-5 5 5 5-5M5 20h14" />
    </svg>
  );
}

function useSystemClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let timer;
    const schedule = () => {
      timer = window.setTimeout(() => {
        setNow(new Date());
        schedule();
      }, 60_050 - (Date.now() % 60_000));
    };

    schedule();
    return () => window.clearTimeout(timer);
  }, []);

  return {
    time: new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    }).format(now),
    date: new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(now),
  };
}

function StatusBar({ time }) {
  return (
    <header className="salah-mobile-status">
      <time>{time}</time>
      <strong>{MOBILE_COPY.statusBrand}</strong>
      <span className="salah-mobile-status-icons" aria-hidden="true">
        <i className="salah-mobile-status-signal" />
        <i className="salah-mobile-status-wifi" />
        <i className="salah-mobile-status-battery" />
      </span>
    </header>
  );
}

function LauncherAppButton({
  app,
  surface,
  index,
  editMode,
  selected,
  dragState,
  onAppPointerDown,
  onAppPointerMove,
  onAppPointerUp,
  onAppPointerCancel,
  onAppKeyDown,
  onAppClick,
}) {
  const isDragSource =
    dragState?.id === app.id &&
    dragState.sourceSurface === surface &&
    dragState.sourceIndex === index;

  return (
    <button
      className={`salah-mobile-app-icon salah-mobile-app-icon--${app.accent} ${
        isDragSource ? "salah-mobile-is-drag-source" : ""
      } ${selected ? "salah-mobile-is-selected" : ""}`}
      data-salah-mobile-app-id={app.id}
      data-salah-mobile-app-surface={surface}
      data-salah-mobile-app-index={index}
      data-salah-mobile-layout-key={`${surface}:${app.id}`}
      type="button"
      aria-label={
        editMode
          ? `${app.title}, ${surface} position ${index + 1}. Use arrow keys to move${
              surface === "home"
                ? ", or Delete to remove from Home"
                : ", or Shift and Arrow Up to add to Home"
            }.`
          : `Open ${app.title}`
      }
      onClick={(event) => onAppClick(event, app.id)}
      onPointerDown={(event) =>
        onAppPointerDown(event, app.id, surface, index)
      }
      onPointerMove={onAppPointerMove}
      onPointerUp={onAppPointerUp}
      onPointerCancel={onAppPointerCancel}
      onLostPointerCapture={onAppPointerCancel}
      onContextMenu={(event) => event.preventDefault()}
      onKeyDown={(event) =>
        onAppKeyDown(event, app.id, surface, index)
      }
    >
      <span className="salah-mobile-app-glyph">
        <AppGlyph type={app.icon} />
      </span>
      <strong>{app.shortTitle}</strong>
      <small>{app.subtitle}</small>
    </button>
  );
}

function DragLayer({ dragState }) {
  if (!dragState) return null;
  const app = APPS[dragState.id];
  if (!app) return null;

  return (
    <div
      className="salah-mobile-drag-layer"
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    >
      <div
        className={`salah-mobile-drag-ghost salah-mobile-app-icon salah-mobile-app-icon--${app.accent} salah-mobile-drag-ghost--${dragState.phase}`}
      >
        <span className="salah-mobile-app-glyph">
          <AppGlyph type={app.icon} />
        </span>
        <strong>{app.shortTitle}</strong>
        <small>{app.subtitle}</small>
      </div>
    </div>
  );
}

function HomeScreen({
  state,
  dragState,
  typedIntroduction,
  canReplay,
  onReplayIntro,
  onSetEditMode,
  onGreetingAnimationEnd,
  onAppPointerDown,
  onAppPointerMove,
  onAppPointerUp,
  onAppPointerCancel,
  onAppKeyDown,
  onAppClick,
  date,
}) {
  const { launcher } = state;
  const candidateKey = dragState?.candidate
    ? `${dragState.candidate.surface}:${dragState.candidate.index}`
    : "";

  return (
    <main className="salah-mobile-home salah-mobile-screen">
      <h1
        className="salah-mobile-home-heading sr-only"
        data-salah-mobile-view-heading
        tabIndex="-1"
      >
        {MOBILE_COPY.homeTitle}
      </h1>

      <section
        className={`salah-mobile-profile-widget salah-mobile-greeting-notification salah-mobile-greeting-notification--${state.greetingPhase}`}
        data-greeting-phase={state.greetingPhase}
        aria-label={MOBILE_COPY.notification.label}
        aria-hidden={
          state.greetingPhase === "queued" ? true : undefined
        }
        inert={
          state.greetingPhase === "queued" ? true : undefined
        }
        onAnimationEnd={(event) => {
          if (event.currentTarget === event.target) {
            onGreetingAnimationEnd();
          }
        }}
      >
        <div className="salah-mobile-profile-mark">
          <img src={OS_MARK} alt="" />
          <span aria-hidden="true" />
        </div>
        <div className="salah-mobile-profile-copy">
          <p>
            {MOBILE_COPY.notification.sender} ·{" "}
            {MOBILE_COPY.notification.timestamp} · {date}
          </p>
          <h2>
            <span className="sr-only">{profile.greeting}</span>
            <span aria-hidden="true">{typedIntroduction}</span>
            <span
              className={`salah-mobile-typing-cursor ${
                typedIntroduction === profile.greeting
                  ? "salah-mobile-is-idle"
                  : ""
              }`}
              aria-hidden="true"
            />
          </h2>
          <span>{MOBILE_COPY.notification.body}</span>
        </div>
        {canReplay && (
          <button
            className="salah-mobile-replay"
            type="button"
            onClick={onReplayIntro}
            aria-label={MOBILE_COPY.notification.replayLabel}
          >
            <span
              className="salah-mobile-replay-icon"
              aria-hidden="true"
            >
              {"\u21bb"}
            </span>
            <span className="salah-mobile-replay-label">
              {MOBILE_COPY.notification.replayLabel}
            </span>
          </button>
        )}
      </section>

      <section
        className="salah-mobile-home-shortcuts"
        aria-labelledby="salah-mobile-home-shortcuts-title"
      >
        <h2 id="salah-mobile-home-shortcuts-title" className="sr-only">
          {MOBILE_COPY.homeGridLabel}
        </h2>

        <ol
          className={`salah-mobile-app-grid salah-mobile-home-grid ${
            launcher.editMode ? "salah-mobile-is-editing" : ""
          }`}
          data-salah-mobile-drop-surface="home"
          aria-label={MOBILE_COPY.homeGridLabel}
        >
          {launcher.homeSlots.map((id, index) => {
            const slotKey = `home:${index}`;
            return (
              <li
                className={`salah-mobile-drop-slot salah-mobile-drop-slot--home ${
                  candidateKey === slotKey
                    ? "salah-mobile-is-drop-target"
                    : ""
                }`}
                data-salah-mobile-drop-surface="home"
                data-salah-mobile-drop-index={index}
                key={slotKey}
              >
                {id && (
                  <LauncherAppButton
                    app={APPS[id]}
                    surface="home"
                    index={index}
                    editMode={launcher.editMode}
                    selected={launcher.selectedAppId === id}
                    dragState={dragState}
                    onAppPointerDown={onAppPointerDown}
                    onAppPointerMove={onAppPointerMove}
                    onAppPointerUp={onAppPointerUp}
                    onAppPointerCancel={onAppPointerCancel}
                    onAppKeyDown={onAppKeyDown}
                    onAppClick={onAppClick}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </section>

      <section
        className={`salah-mobile-app-dock ${
          launcher.editMode ? "salah-mobile-is-editing" : ""
        }`}
        aria-labelledby="salah-mobile-dock-title"
      >
        <h2 id="salah-mobile-dock-title" className="sr-only">
          {MOBILE_COPY.dockLabel}
        </h2>
        <ol
          className={`salah-mobile-app-grid salah-mobile-dock-grid ${
            launcher.editMode ? "salah-mobile-is-editing" : ""
          }`}
          data-salah-mobile-drop-surface="dock"
          aria-label={MOBILE_COPY.dockLabel}
        >
          {launcher.dockOrder.map((id, index) => {
            const app = id ? APPS[id] : null;
            const slotKey = `dock:${index}`;
            return (
              <li
                className={`salah-mobile-drop-slot salah-mobile-drop-slot--dock ${
                  candidateKey === slotKey
                    ? "salah-mobile-is-drop-target"
                    : ""
                }`}
                data-salah-mobile-drop-surface="dock"
                data-salah-mobile-drop-index={index}
                key={slotKey}
              >
                {app && (
                  <LauncherAppButton
                    app={app}
                    surface="dock"
                    index={index}
                    editMode={launcher.editMode}
                    selected={launcher.selectedAppId === id}
                    dragState={dragState}
                    onAppPointerDown={onAppPointerDown}
                    onAppPointerMove={onAppPointerMove}
                    onAppPointerUp={onAppPointerUp}
                    onAppPointerCancel={onAppPointerCancel}
                    onAppKeyDown={onAppKeyDown}
                    onAppClick={onAppClick}
                  />
                )}
              </li>
            );
          })}
        </ol>
        {launcher.editMode && (
          <button
            className="salah-mobile-arrange salah-mobile-done"
            type="button"
            onClick={() => onSetEditMode(false)}
          >
            {MOBILE_COPY.doneLabel}
          </button>
        )}
      </section>
    </main>
  );
}

function PaperTrail({ onOpenBrowser }) {
  const [zoom, setZoom] = useState(resume.defaultZoom);
  const zoomPercentage = Math.round(zoom * 100);
  const updateZoom = (direction) => {
    setZoom((current) =>
      Math.min(
        RESUME_ZOOM_MAX,
        Math.max(
          RESUME_ZOOM_MIN,
          Number((current + direction * RESUME_ZOOM_STEP).toFixed(2)),
        ),
      ),
    );
  };

  return (
    <div className="salah-mobile-papertrail">
      <div className="salah-mobile-document-toolbar">
        <span>
          <i aria-hidden="true" />
          {resume.displayName}
        </span>
        <div
          className="salah-mobile-document-zoom"
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
        <div className="salah-mobile-document-actions">
          <button type="button" onClick={() => onOpenBrowser(RESUME_PAGE)}>
            <ExternalGlyph />
            <span className="sr-only">
              {copy.resumePreview.openInBrowser}
            </span>
          </button>
          <a href={RESUME_URL} download={resume.downloadName}>
            <DownloadGlyph />
            <span className="sr-only">
              {formatPortfolioCopy(
                resume.controls.downloadTemplate,
                { filename: resume.displayName },
              )}
            </span>
          </a>
        </div>
      </div>
      <div className="salah-mobile-document-preview">
        <ResumePreview
          source={RESUME_URL}
          zoom={zoom}
          onOpenBrowser={() => onOpenBrowser(RESUME_PAGE)}
        />
      </div>
    </div>
  );
}

function SignalBook({ onOpenBrowser }) {
  const handleOpenLink = useCallback(
    (method) => {
      if (method.external) {
        onOpenBrowser({
          id: method.id,
          title: `${method.label} — ${profile.name}`,
          label: method.value,
          url: method.href,
          eyebrow: COMMON_COPY.contactLinkEyebrow,
          description: `Continue to ${profile.name}’s ${method.label} profile.`,
          accent: APPS[SIGNAL_BOOK_APP_ID].accent,
        });
        return;
      }

      window.location.assign(method.href);
    },
    [onOpenBrowser],
  );

  return (
    <div className="salah-mobile-signal-book">
      <section className="salah-mobile-contact-card">
        <div className="salah-mobile-contact-orbit" aria-hidden="true">
          <span />
          <i />
        </div>
        <div>
          <p>{APPS[SIGNAL_BOOK_APP_ID].title}</p>
          <h2>{MOBILE_COPY.contact.heading}</h2>
          <span>{MOBILE_COPY.contact.body}</span>
        </div>
      </section>
      <ContactMethods onOpenLink={handleOpenLink} />
    </div>
  );
}

function SalahBrowser({ page }) {
  return (
    <div className="salah-mobile-browser">
      <div className="salah-mobile-browser-toolbar">
        <span aria-hidden="true">◇</span>
        <label>
          <span className="sr-only">{COMMON_COPY.addressLabel}</span>
          <input value={page.label} readOnly />
        </label>
        <span aria-hidden="true">⋮</span>
      </div>
      <article
        className={`salah-mobile-browser-page salah-mobile-browser-page--${page.accent}`}
      >
        <div className="salah-mobile-browser-page-glyph">
          <AppGlyph
            type={page.id === RESUME_PAGE.id ? "document" : "browser"}
          />
        </div>
        <p>{page.eyebrow}</p>
        <h2>{page.title}</h2>
        <span>{page.description}</span>
        <a href={page.url} target="_blank" rel="noopener noreferrer">
          {COMMON_COPY.openNewTab}
          <ExternalGlyph />
        </a>
        <small>{MOBILE_COPY.browser.disclaimer}</small>
      </article>
    </div>
  );
}

function AppScreen({ appId, browserPage, onBack, onOpenBrowser }) {
  const app = APPS[appId];
  if (!app) return null;

  return (
    <main
      className={`salah-mobile-app-view salah-mobile-app-view--${app.accent}`}
    >
      <header className="salah-mobile-app-bar">
        <button
          type="button"
          onClick={onBack}
          aria-label={MOBILE_COPY.navigation.back}
        >
          <BackGlyph />
        </button>
        <span className="salah-mobile-app-bar-glyph">
          <AppGlyph type={app.icon} />
        </span>
        <div>
          <h1 data-salah-mobile-view-heading tabIndex="-1">
            {app.title}
          </h1>
          <span>{app.subtitle}</span>
        </div>
      </header>
      <div className="salah-mobile-app-content">
        {appId === PAPERTRAIL_APP_ID && (
          <PaperTrail onOpenBrowser={onOpenBrowser} />
        )}
        {appId === SIGNAL_BOOK_APP_ID && (
          <SignalBook onOpenBrowser={onOpenBrowser} />
        )}
        {appId === BROWSER_APP_ID && (
          <SalahBrowser page={browserPage} />
        )}
      </div>
    </main>
  );
}

function RecentsScreen({ recentIds, onOpen, onClose, onCloseAll }) {
  return (
    <main className="salah-mobile-recents salah-mobile-screen">
      <header className="salah-mobile-recents-header">
        <div>
          <p>{MOBILE_COPY.recents.eyebrow}</p>
          <h1 data-salah-mobile-view-heading tabIndex="-1">
            {MOBILE_COPY.recents.title}
          </h1>
        </div>
        {recentIds.length > 0 && (
          <button type="button" onClick={onCloseAll}>
            {MOBILE_COPY.recents.closeAll}
          </button>
        )}
      </header>

      {recentIds.length === 0 ? (
        <section className="salah-mobile-recents-empty">
          <span aria-hidden="true">□</span>
          <h2>{MOBILE_COPY.recents.emptyTitle}</h2>
          <p>{MOBILE_COPY.recents.emptyBody}</p>
        </section>
      ) : (
        <div className="salah-mobile-recents-list" role="list">
          {recentIds.map((id) => {
            const app = APPS[id];
            return (
              <article
                className={`salah-mobile-recent-card salah-mobile-recent-card--${app.accent}`}
                key={id}
                role="listitem"
              >
                <button
                  className="salah-mobile-recent-open"
                  type="button"
                  onClick={() => onOpen(id)}
                  aria-label={`Reopen ${app.title}`}
                >
                  <span className="salah-mobile-recent-preview">
                    <AppGlyph type={app.icon} />
                    <i />
                    <i />
                    <i />
                  </span>
                  <span className="salah-mobile-recent-meta">
                    <span className="salah-mobile-recent-glyph">
                      <AppGlyph type={app.icon} />
                    </span>
                    <span>
                      <strong>{app.title}</strong>
                      <small>{app.subtitle}</small>
                    </span>
                  </span>
                </button>
                <button
                  className="salah-mobile-recent-close"
                  type="button"
                  onClick={() => onClose(id)}
                  aria-label={`Close ${app.title}`}
                >
                  ×
                </button>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}

function SystemNavigation({ onBack, onHome, onRecents }) {
  const runPointerSafeCommand = (event, command) => {
    command();

    // A pointer tap must not leave a mobile command looking selected.
    // Keyboard activation has detail === 0 and keeps focus-visible.
    if (event.detail > 0) {
      event.currentTarget.blur();
    }
  };

  return (
    <nav
      className="salah-mobile-system-nav"
      aria-label={MOBILE_COPY.navigation.label}
    >
      <button
        type="button"
        onClick={(event) => runPointerSafeCommand(event, onBack)}
        aria-label={MOBILE_COPY.navigation.back}
      >
        <BackGlyph />
      </button>
      <button
        type="button"
        onClick={(event) => runPointerSafeCommand(event, onHome)}
        aria-label={MOBILE_COPY.navigation.home}
      >
        <HomeGlyph />
      </button>
      <button
        type="button"
        onClick={(event) =>
          runPointerSafeCommand(event, onRecents)
        }
        aria-label={MOBILE_COPY.navigation.recents}
      >
        <RecentsGlyph />
      </button>
    </nav>
  );
}

function vibrate() {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(HAPTIC_MS);
    }
  } catch {
    // Haptics are optional and may be denied by browser policy.
  }
}

function getDropCandidate(root, clientX, clientY) {
  const hit = document.elementFromPoint(clientX, clientY);
  let slot = hit?.closest?.("[data-salah-mobile-drop-index]");

  if (!slot) {
    const surface = hit?.closest?.("[data-salah-mobile-drop-surface]");
    if (surface && root?.contains(surface)) {
      const slots = Array.from(
        surface.querySelectorAll("[data-salah-mobile-drop-index]"),
      );
      slot = slots.reduce((nearest, candidate) => {
        const rect = candidate.getBoundingClientRect();
        const distance = Math.hypot(
          clientX - (rect.left + rect.width / 2),
          clientY - (rect.top + rect.height / 2),
        );
        return !nearest || distance < nearest.distance
          ? { element: candidate, distance }
          : nearest;
      }, null)?.element;
    }
  }

  if (!slot || !root?.contains(slot)) return null;

  const surface = slot.dataset.salahMobileDropSurface;
  const index = Number(slot.dataset.salahMobileDropIndex);
  if (
    !["home", "dock"].includes(surface) ||
    !Number.isInteger(index)
  ) {
    return null;
  }

  return {
    surface,
    index,
    rect: slot.getBoundingClientRect(),
  };
}

function describeDrop(id, candidate) {
  const appName = APPS[id]?.title ?? "Application";
  const surfaceName =
    candidate.surface === "home"
      ? MOBILE_COPY.navigation.home
      : MOBILE_COPY.dockLabel;
  return `${appName} moved to ${surfaceName} position ${candidate.index + 1}.`;
}

export default function MobileOS({
  ready,
  typedIntroduction,
  onReplayIntro,
  canReplay,
}) {
  const [state, dispatch] = useReducer(
    mobileReducer,
    undefined,
    getInitialState,
  );
  const rootRef = useRef(null);
  const longPressTimerRef = useRef(null);
  const dragSettleTimerRef = useRef(null);
  const dragFrameRef = useRef(null);
  const suppressionTimerRef = useRef(null);
  const pointerSessionRef = useRef(null);
  const suppressClickRef = useRef(false);
  const layoutRectsRef = useRef(new Map());
  const pendingLauncherFocusRef = useRef(null);
  const notificationCycleRef = useRef(-1);
  const [dragState, setDragState] = useState(null);
  const [announcement, setAnnouncement] = useState("");
  const { time, date } = useSystemClock();
  const { playMobileNotification } = useSalahAudio({
    enabled: behavior.audio.enabled,
    volume: behavior.audio.mobileShellVolume,
  });

  useEffect(() => {
    try {
      const normalizedLayout = normalizeLauncherLayout(
        state.launcher.homeSlots,
        state.launcher.dockOrder,
      );
      window.localStorage.setItem(
        LAYOUT_STORAGE_KEY,
        JSON.stringify({
          version: LAYOUT_VERSION,
          homeSlots: normalizedLayout.homeSlots,
          dockOrder: normalizedLayout.dockOrder,
        }),
      );
    } catch {
      // A private or restricted browsing context can reject storage.
    }
  }, [state.launcher.dockOrder, state.launcher.homeSlots]);

  useEffect(
    () => () => {
      window.clearTimeout(longPressTimerRef.current);
      window.clearTimeout(dragSettleTimerRef.current);
      window.clearTimeout(suppressionTimerRef.current);
      window.cancelAnimationFrame(dragFrameRef.current);
    },
    [],
  );

  useEffect(() => {
    if (!ready) {
      notificationCycleRef.current = -1;
      dispatch({ type: "RESET_GREETING" });
      return undefined;
    }

    if (
      state.view !== "home" ||
      state.greetingPhase !== "queued"
    ) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      dispatch({ type: "DELIVER_GREETING" });
    }, behavior.notification.deliveryDelayMs);
    return () => window.clearTimeout(timer);
  }, [
    ready,
    state.greetingPhase,
    state.motionKey,
    state.view,
  ]);

  useEffect(() => {
    if (state.greetingPhase !== "entering") return undefined;

    if (notificationCycleRef.current !== state.motionKey) {
      notificationCycleRef.current = state.motionKey;
      void playMobileNotification({
        volume: behavior.audio.mobileNotificationVolume,
        maxDelayMs: behavior.notification.audioMaxDelayMs,
      });
    }
    const timer = window.setTimeout(() => {
      dispatch({ type: "SETTLE_GREETING" });
    }, behavior.notification.settleMs);
    return () => window.clearTimeout(timer);
  }, [
    playMobileNotification,
    state.greetingPhase,
    state.motionKey,
  ]);

  useLayoutEffect(() => {
    if (!rootRef.current || typeof Element === "undefined") return;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const nextRects = new Map();
    const nodes = rootRef.current.querySelectorAll(
      "[data-salah-mobile-layout-key]",
    );

    nodes.forEach((node) => {
      const key = node.dataset.salahMobileLayoutKey;
      const rect = node.getBoundingClientRect();
      nextRects.set(key, rect);
      const previous = layoutRectsRef.current.get(key);
      if (!previous || reduceMotion || typeof node.animate !== "function") {
        return;
      }

      const deltaX = previous.left - rect.left;
      const deltaY = previous.top - rect.top;
      if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) return;

      node.animate(
        [
          { transform: `translate3d(${deltaX}px, ${deltaY}px, 0)` },
          { transform: "translate3d(0, 0, 0)" },
        ],
        {
          duration: DRAG_SETTLE_MS,
          easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
        },
      );
    });

    layoutRectsRef.current = nextRects;
    const pendingFocus = pendingLauncherFocusRef.current;
    if (pendingFocus) {
      const focusTarget = Array.from(nodes).find(
        (node) =>
          node.dataset.salahMobileAppId === pendingFocus.id &&
          node.dataset.salahMobileAppSurface ===
            pendingFocus.surface &&
          Number(node.dataset.salahMobileAppIndex) ===
            pendingFocus.index,
      );
      focusTarget?.focus({ preventScroll: true });
      pendingLauncherFocusRef.current = null;
    }
  }, [state.launcher.dockOrder, state.launcher.homeSlots]);

  useEffect(() => {
    if (!ready) return undefined;
    const frame = window.requestAnimationFrame(() => {
      rootRef.current
        ?.querySelector("[data-salah-mobile-view-heading]")
        ?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [ready, state.activeAppId, state.motionKey, state.view]);

  const openApp = useCallback((id) => {
    if (id === PAPERTRAIL_APP_ID) {
      void preloadResumePreview(RESUME_URL).catch(() => undefined);
    }

    dispatch({
      type: "OPEN_APP",
      id,
      page: id === BROWSER_APP_ID ? GITHUB_PAGE : undefined,
    });
  }, []);

  const reopenApp = useCallback((id) => {
    if (id === PAPERTRAIL_APP_ID) {
      void preloadResumePreview(RESUME_URL).catch(() => undefined);
    }

    dispatch({ type: "OPEN_APP", id });
  }, []);

  const openBrowser = useCallback((page) => {
    dispatch({
      type: "OPEN_APP",
      id: BROWSER_APP_ID,
      page,
      nested: true,
    });
  }, []);

  const setEditMode = useCallback((value) => {
    dispatch({ type: "SET_EDIT_MODE", value });
    setAnnouncement(
      value
        ? `Arrange mode on. Drag icons between ${MOBILE_COPY.navigation.home} and the ${MOBILE_COPY.dockLabel} dock, or use the keyboard.`
        : "Icon arrangement finished.",
    );
    if (value) vibrate();
  }, []);

  const updateDragPosition = useCallback((session) => {
    if (!rootRef.current) return;
    const viewportRect = rootRef.current.getBoundingClientRect();
    rootRef.current.style.setProperty(
      "--salah-mobile-drag-x",
      `${session.clientX - viewportRect.left}px`,
    );
    rootRef.current.style.setProperty(
      "--salah-mobile-drag-y",
      `${session.clientY - viewportRect.top}px`,
    );
    rootRef.current.style.setProperty(
      "--salah-mobile-drag-grab-x",
      `${session.grabOffsetX}px`,
    );
    rootRef.current.style.setProperty(
      "--salah-mobile-drag-grab-y",
      `${session.grabOffsetY}px`,
    );
    rootRef.current.style.setProperty(
      "--salah-mobile-drag-width",
      `${session.sourceRect.width}px`,
    );
    rootRef.current.style.setProperty(
      "--salah-mobile-drag-height",
      `${session.sourceRect.height}px`,
    );
  }, []);

  const scheduleDragPosition = useCallback(
    (session) => {
      window.cancelAnimationFrame(dragFrameRef.current);
      dragFrameRef.current = window.requestAnimationFrame(() => {
        updateDragPosition(session);
      });
    },
    [updateDragPosition],
  );

  const beginPointerDrag = useCallback(
    (session) => {
      if (
        !session ||
        pointerSessionRef.current !== session ||
        session.dragging
      ) {
        return;
      }

      session.dragging = true;
      suppressClickRef.current = true;
      updateDragPosition(session);
      dispatch({ type: "SET_EDIT_MODE", value: true });
      dispatch({ type: "SELECT_APP", id: session.id });
      setDragState({
        id: session.id,
        sourceSurface: session.sourceSurface,
        sourceIndex: session.sourceIndex,
        candidate: null,
        phase: "dragging",
      });
      setAnnouncement(
        `${APPS[session.id].title} picked up. Move to a ${MOBILE_COPY.navigation.home} or ${MOBILE_COPY.dockLabel} dock slot.`,
      );
      vibrate();
    },
    [updateDragPosition],
  );

  const handleAppPointerDown = useCallback(
    (event, id, sourceSurface, sourceIndex) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;

      window.clearTimeout(longPressTimerRef.current);
      window.clearTimeout(dragSettleTimerRef.current);
      event.currentTarget.setPointerCapture?.(event.pointerId);
      const sourceRect = event.currentTarget.getBoundingClientRect();
      const session = {
        id,
        pointerId: event.pointerId,
        sourceSurface,
        sourceIndex,
        startX: event.clientX,
        startY: event.clientY,
        clientX: event.clientX,
        clientY: event.clientY,
        grabOffsetX: event.clientX - sourceRect.left,
        grabOffsetY: event.clientY - sourceRect.top,
        sourceRect,
        sourceElement: event.currentTarget,
        dragging: false,
        candidate: null,
        candidateKey: "",
      };
      pointerSessionRef.current = session;

      if (state.launcher.editMode) {
        beginPointerDrag(session);
        return;
      }

      longPressTimerRef.current = window.setTimeout(() => {
        beginPointerDrag(session);
      }, LONG_PRESS_MS);
    },
    [beginPointerDrag, state.launcher.editMode],
  );

  const handleAppPointerMove = useCallback(
    (event) => {
      const session = pointerSessionRef.current;
      if (!session || session.pointerId !== event.pointerId) return;

      if (!session.dragging) {
        const distance = Math.hypot(
          event.clientX - session.startX,
          event.clientY - session.startY,
        );
        if (distance > DRAG_THRESHOLD_PX) {
          window.clearTimeout(longPressTimerRef.current);
        }
        return;
      }

      event.preventDefault();
      session.clientX = event.clientX;
      session.clientY = event.clientY;
      scheduleDragPosition(session);

      const candidate = getDropCandidate(
        rootRef.current,
        event.clientX,
        event.clientY,
      );
      const candidateKey = candidate
        ? `${candidate.surface}:${candidate.index}`
        : "";
      if (candidateKey === session.candidateKey) {
        session.candidate = candidate;
        return;
      }

      session.candidate = candidate;
      session.candidateKey = candidateKey;
      setDragState((current) =>
        current
          ? {
              ...current,
              candidate: candidate
                ? {
                    surface: candidate.surface,
                    index: candidate.index,
                  }
                : null,
            }
          : current,
      );
      if (candidate) vibrate();
    },
    [scheduleDragPosition],
  );

  const finishPointerSession = useCallback((event, cancelled = false) => {
    window.clearTimeout(longPressTimerRef.current);
    window.cancelAnimationFrame(dragFrameRef.current);

    const session = pointerSessionRef.current;
    if (!session) return;
    pointerSessionRef.current = null;

    if (
      event?.currentTarget?.hasPointerCapture?.(session.pointerId)
    ) {
      event.currentTarget.releasePointerCapture(session.pointerId);
    }

    if (!session.dragging) return;

    event?.preventDefault?.();
    event?.stopPropagation?.();
    suppressClickRef.current = true;
    window.clearTimeout(suppressionTimerRef.current);
    suppressionTimerRef.current = window.setTimeout(() => {
      suppressClickRef.current = false;
    }, behavior.mobileLauncher.clickSuppressionMs);

    const candidate = cancelled ? null : session.candidate;
    const settleRect = candidate?.rect ?? session.sourceRect;
    if (rootRef.current && settleRect) {
      const viewportRect = rootRef.current.getBoundingClientRect();
      rootRef.current.style.setProperty(
        "--salah-mobile-drag-x",
        `${
          settleRect.left -
          viewportRect.left +
          session.grabOffsetX
        }px`,
      );
      rootRef.current.style.setProperty(
        "--salah-mobile-drag-y",
        `${
          settleRect.top -
          viewportRect.top +
          session.grabOffsetY
        }px`,
      );
    }

    setDragState((current) =>
      current
        ? {
            ...current,
            candidate: candidate
              ? {
                  surface: candidate.surface,
                  index: candidate.index,
                }
              : null,
            phase: candidate ? "settling" : "returning",
          }
        : current,
    );

    if (candidate) {
      dispatch({
        type: "COMMIT_DROP",
        id: session.id,
        sourceSurface: session.sourceSurface,
        sourceIndex: session.sourceIndex,
        targetSurface: candidate.surface,
        targetIndex: candidate.index,
      });
      setAnnouncement(describeDrop(session.id, candidate));
      vibrate();
    } else {
      setAnnouncement(`${APPS[session.id].title} returned to its place.`);
    }

    window.clearTimeout(dragSettleTimerRef.current);
    dragSettleTimerRef.current = window.setTimeout(() => {
      setDragState(null);
    }, DRAG_SETTLE_MS);
  }, []);

  const handleAppPointerUp = useCallback(
    (event) => finishPointerSession(event, false),
    [finishPointerSession],
  );

  const handleAppPointerCancel = useCallback(
    (event) => finishPointerSession(event, true),
    [finishPointerSession],
  );

  const handleAppClick = useCallback(
    (event, id) => {
      if (suppressClickRef.current) {
        event.preventDefault();
        event.stopPropagation();
        suppressClickRef.current = false;
        return;
      }

      if (!state.launcher.editMode) {
        openApp(id);
      } else {
        dispatch({ type: "SELECT_APP", id });
      }
    },
    [openApp, state.launcher.editMode],
  );

  const handleAppKeyDown = useCallback(
    (event, id, sourceSurface, sourceIndex) => {
      if (!state.launcher.editMode) return;

      if (
        sourceSurface === "home" &&
        (event.key === "Delete" || event.key === "Backspace")
      ) {
        event.preventDefault();
        dispatch({ type: "REMOVE_HOME_SHORTCUT", id });
        setAnnouncement(
          `${APPS[id].title} removed from ${MOBILE_COPY.navigation.home}. It remains in ${MOBILE_COPY.dockLabel}.`,
        );
        vibrate();
        return;
      }

      if (
        sourceSurface === "dock" &&
        event.shiftKey &&
        event.key === "ArrowUp"
      ) {
        event.preventDefault();
        const existingIndex = state.launcher.homeSlots.indexOf(id);
        const firstOpenIndex = state.launcher.homeSlots.findIndex(
          (slot) => slot === null,
        );
        const targetIndex =
          existingIndex >= 0 ? existingIndex : firstOpenIndex;
        if (targetIndex < 0) {
          setAnnouncement(
            `${MOBILE_COPY.navigation.home} has no empty shortcut positions.`,
          );
          return;
        }
        pendingLauncherFocusRef.current = {
          id,
          surface: "home",
          index: targetIndex,
        };
        dispatch({
          type: "COMMIT_DROP",
          id,
          sourceSurface,
          sourceIndex,
          targetSurface: "home",
          targetIndex,
        });
        setAnnouncement(
          `${APPS[id].title} added to ${MOBILE_COPY.navigation.home} position ${targetIndex + 1}.`,
        );
        vibrate();
        return;
      }

      if (
        sourceSurface === "home" &&
        event.shiftKey &&
        event.key === "ArrowDown"
      ) {
        event.preventDefault();
        dispatch({ type: "REMOVE_HOME_SHORTCUT", id });
        setAnnouncement(
          `${APPS[id].title} removed from ${MOBILE_COPY.navigation.home}. It remains in ${MOBILE_COPY.dockLabel}.`,
        );
        vibrate();
        return;
      }

      const columnCount = HOME_GRID_COLUMNS;
      const currentColumn = sourceIndex % columnCount;
      const itemCount =
        sourceSurface === "home"
          ? HOME_SLOT_COUNT
          : DOCK_SLOT_COUNT;
      let targetIndex = sourceIndex;

      if (event.key === "ArrowLeft" && currentColumn > 0) {
        targetIndex -= 1;
      } else if (
        event.key === "ArrowRight" &&
        currentColumn < columnCount - 1 &&
        sourceIndex + 1 < itemCount
      ) {
        targetIndex += 1;
      } else if (
        event.key === "ArrowUp" &&
        sourceIndex - columnCount >= 0
      ) {
        targetIndex -= columnCount;
      } else if (
        event.key === "ArrowDown" &&
        sourceIndex + columnCount < itemCount
      ) {
        targetIndex += columnCount;
      } else {
        return;
      }

      event.preventDefault();
      if (targetIndex === sourceIndex) return;
      pendingLauncherFocusRef.current = {
        id,
        surface: sourceSurface,
        index: targetIndex,
      };
      dispatch({
        type: "COMMIT_DROP",
        id,
        sourceSurface,
        sourceIndex,
        targetSurface: sourceSurface,
        targetIndex,
      });
      setAnnouncement(
        `${APPS[id].title} moved to ${sourceSurface} position ${targetIndex + 1}.`,
      );
      vibrate();
    },
    [
      state.launcher.editMode,
      state.launcher.homeSlots,
    ],
  );

  useEffect(() => {
    const cancelActiveDrag = () => {
      if (pointerSessionRef.current?.dragging) {
        finishPointerSession(null, true);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key !== "Escape") return;
      if (pointerSessionRef.current?.dragging) {
        event.preventDefault();
        cancelActiveDrag();
        return;
      }
      if (state.launcher.editMode) {
        dispatch({ type: "BACK" });
        setAnnouncement("Icon arrangement finished.");
      }
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") cancelActiveDrag();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", cancelActiveDrag);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", cancelActiveDrag);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
    };
  }, [
    finishPointerSession,
    state.launcher.editMode,
  ]);

  const closeRecent = useCallback(
    (id) => {
      dispatch({ type: "CLOSE_RECENT", id });
      setAnnouncement(`${APPS[id].title} closed.`);
    },
    [],
  );

  return (
    <div
      ref={rootRef}
      className={`hero-content salah-mobile-os salah-mobile-os--${state.view} ${
        ready ? "salah-mobile-is-ready" : "salah-mobile-is-waiting"
      } ${
        state.launcher.editMode ? "salah-mobile-is-arranging" : ""
      } ${
        dragState ? "salah-mobile-is-dragging" : ""
      }`}
      aria-hidden={!ready}
      inert={!ready ? true : undefined}
    >
      <div className="salah-mobile-wallpaper" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <StatusBar time={time} />

      <div
        className="salah-mobile-stage"
      >
        {state.view === "home" && (
          <HomeScreen
            state={state}
            dragState={dragState}
            typedIntroduction={typedIntroduction}
            canReplay={canReplay}
            onReplayIntro={onReplayIntro}
            onSetEditMode={setEditMode}
            onGreetingAnimationEnd={() =>
              dispatch({ type: "SETTLE_GREETING" })
            }
            onAppPointerDown={handleAppPointerDown}
            onAppPointerMove={handleAppPointerMove}
            onAppPointerUp={handleAppPointerUp}
            onAppPointerCancel={handleAppPointerCancel}
            onAppKeyDown={handleAppKeyDown}
            onAppClick={handleAppClick}
            date={date}
          />
        )}

        {state.recentIds.map((id) => {
          const isActive =
            state.view === "app" && state.activeAppId === id;

          return (
            <div
              className={`salah-mobile-running-app ${
                isActive ? "salah-mobile-is-active" : ""
              }`}
              key={id}
              hidden={!isActive}
              inert={!isActive ? true : undefined}
              aria-hidden={!isActive}
            >
              <AppScreen
                appId={id}
                browserPage={state.browserPage}
                onBack={() => dispatch({ type: "BACK" })}
                onOpenBrowser={openBrowser}
              />
            </div>
          );
        })}

        {state.view === "recents" && (
          <RecentsScreen
            recentIds={state.recentIds}
            onOpen={reopenApp}
            onClose={closeRecent}
            onCloseAll={() => {
              dispatch({ type: "CLOSE_ALL" });
              setAnnouncement("All recent apps closed.");
            }}
          />
        )}
      </div>

      <DragLayer dragState={dragState} />

      <SystemNavigation
        onBack={() => dispatch({ type: "BACK" })}
        onHome={() => dispatch({ type: "HOME" })}
        onRecents={() => dispatch({ type: "SHOW_RECENTS" })}
      />

      <span
        className="salah-mobile-announcer sr-only"
        role="status"
        aria-live="polite"
      >
        {announcement}
      </span>
    </div>
  );
}
