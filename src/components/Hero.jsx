import { useEffect, useState } from "react";
import { portfolioConfig } from "../portfolio.config";
import { getPortfolioLayoutMode } from "../portfolio.runtime";
import DesktopOS from "./DesktopOS";
import MobileOS from "./MobileOS";

const INTRODUCTION = portfolioConfig.profile.greeting;

function getMobileLayout() {
  return getPortfolioLayoutMode() === "mobile";
}

function useMobileLayout() {
  const [mobile, setMobile] = useState(getMobileLayout);

  useEffect(() => {
    const mediaQueries = [
      window.matchMedia("(orientation: portrait)"),
      window.matchMedia("(pointer: coarse)"),
      window.matchMedia("(hover: none)"),
    ];
    const handleChange = () => setMobile(getMobileLayout());

    mediaQueries.forEach((query) =>
      query.addEventListener("change", handleChange),
    );
    window.addEventListener("resize", handleChange, { passive: true });

    return () => {
      mediaQueries.forEach((query) =>
        query.removeEventListener("change", handleChange),
      );
      window.removeEventListener("resize", handleChange);
    };
  }, []);

  return mobile;
}

function useTypewriter(
  ready,
  animate,
  text,
  speed = portfolioConfig.behavior.typewriterMs,
) {
  const [visibleText, setVisibleText] = useState(() =>
    ready && !animate ? text : "",
  );

  useEffect(() => {
    if (!ready) {
      setVisibleText("");
      return undefined;
    }

    if (!animate) {
      setVisibleText(text);
      return undefined;
    }

    setVisibleText("");
    let index = 0;
    const interval = window.setInterval(() => {
      index += 1;
      setVisibleText(text.slice(0, index));

      if (index >= text.length) {
        window.clearInterval(interval);
      }
    }, speed);

    return () => window.clearInterval(interval);
  }, [animate, ready, speed, text]);

  return visibleText;
}

export default function Hero({
  ready,
  animateTyping,
  onReplayIntro,
  canReplay,
}) {
  const typedIntroduction = useTypewriter(
    ready,
    animateTyping,
    INTRODUCTION,
  );
  const mobileLayout = useMobileLayout();

  if (!mobileLayout) {
    return (
      <DesktopOS
        ready={ready}
        typedIntroduction={typedIntroduction}
        onReplayIntro={onReplayIntro}
        canReplay={canReplay}
      />
    );
  }

  return (
    <MobileOS
      ready={ready}
      typedIntroduction={typedIntroduction}
      onReplayIntro={onReplayIntro}
      canReplay={canReplay}
    />
  );
}
