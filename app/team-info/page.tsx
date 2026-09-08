"use client";

import { useState } from "react";
import { getTeamInfoAction, type TeamInfo } from "./actions";

export default function TeamInfoPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teamData, setTeamData] = useState<TeamInfo | null>(null);

  async function handleSearch(formData: FormData) {
    setLoading(true);
    setError(null);
    setTeamData(null);
    try {
      const result: any = await getTeamInfoAction(formData);
      if (!result.success) {
        setError(result.error);
      } else {
        setTeamData(result.data);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container flex flex-col items-center justify-center gap-8 mt-12 mb-16 max-w-4xl mx-auto px-4">
      <div className="flex justify-center items-center gap-4 mb-4 text-center">
        <h1 className="mb-0 text-5xl tracking-tight text-white shadow-none" style={{ textShadow: '4px 4px 0px var(--primary)' }}>Team Info</h1>
      </div>
      <p className="mb-8 text-lg text-gray-300 text-center">
        Enter the Team Leader's registered Email Address to view team details.
      </p>

      {error && (
        <div className="bg-red-500/10 border-2 border-danger text-danger p-4 rounded-md w-full shadow-[4px_4px_0px_0px_var(--danger)] mb-2">
          <p className="font-bold text-lg">Error</p>
          <p className="text-sm break-words">{error}</p>
        </div>
      )}

      {teamData ? (
        <div className="w-full bg-[#10141a] border-4 border-[#324054] shadow-[12px_12px_0px_0px_rgba(0,0,0,0.8)] rounded-xl p-8 flex flex-col gap-6">
          <div className="border-b-2 border-[#324054] pb-4 mb-4">
            <h2 className="text-3xl font-black text-white">{teamData.teamName}</h2>
            <p className="text-gray-400 mt-2">{teamData.college}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-[#0d1117] border-2 border-primary/50 p-6 rounded-lg w-full flex flex-col gap-3">
              <h3 className="text-xl font-bold text-primary uppercase mb-2 border-b border-primary/30 pb-2">Team Leader</h3>
              <p><span className="text-gray-500 text-sm font-bold uppercase mr-2">Name:</span> <span className="text-white font-mono">{teamData.leader.name}</span></p>
              <p><span className="text-gray-500 text-sm font-bold uppercase mr-2">Email:</span> <span className="text-white font-mono">{teamData.leader.email}</span></p>
              <p><span className="text-gray-500 text-sm font-bold uppercase mr-2">Roll No:</span> <span className="text-white font-mono">{teamData.leader.roll}</span></p>
              <p><span className="text-gray-500 text-sm font-bold uppercase mr-2">Branch:</span> <span className="text-white font-mono">{teamData.leader.branch}</span></p>
              <p><span className="text-gray-500 text-sm font-bold uppercase mr-2">WhatsApp:</span> <span className="text-white font-mono">{teamData.leader.whatsapp}</span></p>
            </div>

            {teamData.teammate ? (
              <div className="bg-[#0d1117] border-2 border-tertiary/50 p-6 rounded-lg w-full flex flex-col gap-3">
                <h3 className="text-xl font-bold text-tertiary uppercase mb-2 border-b border-tertiary/30 pb-2">Teammate</h3>
                <p><span className="text-gray-500 text-sm font-bold uppercase mr-2">Name:</span> <span className="text-white font-mono">{teamData.teammate.name}</span></p>
                <p><span className="text-gray-500 text-sm font-bold uppercase mr-2">Email:</span> <span className="text-white font-mono">{teamData.teammate.email}</span></p>
                <p><span className="text-gray-500 text-sm font-bold uppercase mr-2">Roll No:</span> <span className="text-white font-mono">{teamData.teammate.roll}</span></p>
                <p><span className="text-gray-500 text-sm font-bold uppercase mr-2">WhatsApp:</span> <span className="text-white font-mono">{teamData.teammate.whatsapp}</span></p>
              </div>
            ) : (
              <div className="bg-[#0d1117] border-2 border-[#324054] p-6 rounded-lg w-full flex flex-col items-center justify-center opacity-70">
                <p className="text-gray-400 italic">No teammate registered</p>
              </div>
            )}
          </div>

          <button
            onClick={() => { setTeamData(null); setError(null); }}
            className="mt-4 bg-[#1a202c] border-2 border-[#445167] text-gray-300 hover:text-white font-black text-xl uppercase tracking-wider py-4 px-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.5)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)] transition-all w-full md:w-auto self-center"
          >
            Search Another Team
          </button>
        </div>
      ) : (
        <div className="w-full max-w-xl bg-[#10141a] border-4 border-[#324054] shadow-[12px_12px_0px_0px_rgba(0,0,0,0.8)] rounded-xl p-8 md:p-10 flex flex-col">
          <form action={handleSearch} className="flex flex-col gap-6 w-full text-left">
            <div>
              <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Leader's Email</label>
              <input
                name="email"
                type="email"
                placeholder="Enter leader's email address"
                className="w-full bg-[#0d1117] border-2 border-[#445167] p-4 text-white text-xl focus:border-primary focus:shadow-[4px_4px_0px_0px_var(--primary)] outline-none transition-all"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 bg-primary text-white font-black text-xl uppercase tracking-wider py-4 px-6 border-2 border-black shadow-[6px_6px_0px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#000] transition-all w-full flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Searching..." : "View Team Info"}
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
