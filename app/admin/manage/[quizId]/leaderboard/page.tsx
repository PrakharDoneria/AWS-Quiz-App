import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Trophy, ArrowLeft, Users, Medal } from "lucide-react";
import Link from "next/link";
import { getQuiz, getParticipants } from "@/lib/quiz/db";

import { ddbDocClient, TableName } from "@/lib/aws/dynamodb";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";

export default async function LeaderboardPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const cookieStore = await cookies();
  if (cookieStore.get("admin_auth")?.value !== "true") {
    redirect("/admin");
  }

  const { quizId } = await params;
  const quiz = await getQuiz(quizId);
  if (!quiz) return <div>Quiz not found</div>;

  const sessionResponse = await ddbDocClient.send(new ScanCommand({
    TableName,
    FilterExpression: "SK = :sk AND begins_with(PK, :pk) AND quizId = :qid AND #st = :st",
    ExpressionAttributeNames: { "#st": "status" },
    ExpressionAttributeValues: {
      ":sk": "METADATA",
      ":pk": "SESSION#",
      ":qid": quizId,
      ":st": "COMPLETED"
    }
  }));

  const sessions = sessionResponse.Items || [];
  
  // Aggregate scores and stats for each session
  const leaderboard = await Promise.all(sessions.map(async (session) => {
    const participants = await getParticipants(session.id);
    const teamScore = participants.reduce((sum, p) => sum + (p.score || 0), 0);
    const totalTimeTaken = participants.reduce((sum, p) => sum + (p.totalTimeTaken || 0), 0);
    const avgTimePerQuestion = participants.length > 0 
      ? Math.round(participants.reduce((sum, p) => sum + (p.avgTimePerQuestion || 0), 0) / participants.length) 
      : 0;

    return {
      session,
      participants,
      teamScore,
      totalTimeTaken,
      avgTimePerQuestion
    };
  }));

  // Sort descending by teamScore (points)
  leaderboard.sort((a, b) => b.teamScore - a.teamScore);

  const maxScore = Math.max(...leaderboard.map(l => l.teamScore), 1);

  return (
    <main className="container flex flex-col items-center justify-center gap-4 mt-8">
      <div className="w-full max-w-4xl">
        <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
          <Trophy size={32} className="text-yellow-400" />
          <h2 className="mb-0">Global Leaderboard: {quiz.title}</h2>
        </div>

        {leaderboard.length === 0 ? (
          <div className="glass-panel p-6 text-center text-gray-400">
            <p>No completed sessions found for this quiz.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-6">
            {leaderboard.map((entry, index) => {
              let medalColor = "text-transparent";
              if (index === 0) medalColor = "text-yellow-400";
              else if (index === 1) medalColor = "text-gray-300";
              else if (index === 2) medalColor = "text-amber-600";

              const barPercentage = Math.max(5, Math.round((entry.teamScore / maxScore) * 100));

              return (
                <li key={entry.session.id} className="bg-[#212836] border-[3px] border-[#324054] rounded-md p-6 flex flex-col gap-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.5)] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.6)] transition-all">
                  
                  {/* Top Row: Info & Points */}
                  <div className="flex items-center gap-6">
                    <div className="w-12 text-3xl font-bold text-gray-500">#{index + 1}</div>
                    
                    {index < 3 ? (
                      <Medal size={32} className={medalColor} />
                    ) : (
                      <div className="w-[32px]"></div> // Spacer
                    )}
                    
                    <div className="flex-1 flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-gray-400" />
                        <span className="font-bold text-xl uppercase tracking-wider text-white truncate max-w-xs">
                          {entry.participants.map(p => p.name).join(" & ")}
                        </span>
                        <span className="text-gray-500 text-sm ml-2 font-mono">Code: {entry.session.joinCode}</span>
                      </div>
                      <div className="text-gray-400 text-sm flex items-center gap-2">
                        <span className="bg-white/10 px-2 py-0.5 rounded text-xs font-bold uppercase">{entry.session.mode} TEAM</span>
                      </div>
                    </div>
                    
                    <div className="text-3xl font-bold bg-primary/20 text-primary border-2 border-primary px-6 py-2 shadow-[2px_2px_0px_0px_var(--primary)] flex-shrink-0">
                      {entry.teamScore} <span className="text-sm font-normal opacity-70">pts</span>
                    </div>
                  </div>

                  {/* Middle Row: Bar Chart */}
                  <div className="w-full bg-[#10141a] h-6 rounded-full overflow-hidden border-2 border-[#445167]">
                    <div 
                      className={`h-full ${index === 0 ? 'bg-yellow-400' : 'bg-primary'} transition-all duration-1000 ease-out`}
                      style={{ width: `${barPercentage}%` }}
                    />
                  </div>

                  {/* Bottom Row: Stats */}
                  <div className="flex justify-between items-center text-sm font-bold uppercase tracking-wider text-gray-400 px-2">
                    <div className="flex gap-8">
                      <div><span className="text-gray-500">Total Time:</span> <span className="text-white">{entry.totalTimeTaken}s</span></div>
                      <div><span className="text-gray-500">Avg Time/Q:</span> <span className="text-white">{entry.avgTimePerQuestion}s</span></div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-8 flex items-center mb-8 border-t border-white/10 pt-4">
          <Link href="/admin/manage" className="text-sm text-primary hover:underline flex items-center gap-1">
            <ArrowLeft size={16} /> Back to Manage
          </Link>
        </div>
      </div>
    </main>
  );
}
