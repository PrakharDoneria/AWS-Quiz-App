"use server";

import { createQuiz, createQuestion, createSession, getSessionByJoinCode, addParticipant, submitAnswer } from "@/lib/quiz/db";
import { redirect } from "next/navigation";

export async function createDemoQuiz() {
  let sessionJoinCode;
  let errorMessage;
  
  try {
    const quiz = await createQuiz("AWS Cloud Practitioner Quiz", "Test your AWS knowledge!");
    
    await createQuestion(quiz.id, "What is Amazon EC2?", [
      { id: "1", text: "A managed database service" },
      { id: "2", text: "A virtual server in the cloud" },
      { id: "3", text: "A content delivery network" },
      { id: "4", text: "A serverless compute engine" },
    ], "2");

    await createQuestion(quiz.id, "Which service provides object storage?", [
      { id: "1", text: "Amazon S3" },
      { id: "2", text: "Amazon EBS" },
      { id: "3", text: "Amazon EFS" },
      { id: "4", text: "Amazon RDS" },
    ], "1");

    const session = await createSession(quiz.id);
    sessionJoinCode = session.joinCode;
  } catch (error: any) {
    console.error("DYNAMODB ERROR: ", error);
    errorMessage = error.message || String(error);
  }
  
  if (errorMessage) {
    redirect(`/?error=${encodeURIComponent(errorMessage)}`);
  } else {
    redirect(`/session/${sessionJoinCode}/lobby`);
  }
}

export async function joinSession(formData: FormData) {
  const joinCode = formData.get("joinCode")?.toString().toUpperCase();
  const name = formData.get("name")?.toString();

  let participantId;
  let errorMessage;
  
  try {
    if (!joinCode || !name) {
      throw new Error("Join code and name are required");
    }

    const session = await getSessionByJoinCode(joinCode);
    if (!session) {
      throw new Error("Invalid join code");
    }

    const participant = await addParticipant(session.id, name);
    participantId = participant.id;
  } catch (error: any) {
    console.error("JOIN ERROR: ", error);
    errorMessage = error.message || String(error);
  }
  
  if (errorMessage) {
    redirect(`/?error=${encodeURIComponent(errorMessage)}`);
  } else {
    redirect(`/session/${joinCode}/lobby?participantId=${participantId}`);
  }
}
