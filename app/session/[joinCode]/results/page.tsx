import { getSessionByJoinCode, getParticipants, getAnswersForParticipant, getQuestions } from "@/lib/quiz/db";
import { calculateTeamScore } from "@/lib/quiz/scoring";
import ResultsClient from "./ResultsClient";

export default async function ResultsPage({
  params,
  searchParams,
}: {
  params: Promise<{ joinCode: string }>;
  searchParams: Promise<{ participantId?: string }>;
}) {
  const { joinCode } = await params;
  const { participantId } = await searchParams;
  
  const session = await getSessionByJoinCode(joinCode);
  if (!session) {
    return <div>Session not found</div>;
  }

  const participants = await getParticipants(session.id);
  const questions = await getQuestions(session.quizId);
  const totalQuestions = questions.length;

  const accuracies: Record<string, number> = {};
  for (const p of participants) {
    if (p.status === 'COMPLETED') {
      const answers = await getAnswersForParticipant(session.id, p.id);
      const correctCount = answers.filter(a => a.isCorrect).length;
      accuracies[p.id] = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    }
  }
  
  // Try to calculate team score (will only succeed if everyone is COMPLETED)
  const teamScore = await calculateTeamScore(session.id);

  return (
    <main className="container flex flex-col items-center justify-center gap-4 mt-8">
      <ResultsClient 
        session={session} 
        participants={participants} 
        teamScore={teamScore} 
        participantId={participantId || ""}
        accuracies={accuracies}
      />
    </main>
  );
}
