"use server";

import { submitAnswer as dbSubmitAnswer, getSession, getQuestions, updateSessionStatus } from "@/lib/quiz/db";

import { calculateParticipantScore, calculateTeamScore } from "@/lib/quiz/scoring";

export async function submitAnswerAction(
  sessionId: string,
  participantId: string,
  questionId: string,
  selectedOptionId: string,
  timeTaken: number
) {
  const session = await getSession(sessionId);
  if (!session) throw new Error("Session not found");

  const questions = await getQuestions(session.quizId);
  const question = questions.find(q => q.id === questionId);
  if (!question) throw new Error("Question not found");

  const isCorrect = question.correctOptionId === selectedOptionId;

  await dbSubmitAnswer(sessionId, participantId, questionId, selectedOptionId, isCorrect, timeTaken);

  return { success: true, isCorrect };
}

export async function finishQuizAction(sessionId: string, participantId: string, quizId: string) {
  // Calculate individual score and mark participant as COMPLETED
  await calculateParticipantScore(sessionId, participantId, quizId);
  
  // Try to calculate team score (will only happen if all participants are COMPLETED)
  await calculateTeamScore(sessionId);
}
