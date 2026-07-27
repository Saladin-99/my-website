import { useEffect, useState } from "react";

const INTRODUCTION = "Hello, I’m Salah.";
const OS_MARK = `${import.meta.env.BASE_URL}salah-os-mark-512.png`;

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

function AppShortcut({ className, icon, label, hint, ...props }) {
  const Component = props.href ? "a" : "button";

  return (
    <Component className={`os-app ${className}`} {...props}>
      <span className="os-app-icon">{icon}</span>
      <span className="os-app-label">{label}</span>
      <span className="os-app-hint">{hint}</span>
    </Component>
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
  const time = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());

  return (
    <div className="hero-content retro-desktop">
      <div className="retro-wallpaper" aria-hidden="true">
        <span className="wallpaper-cloud wallpaper-cloud--one" />
        <span className="wallpaper-cloud wallpaper-cloud--two" />
        <span className="wallpaper-sun" />
      </div>

      <header className="retro-mobile-status">
        <span>● ● ●</span>
        <strong>Salah Mobile</strong>
        <span>▰</span>
      </header>

      <main className="retro-workspace" id="home">
        <section className="retro-welcome-window">
          <div className="retro-titlebar">
            <span>about_salah.exe</span>
            <span className="retro-window-controls" aria-hidden="true">
              <i>_</i>
              <i>□</i>
              <i>×</i>
            </span>
          </div>

          <div className="retro-welcome-body">
            <img src={OS_MARK} alt="" />
            <div>
              <p className="hero-eyebrow">Salah OS is ready</p>
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
              <p className="hero-prompt">
                Pick an icon. Double-clicking is optional.
              </p>
            </div>
          </div>
        </section>

        <nav className="os-apps" aria-label="Primary">
          <AppShortcut
            className="os-app--resume"
            icon={<FileIcon />}
            label="My Résumé"
            hint="Useful documents"
            type="button"
            onClick={onOpenResume}
          />

          <AppShortcut
            className="os-app--contact"
            icon={<ChatIcon />}
            label="Contact Me"
            hint="Internet messaging"
            type="button"
            onClick={onOpenContact}
          />

          <AppShortcut
            className="os-app--github"
            icon={<CodeIcon />}
            label="GitHub"
            hint="Code & experiments"
            href="https://github.com/Saladin-99?tab=repositories"
            target="_blank"
            rel="noreferrer"
          />
        </nav>
      </main>

      <footer className="retro-taskbar">
        <span className="retro-start">
          <img src={OS_MARK} alt="" />
          start
        </span>
        <span className="retro-task">
          <span aria-hidden="true">▣</span>
          Salah’s Desktop
        </span>
        <span className="retro-tray">
          {canReplay && (
            <button
              className="replay-button"
              type="button"
              onClick={onReplayIntro}
            >
              ↻ <span>Replay intro</span>
            </button>
          )}
          <time>{time}</time>
        </span>
      </footer>
    </div>
  );
}
