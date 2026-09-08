"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Copy, Check } from "lucide-react";
import { Participant, Session } from "@/types/session";

interface LobbyClientProps {
  session: Session;
  participants: Participant[];
  participantId: string;
  startQuizAction: () => Promise<void>;
}

export default function LobbyClient({ session, participants, participantId, startQuizAction }: LobbyClientProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const copyInviteLink = () => {
    const url = `${window.location.origin}/?joinCode=${session.joinCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Polling for real-time updates and checking localstorage anti-cheat
  useEffect(() => {
    try {
      if (localStorage.getItem(`attempted_quiz_${session.quizId}`)) {
        router.push(`/?error=${encodeURIComponent("You have already attempted this quiz and cannot rejoin.")}`);
        return;
      }
    } catch (e) {
      console.error(e);
    }

    const interval = setInterval(() => {
      router.refresh();
    }, 2000); // Poll every 2 seconds
    return () => clearInterval(interval);
  }, [router, session.quizId]);

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
          <div className="flex items-center justify-center gap-2">
            <div className="text-4xl font-bold tracking-widest bg-black/30 py-4 px-6 rounded-lg">
              {session.joinCode}
            </div>
            <button 
              onClick={copyInviteLink}
              className="bg-[#1a202c] border-2 border-[#445167] text-gray-300 hover:text-white p-3 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.5)] transition-all"
              title="Copy Invite Link"
            >
              {copied ? <Check size={24} className="text-green-500" /> : <Copy size={24} />}
            </button>
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
