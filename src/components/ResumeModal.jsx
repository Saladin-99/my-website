import ModalFrame from "./ModalFrame";

const resumeUrl = `${import.meta.env.BASE_URL}nothing/Salah_CV.pdf`;

function ExternalIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14 5h5v5M19 5l-9 9M19 14v5H5V5h5" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
    </svg>
  );
}

export default function ResumeModal({ onClose }) {
  return (
    <ModalFrame
      eyebrow="FILE / 01"
      title="Résumé"
      description="A concise record of experience, tools, and selected work."
      size="wide"
      onClose={onClose}
    >
      <div className="resume-toolbar">
        <span className="document-status">
          <span aria-hidden="true" />
          SALAH_CV.PDF
        </span>
        <div className="resume-actions">
          <a href={resumeUrl} target="_blank" rel="noreferrer">
            <ExternalIcon />
            Open
          </a>
          <a href={resumeUrl} download="Salah_CV.pdf">
            <DownloadIcon />
            Download
          </a>
        </div>
      </div>

      <div className="resume-preview">
        <iframe src={`${resumeUrl}#view=FitH`} title="Salah's résumé" />
        <div className="resume-mobile-fallback">
          <p>PDF preview is optimized for larger screens.</p>
          <a href={resumeUrl} target="_blank" rel="noreferrer">
            View full résumé
            <ExternalIcon />
          </a>
        </div>
      </div>
    </ModalFrame>
  );
}
