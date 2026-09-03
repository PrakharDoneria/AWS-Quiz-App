import { ddbDocClient, TableName } from "../aws/dynamodb";
import { PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { Quiz, Question } from "../../types/quiz";
import { Session, Participant, Answer, SessionResult } from "../../types/session";
import { v4 as uuidv4 } from "uuid";

// Note: In a real app we'd share types more cleanly, combining here for simplicity.
import { Session as SessionState } from "../../types/session";

// Helpers for keys
const quizPK = (quizId: string) => `QUIZ#${quizId}`;
const sessionPK = (sessionId: string) => `SESSION#${sessionId}`;

export async function createQuiz(title: string, description: string = ""): Promise<Quiz> {
  const quiz: Quiz = {
    id: uuidv4(),
    quizCode: Math.floor(1000 + Math.random() * 9000).toString(),
    title,
    description,
    createdAt: new Date().toISOString(),
  };

  await ddbDocClient.send(new PutCommand({
    TableName,
    Item: {
      PK: quizPK(quiz.id),
      SK: "METADATA",
      ...quiz,
    }
  }));

  // Mapping item: PK = QUIZCODE#<code>, SK = METADATA
  await ddbDocClient.send(new PutCommand({
    TableName,
    Item: {
      PK: `QUIZCODE#${quiz.quizCode}`,
      SK: "METADATA",
      quizId: quiz.id
    }
  }));

  return quiz;
}

export async function createQuestion(
  quizId: string, 
  text: string, 
  options: {id: string, text: string}[], 
  correctOptionId: string,
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' = 'MEDIUM',
  points: number = 10
): Promise<Question> {
  const question: Question = {
    id: uuidv4(),
    quizId,
    text,
    options,
    correctOptionId,
    difficulty,
    points,
  };

  await ddbDocClient.send(new PutCommand({
    TableName,
    Item: {
      PK: quizPK(quizId),
      SK: `QUESTION#${question.id}`,
      ...question,
    }
  }));

  return question;
}

export async function getQuiz(quizId: string): Promise<Quiz | null> {
  const response = await ddbDocClient.send(new GetCommand({
    TableName,
    Key: {
      PK: quizPK(quizId),
      SK: "METADATA",
    }
  }));
  return response.Item ? (response.Item as Quiz) : null;
}

export async function getQuizByCode(quizCode: string): Promise<Quiz | null> {
  const codeItem = await ddbDocClient.send(new GetCommand({
    TableName,
    Key: {
      PK: `QUIZCODE#${quizCode}`,
      SK: "METADATA",
    }
  }));

  if (!codeItem.Item) return null;

  return getQuiz(codeItem.Item.quizId);
}

export async function getAllQuizzes(): Promise<Quiz[]> {
  const response = await ddbDocClient.send(new ScanCommand({
    TableName,
    FilterExpression: "SK = :sk AND begins_with(PK, :pk)",
    ExpressionAttributeValues: {
      ":sk": "METADATA",
      ":pk": "QUIZ#",
    }
  }));
  return (response.Items as Quiz[]) || [];
}

export async function deleteQuiz(quizId: string) {
  // To keep it simple, we just delete the quiz metadata.
  // In production, we'd query and delete all questions too.
  await ddbDocClient.send(new DeleteCommand({
    TableName,
    Key: {
      PK: quizPK(quizId),
      SK: "METADATA",
    }
  }));
}

export async function getQuestions(quizId: string): Promise<Question[]> {
  const response = await ddbDocClient.send(new QueryCommand({
    TableName,
    KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
    ExpressionAttributeValues: {
      ":pk": quizPK(quizId),
      ":sk": "QUESTION#",
    }
  }));
  return (response.Items as Question[]) || [];
}

function generateJoinCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export async function createSession(quizId: string, mode: 'SOLO' | 'TEAM'): Promise<SessionState> {
  const session: SessionState = {
    id: uuidv4(),
    quizId,
    joinCode: generateJoinCode(),
    status: 'WAITING',
    mode,
    createdAt: new Date().toISOString(),
  };

  await ddbDocClient.send(new PutCommand({
    TableName,
    Item: {
      PK: sessionPK(session.id),
      SK: "METADATA",
      ...session,
      // Global Secondary Index would be needed to lookup by joinCode if we scale, 
      // but to keep IAM policy minimal (no indexes), we will use a Scan, or we can use joinCode as part of a PK.
      // Wait, we need to lookup by joinCode. Let's make a separate item mapping joinCode -> sessionId,
      // so we don't need a GSI and avoid Scan.
    }
  }));

  // Mapping item: PK = JOINCODE#<code>, SK = METADATA
  await ddbDocClient.send(new PutCommand({
    TableName,
    Item: {
      PK: `JOINCODE#${session.joinCode}`,
      SK: "METADATA",
      sessionId: session.id
    }
  }));

  return session;
}

export async function getSessionByJoinCode(joinCode: string): Promise<SessionState | null> {
  const joinCodeItem = await ddbDocClient.send(new GetCommand({
    TableName,
    Key: {
      PK: `JOINCODE#${joinCode}`,
      SK: "METADATA",
    }
  }));

  if (!joinCodeItem.Item) return null;

  const sessionId = joinCodeItem.Item.sessionId;

  const sessionItem = await ddbDocClient.send(new GetCommand({
    TableName,
    Key: {
      PK: sessionPK(sessionId),
      SK: "METADATA",
    }
  }));

  return sessionItem.Item ? (sessionItem.Item as SessionState) : null;
}

export async function getSession(sessionId: string): Promise<SessionState | null> {
  const sessionItem = await ddbDocClient.send(new GetCommand({
    TableName,
    Key: {
      PK: sessionPK(sessionId),
      SK: "METADATA",
    }
  }));
  return sessionItem.Item ? (sessionItem.Item as SessionState) : null;
}

export async function updateSessionStatus(sessionId: string, status: 'WAITING' | 'ACTIVE' | 'COMPLETED', startedAt?: string) {
  let updateExp = "SET #status = :status";
  const expNames: Record<string, string> = { "#status": "status" };
  const expVals: Record<string, any> = { ":status": status };

  if (startedAt) {
    updateExp += ", #startedAt = :startedAt";
    expNames["#startedAt"] = "startedAt";
    expVals[":startedAt"] = startedAt;
  }

  await ddbDocClient.send(new UpdateCommand({
    TableName,
    Key: {
      PK: sessionPK(sessionId),
      SK: "METADATA",
    },
    UpdateExpression: updateExp,
    ExpressionAttributeNames: expNames,
    ExpressionAttributeValues: expVals
  }));
}

export async function addParticipant(sessionId: string, name: string): Promise<Participant> {
  const participant: Participant = {
    id: uuidv4(),
    sessionId,
    name,
    status: 'JOINED',
    joinedAt: new Date().toISOString(),
    score: 0
  };

  await ddbDocClient.send(new PutCommand({
    TableName,
    Item: {
      PK: sessionPK(sessionId),
      SK: `PARTICIPANT#${participant.id}`,
      ...participant,
    }
  }));

  return participant;
}

export async function getParticipants(sessionId: string): Promise<Participant[]> {
  const response = await ddbDocClient.send(new QueryCommand({
    TableName,
    KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
    ExpressionAttributeValues: {
      ":pk": sessionPK(sessionId),
      ":sk": "PARTICIPANT#",
    }
  }));
  return (response.Items as Participant[]) || [];
}

export async function updateParticipantStatus(sessionId: string, participantId: string, status: 'JOINED' | 'IN_PROGRESS' | 'COMPLETED', score?: number) {
  let updateExp = "SET #st = :st";
  const expNames: Record<string, string> = { "#st": "status" };
  const expVals: Record<string, any> = { ":st": status };

  if (score !== undefined) {
    updateExp += ", #sc = :sc";
    expNames["#sc"] = "score";
    expVals[":sc"] = score;
  }

  await ddbDocClient.send(new UpdateCommand({
    TableName,
    Key: {
      PK: sessionPK(sessionId),
      SK: `PARTICIPANT#${participantId}`,
    },
    UpdateExpression: updateExp,
    ExpressionAttributeNames: expNames,
    ExpressionAttributeValues: expVals
  }));
}

export async function submitAnswer(sessionId: string, participantId: string, questionId: string, selectedOptionId: string, isCorrect: boolean) {
  const answer = {
    sessionId,
    participantId,
    questionId,
    selectedOptionId,
    isCorrect,
    submittedAt: new Date().toISOString(),
  };

  await ddbDocClient.send(new PutCommand({
    TableName,
    Item: {
      PK: sessionPK(sessionId),
      SK: `ANSWER#${participantId}#${questionId}`,
      ...answer,
    },
    // Condition to ensure participant cannot submit multiple answers for the same question
    ConditionExpression: "attribute_not_exists(PK)"
  }));
}

export async function getAnswersForParticipant(sessionId: string, participantId: string) {
  const response = await ddbDocClient.send(new QueryCommand({
    TableName,
    KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
    ExpressionAttributeValues: {
      ":pk": sessionPK(sessionId),
      ":sk": `ANSWER#${participantId}#`,
    }
  }));
  return response.Items || [];
}
