import { joinSession, playQuizAction } from "./actions";
import { getAllQuizzes } from "@/lib/quiz/db";

export default async function Home({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const errorMsg = params.error;

  const quizzes = await getAllQuizzes();

  return (
    <main className="container flex flex-col items-center justify-center gap-4 mt-12 mb-16 text-center max-w-2xl">
      <img src="/icons/App_Icon.svg" alt="App Icon" className="mb-4 w-20 h-20" />
      <h1 className="mb-2">AWS Quiz Master</h1>
      <p className="mb-8">Test your knowledge or challenge your friends in real-time.</p>

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-md mt-4 w-full mb-8">
          <p className="font-bold">Error Occurred</p>
          <p className="text-sm break-words">{errorMsg}</p>
        </div>
      )}

      {/* Available Quizzes Section */}
      <div className="w-full mb-12">
        <h2 className="text-2xl mb-6 text-left">Available Quizzes</h2>
        {quizzes.length === 0 ? (
          <div className="glass-panel text-center py-12 text-gray-400">
            No quizzes available right now.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {quizzes.map(quiz => (
              <div key={quiz.id} className="glass-panel flex flex-col items-start p-6 w-full shadow-md text-left">
                <h3 className="text-xl font-bold mb-1">{quiz.title}</h3>
                <p className="text-gray-400 text-sm mb-6">{quiz.description}</p>
                <form action={playQuizAction} className="flex gap-4 w-full">
                  <input type="hidden" name="quizId" value={quiz.id} />
                  <input 
                    name="name" 
                    type="text" 
                    placeholder="Your Name" 
                    className="input flex-1" 
                    required 
                    maxLength={20}
                  />
                  <div className="flex gap-2">
                    <button type="submit" name="mode" value="SOLO" className="btn btn-secondary border border-white/20 whitespace-nowrap px-4 py-2 text-sm">
                      Play Solo
                    </button>
                    <button type="submit" name="mode" value="TEAM" className="btn whitespace-nowrap px-4 py-2 text-sm">
                      Play Team
                    </button>
                  </div>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="w-full border-t border-white/10 pt-12">
        <div className="glass-panel flex flex-col items-center gap-6 py-10 px-8 w-full shadow-lg">
          <img src="/icons/AWS Student Builder Group_RGB_Icons_Teams_Purple.svg" alt="Teams" className="w-12 h-12 mb-2" />
          <h3 className="text-2xl mb-2">Join an Existing Team Session</h3>
          <p className="text-sm text-gray-400 mb-2">Did your teammate already create a session? Enter the code below to join them.</p>
          <form action={joinSession} className="flex flex-col gap-6 w-full">
            <input 
              name="joinCode" 
              type="text" 
              placeholder="4-Digit Join Code" 
              className="input text-center text-lg tracking-widest" 
              required 
              maxLength={4}
              minLength={4}
            />
            <input 
              name="name" 
              type="text" 
              placeholder="Your Name" 
              className="input text-center text-lg" 
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
