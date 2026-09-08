import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getQuiz, getSession, getParticipants } from "@/lib/quiz/db";
import Link from "next/link";
import { ArrowLeft, Trophy, User } from "lucide-react";
import { ScoreEditorClient } from "../../ScoreEditorClient";

export default async function SecretSessionManagePage({
  params,
}: {
  params: Promise<{ quizId: string, sessionId: string }>;
}) {
  const cookieStore = await cookies();
  if (cookieStore.get("admin_auth")?.value !== "true") {
    redirect("/admin");
  }

  const { quizId, sessionId } = await params;
  const quiz = await getQuiz(quizId);
  const session = await getSession(sessionId);
  
  if (!quiz || !session) return <div>Quiz or Session not found</div>;

  const participants = await getParticipants(sessionId);
  
  // Sort participants by score descending to show current leaderboard
  const sortedParticipants = [...participants].sort((a, b) => (b.score || 0) - (a.score || 0));

  return (
    <main className="container flex flex-col gap-8 mt-8 max-w-4xl mx-auto">
      <div className="flex flex-col gap-4 border-b border-white/10 pb-6">
        <Link href={`/admin/m/${quizId}`} className="text-gray-400 hover:text-white self-start">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h2 className="mb-1 text-white flex items-center gap-2">
            Leaderboard Management
          </h2>
          <div className="flex flex-col text-gray-400 text-sm">
            <span>Quiz: <span className="text-white font-bold">{quiz.title}</span></span>
            <span>Session: <span className="text-white font-mono font-bold tracking-widest">{session.joinCode}</span></span>
          </div>
        </div>
      </div>

      <div className="bg-[#1a202c] border-[3px] border-[#2d3748] rounded-md p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-3 mb-6">
          <Trophy size={28} className="text-yellow-400" />
          <h3 className="text-2xl font-bold mb-0 text-white">Edit Scores</h3>
        </div>

        {sortedParticipants.length === 0 ? (
          <p className="text-gray-500">No participants in this session yet.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {sortedParticipants.map((p, index) => (
              <div key={p.id} className="flex items-center justify-between bg-[#212836] border border-white/5 p-4 rounded-md">
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-black text-gray-600 w-8">#{index + 1}</div>
                  <div className="flex items-center gap-2">
                    <User size={18} className="text-primary" />
                    <span className="font-bold text-lg text-white">{p.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-gray-400 uppercase ml-2">{p.status}</span>
                  </div>
                </div>
                
                <ScoreEditorClient participant={p} sessionId={sessionId} />
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="text-sm text-gray-500 bg-red-900/20 border border-red-500/30 p-4 rounded text-center">
        <p><strong>Warning:</strong> Editing scores will immediately impact the public leaderboard for this session.</p>
      </div>
    </main>
  );
}
