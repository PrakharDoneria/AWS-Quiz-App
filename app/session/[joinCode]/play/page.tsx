import { getSessionByJoinCode, getQuestions, getAnswersForParticipant } from "@/lib/quiz/db";
import { redirect } from "next/navigation";
import PlayClient from "./PlayClient";

export default async function PlayPage({
  params,
  searchParams,
}: {
  params: Promise<{ joinCode: string }>;
  searchParams: Promise<{ participantId?: string }>;
}) {
  const { joinCode } = await params;
  const { participantId } = await searchParams;

  if (!participantId) {
    redirect(`/session/${joinCode}/lobby`);
  }

  const session = await getSessionByJoinCode(joinCode);
  if (!session) {
    return <div>Session not found</div>;
  }

  if (session.status === "COMPLETED") {
    redirect(`/session/${joinCode}/results?participantId=${participantId}`);
  }

  const questions = await getQuestions(session.quizId);
  const existingAnswers = await getAnswersForParticipant(session.id, participantId);

  return (
    <main className="container flex flex-col items-center justify-center gap-4 mt-8">
      <PlayClient 
        sessionId={session.id}
        quizId={session.quizId}
        joinCode={joinCode}
        participantId={participantId}
        questions={questions}
        existingAnswers={existingAnswers}
      />
    </main>
  );
}
