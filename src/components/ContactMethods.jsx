import { useEffect, useRef, useState } from "react";
import { portfolioConfig } from "../portfolio.config";
import { formatPortfolioCopy } from "../portfolio.runtime";

export const CONTACT_METHODS = portfolioConfig.contacts;
const CONTACT_COPY = portfolioConfig.copy.contactMethods;

function LaunchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 18L18 6M9 6h9v9" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="8" y="8" width="11" height="11" rx="1.5" />
      <path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8" />
    </svg>
  );
}

function legacyCopy(text) {
  const textArea = document.createElement("textarea");
  const selection = document.getSelection();
  const previousRange =
    selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
  const previousFocus = document.activeElement;

  textArea.value = text;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.inset = "0 auto auto -9999px";
  textArea.style.opacity = "0";
  textArea.style.pointerEvents = "none";

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  textArea.setSelectionRange(0, text.length);

  let copied = false;

  try {
    copied = document.execCommand("copy");
  } finally {
    textArea.remove();

    if (selection && previousRange) {
      selection.removeAllRanges();
      selection.addRange(previousRange);
    }

    if (previousFocus instanceof HTMLElement) {
      previousFocus.focus();
    }
  }

  if (!copied) {
    throw new Error("The browser did not complete the copy command.");
  }
}

async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Permission and browser-policy failures can still use the legacy path.
    }
  }

  legacyCopy(text);
}

export default function ContactMethods({
  methods = CONTACT_METHODS,
  onOpenLink,
}) {
  const [copiedMethods, setCopiedMethods] = useState({});
  const [status, setStatus] = useState("");
  const resetTimers = useRef(new Map());

  useEffect(
    () => () => {
      resetTimers.current.forEach((timer) => window.clearTimeout(timer));
    },
    [],
  );

  const handleCopy = async (method) => {
    try {
      await copyToClipboard(method.copyValue ?? method.value);

      setCopiedMethods((current) => ({ ...current, [method.id]: true }));
      setStatus(
        formatPortfolioCopy(CONTACT_COPY.copiedStatusTemplate, {
          label: method.label,
        }),
      );

      const existingTimer = resetTimers.current.get(method.id);
      if (existingTimer) {
        window.clearTimeout(existingTimer);
      }

      const timer = window.setTimeout(() => {
        setCopiedMethods((current) => ({ ...current, [method.id]: false }));
        resetTimers.current.delete(method.id);
      }, portfolioConfig.behavior.contactCopyResetMs);

      resetTimers.current.set(method.id, timer);
    } catch {
      setStatus(
        formatPortfolioCopy(CONTACT_COPY.errorStatusTemplate, {
          label: method.label,
        }),
      );
    }
  };

  const handleOpen = (event, method) => {
    if (!onOpenLink) {
      return;
    }

    event.preventDefault();
    onOpenLink(method);
  };

  return (
    <>
      <div className="contact-list">
        {methods.map((method) => {
          const isCopied = Boolean(copiedMethods[method.id]);

          return (
            <div className="contact-method" key={method.id}>
              <a
                className="contact-method__link"
                href={method.href}
                onClick={(event) => handleOpen(event, method)}
                target={!onOpenLink && method.external ? "_blank" : undefined}
                rel={
                  !onOpenLink && method.external
                    ? "noopener noreferrer"
                    : undefined
                }
              >
                <span className="contact-method__details">
                  <span className="contact-label">{method.label}</span>
                  <span className="contact-value">{method.value}</span>
                </span>
                <span className="contact-method__launch" aria-hidden="true">
                  <LaunchIcon />
                </span>
                <span className="sr-only">
                  {method.external
                    ? CONTACT_COPY.externalHint
                    : CONTACT_COPY.applicationHint}
                </span>
              </a>

              <button
                className="contact-method__copy"
                type="button"
                onClick={() => handleCopy(method)}
                aria-label={formatPortfolioCopy(
                  CONTACT_COPY.copyLabelTemplate,
                  { label: method.label.toLowerCase() },
                )}
                title={formatPortfolioCopy(
                  CONTACT_COPY.copyLabelTemplate,
                  { label: method.label.toLowerCase() },
                )}
              >
                <CopyIcon />
                <span>
                  {isCopied ? CONTACT_COPY.copied : CONTACT_COPY.copy}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      <span className="sr-only" role="status" aria-live="polite">
        {status}
      </span>
    </>
  );
}
