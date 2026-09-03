export interface Session {
  id: string;
  quizId: string;
  joinCode: string; // 6-character short code for joining
  status: 'WAITING' | 'ACTIVE' | 'COMPLETED';
  createdAt: string;
}

export interface Participant {
  id: string;
  sessionId: string;
  name: string;
  joinedAt: string;
  score: number;
}

export interface Answer {
  sessionId: string;
  participantId: string;
  questionId: string;
  selectedOptionId: string;
  isCorrect: boolean;
  submittedAt: string;
}

export interface SessionResult {
  session: Session;
  participants: Participant[];
  teamScore: number;
}
