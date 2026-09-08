import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAllQuizzes } from "@/lib/quiz/db";
import Link from "next/link";
import { Settings, ShieldAlert, ArrowRight } from "lucide-react";

export default async function SecretManagePage() {
  const cookieStore = await cookies();
  if (cookieStore.get("admin_auth")?.value !== "true") {
    redirect("/admin");
  }

  const quizzes = await getAllQuizzes();

  return (
    <main className="container flex flex-col gap-6 mt-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6 border-b border-red-500/30 pb-4">
        <ShieldAlert size={32} className="text-red-500" />
        <h2 className="mb-0 text-red-500">Secret Management Area</h2>
      </div>
      
      <p className="text-gray-400">Select a quiz to manage its sessions, view questions, or manually adjust leaderboard scores.</p>

      {quizzes.length === 0 ? (
        <div className="glass-panel p-6 text-center text-gray-400">
          <p>No quizzes available.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="bg-[#212836] border border-[#324054] rounded-md p-6 flex flex-col gap-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">{quiz.title}</h3>
                <p className="text-gray-400 text-sm line-clamp-2">{quiz.description || "No description"}</p>
              </div>
              <div className="mt-auto pt-4 flex justify-between items-center border-t border-white/5">
                <span className="text-xs font-mono text-gray-500">Code: {quiz.quizCode}</span>
                <Link 
                  href={`/admin/m/${quiz.id}`}
                  className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors"
                >
                  Manage Sessions <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
