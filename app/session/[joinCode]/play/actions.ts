"use server";

import { submitAnswer as dbSubmitAnswer, getSession, getQuestions, updateSessionStatus } from "@/lib/quiz/db";

export async function submitAnswerAction(
  sessionId: string,
  participantId: string,
  questionId: string,
  selectedOptionId: string
) {
  const session = await getSession(sessionId);
  if (!session) throw new Error("Session not found");

  const questions = await getQuestions(session.quizId);
  const question = questions.find(q => q.id === questionId);
  if (!question) throw new Error("Question not found");

  const isCorrect = question.correctOptionId === selectedOptionId;

  await dbSubmitAnswer(sessionId, participantId, questionId, selectedOptionId, isCorrect);

  return { success: true, isCorrect };
}

export async function finishQuizAction(sessionId: string) {
  await updateSessionStatus(sessionId, "COMPLETED");
}
