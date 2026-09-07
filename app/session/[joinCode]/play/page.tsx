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

  const { getQuiz } = await import("@/lib/quiz/db");
  const quiz = await getQuiz(session.quizId);
  if (!quiz) {
    return <div>Quiz not found</div>;
  }

  const questions = await getQuestions(session.quizId);
  const existingAnswers = await getAnswersForParticipant(session.id, participantId);

  return (
    <PlayClient
      sessionId={session.id}
      quizId={session.quizId}
      joinCode={joinCode}
      participantId={participantId!}
      questions={questions}
      existingAnswers={existingAnswers}
      quiz={quiz}
    />
  );
}
