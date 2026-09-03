export function calculateTeamScore(participantScores: number[]): number {
  if (!participantScores || participantScores.length === 0) return 0;
  
  // To avoid biasing against duos with varying skill levels (or solos playing against duos),
  // we take the highest individual score in the team as the team's final score.
  // This ensures no one is punished for teaming up.
  return Math.max(...participantScores);
}

export function calculateParticipantScore(answers: any[], questions: any[]): number {
  return answers.reduce((total, answer) => {
    if (answer.isCorrect) {
      const q = questions.find((q: any) => q.id === answer.questionId);
      return total + (q?.points || 10);
    }
    return total;
  }, 0);
}
