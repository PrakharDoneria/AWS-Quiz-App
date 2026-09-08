"use client";

import { useEffect, useState } from "react";

export default function TopNav() {
  const [hasCompletedQuiz, setHasCompletedQuiz] = useState(false);

  useEffect(() => {
    // Check local storage for any key starting with "attempted_quiz_"
    let found = false;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("attempted_quiz_")) {
        found = true;
        break;
      }
    }
    setHasCompletedQuiz(found);
  }, []);

  return (
    <div className="w-full flex justify-center sticky top-4 z-50 px-4">
      <nav className="w-full max-w-5xl bg-[#10141a] border-4 border-black px-6 py-3 flex items-center justify-between rounded-xl shadow-[8px_8px_0px_0px_#000]">
        <a href="/" className="flex items-center gap-3 text-white font-black text-xl md:text-2xl uppercase tracking-wider hover:text-primary transition-colors">
          <img src="/icons/App_Icon.svg" alt="Icon" className="w-8 h-8 md:w-10 md:h-10" />
          AWS Quiz
        </a>
        <div className="flex items-center gap-3 md:gap-4">
          <a href="/team-info" className="hidden sm:inline-block bg-[#1a202c] text-white px-4 py-2 border-2 border-black font-bold uppercase tracking-widest shadow-[4px_4px_0px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[0px_0px_0px_0px_#000] transition-all text-xs">Team Info</a>
          
          {hasCompletedQuiz && (
            <a href="/certificate" className="hidden sm:inline-block bg-primary text-white px-4 py-2 border-2 border-black font-bold uppercase tracking-widest shadow-[4px_4px_0px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[0px_0px_0px_0px_#000] transition-all text-xs">Certificate</a>
          )}

          <a href="https://www.instagram.com/aws.sbg.ieccet/" target="_blank" rel="noopener noreferrer" className="bg-[#E1306C] text-white p-2 border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[0px_0px_0px_0px_#000] transition-all flex items-center" title="Follow us on Instagram">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
          </a>
        </div>
      </nav>
    </div>
  );
}
