import { getSessionByJoinCode, getParticipants } from "@/lib/quiz/db";
import { Trophy, Medal } from "lucide-react";
import Link from "next/link";

export default async function LeaderboardPage({
  params,
}: {
  params: Promise<{ joinCode: string }>;
}) {
  const { joinCode } = await params;
  const session = await getSessionByJoinCode(joinCode);
  
  if (!session) {
    return <div className="container mt-8"><h2>Session not found</h2></div>;
  }

  const participants = await getParticipants(session.id);
  // Sort descending by score
  const sortedParticipants = [...participants].sort((a: any, b: any) => b.score - a.score);

  return (
    <main className="container flex flex-col items-center justify-center gap-4 mt-8">
      <div className="glass-panel text-center w-full max-w-2xl">
        <div className="flex items-center justify-center gap-3 mb-8 border-b border-white/10 pb-6">
          <Trophy size={40} className="text-yellow-400" />
          <h1 className="mb-0">Live Leaderboard</h1>
        </div>
        
        <p className="text-gray-400 mb-6 uppercase tracking-wider text-sm">
          Session Code: {joinCode}
        </p>

        {sortedParticipants.length === 0 ? (
          <p className="text-gray-400 py-8">No players have joined this session yet.</p>
        ) : (
          <ul className="flex flex-col gap-4 mb-8">
            {sortedParticipants.map((p: any, index: number) => {
              let medalColor = "text-transparent";
              if (index === 0) medalColor = "text-yellow-400";
              else if (index === 1) medalColor = "text-gray-300";
              else if (index === 2) medalColor = "text-amber-600";

              return (
                <li key={p.id} className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10 relative overflow-hidden">
                  <div className="w-12 text-2xl font-bold text-gray-500">#{index + 1}</div>
                  {index < 3 ? (
                    <Medal size={28} className={medalColor} />
                  ) : (
                    <div className="w-[28px]"></div> // Spacer
                  )}
                  <span className="font-medium text-xl flex-1 text-left ml-2">{p.name}</span>
                  <div className="text-2xl font-bold bg-primary/20 text-primary px-4 py-1 rounded-md">
                    {p.score} <span className="text-sm font-normal opacity-70">pts</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex justify-center gap-4 mt-8">
          <Link href={`/session/${joinCode}/lobby`} className="btn btn-secondary">
            Back to Lobby
          </Link>
          <Link href={`/session/${joinCode}/leaderboard`} className="btn btn-secondary">
            Refresh
          </Link>
        </div>
      </div>
    </main>
  );
}
