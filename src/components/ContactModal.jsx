import { useState } from "react";
import ModalFrame from "./ModalFrame";

const contactMethods = [
  {
    label: "Email",
    value: "salahabdou99@gmail.com",
    href: "mailto:salahabdou99@gmail.com",
  },
  {
    label: "Phone",
    value: "+20 120 302 5003",
    href: "tel:+201203025003",
  },
  {
    label: "LinkedIn",
    value: "linkedin.com/in/salaheldin99",
    href: "https://www.linkedin.com/in/salaheldin99",
    external: true,
  },
];

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 18L18 6M9 6h9v9" />
    </svg>
  );
}

export default function ContactModal({ onClose }) {
  const [copied, setCopied] = useState(false);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText("salahabdou99@gmail.com");
      setCopied(true);
    } catch {
      window.location.href = "mailto:salahabdou99@gmail.com";
    }
  };

  return (
    <ModalFrame
      eyebrow="Let’s make something interesting"
      title="Contact"
      description="Pick whatever feels easiest. I’ll take it from there."
      onClose={onClose}
    >
      <div className="contact-list">
        {contactMethods.map((method) => (
          <a
            className="contact-method"
            href={method.href}
            key={method.label}
            target={method.external ? "_blank" : undefined}
            rel={method.external ? "noreferrer" : undefined}
          >
            <span>
              <span className="contact-label">{method.label}</span>
              <span className="contact-value">{method.value}</span>
            </span>
            <ArrowIcon />
          </a>
        ))}
      </div>

      <button className="copy-email" type="button" onClick={copyEmail}>
        <span>{copied ? "Copied to clipboard" : "Copy email address"}</span>
        <span aria-hidden="true">{copied ? "✓" : "Copy"}</span>
        <span className="sr-only" aria-live="polite">
          {copied ? "Email address copied to clipboard." : ""}
        </span>
      </button>
    </ModalFrame>
  );
}
