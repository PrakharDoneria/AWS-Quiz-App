"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import { Participant, Session } from "@/types/session";

interface LobbyClientProps {
  session: Session;
  participants: Participant[];
  participantId: string;
  startQuizAction: () => Promise<void>;
}

export default function LobbyClient({ session, participants, participantId, startQuizAction }: LobbyClientProps) {
  const router = useRouter();

  // Polling for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 2000); // Poll every 2 seconds
    return () => clearInterval(interval);
  }, [router]);

  if (session.status === 'ACTIVE') {
    // If we're just polling and the session goes active, this client-side redirect helps catch it instantly
    router.push(`/session/${session.joinCode}/play?participantId=${participantId}`);
  }

  const isSolo = session.mode === 'SOLO';

  return (
    <div className="glass-panel text-center w-full max-w-md">
      <h2>{isSolo ? "Solo Quiz" : "Team Quiz"}</h2>
      
      {!isSolo && (
        <div className="my-6">
          <p className="text-sm uppercase tracking-wider mb-2">Join Code</p>
          <div className="text-4xl font-bold tracking-widest bg-black/30 py-4 rounded-lg">
            {session.joinCode}
          </div>
          {participants.length < 2 && (
            <p className="text-sm text-gray-400 mt-2 animate-pulse">Waiting for teammate...</p>
          )}
        </div>
      )}

      <div className="mb-8">
        <h3 className="flex items-center justify-center gap-2 mb-4">
          <Users size={20} /> Players ({participants.length}{!isSolo ? "/2" : ""})
        </h3>
        {participants.length === 0 ? (
          <p className="text-gray-400">Waiting for players to join...</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {participants.map(p => (
              <li key={p.id} className="bg-white/5 p-3 rounded-md border border-white/10">
                {p.name} {p.id === participantId ? "(You)" : ""}
              </li>
            ))}
          </ul>
        )}
      </div>

      <form action={startQuizAction}>
        {isSolo ? (
          <button type="submit" className="btn w-full text-lg py-3">
            Start Solo Quiz
          </button>
        ) : (
          <button type="submit" className="btn w-full text-lg py-3" disabled={participants.length === 0}>
            {participants.length === 1 ? "Start Alone" : "Start Quiz"}
          </button>
        )}
      </form>
    </div>
  );
}
