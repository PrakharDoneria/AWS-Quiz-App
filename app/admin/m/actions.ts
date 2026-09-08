"use server";

import { updateParticipantStatus, getParticipants } from "@/lib/quiz/db";
import { revalidatePath } from "next/cache";

export async function updateParticipantScoreAction(
  sessionId: string,
  participantId: string,
  newScore: number,
  status: 'JOINED' | 'IN_PROGRESS' | 'COMPLETED'
) {
  try {
    await updateParticipantStatus(sessionId, participantId, status, newScore);
    revalidatePath(`/admin/m`);
    revalidatePath(`/admin/manage`);
    return { success: true };
  } catch (error) {
    console.error("Failed to update participant score:", error);
    return { success: false, error: "Failed to update score" };
  }
}

export async function updateTeamScoreOverride(
  sessionId: string,
  scoreDelta: number
) {
  try {
    const participants = await getParticipants(sessionId);
    if (participants.length === 0) {
      throw new Error("Cannot change score of session with no participants");
    }

    // Give the score difference to the first participant
    const p = participants[0];
    const newScore = (p.score || 0) + scoreDelta;
    
    await updateParticipantStatus(sessionId, p.id, p.status, newScore);
    
    revalidatePath(`/admin/m`);
    revalidatePath(`/admin/manage`);
    return { success: true };
  } catch (error) {
    console.error("Failed to override team score:", error);
    throw error;
  }
}
