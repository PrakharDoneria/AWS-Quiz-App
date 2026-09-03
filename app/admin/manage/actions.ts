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
