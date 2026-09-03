import { joinSession, playQuizAction, viewLeaderboardAction } from "./actions";
import { getAllQuizzes } from "@/lib/quiz/db";

export default async function Home({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const errorMsg = params.error;

  const quizzes = await getAllQuizzes();

  return (
    <main className="container flex flex-col items-center justify-center gap-8 mt-12 mb-16 text-center max-w-6xl mx-auto px-4">
      <div className="flex justify-center items-center gap-4 mb-4">
        <img src="/icons/App_Icon.svg" alt="App Icon" className="w-16 h-16" />
        <h1 className="mb-0 text-5xl tracking-tight text-white shadow-none" style={{ textShadow: '4px 4px 0px var(--primary)' }}>AWS Quiz Master</h1>
      </div>
      <p className="mb-8 text-lg text-gray-300 max-w-2xl mx-auto">
        Join a team or create a new session to begin your AWS learning journey.
      </p>

      {errorMsg && (
        <div className="bg-red-500/10 border-2 border-danger text-danger p-4 rounded-md w-full mb-8 shadow-[4px_4px_0px_0px_var(--danger)]">
          <p className="font-bold text-lg">Error Occurred</p>
          <p className="text-sm break-words">{errorMsg}</p>
        </div>
      )}

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* LEFT SIDE: Create Team */}
        <div className="bg-[#10141a] border-4 border-[#324054] shadow-[12px_12px_0px_0px_rgba(0,0,0,0.8)] rounded-xl overflow-hidden flex-1 p-8 md:p-10 flex flex-col">
          <div className="flex flex-col items-start text-left gap-4 mb-8">
            <div className="bg-primary/20 p-4 rounded-md border-2 border-primary shadow-[4px_4px_0px_0px_var(--primary)]">
              <img src="/icons/AWS Student Builder Group_RGB_Icons_Wrench_Blue.svg" alt="Make Team Icon" className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white mb-2 tracking-tight shadow-none">Make New Team</h2>
              <p className="text-gray-400">Start a new team session for a specific quiz.</p>
            </div>
          </div>

          <form action={playQuizAction} className="flex flex-col gap-6 w-full">
            <input type="hidden" name="mode" value="TEAM" />
            <div>
              <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 text-left">Quiz Code</label>
              <input
                name="quizCode"
                type="text"
                placeholder="4-Digit Quiz Code"
                className="w-full bg-[#0d1117] border-2 border-[#445167] p-4 text-white text-xl tracking-widest font-mono uppercase focus:border-primary focus:shadow-[4px_4px_0px_0px_var(--primary)] outline-none transition-all"
                required
                maxLength={4}
                minLength={4}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 text-left">Your Name / Team Name</label>
              <input
                name="name"
                type="text"
                placeholder="Enter your name"
                className="w-full bg-[#0d1117] border-2 border-[#445167] p-4 text-white text-xl focus:border-primary focus:shadow-[4px_4px_0px_0px_var(--primary)] outline-none transition-all"
                required
                maxLength={20}
              />
            </div>
            <button type="submit" className="mt-4 bg-primary text-white font-black text-xl uppercase tracking-wider py-4 px-6 border-2 border-black shadow-[6px_6px_0px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#000] transition-all w-full flex justify-center items-center gap-2">
              Create Team <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
            </button>
          </form>
        </div>

        {/* MIDDLE: Join Team */}
        <div className="bg-[#10141a] border-4 border-[#324054] shadow-[12px_12px_0px_0px_rgba(0,0,0,0.8)] rounded-xl overflow-hidden flex-1 p-8 md:p-10 flex flex-col">
          <div className="flex flex-col items-start text-left gap-4 mb-8">
            <div className="bg-tertiary/20 p-4 rounded-md border-2 border-tertiary shadow-[4px_4px_0px_0px_var(--tertiary)]">
              <img src="/icons/AWS Student Builder Group_RGB_Icons_Teams_Purple.svg" alt="Join Team Icon" className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white mb-2 tracking-tight shadow-none">Join Your Team</h2>
              <p className="text-gray-400">Enter the invite code to join your teammate.</p>
            </div>
          </div>

          <form action={joinSession} className="flex flex-col gap-6 w-full">
            <div>
              <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 text-left">Team Invite Code</label>
              <input
                name="joinCode"
                type="text"
                placeholder="4-Digit Code"
                className="w-full bg-[#0d1117] border-2 border-[#445167] p-4 text-white text-xl tracking-widest font-mono uppercase focus:border-tertiary focus:shadow-[4px_4px_0px_0px_var(--tertiary)] outline-none transition-all"
                required
                maxLength={4}
                minLength={4}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 text-left">Your Name</label>
              <input
                name="name"
                type="text"
                placeholder="Enter your name"
                className="w-full bg-[#0d1117] border-2 border-[#445167] p-4 text-white text-xl focus:border-tertiary focus:shadow-[4px_4px_0px_0px_var(--tertiary)] outline-none transition-all"
                required
                maxLength={20}
              />
            </div>
            <button type="submit" className="mt-4 bg-tertiary text-white font-black text-xl uppercase tracking-wider py-4 px-6 border-2 border-black shadow-[6px_6px_0px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#000] transition-all w-full flex justify-center items-center gap-2">
              Join Session <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
            </button>
          </form>
        </div>

        {/* BOTTOM WIDE CARD: View Leaderboard */}
        <div className="bg-[#10141a] border-4 border-[#324054] shadow-[12px_12px_0px_0px_rgba(0,0,0,0.8)] rounded-xl overflow-hidden flex-1 p-8 md:p-10 flex flex-col md:col-span-2">
          <div className="flex flex-col items-start text-left gap-4 mb-8">
            <div className="bg-yellow-500/20 p-4 rounded-md border-2 border-yellow-500 shadow-[4px_4px_0px_0px_#eab308]">
              <img src="/icons/AWS Student Builder Group_RGB_Icons_Clock_Purple.svg" alt="Leaderboard Icon" className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white mb-2 tracking-tight shadow-none">Leaderboard</h2>
              <p className="text-gray-400">View live stats and rankings for a quiz.</p>
            </div>
          </div>

          <form action={viewLeaderboardAction} className="flex flex-col gap-6 w-full mt-auto">
            <div>
              <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 text-left">Quiz Code</label>
              <input
                name="quizCode"
                type="text"
                placeholder="4-Digit Quiz Code"
                className="w-full bg-[#0d1117] border-2 border-[#445167] p-4 text-white text-xl tracking-widest font-mono uppercase focus:border-yellow-500 focus:shadow-[4px_4px_0px_0px_#eab308] outline-none transition-all"
                required
                maxLength={4}
                minLength={4}
              />
            </div>
            <button type="submit" className="mt-4 bg-yellow-500 text-black font-black text-xl uppercase tracking-wider py-4 px-6 border-2 border-black shadow-[6px_6px_0px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#000] transition-all w-full flex justify-center items-center gap-2">
              View Stats <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter"><path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" /></svg>
            </button>
          </form>
        </div>

      </div>
    </main>
  );
}
