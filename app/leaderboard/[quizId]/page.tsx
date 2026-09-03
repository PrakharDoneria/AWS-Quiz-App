import { ddbDocClient, TableName } from "@/lib/aws/dynamodb";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { getQuiz, getParticipants } from "@/lib/quiz/db";
import { Trophy, Home } from "lucide-react";
import Link from "next/link";

export default async function PublicLeaderboardPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId } = await params;
  const quiz = await getQuiz(quizId);
  if (!quiz) {
    return (
      <div className="container mt-20 text-center">
        <h2 className="text-3xl text-white mb-4">Quiz Not Found</h2>
        <Link href="/" className="text-primary hover:underline">Return Home</Link>
      </div>
    );
  }

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

    const teamName = participants.map(p => p.name).join(" & ") || "Unknown Team";

    return {
      session,
      participants,
      teamName,
      teamScore,
      totalTimeTaken,
      avgTimePerQuestion
    };
  }));

  // Sort descending by teamScore
  leaderboard.sort((a, b) => b.teamScore - a.teamScore);

  // --- HORIZONTAL BAR CHART LOGIC ---
  const maxScore = Math.max(...leaderboard.map(l => l.teamScore), 10);

  return (
    <main className="container flex flex-col items-center gap-12 mt-12 mb-16 px-4 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col items-center text-center gap-4">
        <Trophy size={48} className="text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
        <h1 className="text-5xl font-black text-white tracking-tight shadow-none" style={{ textShadow: '4px 4px 0px var(--primary)' }}>
          Leaderboard
        </h1>
        <h2 className="text-2xl text-gray-300 font-bold uppercase tracking-wider">{quiz.title}</h2>
      </div>

      {leaderboard.length === 0 ? (
        <div className="bg-[#10141a] border-4 border-[#324054] p-12 rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)] text-center w-full">
          <p className="text-xl text-gray-400 font-bold">No teams have completed this quiz yet.</p>
        </div>
      ) : (
        <div className="w-full flex flex-col gap-12">
          
          {/* BAR CHART SECTION */}
          <div className="bg-[#10141a] border-4 border-[#324054] rounded-xl p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,0.8)] overflow-hidden w-full relative">
            <h3 className="text-xl font-bold uppercase text-gray-400 mb-8 tracking-wider">Team Rankings</h3>
            
            <ul className="flex flex-col gap-6 w-full">
              {leaderboard.map((entry, index) => {
                const barPercentage = Math.max(5, Math.round((entry.teamScore / maxScore) * 100));
                return (
                  <li key={entry.session.id} className="flex flex-col gap-4">
                    <div className="flex justify-between items-end">
                      <div className="flex items-center gap-4">
                        <span className={`text-2xl font-black ${index === 0 ? 'text-yellow-400' : 'text-gray-400'}`}>
                          #{index + 1}
                        </span>
                        <span className="text-xl font-bold text-white uppercase tracking-wider">
                          {entry.teamName}
                        </span>
                      </div>
                      <div className="text-2xl font-black text-primary">
                        {entry.teamScore} <span className="text-sm text-gray-400 font-normal">pts</span>
                      </div>
                    </div>
                    
                    {/* Horizontal Bar */}
                    <div className="w-full bg-[#1a202c] h-8 rounded-full overflow-hidden border-2 border-[#445167]">
                      <div 
                        className={`h-full ${index === 0 ? 'bg-yellow-400' : 'bg-primary'} transition-all duration-1000 ease-out flex items-center justify-end px-4`}
                        style={{ width: `${barPercentage}%` }}
                      >
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* DATA TABLE SECTION */}
          <div className="bg-[#10141a] border-4 border-[#324054] rounded-xl p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,0.8)] overflow-hidden w-full">
            <h3 className="text-xl font-bold uppercase text-gray-400 mb-6 tracking-wider">Detailed Stats</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-[#324054] text-gray-400 uppercase tracking-wider text-sm">
                    <th className="py-4 font-bold">Rank</th>
                    <th className="py-4 font-bold">Team Name</th>
                    <th className="py-4 font-bold">Total Score</th>
                    <th className="py-4 font-bold">Total Time</th>
                    <th className="py-4 font-bold">Avg Time/Q</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, index) => (
                    <tr key={entry.session.id} className="border-b border-[#324054]/50 hover:bg-[#1a202c] transition-colors">
                      <td className={`py-4 font-bold text-xl ${index === 0 ? 'text-yellow-400' : 'text-gray-300'}`}>
                        #{index + 1}
                      </td>
                      <td className="py-4 font-bold text-white uppercase tracking-wide">
                        {entry.teamName}
                      </td>
                      <td className="py-4 font-black text-primary">
                        {entry.teamScore} pts
                      </td>
                      <td className="py-4 text-gray-300 font-mono">
                        {entry.totalTimeTaken}s
                      </td>
                      <td className="py-4 text-gray-300 font-mono">
                        {entry.avgTimePerQuestion}s
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-6 text-sm text-gray-500 font-bold border-t-2 border-[#324054] pt-4">
              * Total Score includes up to a 50% Speed Bonus for answering quickly.
            </div>
          </div>

        </div>
      )}

      {/* Footer Navigation */}
      <div className="mt-4">
        <Link 
          href="/" 
          className="flex items-center gap-2 bg-[#212836] border-2 border-[#324054] px-6 py-3 text-white font-bold uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.6)] transition-all"
        >
          <Home size={20} /> Back to Home
        </Link>
      </div>

    </main>
  );
}
