export interface Quiz {
  id: string; // The UUID or ID of the quiz
  title: string;
  description?: string;
  createdAt: string;
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
}
