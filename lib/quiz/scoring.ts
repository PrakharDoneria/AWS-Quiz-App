import { getQuestions, getAnswersForParticipant, getParticipants, updateParticipantStatus, updateSessionStatus, getSession } from "./db";

export async function calculateParticipantScore(sessionId: string, participantId: string, quizId: string): Promise<number> {
  const questions = await getQuestions(quizId);
  const answers = await getAnswersForParticipant(sessionId, participantId);

  const totalQuestions = questions.length;
  if (totalQuestions === 0) return 0;

  let totalScore = 0;
  let totalTimeTaken = 0;

  for (const q of questions) {
    const answer = answers.find(a => a.questionId === q.id);
    if (answer) {
      totalTimeTaken += answer.timeTaken || 0;
      
      if (answer.selectedOptionId === q.correctOptionId) {
        // Base points
        const basePoints = q.points || 10;
        
        // Speed bonus: up to 50% extra points if answered quickly
        // timeLimit = q.timeLimit || 30
        const timeLimit = q.timeLimit || 30;
        const timeTaken = answer.timeTaken || timeLimit;
        
        // Formula: bonus = 0.5 * basePoints * (1 - (timeTaken / timeLimit))
        // So if timeTaken is 0 (instant), bonus is 50%
        // If timeTaken is timeLimit (last second), bonus is 0%
        const bonusMultiplier = Math.max(0, 1 - (timeTaken / timeLimit));
        const speedBonus = Math.round(0.5 * basePoints * bonusMultiplier);
        
        totalScore += basePoints + speedBonus;
      }
    }
  }

  const avgTimePerQuestion = totalQuestions > 0 ? Math.round(totalTimeTaken / totalQuestions) : 0;
  
  await updateParticipantStatus(
    sessionId, 
    participantId, 
    'COMPLETED', 
    totalScore, 
    totalTimeTaken, 
    avgTimePerQuestion
  );
  
  return totalScore;
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
