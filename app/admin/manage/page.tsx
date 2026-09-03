import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Settings, Plus, Trash2, Trophy, Hammer } from "lucide-react";
import Link from "next/link";
import { getAllQuizzes } from "@/lib/quiz/db";
import { deleteQuizAction } from "@/app/admin/manage/actions";

export default async function AdminManage() {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get("admin_auth")?.value === "true";

  if (!isAdmin) {
    redirect("/admin");
  }

  const quizzes = await getAllQuizzes();

  return (
    <main className="container flex flex-col items-center justify-center gap-4 mt-8">
      <div className="w-full max-w-4xl">
        <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <Settings size={32} className="text-primary" />
            <h2 className="mb-0">Manage Quizzes</h2>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/dashboard" className="btn btn-secondary text-sm px-4 py-2">
              <Hammer size={18} /> Quiz Builder
            </Link>
            <Link href="/admin/dashboard" className="btn text-sm px-4 py-2">
              <Plus size={18} /> New Quiz
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {quizzes.length === 0 ? (
            <div className="glass-panel text-center py-12 text-gray-400">
              No quizzes found. Create one to get started!
            </div>
          ) : (
            quizzes.map(quiz => (
              <div key={quiz.id} className="glass-panel flex items-center justify-between py-4 px-6">
                <div>
                  <h3 className="text-xl mb-1 flex items-center gap-3">
                    {quiz.title} 
                    {quiz.quizCode && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-md border border-primary/30 tracking-widest font-mono">
                        CODE: {quiz.quizCode}
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-400">{quiz.description}</p>
                </div>
                <div className="flex items-center gap-4">
                  <Link href={`/admin/manage/${quiz.id}/leaderboard`} className="p-2 text-gray-400 hover:text-primary transition-colors" title="View Leaderboard">
                    <Trophy size={20} />
                  </Link>
                  <form action={deleteQuizAction}>
                    <input type="hidden" name="quizId" value={quiz.id} />
                    <button type="submit" className="p-2 text-gray-400 hover:text-danger transition-colors" title="Delete Quiz">
                      <Trash2 size={20} />
                    </button>
                  </form>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-8 flex justify-between items-center mb-8 border-t border-white/10 pt-4">
          <Link href="/" className="text-sm text-primary hover:underline">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
