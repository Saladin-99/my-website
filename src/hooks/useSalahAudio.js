import { useCallback, useEffect, useMemo, useState } from "react";
import { salahAudio } from "../audio/salahAudio";

function usePrefersReducedMotion(enabled) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (!enabled || typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      setPrefersReducedMotion(false);
      return undefined;
    }

    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(query.matches);
    updatePreference();
    if (typeof query.addEventListener === "function") {
      query.addEventListener("change", updatePreference);
    } else {
      query.addListener?.(updatePreference);
    }

    return () => {
      if (typeof query.removeEventListener === "function") {
        query.removeEventListener("change", updatePreference);
      } else {
        query.removeListener?.(updatePreference);
      }
    };
  }, [enabled]);

  return prefersReducedMotion;
}

/**
 * Lightweight synthesized interface sounds.
 *
 * Cue functions return a Promise<boolean>: true means the sound was scheduled,
 * false means it was muted, reduced, throttled, unsupported, or autoplay-blocked.
 * Browsers only allow audio after a user gesture; the engine primes itself on
 * the first pointer, touch, or keyboard interaction and never throws if a
 * pre-gesture cue cannot be played.
 */
export function useSalahAudio({
  enabled = true,
  volume = 1,
  reducedSensory,
  respectReducedMotion = true,
} = {}) {
  const prefersReducedMotion = usePrefersReducedMotion(
    respectReducedMotion && reducedSensory === undefined,
  );
  const shouldReduce =
    reducedSensory === undefined ? prefersReducedMotion : reducedSensory;

  useEffect(() => salahAudio.acquire(), []);

  const baseOptions = useMemo(
    () => ({
      enabled,
      reducedSensory: shouldReduce,
      volume,
    }),
    [enabled, shouldReduce, volume],
  );

  const withOptions = useCallback(
    (play, options) => play({ ...baseOptions, ...options }),
    [baseOptions],
  );

  const playMobileTap = useCallback(
    (options) =>
      withOptions((settings) => salahAudio.playMobileTap(settings), options),
    [withOptions],
  );
  const playMobileUnlock = useCallback(
    (options) =>
      withOptions(
        (settings) => salahAudio.playMobileUnlock(settings),
        options,
      ),
    [withOptions],
  );
  const playMobileNotification = useCallback(
    (options) =>
      withOptions(
        (settings) => salahAudio.playMobileNotification(settings),
        options,
      ),
    [withOptions],
  );
  const playDesktopClick = useCallback(
    (options) =>
      withOptions((settings) => salahAudio.playDesktopClick(settings), options),
    [withOptions],
  );
  const playDesktopLogin = useCallback(
    (options) =>
      withOptions((settings) => salahAudio.playDesktopLogin(settings), options),
    [withOptions],
  );

  return useMemo(
    () => ({
      activate: (options) => salahAudio.activate(options),
      getState: () => salahAudio.getState(),
      playDesktopClick,
      playDesktopLogin,
      playMobileNotification,
      playMobileTap,
      playMobileUnlock,
      setMuted: (muted) => salahAudio.setMuted(muted),
      stopAll: (fadeSeconds) => salahAudio.stopAll(fadeSeconds),
      toggleMuted: () => salahAudio.toggleMuted(),
    }),
    [
      playDesktopClick,
      playDesktopLogin,
      playMobileNotification,
      playMobileTap,
      playMobileUnlock,
    ],
  );
}
