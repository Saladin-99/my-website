// components/Header.js
import React from 'react';

const Header = () => {
  return (
    <div className="relative z-10 max-w-5xl w-full flex items-center justify-between font-mono text-sm lg:flex">
      <p className="fixed left-0 top-0 w-full flex items-center justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
        <span>
          Welcome to my website! <code className="font-mono font-bold">What would you like to do?</code>
        </span>
      </p>
      <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none"></div>
    </div>
  );
};

export default Header;