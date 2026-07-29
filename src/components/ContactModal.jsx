import ContactMethods from "./ContactMethods";
import ModalFrame from "./ModalFrame";
import { portfolioConfig } from "../portfolio.config";

const {
  applications,
  copy: {
    desktop: { contact: contactCopy },
  },
} = portfolioConfig;

export default function ContactModal({ onClose }) {
  return (
    <ModalFrame
      eyebrow={applications.contact.subtitle}
      title={applications.contact.label}
      description={`${contactCopy.heading} ${contactCopy.body}`}
      onClose={onClose}
    >
      <ContactMethods />
    </ModalFrame>
  );
}
