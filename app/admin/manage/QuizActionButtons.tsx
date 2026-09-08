"use client";

import { Trash2, Trophy, RotateCcw, Copy, Check } from "lucide-react";
import Link from "next/link";
import { deleteQuizAction, resetLeaderboardAction } from "./actions";
import { useTransition, useState } from "react";

export default function QuizActionButtons({ quizId, quizCode }: { quizId: string, quizCode?: string }) {
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  const copyQuizLink = () => {
    if (!quizCode) return;
    const url = `${window.location.origin}/?quizCode=${quizCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset the leaderboard and delete all submissions?')) {
      startTransition(() => {
        const formData = new FormData();
        formData.append("quizId", quizId);
        resetLeaderboardAction(formData);
      });
    }
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this quiz? This cannot be undone.')) {
      startTransition(() => {
        const formData = new FormData();
        formData.append("quizId", quizId);
        deleteQuizAction(formData);
      });
    }
  };

  return (
    <div className="flex items-center gap-4">
      {quizCode && (
        <button 
          onClick={copyQuizLink}
          className="p-2 text-gray-400 hover:text-white transition-colors" 
          title="Copy Quiz Share Link"
        >
          {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
        </button>
      )}

      <Link href={`/admin/manage/${quizId}/leaderboard`} className="p-2 text-gray-400 hover:text-primary transition-colors" title="View Leaderboard">
        <Trophy size={20} />
      </Link>
      
      <button 
        onClick={handleReset} 
        disabled={isPending}
        className="p-2 text-gray-400 hover:text-yellow-500 transition-colors disabled:opacity-50" 
        title="Reset Leaderboard & Submissions"
      >
        <RotateCcw size={20} />
      </button>

      <button 
        onClick={handleDelete} 
        disabled={isPending}
        className="p-2 text-gray-400 hover:text-danger transition-colors disabled:opacity-50" 
        title="Delete Quiz"
      >
        <Trash2 size={20} />
      </button>
    </div>
  );
}
