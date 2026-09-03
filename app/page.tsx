import { joinSession, playQuizAction } from "./actions";
import { getAllQuizzes } from "@/lib/quiz/db";

export default async function Home({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const errorMsg = params.error;

  const quizzes = await getAllQuizzes();

  return (
    <main className="container flex flex-col items-center justify-center gap-4 mt-12 mb-16 text-center max-w-4xl">
      <img src="/icons/App_Icon.svg" alt="App Icon" className="mb-4 w-20 h-20" />
      <h1 className="mb-2">AWS Quiz Master</h1>
      <p className="mb-8">Test your knowledge or challenge your friends in real-time.</p>

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-md mt-4 w-full mb-8">
          <p className="font-bold">Error Occurred</p>
          <p className="text-sm break-words">{errorMsg}</p>
        </div>
      )}

      <div className="w-full flex flex-col md:flex-row gap-6 mt-4">
        {/* Make New Team Section */}
        <div className="glass-panel flex-1 flex flex-col items-center gap-6 py-10 px-8 shadow-lg">
          <img src="/icons/AWS Student Builder Group_RGB_Icons_Teams_Purple.svg" alt="Teams" className="w-12 h-12 mb-2" />
          <h3 className="text-2xl mb-2">Make New Team</h3>
          <p className="text-sm text-gray-400 mb-2">Start a new team session for a specific quiz.</p>
          <form action={playQuizAction} className="flex flex-col gap-6 w-full">
            <input type="hidden" name="mode" value="TEAM" />
            <input 
              name="quizCode" 
              type="text" 
              placeholder="4-Digit Quiz Code" 
              className="input text-center text-lg tracking-widest uppercase w-full" 
              required 
              maxLength={4}
              minLength={4}
            />
            <input 
              name="name" 
              type="text" 
              placeholder="Team/Your Name" 
              className="input text-center text-lg w-full" 
              required 
              maxLength={20}
            />
            <button type="submit" className="btn w-full mt-4 text-lg py-3">Create Team</button>
          </form>
        </div>

        {/* Join Your Team Section */}
        <div className="glass-panel flex-1 flex flex-col items-center gap-6 py-10 px-8 shadow-lg w-full">
          <img src="/icons/AWS Student Builder Group_RGB_Icons_Teams_Purple.svg" alt="Teams" className="w-12 h-12 mb-2" />
          <h3 className="text-2xl mb-2">Join Your Team</h3>
          <p className="text-sm text-gray-400 mb-2">Enter the team invite code to join your teammate.</p>
          <form action={joinSession} className="flex flex-col gap-6 w-full">
            <input 
              name="joinCode" 
              type="text" 
              placeholder="4-Digit Invite Code" 
              className="input text-center text-lg tracking-widest uppercase w-full" 
              required 
              maxLength={4}
              minLength={4}
            />
            <input 
              name="name" 
              type="text" 
              placeholder="Your Name" 
              className="input text-center text-lg w-full" 
              required 
              maxLength={20}
            />
            <button type="submit" className="btn w-full mt-4 text-lg py-3">Join Session</button>
          </form>
        </div>
      </div>
    </main>
  );
}
