"use client";

import { useState } from "react";
import { Question } from "@/types/quiz";
import { submitAnswerAction, finishQuizAction } from "./actions";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle } from "lucide-react";

export default function PlayClient({
  sessionId,
  joinCode,
  participantId,
  questions,
  existingAnswers,
}: {
  sessionId: string;
  joinCode: string;
  participantId: string;
  questions: Question[];
  existingAnswers: any[];
}) {
  const router = useRouter();
  
  // Find the first question that hasn't been answered yet
  const initialIndex = questions.findIndex(
    q => !existingAnswers.some(a => a.questionId === q.id)
  );
  
  const [currentIndex, setCurrentIndex] = useState(initialIndex === -1 ? questions.length : initialIndex);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<boolean | null>(null); // true = correct, false = incorrect

  if (currentIndex >= questions.length) {
    return (
      <div className="glass-panel text-center">
        <h2>You've completed all questions!</h2>
        <p className="mb-6">Waiting for others or finish the quiz now.</p>
        <button 
          className="btn"
          onClick={async () => {
            await finishQuizAction(sessionId);
            router.push(`/session/${joinCode}/results?participantId=${participantId}`);
          }}
        >
          Finish & View Results
        </button>
      </div>
    );
  }

  const question = questions[currentIndex];

  async function handleSubmit() {
    if (!selectedOption || isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      const res = await submitAnswerAction(sessionId, participantId, question.id, selectedOption);
      setFeedback(res.isCorrect);
      
      // Wait a moment so they can see if it was correct
      setTimeout(() => {
        setFeedback(null);
        setSelectedOption(null);
        setIsSubmitting(false);
        setCurrentIndex(prev => prev + 1);
      }, 1500);
    } catch (e) {
      console.error(e);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="glass-panel w-full max-w-2xl text-center">
      <div className="mb-2 text-sm text-gray-400">
        Question {currentIndex + 1} of {questions.length}
      </div>
      <h2 className="mb-6 text-2xl">{question.text}</h2>
      
      <div className="flex flex-col gap-3">
        {question.options.map((opt) => {
          let bgClass = "bg-white/5 border-white/10 hover:bg-white/10";
          if (selectedOption === opt.id) {
            bgClass = "bg-primary/20 border-primary";
            if (feedback === true) bgClass = "bg-success/20 border-success text-success";
            if (feedback === false) bgClass = "bg-danger/20 border-danger text-danger";
          }
          
          return (
            <button
              key={opt.id}
              disabled={isSubmitting || feedback !== null}
              onClick={() => setSelectedOption(opt.id)}
              className={`p-4 rounded-lg border text-left flex items-center justify-between transition-all ${bgClass}`}
            >
              <span>{opt.text}</span>
              {selectedOption === opt.id && feedback === true && <CheckCircle size={20} className="text-success" />}
              {selectedOption === opt.id && feedback === false && <XCircle size={20} className="text-danger" />}
            </button>
          );
        })}
      </div>
      
      <button 
        className="btn mt-8 w-full"
        disabled={!selectedOption || isSubmitting || feedback !== null}
        onClick={handleSubmit}
      >
        Submit Answer
      </button>
    </div>
  );
}
