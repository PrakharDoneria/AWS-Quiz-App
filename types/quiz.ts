export interface Quiz {
  id: string; // The UUID or ID of the quiz
  quizCode: string;
  title: string;
  description?: string;
  createdAt: string;
  status: 'DRAFT' | 'ACTIVE' | 'ENDED';
  scheduleMode: 'MANUAL' | 'AUTO';
  startTime?: string;
  endTime?: string;
}

export interface Question {
  id: string;
  quizId: string;
  text: string;
  options: {
    id: string;
    text: string;
  }[];
  correctOptionId: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  points?: number;
  timeLimit?: number;
}
