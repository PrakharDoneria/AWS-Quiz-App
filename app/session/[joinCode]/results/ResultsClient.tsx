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
  participantId,
  accuracies
}: {
  session: Session;
  participants: Participant[];
  teamScore: number | null;
  participantId: string;
  accuracies: Record<string, number>;
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
        <div className="my-8 bg-[#10141a] border-4 border-[#324054] p-8 rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)] flex flex-col items-center gap-4 animate-pulse">
          <Loader2 size={40} className="animate-spin text-primary" />
          <h2 className="text-xl font-bold text-white uppercase tracking-wider">Waiting for teammate to finish...</h2>
          <p className="text-gray-400 text-sm font-bold">Your individual score is ready, but the team score will be calculated once everyone completes the quiz.</p>
        </div>
      ) : (
        <div className="my-8 bg-[#10141a] border-4 border-[#324054] p-8 rounded-xl shadow-[12px_12px_0px_0px_rgba(0,0,0,0.8)]">
          <h2 className="text-xl mb-4 font-bold text-gray-400 uppercase tracking-wider">{isSolo ? "Your Total Score" : "Team Total Score"}</h2>
          <div className="text-6xl font-black text-primary flex items-center justify-center gap-2 drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]">
            {teamScore !== null ? `${teamScore}` : '...'} <span className="text-2xl text-gray-400 font-bold">pts</span>
          </div>
          {!isSolo && participants.length > 1 && (
            <p className="mt-4 text-sm font-bold text-gray-500 uppercase tracking-wider">Sum of all team members' points</p>
          )}
        </div>
      )}

      <div className="mb-8 w-full">
        <h3 className="mb-6 text-left border-b-2 border-[#324054] pb-2 font-bold text-gray-400 uppercase tracking-wider">Individual Stats</h3>
        <ul className="flex flex-col gap-4">
          {participants.map(p => {
            const isMe = p.id === participantId;
            return (
              <li key={p.id} className="flex justify-between items-center bg-[#1a202c] border-2 border-[#445167] p-4 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]">
                <div className="flex flex-col text-left gap-1">
                  <span className="font-black text-xl text-white uppercase tracking-wider flex items-center gap-3">
                    {p.name} {isMe && <span className="text-xs bg-primary text-black px-2 py-1 rounded-sm shadow-[2px_2px_0px_0px_#000]">You</span>}
                  </span>
                  {p.status === 'COMPLETED' && (
                    <span className="text-sm font-bold text-gray-400">Accuracy: <span className="text-yellow-400">{accuracies[p.id]}%</span></span>
                  )}
                </div>
                <div className="text-2xl font-black text-primary">
                  {p.status === 'COMPLETED' ? (
                    <>{p.score} <span className="text-sm text-gray-400 font-bold">pts</span></>
                  ) : (
                    <span className="text-gray-500 text-lg">Waiting...</span>
                  )}
                </div>
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
