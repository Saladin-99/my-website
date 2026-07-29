import { useEffect, useRef, useState } from "react";
import { salahAudio } from "../../audio/salahAudio";
import { portfolioConfig } from "../../portfolio.config";
import { publicAsset } from "../../portfolio.runtime";
import {
  DESKTOP_INTRO_TIMING,
  MOBILE_INTRO_TIMING,
} from "./introTiming";

const {
  assets,
  behavior,
  copy,
  site,
} = portfolioConfig;
const BOOT_COPY = copy.boot;
const DESKTOP_BOOT_COPY = BOOT_COPY.desktop;
const MOBILE_BOOT_COPY = BOOT_COPY.mobile;
const OS_MARK = publicAsset(assets.osMark);
const SESSION_PASSWORD = DESKTOP_BOOT_COPY.password;
const DESKTOP_INTERACTION =
  behavior.intro.interactions?.desktop ?? {};
const MOBILE_INTERACTION =
  behavior.intro.interactions?.mobile ?? {};
const SLIDE_COMPLETION_THRESHOLD =
  MOBILE_INTERACTION.slideCompletionThreshold ?? 0.82;
const SLIDE_KEYBOARD_STEP =
  MOBILE_INTERACTION.slideKeyboardStep ?? 0.16;

function waitForPhase(duration, signal) {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve(false);
      return;
    }

    const finish = (completed) => {
      window.clearTimeout(timer);
      signal.removeEventListener("abort", handleAbort);
      resolve(completed);
    };
    const handleAbort = () => finish(false);
    const timer = window.setTimeout(() => finish(true), duration);
    signal.addEventListener("abort", handleAbort, { once: true });
  });
}

function waitForPaint(signal) {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve(false);
      return;
    }

    let firstFrame;
    let secondFrame;
    let settled = false;

    const finish = (completed) => {
      if (settled) return;
      settled = true;
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
      signal.removeEventListener("abort", handleAbort);
      resolve(completed);
    };
    const handleAbort = () => finish(false);

    signal.addEventListener("abort", handleAbort, { once: true });
    firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => finish(true));
    });
  });
}

function waitForInteraction(signal, resolverRef) {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve(false);
      return;
    }

    let settled = false;
    const finish = (completed) => {
      if (settled) return;
      settled = true;
      signal.removeEventListener("abort", handleAbort);
      if (resolverRef.current === handleInteraction) {
        resolverRef.current = null;
      }
      resolve(completed);
    };
    const handleAbort = () => finish(false);
    const handleInteraction = () => finish(true);

    resolverRef.current = handleInteraction;
    signal.addEventListener("abort", handleAbort, { once: true });
  });
}

function activateAudioFromGesture(event) {
  if (!behavior.audio.enabled || !event.isTrusted) return;
  void salahAudio.activate({ fromGesture: true });
}

function SessionPasswordField({ locked, visibleCharacters }) {
  return (
    <span
      className={`session-password-field ${
        locked ? "is-locked" : ""
      }`}
    >
      <input
        type="password"
        value={SESSION_PASSWORD.slice(0, visibleCharacters)}
        disabled={locked}
        readOnly
        tabIndex={-1}
        autoComplete="off"
        aria-label={DESKTOP_BOOT_COPY.passwordLabel}
      />
    </span>
  );
}

function BootLogo({ device }) {
  const desktop = device === "desktop";

  return (
    <div className={`os-boot-logo os-boot-logo--${device}`}>
      <img
        src={OS_MARK}
        alt=""
        decoding="async"
        fetchPriority="high"
        loading="eager"
      />
      <p
        className={`os-boot-name os-boot-name--${device}`}
      >
        {BOOT_COPY.osName}
        {!desktop && <sup>{MOBILE_BOOT_COPY.osSuffix}</sup>}
      </p>
      {desktop && (
        <>
          <div className="os-boot-track" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <p className="os-boot-status">
            {DESKTOP_BOOT_COPY.startupStatus}
          </p>
        </>
      )}
    </div>
  );
}

