"use server";

import { deleteQuiz } from "@/lib/quiz/db";
import { revalidatePath } from "next/cache";

export async function deleteQuizAction(formData: FormData) {
  try {
    const quizId = formData.get("quizId")?.toString();
    if (quizId) {
      await deleteQuiz(quizId);
      revalidatePath("/admin/manage");
      revalidatePath("/");
    }
  } catch (error) {
    console.error("Failed to delete quiz:", error);
    // Suppress error to avoid React Error 441 in client when action crashes
  }
}

export async function updateQuizSettingsAction(formData: FormData) {
  try {
    const quizId = formData.get("quizId")?.toString();
    if (!quizId) return;

    const status = formData.get("status")?.toString() as 'DRAFT' | 'ACTIVE' | 'ENDED' | undefined;
    const scheduleMode = formData.get("scheduleMode")?.toString() as 'MANUAL' | 'AUTO' | undefined;
    const startTime = formData.get("startTime")?.toString();
    const endTime = formData.get("endTime")?.toString();

    const { updateQuizSettings } = await import("@/lib/quiz/db");
    await updateQuizSettings(quizId, {
      ...(status && { status }),
      ...(scheduleMode && { scheduleMode }),
      ...(startTime !== undefined && { startTime }),
      ...(endTime !== undefined && { endTime }),
    });

    revalidatePath(`/admin/manage`);
    revalidatePath(`/admin/manage/${quizId}`);
  } catch (error) {
    console.error("Failed to update quiz settings:", error);
  }
}

export async function resetLeaderboardAction(formData: FormData) {
  try {
    const quizId = formData.get("quizId")?.toString();
    if (!quizId) return;

    const { deleteQuizSubmissions } = await import("@/lib/quiz/db");
    await deleteQuizSubmissions(quizId);

    revalidatePath(`/admin/manage`);
    revalidatePath(`/leaderboard/${quizId}`);
  } catch (error) {
    console.error("Failed to reset leaderboard:", error);
  }
}
