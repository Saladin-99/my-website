import { useEffect, useState } from "react";

const INTRODUCTION = "Hello, I’m Salah.";

function useTypewriter(enabled, text, speed = 68) {
  const [visibleText, setVisibleText] = useState(enabled ? "" : text);

  useEffect(() => {
    if (!enabled) {
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
  }, [enabled, speed, text]);

  return visibleText;
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h13M13 6l6 6-6 6" />
    </svg>
  );
}

export default function Hero({
  ready,
  animateTyping,
  onOpenResume,
  onOpenContact,
  onReplayIntro,
  canReplay,
}) {
  const typedIntroduction = useTypewriter(
    ready && animateTyping,
    INTRODUCTION,
  );

  return (
    <div className="hero-content">
      <header className="site-header">
        <a className="monogram" href="#home" aria-label="Salah, home">
          <span>S</span>
          <span className="monogram-slash">/</span>
          <span>99</span>
        </a>

        <div className="system-status" aria-label="Portfolio online">
          <span className="status-light" aria-hidden="true" />
          <span>AVAILABLE FOR CONNECTION</span>
        </div>
      </header>

      <section className="hero-interface" id="home">
        <div className="interface-corners" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>

        <p className="interface-label">
          <span>PORTFOLIO INTERFACE</span>
          <span>V.02</span>
        </p>

        <h1 className="hero-title" tabIndex="-1">
          <span className="sr-only">{INTRODUCTION}</span>
          <span aria-hidden="true">{typedIntroduction}</span>
          <span
            className={`typing-cursor ${
              typedIntroduction === INTRODUCTION ? "is-idle" : ""
            }`}
            aria-hidden="true"
          />
        </h1>

        <p className="hero-prompt">Select a destination.</p>

        <nav className="primary-actions" aria-label="Primary">
          <button
            className="primary-action"
            type="button"
            onClick={onOpenResume}
          >
            <span className="action-index">01</span>
            <span className="action-label">View résumé</span>
            <span className="action-arrow">
              <ArrowIcon />
            </span>
          </button>

          <button
            className="primary-action"
            type="button"
            onClick={onOpenContact}
          >
            <span className="action-index">02</span>
            <span className="action-label">Contact me</span>
            <span className="action-arrow">
              <ArrowIcon />
            </span>
          </button>

          <a
            className="primary-action"
            href="https://github.com/Saladin-99?tab=repositories"
            target="_blank"
            rel="noreferrer"
          >
            <span className="action-index">03</span>
            <span className="action-label">GitHub</span>
            <span className="sr-only"> (opens in a new tab)</span>
            <span className="action-arrow">
              <ArrowIcon />
            </span>
          </a>
        </nav>
      </section>

      <footer className="site-footer">
        <p>
          <span className="footer-key">MODE</span>
          <span>ADAPTIVE / WEBGL</span>
        </p>
        {canReplay && (
          <button
            className="replay-button"
            type="button"
            onClick={onReplayIntro}
          >
            <span aria-hidden="true">↻</span>
            Replay sequence
          </button>
        )}
      </footer>
    </div>
  );
}
