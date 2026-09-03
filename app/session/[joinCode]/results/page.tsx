import { getSessionByJoinCode, getParticipants, getAnswersForParticipant, getQuestions } from "@/lib/quiz/db";
import { calculateParticipantScore, calculateTeamScore } from "@/lib/quiz/scoring";
import { Trophy, Star } from "lucide-react";
import Link from "next/link";

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ joinCode: string }>;
}) {
  const { joinCode } = await params;
  const session = await getSessionByJoinCode(joinCode);
  
  if (!session) {
    return <div>Session not found</div>;
  }

  const participants = await getParticipants(session.id);
  const questions = await getQuestions(session.quizId);
  
  // Calculate scores
  const participantScores = await Promise.all(
    participants.map(async (p) => {
      const answers = await getAnswersForParticipant(session.id, p.id);
      return {
        ...p,
        score: calculateParticipantScore(answers as any, questions)
      };
    })
  );

  const teamScore = calculateTeamScore(participantScores.map(p => p.score));

  return (
    <main className="container flex flex-col items-center justify-center gap-4 mt-8">
      <div className="glass-panel text-center w-full max-w-2xl">
        <Trophy size={64} className="mx-auto mb-6 text-yellow-400" />
        <h1 className="mb-2">Quiz Completed!</h1>
        
        <div className="my-8 bg-white/5 p-6 rounded-xl border border-white/10">
          <h2 className="text-xl mb-4 text-gray-300">Team Score</h2>
          <div className="text-6xl font-bold text-white flex items-center justify-center gap-2">
            {teamScore} <Star className="text-yellow-400" size={40} />
          </div>
          {participants.length > 1 && (
            <p className="mt-2 text-sm text-gray-400">Highest individual score on the team</p>
          )}
        </div>

        <div className="mb-8">
          <h3 className="mb-4 text-left border-b border-white/10 pb-2">Individual Scores</h3>
          <ul className="flex flex-col gap-3">
            {participantScores.map(p => (
              <li key={p.id} className="flex justify-between items-center bg-black/20 p-4 rounded-lg">
                <span className="font-medium text-lg">{p.name}</span>
                <span className="text-xl font-bold">{p.score} pts</span>
              </li>
            ))}
          </ul>
        </div>

        <Link href="/" className="btn btn-secondary mt-4">
          Back to Home
        </Link>
      </div>
    </main>
  );
}
