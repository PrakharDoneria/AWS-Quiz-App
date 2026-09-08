"use client";

import { useState, useTransition } from "react";
import { Participant } from "@/types/session";
import { updateParticipantScoreAction } from "./actions";
import { Save, Loader2 } from "lucide-react";

export function ScoreEditorClient({ 
  participant, 
  sessionId 
}: { 
  participant: Participant, 
  sessionId: string 
}) {
  const [score, setScore] = useState(participant.score || 0);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      await updateParticipantScoreAction(sessionId, participant.id, score, participant.status);
    });
  };

  return (
    <div className="flex items-center gap-3">
      <input 
        type="number" 
        value={score} 
        onChange={(e) => setScore(Number(e.target.value))}
        className="w-24 bg-black/50 border border-white/20 rounded px-3 py-1.5 text-white font-mono focus:border-red-500 focus:outline-none transition-colors"
      />
      <button 
        onClick={handleSave}
        disabled={isPending || score === participant.score}
        className="btn-primary p-2 flex items-center justify-center bg-[#2d3748] hover:bg-[#4a5568] border-[#1a202c] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed text-white"
        title="Save Score"
      >
        {isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} className={score !== participant.score ? "text-yellow-400" : "text-gray-400"} />}
      </button>
    </div>
  );
}
