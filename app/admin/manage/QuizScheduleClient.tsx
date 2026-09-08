"use client";

import { useState } from "react";
import { Quiz } from "@/types/quiz";
import { updateQuizSettingsAction } from "./actions";

export default function QuizScheduleClient({ quiz }: { quiz: Quiz }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'MANUAL' | 'AUTO'>(quiz.scheduleMode || 'MANUAL');
  const [status, setStatus] = useState<'DRAFT' | 'ACTIVE' | 'ENDED'>(quiz.status || 'ACTIVE');

  return (
    <div className="mt-4 border-t border-white/10 pt-4 w-full">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="text-sm font-bold text-gray-400 hover:text-white transition-colors flex items-center gap-2"
      >
        {isOpen ? '▼ Hide Schedule Settings' : '▶ Manage Schedule & Status'}
      </button>

      {isOpen && (
        <form action={updateQuizSettingsAction} className="mt-4 flex flex-col gap-4 bg-[#0d1117] p-4 rounded-md border border-[#445167]">
          <input type="hidden" name="quizId" value={quiz.id} />
          
          <div className="flex gap-4 items-center">
            <label className="text-sm font-bold text-gray-300">Mode:</label>
            <select 
              name="scheduleMode" 
              value={mode} 
              onChange={(e) => setMode(e.target.value as 'MANUAL' | 'AUTO')}
              className="bg-[#1a202c] border border-[#324054] text-white p-2 rounded"
            >
              <option value="MANUAL">Manual</option>
              <option value="AUTO">Auto (Date & Time)</option>
            </select>
          </div>

          {mode === 'MANUAL' && (
            <div className="flex gap-4 items-center mt-2">
              <label className="text-sm font-bold text-gray-300">Current Status:</label>
              <select 
                name="status" 
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="bg-[#1a202c] border border-[#324054] text-white p-2 rounded"
              >
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active (Started)</option>
                <option value="ENDED">Ended</option>
              </select>
            </div>
          )}

          {mode === 'AUTO' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">Start Time (IST, Optional)</label>
                <input 
                  type="datetime-local" 
                  name="startTime" 
                  defaultValue={quiz.startTime || ""}
                  className="w-full bg-[#1a202c] border border-[#324054] text-white p-2 rounded"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">End Time (IST, Optional)</label>
                <input 
                  type="datetime-local" 
                  name="endTime" 
                  defaultValue={quiz.endTime || ""}
                  className="w-full bg-[#1a202c] border border-[#324054] text-white p-2 rounded"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end mt-2">
            <button 
              type="submit" 
              className="bg-primary text-white font-bold py-2 px-4 rounded text-sm hover:bg-primary/80 transition-colors"
            >
              Save Settings
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
