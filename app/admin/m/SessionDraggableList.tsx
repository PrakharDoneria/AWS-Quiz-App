"use client";

import { useState } from "react";
import { Session, Participant } from "@/types/session";
import { updateTeamScoreOverride } from "./actions";
import Link from "next/link";
import { GripVertical, Loader2 } from "lucide-react";

type SessionWithStats = {
  session: Session;
  participants: Participant[];
  teamScore: number;
};

export function SessionDraggableList({ 
  initialSessions, 
  quizId 
}: { 
  initialSessions: SessionWithStats[], 
  quizId: string 
}) {
  const [sessions, setSessions] = useState(initialSessions);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, dropIdx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === dropIdx) return;
    if (isPending) return;

    setIsPending(true);

    const newSessions = [...sessions];
    const [draggedItem] = newSessions.splice(draggedIdx, 1);
    newSessions.splice(dropIdx, 0, draggedItem);
    
    // We now have the new desired order. 
    // We need to calculate a new score for draggedItem to fit at dropIdx.
    let newScore = 0;
    if (dropIdx === 0) {
      // Moved to top: take the score of the new 2nd place (which was originally 1st) and add 10.
      newScore = (newSessions[1]?.teamScore || 0) + 10;
    } else if (dropIdx === newSessions.length - 1) {
      // Moved to bottom: take the score of the new 2nd to last and subtract 10 (min 0).
      newScore = Math.max(0, (newSessions[newSessions.length - 2]?.teamScore || 0) - 10);
    } else {
      // Moved somewhere in the middle: average the score of the item above and below.
      const scoreAbove = newSessions[dropIdx - 1].teamScore;
      const scoreBelow = newSessions[dropIdx + 1].teamScore;
      newScore = Math.floor((scoreAbove + scoreBelow) / 2);
    }

    const currentScore = draggedItem.teamScore;
    const diff = newScore - currentScore;

    // Apply the score directly to the local state so the UI feels instant
    draggedItem.teamScore = newScore;
    setSessions(newSessions);

    try {
      await updateTeamScoreOverride(draggedItem.session.id, diff);
    } catch (error) {
      console.error("Failed to update team score:", error);
      // Revert on error
      setSessions(initialSessions);
    } finally {
      setIsPending(false);
      setDraggedIdx(null);
    }
  };

  if (sessions.length === 0) {
    return (
      <div className="glass-panel p-6 text-center text-gray-400">
        <p>No sessions found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 relative">
      {isPending && (
        <div className="absolute inset-0 bg-black/20 z-10 flex items-center justify-center rounded">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      )}
      {sessions.map((item, idx) => (
        <div 
          key={item.session.id} 
          draggable={!isPending}
          onDragStart={(e) => handleDragStart(e, idx)}
          onDragOver={(e) => handleDragOver(e, idx)}
          onDrop={(e) => handleDrop(e, idx)}
          className={`bg-[#212836] border border-[#324054] rounded-md p-4 flex justify-between items-center shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] transition-colors cursor-move
            ${draggedIdx === idx ? 'opacity-50' : ''}
            hover:border-red-500/50
          `}
        >
          <div className="flex items-center gap-4">
            <GripVertical size={20} className="text-gray-500 cursor-move" />
            
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <span className="font-mono text-lg font-bold tracking-widest text-white">{item.session.joinCode}</span>
                <span className={`text-xs px-2 py-0.5 rounded uppercase font-bold ${
                  item.session.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' :
                  item.session.status === 'ACTIVE' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {item.session.status}
                </span>
                <span className="font-bold text-primary ml-2">{item.teamScore} pts</span>
              </div>
              <span className="text-xs text-gray-400 font-bold uppercase">
                {item.participants.length > 0 ? item.participants.map(p => p.name).join(" & ") : "No Participants"}
              </span>
              <span className="text-xs text-gray-500">Mode: {item.session.mode} | Created: {new Date(item.session.createdAt).toLocaleString()}</span>
            </div>
          </div>
          
          <Link 
            href={`/admin/m/${quizId}/${item.session.id}`} 
            className="btn-primary text-sm px-4 py-1.5 flex items-center gap-2 bg-red-600 hover:bg-red-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border-red-800"
            onDragStart={(e) => e.preventDefault()} // Prevent link dragging
          >
            Edit Leaderboard
          </Link>
        </div>
      ))}
    </div>
  );
}
