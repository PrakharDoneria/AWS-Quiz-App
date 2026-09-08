"use client";

import { useEffect, useState } from "react";

export default function CertificateCard() {
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

  if (!hasCompletedQuiz) return null;

  return (
    <div className="bg-[#10141a] border-4 border-[#324054] shadow-[12px_12px_0px_0px_rgba(0,0,0,0.8)] rounded-xl overflow-hidden flex-1 p-8 md:p-10 flex flex-col">
      <div className="flex flex-col items-start text-left gap-4 mb-8">
        <div className="bg-green-500/20 p-4 rounded-md border-2 border-green-500 shadow-[4px_4px_0px_0px_#22c55e]">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 0 0 4.561 21h14.878a2 2 0 0 0 1.94-1.515L22 17"></path></svg>
        </div>
        <div>
          <h2 className="text-3xl font-black text-white mb-2 tracking-tight shadow-none">My Certificate</h2>
          <p className="text-gray-400">Get your completion certificate.</p>
        </div>
      </div>

      <div className="flex flex-col gap-6 w-full mt-auto">
        <a href="/certificate" className="mt-4 bg-green-500 text-black font-black text-xl uppercase tracking-wider py-4 px-6 border-2 border-black shadow-[6px_6px_0px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#000] transition-all w-full flex justify-center items-center gap-2 text-center">
          Get Certificate
        </a>
      </div>
    </div>
  );
}
