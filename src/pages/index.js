import { useState } from 'react';
import RootLayout from "@/app/layout";

export default function Home() {
  const [hoveredItem, setHoveredItem] = useState(null);
  return (
    <RootLayout>
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          Welcome to my website!&nbsp;
          <code className="font-mono font-bold">what would you like to do?</code>
        </p>
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none">

        </div>
      </div>

      <div className="relative flex place-items-center justify-center before:absolute before:-z-20 before:h-[180px] before:w-full sm:before:w-[240px] before:left-1/2 before:-translate-x-1/2 before:bg-gradient-conic before:from-sky-200 before:via-blue-200 before:blur-2xl before:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700 before:dark:opacity-10 before:dark:from-sky-900 before:dark:via-[#0141ff] before:dark:opacity-40 after:absolute after:-z-20 after:h-[180px] after:w-full sm:after:w-[240px] after:left-1/2 after:-translate-x-1/2 after:bg-gradient-conic after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-[''] after:dark:bg-gradient-to-br after:dark:from-transparent after:dark:to-blue-700 after:dark:opacity-10 after:dark:from-sky-900 after:dark:via-[#0141ff] after:dark:opacity-40 before:lg:h-[360px] z-[-1]">

          {hoveredItem === 'about' && (
            <div className="w-full max-w-[30ch]">
              <h2 className={"mb-6 text-2xl font-semibold"}>
                About me
              </h2>
              <p className={`m-0 text-left text-sm opacity-50 text-3xl font-bold text-blue-500`}>
                Detailed information about my education, skills and experience. You can also find my CV here.
              </p>
            </div>
          )}
          {hoveredItem === 'contact' && (
            <div className="w-full max-w-[30ch]">
              <h2 className={"mb-6 text-2xl font-semibold"}>
                Contact
              </h2>
              <p className={`m-0 text-left text-sm opacity-50 text-3xl font-bold text-blue-500`}>
                Ways to reach out to me.
              </p>
            </div>
          )}
          {hoveredItem === 'portfolio' && (
            <div className="w-full max-w-[30ch]">
              <h2 className={"mb-6 text-2xl font-semibold"}>
                Portfolio
              </h2>
              <p className={`m-0 text-left text-sm opacity-50 text-3xl font-bold text-blue-500`}>
                My Github Repo.
              </p>
            </div>
          )}
  </div>


        <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-4 lg:text-left">
          <a
            href=""
            className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
            target="_blank"
            rel="noopener noreferrer"
            onMouseEnter={() => setHoveredItem('about')}
            onMouseLeave={() => setHoveredItem(null)}
            onTouchStart={() => handleInteraction('about')} // Touch event
            onTouchEnd={() => handleInteraction(null)} // Touch event
          >
            <h2 className={`mb-3 text-2xl font-semibold`}>
              About me{" "}
              <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                -&gt;
              </span>
            </h2>
          </a>

        <a
          href=""
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800 hover:dark:bg-opacity-30"
          target="_blank"
          rel="noopener noreferrer"
          onMouseEnter={() => setHoveredItem('contact')}
          onMouseLeave={() => setHoveredItem(null)}
          onTouchStart={() => handleInteraction('contact')} // Touch event
          onTouchEnd={() => handleInteraction(null)} // Touch event
        >
          <h2 className={`mb-3 text-2xl font-semibold`}>
            Contact{" "}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
        </a>

        <a
          href="https://github.com/Saladin-99?tab=repositories"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          target="_blank"
          rel="noopener noreferrer"
          onMouseEnter={() => setHoveredItem('portfolio')}
          onMouseLeave={() => setHoveredItem(null)}
          onTouchStart={() => handleInteraction('portfolio')} // Touch event
          onTouchEnd={() => handleInteraction(null)} // Touch event
        >
          <h2 className={`mb-3 text-2xl font-semibold`}>
            Portfolio{" "}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
        </a>
      </div>
    </main>
    </RootLayout>
  );
}
