import { getQuestions, getAnswersForParticipant, getParticipants, updateParticipantStatus, updateSessionStatus, getSession } from "./db";

export async function calculateParticipantScore(sessionId: string, participantId: string, quizId: string): Promise<number> {
  const questions = await getQuestions(quizId);
  const answers = await getAnswersForParticipant(sessionId, participantId);

  const totalQuestions = questions.length;
  if (totalQuestions === 0) return 0;

  let correctCount = 0;
  for (const q of questions) {
    const answer = answers.find(a => a.questionId === q.id);
    if (answer && answer.selectedOptionId === q.correctOptionId) {
      correctCount++;
    }
  }

  const score = Math.round((correctCount / totalQuestions) * 100);
  
  await updateParticipantStatus(sessionId, participantId, 'COMPLETED', score);
  
  return score;
}

export async function calculateTeamScore(sessionId: string): Promise<number | null> {
  const session = await getSession(sessionId);
  if (!session) return null;

  const participants = await getParticipants(sessionId);
  if (participants.length === 0) return 0;

  const allCompleted = participants.every(p => p.status === 'COMPLETED');
  if (!allCompleted) {
    return null;
  }

  const totalScore = participants.reduce((sum, p) => sum + p.score, 0);
  const averageScore = Math.round(totalScore / participants.length);

  await updateSessionStatus(sessionId, 'COMPLETED');
  
  return averageScore;
}
