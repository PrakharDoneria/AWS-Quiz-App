"use server";

import { createQuiz, createQuestion, createSession, getSessionByJoinCode, addParticipant, submitAnswer } from "@/lib/quiz/db";
import { redirect } from "next/navigation";



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
