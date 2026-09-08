"use client";

export default function FollowInstagramSheet() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pointer-events-none flex justify-center">
      <div className="bg-[#E1306C] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-t-xl sm:rounded-xl p-4 flex items-center justify-between gap-6 pointer-events-auto w-full max-w-md">
        <div className="flex items-center gap-3">
          <div className="bg-white p-2 rounded-lg border-2 border-black">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E1306C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
          </div>
          <div className="text-left">
            <h3 className="font-black text-white uppercase tracking-wider leading-tight">Follow on Instagram</h3>
            <p className="text-white/80 text-xs font-bold">@aws.sbg.ieccet</p>
          </div>
        </div>
        <a 
          href="https://www.instagram.com/aws.sbg.ieccet/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-white text-black font-black text-sm uppercase tracking-wider py-2 px-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all whitespace-nowrap"
        >
          Follow
        </a>
      </div>
    </div>
  );
}
