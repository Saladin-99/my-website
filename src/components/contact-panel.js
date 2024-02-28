import React from 'react';

const ContactPanel = ({ isOpen, onClose }) => {
  return (
    <div className={`contact-panel ${isOpen ? 'open' : ''}`}>
      <div className="panel-content">
        {/* Close button */}
        <button className="close-button" onClick={onClose}>X</button>
        {/* Contact information */}
        <h2>Contact Information</h2>
        <p>Example Contact Information</p>
      </div>
    </div>
  );
};

export default ContactPanel;
