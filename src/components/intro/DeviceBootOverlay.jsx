const OS_MARK = `${import.meta.env.BASE_URL}salah-os-mark-512.png`;

function BootLogo({ device }) {
  return (
    <div className={`os-boot-logo os-boot-logo--${device}`}>
      <img src={OS_MARK} alt="" />
      <p className="os-boot-name">Salah OS</p>
      <div className="os-boot-track" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <p className="os-boot-status">Starting up…</p>
    </div>
  );
}

function DesktopBoot() {
  return (
    <div className="device-boot device-boot--desktop" aria-hidden="true">
      <BootLogo device="desktop" />

      <div className="desktop-login">
        <div className="xp-login-banner">
          <strong>Salah OS</strong>
          <span>professional-ish edition</span>
        </div>

        <div className="xp-login-copy">
          <p>Welcome</p>
          <span>To begin, click the extremely obvious user account.</span>
        </div>

        <div className="xp-user-tile">
          <img src={OS_MARK} alt="" />
          <div>
            <strong>Salah</strong>
            <span className="xp-password-dots">
              {Array.from({ length: 6 }, (_, index) => (
                <i key={index} />
              ))}
            </span>
            <small>loading personal settings…</small>
          </div>
          <span className="xp-login-arrow">➜</span>
        </div>

        <div className="xp-login-footer">
          <span className="xp-power-icon">⏻</span>
          <span>Turn off computer</span>
          <small>Salah OS is definitely genuine software.</small>
        </div>
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
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(now);

  return (
    <div className="device-boot device-boot--mobile" aria-hidden="true">
      <BootLogo device="mobile" />

      <div className="mobile-lock-screen">
        <div className="mobile-lock-status">
          <span>◉ ◉ ◉</span>
          <strong>SALAH</strong>
          <span>▮</span>
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
          Loading home screen…
        </div>
      </div>
    </div>
  );
}

export default function DeviceBootOverlay({ mode }) {
  return mode === "mobile" ? <MobileUnlock /> : <DesktopBoot />;
}
