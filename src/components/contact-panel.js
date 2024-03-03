import React from 'react';

const ContactPanel = ({ onClose }) => {
  return (
    <div className="fixed inset-0 flex items-center z-40 justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div className="relative w-96 h-64 z-50 bg-black border border-gray-300 rounded-lg opacity-0 animate-fadeIn p-4 text-center" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button className="absolute top-2 right-2 text-white text-lg" onClick={onClose}>X</button>
        {/* Contact information */}
        <h2 className="text-2xl font-bold mb-4 text-white">Contact Information</h2>
        <div className="flex flex-col items-left">
          <div className="flex mt-8 items-center mb-2">
            <img src="/my-website/svg/email-icon.svg" alt="Email" className="w-6 h-6 mr-2" />
            <p className="text-white">: salahabdou99@gmail.com</p>
          </div>
          <div className="flex items-center mb-2">
            <img src="/my-website/svg/phone-icon.svg" alt="Phone" className="w-6 h-6 mr-2" />
            <p className="text-white">: +201203025003</p>
          </div>
          <div className="flex items-center ">
            <img src="/my-website/svg/linked-icon.svg" alt="Linkedin" className="w-6 h-6 mr-2" />
            <p className="text-white">: www.linkedin.com/in/salaheldin99</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPanel;