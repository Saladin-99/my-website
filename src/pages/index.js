import { useState } from 'react';
import RootLayout from "@/app/layout";
import ContactPanel from '@/components/contact-panel';
import AboutPanel from '@/components/about-panel'
import Header from '@/components/header';

export default function Home() {
  const [hoveredItem, setHoveredItem] = useState(null);
  const [contactPanelOpen, setContactPanelOpen] = useState(false);
  const [aboutPanelOpen, setAboutPanelOpen] = useState(false);

/*  const handleClick = (setter) => {
    if (setter) {
      setHoveredItem(null);
      setter(true);
    } else {
      console.error("Setter function is not provided.");
    }
  };*/

  return (
    <RootLayout>
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <Header />

        <div className="relative m-1 w-full max-w-[30ch]">
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 bg-gradient-conic from-sky-200 via-blue-200 blur-2xl content-[''] dark:bg-gradient-to-br dark:from-transparent dark:to-blue-700 dark:from-sky-900 dark:via-[#0141ff] w-full h-[180px] sm:w-[240px] transition-opacity duration-300 ease-in-out ${hoveredItem ? 'opacity-100 dark:opacity-70' : 'opacity-0 dark:opacity-0'}`}>
        </div>
          {hoveredItem&& (
            <div className="absolute mt-10 ml-10 z-20 w-full max-w-[30ch]">
              {(() => {
                switch (hoveredItem) {
                  case 'about':
                    return (
                      <div>
                        <h2 className="text-2xl font-semibold">Resumé</h2>
                        <p className="m-0 text-left text-sm opacity-50 text-3xl font-bold text-blue-500 shadow-outline text-shadow-lg">View and download my CV here.</p>
                      </div>
                    );
                  case 'contact':
                    return (
                      <div>
                        <h2 className="text-2xl font-semibold">Contact</h2>
                        <p className="m-0 text-left text-sm opacity-50 text-3xl font-bold text-blue-500 shadow-outline text-shadow-lg">Ways to reach out to me.</p>
                      </div>
                    );
                  case 'portfolio':
                    return (
                      <div>
                        <h2 className="text-2xl font-semibold">Portfolio</h2>
                        <p className="m-0 text-left text-sm opacity-50 text-3xl font-bold text-blue-500 shadow-outline text-shadow-lg">My Github Repo.</p>
                      </div>
                    );
                  default:
                    return null;
                }
              })()}
            </div>
          )}
        </div>

        <div className="z-10 mb-32 mt-[200px] grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:mt-0 lg:grid-cols-3 lg:text-left">
          <a
            className={`group rounded-lg border border-transparent px-5 py-4 transition-colors ${hoveredItem === 'about' ? 'border-gray-300 bg-gray-100 dark:border-neutral-700 dark:bg-neutral-800/30' : ''}`}
            onMouseEnter={() => setHoveredItem('about')}
            onMouseLeave={() => setHoveredItem(null)}
            onTouchStart={() => setHoveredItem('about')}
            onTouchEnd={() => setHoveredItem(null)}
            onClick={() => setAboutPanelOpen(true)}
          >
            <h2 className={`m-2 text-xl md:text-2xl font-semibold whitespace-no-wrap relative`}>Resumé <span className={`inline-block transition-transform motion-reduce:transform-none text-base md:text-xl ${hoveredItem === 'about' ? 'translate-x-1' : 'translate-x-0'}`}>-&gt;</span></h2>
          </a>

          <a
            className={`group rounded-lg border border-transparent px-5 py-4 transition-colors ${hoveredItem === 'contact' ? 'border-gray-300 bg-gray-100 dark:border-neutral-700 dark:bg-neutral-800/30' : ''}`}
            onMouseEnter={() => setHoveredItem('contact')}
            onMouseLeave={() => setHoveredItem(null)}
            onTouchStart={() => setHoveredItem('contact')}
            onTouchEnd={() => setHoveredItem(null)}
            onClick={() => setContactPanelOpen(true)}
          >
            <h2 className={`m-2 text-xl md:text-2xl font-semibold whitespace-no-wrap relative`}>Contact <span className={`inline-block transition-transform motion-reduce:transform-none text-base md:text-xl ${hoveredItem === 'contact' ? 'translate-x-1' : 'translate-x-0'}`}>-&gt;</span></h2>
          </a>

          <a
            href="https://github.com/Saladin-99?tab=repositories"
            className={`group rounded-lg border border-transparent px-5 py-4 transition-colors ${hoveredItem === 'portfolio' ? 'border-gray-300 bg-gray-100 dark:border-neutral-700 dark:bg-neutral-800/30' : ''}`}
            target="_blank"
            rel="noopener noreferrer"
            onMouseEnter={() => setHoveredItem('portfolio')}
            onMouseLeave={() => setHoveredItem(null)}
            onTouchStart={() => setHoveredItem('portfolio')}
            onTouchEnd={() => setHoveredItem(null)}
          >
            <h2 className={`m-2 text-xl md:text-2xl font-semibold whitespace-no-wrap relative`}>Portfolio <span className={`inline-block transition-transform motion-reduce:transform-none text-base md:text-xl ${hoveredItem === 'portfolio' ? 'translate-x-1' : 'translate-x-0'}`}>-&gt;</span></h2>
          </a>
        </div>
      </main>

      {aboutPanelOpen && <AboutPanel onClose={() => setAboutPanelOpen(false)} />}
      {contactPanelOpen && <ContactPanel onClose={() => setContactPanelOpen(false)} />}
    </RootLayout>
  );
}
