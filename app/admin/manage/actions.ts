"use server";

import { deleteQuiz } from "@/lib/quiz/db";
import { revalidatePath } from "next/cache";

export async function deleteQuizAction(formData: FormData) {
  const quizId = formData.get("quizId")?.toString();
  if (quizId) {
    await deleteQuiz(quizId);
    revalidatePath("/admin/manage");
    revalidatePath("/"); // Also revalidate home page where quizzes are listed
  }
}
