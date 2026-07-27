function ColorBloom() {
  return (
    <div className="color-bloom" aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}

function DesktopBoot() {
  return (
    <div className="device-boot device-boot--desktop" aria-hidden="true">
      <div className="boot-wallpaper">
        <span />
        <span />
        <span />
      </div>

      <div className="desktop-power-on">
        <ColorBloom />
        <p>Waking things up…</p>
      </div>

      <div className="desktop-login">
        <div className="login-avatar">S</div>
        <p className="login-greeting">Welcome back</p>
        <p className="login-name">Salah</p>
        <div className="password-pill">
          <span className="password-dots">
            {Array.from({ length: 6 }, (_, index) => (
              <i key={index} />
            ))}
          </span>
          <span className="password-arrow">→</span>
        </div>
        <p className="signing-in">Signing in…</p>
      </div>
    </div>
  );
}

function MobileUnlock() {
  const now = new Date();
  const time = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(now);
  const date = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(now);

  return (
    <div className="device-boot device-boot--mobile" aria-hidden="true">
      <div className="mobile-wallpaper">
        <span />
        <span />
        <span />
      </div>

      <div className="mobile-lock-header">
        <p className="lock-time">{time}</p>
        <p className="lock-date">{date}</p>
      </div>

      <div className="pattern-card">
        <p>Draw pattern to unlock</p>
        <div className="pattern-grid">
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <path d="M16.7 16.7 L83.3 16.7 L83.3 83.3 L16.7 83.3 L50 50" />
          </svg>
          {Array.from({ length: 9 }, (_, index) => (
            <span
              className={
                [0, 2, 4, 6, 8].includes(index) ? "is-pattern-node" : ""
              }
              key={index}
            />
          ))}
        </div>
      </div>

      <div className="unlock-success">
        <span>✓</span>
        Unlocked
      </div>
    </div>
  );
}

export default function DeviceBootOverlay({ mode }) {
  return mode === "mobile" ? <MobileUnlock /> : <DesktopBoot />;
}
