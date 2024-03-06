import React, { useState, useEffect, useRef } from 'react';

const Header = () => {
  const [typedText, setTypedText] = useState('');
  const textRef = useRef(null);

  useEffect(() => {
    const fullText = "Welcome to my website! What would you like to do?";
    let currentIndex = 0;

    const typeText = () => {
      setTypedText(fullText.slice(0, currentIndex));
      currentIndex++;
      if (currentIndex <= fullText.length) {
        setTimeout(typeText, 50); // Adjust the typing speed by changing the delay
      }
    };

    typeText();
  }, []);

  return (
    <div className="relative z-30 max-w-5xl w-full flex items-center justify-between font-mono text-sm lg:flex">
      <p className="fixed left-0 top-0 w-full flex items-center justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
        <span className="px-4" ref={textRef}>
          {typedText}
          <span className="blinking-cursor">|</span>
        </span>
      </p>


      <style jsx>{`
      .blinking-cursor {
          position: absolute;
          animation: blink 1s step-end infinite;
        }

        @keyframes blink {
          from, to {
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default Header;