// components/AboutPanel.js
import React, { useEffect, useRef } from 'react';

const AboutPanel = ({ onClose }) => {
  const panelRef = useRef(null);

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

  return (
    <div
      ref={panelRef}
      className="fixed inset-0 z-50 flex items-end justify-center bg-white bg-opacity-90 backdrop-filter backdrop-blur-sm p-6 text-left shadow-xl transform transition-transform duration-300 ease-in-out"
    >
      <div className="w-full max-w-screen-md h-3/4 bg-white rounded-lg overflow-hidden">
        <div className="border-t-4 border-blue-500 p-4">
          <h3 className="text-lg font-medium leading-6 text-gray-900">About me</h3>
          <div className="mt-2 text-sm text-gray-500 text-balance">
            Detailed information about my education, skills, and experience. You can also find my CV here.
          </div>
        </div>
        <div className="mt-5 sm:mt-6">
          <button
            type="button"
            className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:text-sm"
            onClick={handleClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AboutPanel;