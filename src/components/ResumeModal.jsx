import ModalFrame from "./ModalFrame";
import ResumePreview from "./ResumePreview";
import { portfolioConfig } from "../portfolio.config";
import { publicAsset } from "../portfolio.runtime";

const {
  applications,
  assets,
  copy,
  destinations,
  resume,
} = portfolioConfig;
const resumeUrl = publicAsset(assets.resumePdf);

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
  const openResume = () => {
    window.open(resumeUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <ModalFrame
      eyebrow={destinations.resume.eyebrow}
      title={applications.resume.label}
      description={destinations.resume.desktopDescription}
      size="wide"
      onClose={onClose}
    >
      <div className="resume-toolbar">
        <span className="document-status">
          <span aria-hidden="true" />
          {destinations.resume.title} · PDF
        </span>
        <div className="resume-actions">
          <a href={resumeUrl} target="_blank" rel="noreferrer">
            <ExternalIcon />
            {copy.common.openNewTab}
          </a>
          <a href={resumeUrl} download={resume.downloadName}>
            <DownloadIcon />
            {copy.desktop.resume.saveLabel}
          </a>
        </div>
      </div>

      <div className="resume-preview">
        <ResumePreview
          source={resumeUrl}
          onOpenBrowser={openResume}
        />
        <div className="resume-mobile-fallback">
          <p>{destinations.resume.mobileDescription}</p>
          <a href={resumeUrl} target="_blank" rel="noreferrer">
            {copy.common.openNewTab}
            <ExternalIcon />
          </a>
        </div>
      </div>
    </ModalFrame>
  );
}