function DesktopBoot({
  active,
  onHandoffStart,
  onInteractionWaitChange,
}) {
  const [phase, setPhase] = useState("waiting");
  const [visibleCharacters, setVisibleCharacters] = useState(0);
  const [awaitingAccount, setAwaitingAccount] = useState(false);
  const [accountSelected, setAccountSelected] = useState(false);
  const accountButtonRef = useRef(null);
  const accountResolverRef = useRef(null);
  const accountSelectionCommittedRef = useRef(false);
  const loginTunePlayedRef = useRef(false);

  useEffect(() => {
    if (!awaitingAccount) return undefined;

    const focusFrame = window.requestAnimationFrame(() => {
      accountButtonRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(focusFrame);
  }, [awaitingAccount]);

  useEffect(() => {
    if (!active) {
      onInteractionWaitChange?.(false);
      return undefined;
    }

    const controller = new AbortController();
    const { signal } = controller;

    const runSequence = async () => {
      loginTunePlayedRef.current = false;
      accountSelectionCommittedRef.current = false;
      setVisibleCharacters(0);
      setAwaitingAccount(false);
      setAccountSelected(false);
      setPhase("boot");
      onInteractionWaitChange?.(false);

      if (
        !(await waitForPhase(DESKTOP_INTRO_TIMING.bootMs, signal))
      ) {
        return;
      }
      setPhase("login");

      if (
        !(await waitForPhase(
          DESKTOP_INTRO_TIMING.loginRevealMs,
          signal,
        ))
      ) {
        return;
      }

      setAwaitingAccount(true);
      onInteractionWaitChange?.(true);
      if (!(await waitForInteraction(signal, accountResolverRef))) {
        return;
      }
      setAwaitingAccount(false);
      onInteractionWaitChange?.(false);

      // Give the account card time to unfold its authentication controls
      // before password entry begins. Waiting through a painted frame first
      // keeps the expansion and first character from landing in one commit.
      if (!(await waitForPaint(signal))) return;
      if (
        !(await waitForPhase(
          DESKTOP_INTRO_TIMING.accountRevealMs,
          signal,
        ))
      ) {
        return;
      }
      setPhase("typing");

      for (
        let index = 0;
        index < DESKTOP_INTRO_TIMING.passwordCharacterMs.length;
        index += 1
      ) {
        if (
          !(await waitForPhase(
            DESKTOP_INTRO_TIMING.passwordCharacterMs[index],
            signal,
          ))
        ) {
          return;
        }
        setVisibleCharacters(index + 1);
      }

      // Let React commit the final character and the browser paint it before
      // confirmation begins. Two frames remove the visual pause without
      // allowing the final mask glyph to be skipped on a busy device.
      if (!(await waitForPaint(signal))) return;
      setPhase("authenticated");
      if (
        behavior.audio.enabled &&
        !loginTunePlayedRef.current
      ) {
        loginTunePlayedRef.current = true;
        void salahAudio.playDesktopLogin({
          deferUntilActive: true,
          maxDelayMs: behavior.audio.desktopLoginMaxDelayMs,
          reducedSensory: window.matchMedia(
            "(prefers-reduced-motion: reduce)",
          ).matches,
          volume: behavior.audio.desktopLoginVolume,
        });
      }

      if (
        !(await waitForPhase(
          DESKTOP_INTRO_TIMING.authenticationMs,
          signal,
        ))
      ) {
        return;
      }
      setPhase("handoff");
      onHandoffStart?.();
    };

    runSequence();
    return () => {
      controller.abort();
      onInteractionWaitChange?.(false);
    };
  }, [
    active,
    onHandoffStart,
    onInteractionWaitChange,
  ]);

  const handleAccountPointerDown = (event) => {
    event.stopPropagation();
    if (!awaitingAccount) return;
    activateAudioFromGesture(event);
  };

  const handleAccountKeyDown = (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.stopPropagation();
    if (!awaitingAccount) return;
    activateAudioFromGesture(event);
  };

  const handleAccountSelect = (event) => {
    event.stopPropagation();
    if (
      !awaitingAccount ||
      accountSelectionCommittedRef.current
    ) {
      return;
    }

    activateAudioFromGesture(event);
    accountSelectionCommittedRef.current = true;
    accountButtonRef.current?.blur();
    setAccountSelected(true);
    accountResolverRef.current?.();
  };

  const authenticated =
    phase === "authenticated" || phase === "handoff";
  const showingAccountPrompt =
    !accountSelected &&
    (phase === "boot" || phase === "login");
  const sessionMessage =
    phase === "handoff"
      ? DESKTOP_BOOT_COPY.statuses.handoff
      : authenticated
        ? DESKTOP_BOOT_COPY.statuses.authenticated
        : phase === "typing"
          ? DESKTOP_BOOT_COPY.statuses.typing
          : awaitingAccount
            ? (DESKTOP_BOOT_COPY.statuses.awaitingSelection ??
              DESKTOP_BOOT_COPY.statuses.idle)
            : DESKTOP_BOOT_COPY.statuses.idle;

  return (
    <div
      className={`device-boot device-boot--desktop is-${phase} ${
        showingAccountPrompt ? "is-account-prompt" : ""
      } ${
        awaitingAccount ? "is-awaiting-account" : ""
      } ${accountSelected ? "is-account-selected" : ""}`}
      data-interaction-wait={
        awaitingAccount ? "account" : undefined
      }
      aria-hidden={awaitingAccount ? undefined : true}
      style={{
        "--account-pulse-duration": `${
          DESKTOP_INTERACTION.accountPulseMs ?? 2200
        }ms`,
        "--account-shine-duration": `${
          DESKTOP_INTERACTION.accountShineMs ?? 2650
        }ms`,
        "--account-reveal-duration": `${
          DESKTOP_INTRO_TIMING.accountRevealMs
        }ms`,
      }}
    >
      <BootLogo device="desktop" />

      <div className="desktop-login">
        <div className="session-menubar">
          <span className="session-menu-gems" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <strong>{BOOT_COPY.osName}</strong>
          <span>{DESKTOP_BOOT_COPY.gateLabel}</span>
        </div>

        <div className="session-scenery" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>

        <section className="session-cartridge">
          <header>
            <span>{DESKTOP_BOOT_COPY.workstationLabel}</span>
            <i aria-hidden="true">◇</i>
          </header>

          <p
            className="session-selection-instruction"
            id="desktop-account-instruction"
          >
            {DESKTOP_BOOT_COPY.selectionInstruction}
          </p>

          <button
            ref={accountButtonRef}
            className={`session-account session-account-select ${
              awaitingAccount ? "is-awaiting-selection" : ""
            } ${accountSelected ? "is-selected" : ""}`}
            type="button"
            data-ready={awaitingAccount ? "true" : "false"}
            data-selected={accountSelected ? "true" : "false"}
            disabled={!awaitingAccount}
            aria-label={
              DESKTOP_BOOT_COPY.accountActionLabel ??
              `${DESKTOP_BOOT_COPY.welcomeLabel}, ${DESKTOP_BOOT_COPY.accountName}`
            }
            aria-describedby="desktop-account-instruction"
            onPointerDown={handleAccountPointerDown}
            onKeyDown={handleAccountKeyDown}
            onClick={handleAccountSelect}
          >
            <div className="session-portrait">
              <img
                src={OS_MARK}
                alt=""
                decoding="async"
                loading="eager"
              />
              <span aria-hidden="true" />
            </div>
            <div className="session-account-identity">
              <p>{DESKTOP_BOOT_COPY.welcomeLabel}</p>
              <strong>{DESKTOP_BOOT_COPY.accountName}</strong>
              <small>{DESKTOP_BOOT_COPY.accountSubtitle}</small>
            </div>
          </button>

          <div
            className="session-key session-authentication-control"
            data-visible={accountSelected ? "true" : "false"}
            aria-hidden={accountSelected ? undefined : true}
          >
            <span>{DESKTOP_BOOT_COPY.passwordLabel}</span>
            <SessionPasswordField
              locked={
                !accountSelected ||
                visibleCharacters >= SESSION_PASSWORD.length
              }
              visibleCharacters={visibleCharacters}
            />
          </div>

          <footer
            className="session-authentication-control session-authentication-status"
            data-visible={accountSelected ? "true" : "false"}
            aria-hidden={accountSelected ? undefined : true}
          >
            <span className="session-ready-light" aria-hidden="true" />
            <span id="desktop-session-status">{sessionMessage}</span>
            <span className="session-enter" aria-hidden="true">
              {authenticated ? "✓" : "↳"}
            </span>
          </footer>
        </section>

        <div className="session-footer">
          <span>
            <i aria-hidden="true">◌</i>
            {DESKTOP_BOOT_COPY.footerSleep}
          </span>
          <span>
            {DESKTOP_BOOT_COPY.footerProfilePrefix}{" "}
            <strong>{site.domainLabel}</strong>
          </span>
          <span>
            {DESKTOP_BOOT_COPY.footerAudio}{" "}
            <i aria-hidden="true">◖</i>
          </span>
        </div>
      </div>
    </div>
  );
}

function MobileUnlock({
  active,
  onHandoffStart,
  onInteractionWaitChange,
  onSequenceComplete,
}) {
  const [phase, setPhase] = useState("waiting");
  const [awaitingSlide, setAwaitingSlide] = useState(false);
  const [slideComplete, setSlideComplete] = useState(false);
  const [slideDragging, setSlideDragging] = useState(false);
  const [slideProgress, setSlideProgress] = useState(0);
  const [slideOffset, setSlideOffset] = useState(0);
  const slideTrackRef = useRef(null);
  const slideResolverRef = useRef(null);
  const slideProgressRef = useRef(0);
  const slideTravelRef = useRef(1);
  const slideDragRef = useRef(null);
  const slideCompletionCommittedRef = useRef(false);
  const unlockCuePlayedRef = useRef(false);
  const [{ time, date }] = useState(() => {
    const now = new Date();
    return {
      time: new Intl.DateTimeFormat(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      }).format(now),
      date: new Intl.DateTimeFormat(undefined, {
        weekday: "short",
        day: "numeric",
        month: "short",
      }).format(now),
    };
  });

  useEffect(() => {
    if (!awaitingSlide) return undefined;

    const refreshTravel = () => {
      const travel = measureSlideTravel();
      slideTravelRef.current = travel;
      setSlideOffset(travel * slideProgressRef.current);
    };
    const focusFrame = window.requestAnimationFrame(() => {
      refreshTravel();
      slideTrackRef.current?.focus({ preventScroll: true });
    });
    const resizeObserver =
      typeof ResizeObserver === "function"
        ? new ResizeObserver(refreshTravel)
        : null;
    if (slideTrackRef.current) {
      resizeObserver?.observe(slideTrackRef.current);
    }
    window.addEventListener("resize", refreshTravel, { passive: true });

    return () => {
      window.cancelAnimationFrame(focusFrame);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", refreshTravel);
    };
  }, [awaitingSlide]);

  function measureSlideTravel() {
    const track = slideTrackRef.current;
    const knob = track?.querySelector(".mobile-slide-knob");
    if (!track || !knob) return 1;

    return Math.max(
      track.getBoundingClientRect().width -
        knob.getBoundingClientRect().width -
        12,
      1,
    );
  }

  const updateSlidePosition = (nextProgress) => {
    const progress = Math.min(Math.max(nextProgress, 0), 1);
    slideProgressRef.current = progress;
    setSlideProgress(progress);
    setSlideOffset(slideTravelRef.current * progress);
  };

  const completeSlide = (event) => {
    if (
      !awaitingSlide ||
      slideCompletionCommittedRef.current
    ) {
      return;
    }

    activateAudioFromGesture(event);
    slideCompletionCommittedRef.current = true;
    slideTrackRef.current?.blur();
    setSlideDragging(false);
    updateSlidePosition(1);
    setSlideComplete(true);
    setAwaitingSlide(false);
    onInteractionWaitChange?.(false);
    slideResolverRef.current?.();
  };

  const resetSlide = () => {
    setSlideDragging(false);
    updateSlidePosition(0);
  };

  const handleSlidePointerDown = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!awaitingSlide) return;

    activateAudioFromGesture(event);
    const travel = measureSlideTravel();
    slideTravelRef.current = travel;
    slideDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startProgress: slideProgressRef.current,
      travel,
    };
    setSlideDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleSlidePointerMove = (event) => {
    const drag = slideDragRef.current;
    if (
      !awaitingSlide ||
      !drag ||
      drag.pointerId !== event.pointerId
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    updateSlidePosition(
      drag.startProgress +
        (event.clientX - drag.startX) / drag.travel,
    );
  };

  const handleSlidePointerEnd = (event) => {
    const drag = slideDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    event.preventDefault();
    event.stopPropagation();
    slideDragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (slideProgressRef.current >= SLIDE_COMPLETION_THRESHOLD) {
      completeSlide(event);
      return;
    }
    resetSlide();
  };

  const handleSlidePointerCancel = (event) => {
    const drag = slideDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    event.preventDefault();
    event.stopPropagation();
    slideDragRef.current = null;
    resetSlide();
  };

  const handleSlideKeyDown = (event) => {
    const completionKeys = ["Enter", " ", "End"];
    const movementKeys = [
      "ArrowLeft",
      "ArrowRight",
      "ArrowDown",
      "ArrowUp",
      "Home",
    ];
    if (
      !completionKeys.includes(event.key) &&
      !movementKeys.includes(event.key)
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    if (!awaitingSlide) return;
    activateAudioFromGesture(event);

    if (completionKeys.includes(event.key)) {
      completeSlide(event);
      return;
    }

    const nextProgress =
      event.key === "Home"
        ? 0
        : slideProgressRef.current +
          (event.key === "ArrowRight" || event.key === "ArrowUp"
            ? SLIDE_KEYBOARD_STEP
            : -SLIDE_KEYBOARD_STEP);
    if (nextProgress >= SLIDE_COMPLETION_THRESHOLD) {
      completeSlide(event);
      return;
    }
    updateSlidePosition(nextProgress);
  };

  useEffect(() => {
    if (!active) {
      onInteractionWaitChange?.(false);
      return undefined;
    }

    const controller = new AbortController();
    const { signal } = controller;

    const runSequence = async () => {
      unlockCuePlayedRef.current = false;
      slideCompletionCommittedRef.current = false;
      slideDragRef.current = null;
      slideProgressRef.current = 0;
      slideTravelRef.current = 1;
      setAwaitingSlide(false);
      setSlideComplete(false);
      setSlideDragging(false);
      setSlideProgress(0);
      setSlideOffset(0);
      setPhase("waiting");
      onInteractionWaitChange?.(false);
      if (
        !(await waitForPhase(
          MOBILE_INTRO_TIMING.screenHoldMs,
          signal,
        ))
      ) {
        return;
      }

      setPhase("wake");
      if (
        !(await waitForPhase(
          MOBILE_INTRO_TIMING.screenWakeMs,
          signal,
        ))
      ) {
        return;
      }

      setPhase("logo");
      if (
        !(await waitForPhase(
          MOBILE_INTRO_TIMING.logoHoldMs,
          signal,
        ))
      ) {
        return;
      }

      setPhase("gap");
      if (
        !(await waitForPhase(
          MOBILE_INTRO_TIMING.logoGapMs,
          signal,
        ))
      ) {
        return;
      }

      setPhase("slide");
      setAwaitingSlide(true);
      onInteractionWaitChange?.(true);
      if (!(await waitForInteraction(signal, slideResolverRef))) {
        return;
      }
      if (!(await waitForPaint(signal))) return;
      if (
        !(await waitForPhase(
          MOBILE_INTRO_TIMING.slideSettleMs,
          signal,
        ))
      ) {
        return;
      }

      setPhase("pattern");
      if (
        !(await waitForPhase(
          MOBILE_INTRO_TIMING.patternMs,
          signal,
        ))
      ) {
        return;
      }

      setPhase("success");
      if (
        behavior.audio.enabled &&
        !unlockCuePlayedRef.current
      ) {
        unlockCuePlayedRef.current = true;
        void salahAudio.playMobileUnlock({
          deferUntilActive: true,
          maxDelayMs: behavior.audio.mobileUnlockMaxDelayMs,
          reducedSensory: window.matchMedia(
            "(prefers-reduced-motion: reduce)",
          ).matches,
          volume: behavior.audio.mobileUnlockVolume,
        });
      }
      if (
        !(await waitForPhase(
          MOBILE_INTRO_TIMING.successMs,
          signal,
        ))
      ) {
        return;
      }

      setPhase("handoff");
      onHandoffStart?.();
      if (
        await waitForPhase(
          MOBILE_INTRO_TIMING.handoffMs,
          signal,
        )
      ) {
        onSequenceComplete?.("complete");
      }
    };

    runSequence();
    return () => {
      controller.abort();
      onInteractionWaitChange?.(false);
    };
  }, [
    active,
    onHandoffStart,
    onInteractionWaitChange,
    onSequenceComplete,
  ]);

  return (
    <div
      className={`device-boot device-boot--mobile is-${phase} ${
        awaitingSlide ? "is-awaiting-slide" : ""
      } ${slideDragging ? "is-dragging" : ""} ${
        slideComplete ? "is-slide-complete" : ""
      }`}
      data-interaction-wait={
        awaitingSlide ? "slide" : undefined
      }
      aria-hidden={awaitingSlide ? undefined : true}
      style={{
        "--slide-reset-duration": `${
          MOBILE_INTERACTION.slideResetMs ?? 240
        }ms`,
      }}
    >
      <BootLogo device="mobile" />

      <div className="mobile-lock-screen">
        <div className="mobile-lock-status">
          <span className="mobile-status-signal">◉ ◉ ◉</span>
          <strong className="mobile-status-brand">
            {MOBILE_BOOT_COPY.carrier}
          </strong>
          <span className="mobile-status-battery">▮</span>
        </div>

        <div className="mobile-lock-header">
          <p className="lock-time">{time}</p>
          <p className="lock-date">{date}</p>
        </div>

        <div className="mobile-slide-card">
          <div className="mobile-slide-brand">
            <img
              src={OS_MARK}
              alt=""
              decoding="async"
              loading="eager"
            />
            <span>
              <strong>{MOBILE_BOOT_COPY.productName}</strong>
              <small>{MOBILE_BOOT_COPY.productSubtitle}</small>
            </span>
          </div>
          <button
            ref={slideTrackRef}
            className="mobile-slide-track"
            type="button"
            role="slider"
            tabIndex={awaitingSlide ? 0 : -1}
            data-ready={awaitingSlide ? "true" : "false"}
            data-progress={slideProgress.toFixed(3)}
            aria-label={
              MOBILE_BOOT_COPY.slideActionLabel ??
              MOBILE_BOOT_COPY.slideLabel
            }
            aria-describedby={
              MOBILE_BOOT_COPY.slideHint
                ? "mobile-slide-hint"
                : undefined
            }
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={Math.round(slideProgress * 100)}
            aria-valuetext={`${Math.round(slideProgress * 100)}%`}
            aria-orientation="horizontal"
            style={{
              "--slide-progress": slideProgress,
              "--slide-offset": `${slideOffset}px`,
            }}
            onPointerDown={handleSlidePointerDown}
            onPointerMove={handleSlidePointerMove}
            onPointerUp={handleSlidePointerEnd}
            onPointerCancel={handleSlidePointerCancel}
            onLostPointerCapture={handleSlidePointerCancel}
            onKeyDown={handleSlideKeyDown}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
          >
            <span className="mobile-slide-knob">
              <span className="mobile-slide-glyph" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  focusable="false"
                  aria-hidden="true"
                >
                  <path d="m4.5 5.5 6.5 6.5-6.5 6.5M12 5.5l6.5 6.5-6.5 6.5" />
                </svg>
              </span>
            </span>
            <span className="mobile-slide-label">
              {MOBILE_BOOT_COPY.slideLabel}
            </span>
            <span className="mobile-slide-end">›</span>
          </button>
          {MOBILE_BOOT_COPY.slideHint && (
            <span className="sr-only" id="mobile-slide-hint">
              {MOBILE_BOOT_COPY.slideHint}
            </span>
          )}
        </div>

        <div className="pattern-card">
          <p>{MOBILE_BOOT_COPY.patternLabel}</p>
          <div className="pattern-grid">
            <svg viewBox="0 0 100 100" aria-hidden="true">
              <path d="M16.7 16.7 L83.3 16.7 L83.3 83.3 L16.7 83.3 L50 50" />
            </svg>
            {Array.from({ length: 9 }, (_, index) => (
              <span
                className={
                  [0, 2, 4, 6, 8].includes(index)
                    ? "is-pattern-node"
                    : ""
                }
                key={index}
              />
            ))}
          </div>
        </div>

        <div className="unlock-success">
          <span>✓</span>
          {MOBILE_BOOT_COPY.successLabel}
        </div>
      </div>
    </div>
  );
}

export default function DeviceBootOverlay({
  mode,
  active = false,
  onHandoffStart,
  onInteractionWaitChange,
  onSequenceComplete,
}) {
  return mode === "mobile" ? (
    <MobileUnlock
      active={active}
      onHandoffStart={onHandoffStart}
      onInteractionWaitChange={onInteractionWaitChange}
      onSequenceComplete={onSequenceComplete}
    />
  ) : (
    <DesktopBoot
      active={active}
      onHandoffStart={onHandoffStart}
      onInteractionWaitChange={onInteractionWaitChange}
    />
  );
}
