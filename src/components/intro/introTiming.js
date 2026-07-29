import { portfolioConfig } from "../../portfolio.config";

export const MOBILE_INTRO_TIMING = Object.freeze({
  ...portfolioConfig.behavior.intro.mobile,
});

export const MOBILE_INTRO_DURATION_MS = Object.values(
  MOBILE_INTRO_TIMING,
).reduce((total, duration) => total + duration, 0);

export const DESKTOP_INTRO_TIMING = Object.freeze({
  ...portfolioConfig.behavior.intro.desktop,
  passwordCharacterMs: Object.freeze([
    ...portfolioConfig.behavior.intro.desktop.passwordCharacterMs,
  ]),
});

export const DESKTOP_PROGRESS_DURATION_MS =
  DESKTOP_INTRO_TIMING.deviceUiStartMs +
  DESKTOP_INTRO_TIMING.bootMs +
  DESKTOP_INTRO_TIMING.loginRevealMs +
  DESKTOP_INTRO_TIMING.accountRevealMs +
  DESKTOP_INTRO_TIMING.passwordCharacterMs.reduce(
    (total, duration) => total + duration,
    0,
  ) +
  DESKTOP_INTRO_TIMING.finalPaintBudgetMs +
  DESKTOP_INTRO_TIMING.authenticationMs;
