"use server";

import { createQuiz, createQuestion, createSession } from "@/lib/quiz/db";
import { redirect } from "next/navigation";



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

  return {
    success: true,
    quizId: quiz.id
  };
}
