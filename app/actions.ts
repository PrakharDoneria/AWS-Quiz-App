"use server";

import { createSession, getSessionByJoinCode, addParticipant, getParticipants, getQuizByCode } from "@/lib/quiz/db";
import { redirect } from "next/navigation";

export async function playQuizAction(formData: FormData) {
  const quizCode = formData.get("quizCode")?.toString().toUpperCase();
  const name = formData.get("name")?.toString();
  const mode = formData.get("mode")?.toString() as 'SOLO' | 'TEAM';

  let participantId;
  let errorMessage;
  let sessionJoinCode;

  try {
    if (!quizCode || !name || !mode) {
      throw new Error("Missing required fields");
    }

    const quiz = await getQuizByCode(quizCode);
    if (!quiz) {
      throw new Error("Invalid Quiz Code");
    }

    const session = await createSession(quiz.id, mode);
    sessionJoinCode = session.joinCode;

    const participant = await addParticipant(session.id, name);
    participantId = participant.id;

    if (mode === 'SOLO') {
      // For solo, we can just jump straight to play (or lobby which auto-redirects if ACTIVE, but solo isn't active yet)
      // Actually, we should probably start the quiz for solo immediately or let the lobby do it.
      // Lobby can do it, or we can just redirect to lobby and have a "Start Quiz" button.
      // Let's redirect to lobby for both, but lobby will behave differently for SOLO (just one button: Start Solo Quiz).
    }

  } catch (error: any) {
    console.error("PLAY ERROR: ", error);
    errorMessage = error.message || String(error);
  }

  if (errorMessage) {
    redirect(`/?error=${encodeURIComponent(errorMessage)}`);
  } else {
    redirect(`/session/${sessionJoinCode}/lobby?participantId=${participantId}`);
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

    const participants = await getParticipants(session.id);
    if (session.mode === 'TEAM' && participants.length >= 2) {
      throw new Error("This team is already full.");
    }
    if (session.mode === 'SOLO') {
      throw new Error("Cannot join a solo session.");
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
