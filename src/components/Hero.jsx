import { useEffect, useState } from "react";

const INTRODUCTION = "Hello, I’m Salah.";

function useTypewriter(enabled, text, speed = 62) {
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

function FileIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M8 3h11l6 6v20H8zM19 3v7h6M12 16h9M12 21h7" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M5 6h22v16H14l-7 6v-6H5z" />
      <path d="M11 14h.01M16 14h.01M21 14h.01" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="m12 9-7 7 7 7M20 9l7 7-7 7M18 5l-4 22" />
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
        <a className="wordmark" href="#home" aria-label="Salah, home">
          <span aria-hidden="true">✦</span>
          Salah
        </a>

        <div className="availability" aria-label="Available to collaborate">
          <span className="availability-orb" aria-hidden="true" />
          <span>Available for bright ideas</span>
        </div>
      </header>

      <section className="hero-interface" id="home">
        <div className="hero-color-orbit" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>

        <p className="hero-eyebrow">
          A tiny, colorful corner of the internet
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

        <p className="hero-prompt">Where should we go?</p>

        <nav className="primary-actions" aria-label="Primary">
          <button
            className="primary-action primary-action--resume"
            type="button"
            onClick={onOpenResume}
          >
            <span className="action-icon">
              <FileIcon />
            </span>
            <span className="action-copy">
              <span className="action-label">Résumé</span>
              <span className="action-hint">The useful stuff</span>
            </span>
            <span className="action-arrow">
              <ArrowIcon />
            </span>
          </button>

          <button
            className="primary-action primary-action--contact"
            type="button"
            onClick={onOpenContact}
          >
            <span className="action-icon">
              <ChatIcon />
            </span>
            <span className="action-copy">
              <span className="action-label">Say hello</span>
              <span className="action-hint">Start a conversation</span>
            </span>
            <span className="action-arrow">
              <ArrowIcon />
            </span>
          </button>

          <a
            className="primary-action primary-action--github"
            href="https://github.com/Saladin-99?tab=repositories"
            target="_blank"
            rel="noreferrer"
          >
            <span className="action-icon">
              <CodeIcon />
            </span>
            <span className="action-copy">
              <span className="action-label">GitHub</span>
              <span className="action-hint">Code & experiments</span>
            </span>
            <span className="sr-only"> (opens in a new tab)</span>
            <span className="action-arrow">
              <ArrowIcon />
            </span>
          </a>
        </nav>
      </section>

      <footer className="site-footer">
        <p>Made with curiosity and too many colors.</p>
        {canReplay && (
          <button
            className="replay-button"
            type="button"
            onClick={onReplayIntro}
          >
            <span aria-hidden="true">↻</span>
            Replay the entrance
          </button>
        )}
      </footer>
    </div>
  );
}
