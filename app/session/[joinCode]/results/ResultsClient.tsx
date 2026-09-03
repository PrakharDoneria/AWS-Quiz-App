"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Trophy, Star, Loader2 } from "lucide-react";
import Link from "next/link";
import { Session, Participant } from "@/types/session";

export default function ResultsClient({
  session,
  participants,
  teamScore,
  participantId
}: {
  session: Session;
  participants: Participant[];
  teamScore: number | null;
  participantId: string;
}) {
  const router = useRouter();
  const isSolo = session.mode === 'SOLO';
  const allCompleted = participants.every(p => p.status === 'COMPLETED');
  const me = participants.find(p => p.id === participantId);

  // Poll for updates if waiting for team
  useEffect(() => {
    // Mark as attempted in localstorage for anti-cheat
    try {
      localStorage.setItem(`attempted_quiz_${session.quizId}`, 'true');
    } catch (e) {
      console.error("Localstorage error", e);
    }

    if (!isSolo && !allCompleted) {
      const interval = setInterval(() => {
        router.refresh();
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isSolo, allCompleted, router, session.quizId]);

  return (
    <div className="glass-panel text-center w-full max-w-2xl">
      <Trophy size={64} className="mx-auto mb-6 text-yellow-400" />
      <h1 className="mb-2">{isSolo ? "Quiz Complete" : "Team Quiz Complete"}</h1>
      
      {!allCompleted && !isSolo ? (
        <div className="my-8 bg-white/5 p-8 rounded-xl border border-white/10 flex flex-col items-center gap-4 animate-pulse">
          <Loader2 size={40} className="animate-spin text-primary" />
          <h2 className="text-xl text-white">Waiting for teammate to finish...</h2>
          <p className="text-gray-400 text-sm">Your individual score is ready, but the team score will be calculated once everyone completes the quiz.</p>
        </div>
      ) : (
        <div className="my-8 bg-white/5 p-6 rounded-xl border border-white/10">
          <h2 className="text-xl mb-4 text-gray-300">{isSolo ? "Your Score" : "Team Score"}</h2>
          <div className="text-6xl font-bold text-white flex items-center justify-center gap-2">
            {teamScore !== null ? `${teamScore}%` : '...'}
          </div>
          {!isSolo && participants.length > 1 && (
            <p className="mt-2 text-sm text-gray-400">Average of both scores</p>
          )}
        </div>
      )}

      <div className="mb-8">
        <h3 className="mb-4 text-left border-b border-white/10 pb-2">Individual Scores</h3>
        <ul className="flex flex-col gap-3">
          {participants.map(p => {
            const isMe = p.id === participantId;
            return (
              <li key={p.id} className="flex justify-between items-center bg-black/20 p-4 rounded-lg">
                <span className="font-medium text-lg flex items-center gap-2">
                  {p.name} {isMe && <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">You</span>}
                </span>
                <span className="text-xl font-bold">
                  {p.status === 'COMPLETED' ? `${p.score}%` : 'Waiting...'}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <Link href="/" className="btn btn-secondary mt-4">
        Back to Home
      </Link>
    </div>
  );
}
