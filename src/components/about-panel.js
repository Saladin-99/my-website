// components/AboutPanel.js
import React, { useEffect, useState, useRef } from 'react';

const AboutPanel = ({ onClose }) => {
  const panelRef = useRef(null);
  const [downloadIcon, setDownloadIcon] = useState('my-website/svg/download-icon.svg');

  useEffect(() => {
    const panel = panelRef.current;
    if (panel) {
      panel.classList.add('animate-slide-in');
    }
  }, []);

  const handleClose = () => {
    const panel = panelRef.current;
    if (panel) {
      panel.classList.remove('animate-slide-in');
      panel.classList.add('animate-slide-out');
    }
    setTimeout(onClose, 350);
  };

  const handleDownload = () => {
    // Logic to download the PDF file
    const downloadLink = document.createElement('a');
    downloadLink.href = 'my-website/nothing/Salah_CV.pdf'; // Replace with your PDF file path
    downloadLink.download = 'Salah_CV.pdf'; // Replace with your desired file name
    downloadLink.click();
    setDownloadIcon('my-website/svg/downloaded-icon.svg');
  };

  return (
    <div
      ref={panelRef}
      className="fixed inset-0 z-50 flex items-end justify-center bg-white bg-opacity-90 backdrop-filter backdrop-blur-sm p-6 text-left border-t-4 border-blue-500 shadow-xl transform transition-transform duration-300 ease-in-out"
    > <div className="absolute top-0 left-0 mt-4 ml-4">
      <button
        type="button"
        className="inline-flex items-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:text-sm"
        onClick={handleClose}
      >
        <img src="my-website/svg/back-icon.svg" alt="Back Icon" className="h-5 w-5 mr-2"/>
        Back
      </button>
    </div>
    <div className="absolute top-0 justify-center mt-4">
      <button
        type="button"
        className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:text-sm"
        onClick={handleDownload}
      >
        <img src={downloadIcon} alt="Download Icon" className="h-5 w-5 mr-2" />
        Download
      </button>
    </div>
    <div className="absolute top-16 inset-0">
          {/* Your PDF content here */}
          <embed src="my-website/nothing/Salah_CV.pdf" type="application/pdf" width="100%" height="100%" />
        </div>
    </div>
  );
};

export default AboutPanel;