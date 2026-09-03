export interface Session {
  id: string;
  quizId: string;
  joinCode: string; // 4-digit code for joining
  status: 'WAITING' | 'ACTIVE' | 'COMPLETED';
  mode: 'SOLO' | 'TEAM';
  createdAt: string;
  startedAt?: string;
}

export interface Participant {
  id: string;
  sessionId: string;
  name: string;
  status: 'JOINED' | 'IN_PROGRESS' | 'COMPLETED';
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
