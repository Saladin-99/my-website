import { useState } from 'react';
import RootLayout from "@/app/layout";
import ContactPanel from '@/components/contact-panel';
import AboutPanel from '@/components/about-panel'

export default function Home() {
  const [hoveredItem, setHoveredItem] = useState(null);
  const [contactPanelOpen, setContactPanelOpen] = useState(false);
  const [aboutPanelOpen, setAboutPanelOpen] = useState(false);
  return (
    <RootLayout>
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="relative z-10 max-w-5xl w-full flex items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
        Welcome to my website! <code className="font-mono font-bold">What would you like to do?</code>
        </p>
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none"></div>
      </div>
      
      
          {(hoveredItem === 'about' || hoveredItem === 'contact' || hoveredItem === 'portfolio') && (
  <div className="relative w-full max-w-[30ch]">
    <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-gradient-conic from-sky-200 via-blue-200 blur-2xl content-[''] dark:bg-gradient-to-br dark:from-transparent dark:to-blue-700 dark:opacity-10 dark:from-sky-900 dark:via-[#0141ff] dark:opacity-40 w-full h-[180px] sm:w-[240px]">
    </div>
    <div className="z-20 w-full max-w-[30ch]">
      {(hoveredItem === 'about' && (
        <div>
          <h2 className="mb-6 text-2xl font-semibold">About me</h2>
          <p className="m-0 text-left text-sm opacity-50 text-3xl font-bold text-blue-500">Detailed information about my education, skills, and experience. You can also find my CV here.</p>
        </div>
      )) || (hoveredItem === 'contact' && (
        <div>
          <h2 className="mb-6 text-2xl font-semibold">Contact</h2>
          <p className="m-0 text-left text-sm opacity-50 text-3xl font-bold text-blue-500">Ways to reach out to me.</p>
        </div>
      )) || (hoveredItem === 'portfolio' && (
        <div>
          <h2 className="mb-6 text-2xl font-semibold">Portfolio</h2>
          <p className="m-0 text-left text-sm opacity-50 text-3xl font-bold text-blue-500">My Github Repo.</p>
        </div>
      ))}
    </div>
  </div>
)}

        <div className="z-10 mb-32 mt-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:mt-0 lg:grid-cols-3 lg:text-left">
          <a
            className={`group rounded-lg border border-transparent px-5 py-4 transition-colors ${hoveredItem === 'about' ? 'border-gray-300 bg-gray-100 dark:border-neutral-700 dark:bg-neutral-800/30' : ''}`}
            onMouseEnter={() => setHoveredItem('about')}
            onMouseLeave={() => setHoveredItem(null)}
            onTouchStart={() => setHoveredItem('about')} // Touch event
            onTouchEnd={() => setHoveredItem(null)} // Touch event

            onClick={() => setAboutPanelOpen(true)}
          >
            <h2 className={`mb-3 text-2xl font-semibold`}>
              About me{" "}
              <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                -&gt;
              </span>
            </h2>
          </a>

        <a
          className={`group rounded-lg border border-transparent px-5 py-4 transition-colors ${hoveredItem === 'contact' ? 'border-gray-300 bg-gray-100 dark:border-neutral-700 dark:bg-neutral-800/30' : ''}`}
          onMouseEnter={() => setHoveredItem('contact')}
          onMouseLeave={() => setHoveredItem(null)}
          onTouchStart={() => setHoveredItem('contact')} // Touch event
          onTouchEnd={() => setHoveredItem(null)} // Touch event

          onClick={() => setContactPanelOpen(true)}
          >
          <h2 className={`mb-3 text-2xl font-semibold`}>
            Contact{" "}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
        </a>
        {contactPanelOpen && <ContactPanel onClose={() => setContactPanelOpen(false)} />}
        <a
          href="https://github.com/Saladin-99?tab=repositories"
          className={`group rounded-lg border border-transparent px-5 py-4 transition-colors ${hoveredItem === 'portfolio' ? 'border-gray-300 bg-gray-100 dark:border-neutral-700 dark:bg-neutral-800/30' : ''}`}
          target="_blank"
          rel="noopener noreferrer"
          onMouseEnter={() => setHoveredItem('portfolio')}
          onMouseLeave={() => setHoveredItem(null)}
          onTouchStart={() => setHoveredItem('portfolio')} // Touch event
          onTouchEnd={() => setHoveredItem(null)} // Touch event
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
    {aboutPanelOpen && <AboutPanel
          onClose={() => setAboutPanelOpen(false)}
        />}
    </RootLayout>
  );
}
