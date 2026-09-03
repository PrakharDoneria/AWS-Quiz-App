"use server";

import { createQuiz, createQuestion, createSession } from "@/lib/quiz/db";
import { redirect } from "next/navigation";

// Legacy custom generator (if still used)
export async function createCustomQuiz(formData: FormData) {
  const numQuestionsStr = formData.get("numQuestions")?.toString();
  const numQuestions = parseInt(numQuestionsStr || "0", 10);

  if (numQuestions < 1 || numQuestions > 50) {
    throw new Error("Number of questions must be between 1 and 50");
  }

  const quiz = await createQuiz("Custom AWS Quiz", `A custom quiz with ${numQuestions} questions.`);
  
  for (let i = 1; i <= numQuestions; i++) {
    await createQuestion(quiz.id, `Sample Question ${i} for Custom Quiz?`, [
      { id: "1", text: "Option A (Correct)" },
      { id: "2", text: "Option B" },
      { id: "3", text: "Option C" },
      { id: "4", text: "Option D" },
    ], "1", "MEDIUM", 10);
  }

  const session = await createSession(quiz.id);
  redirect(`/session/${session.joinCode}/lobby`);
}

// New full quiz builder action
export async function saveBuiltQuizAction(payloadStr: string) {
  const payload = JSON.parse(payloadStr);
  const { title, description, questions } = payload;
  
  if (!title || !questions || questions.length === 0) {
    throw new Error("Quiz must have a title and at least one question.");
  }

  const quiz = await createQuiz(title, description);

  for (const q of questions) {
    await createQuestion(
      quiz.id, 
      q.text, 
      q.options, 
      q.correctOptionId, 
      q.difficulty, 
      q.points
    );
  }

  const session = await createSession(quiz.id);
  
  return {
    success: true,
    joinCode: session.joinCode
  };
}
