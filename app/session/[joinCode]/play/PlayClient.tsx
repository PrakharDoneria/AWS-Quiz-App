"use client";

import { useState, useEffect, useCallback } from "react";
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
  const [timeLeft, setTimeLeft] = useState(30);
  const [hasStarted, setHasStarted] = useState(false); // Used to trigger full screen

  const enterFullScreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      setHasStarted(true);
    } catch (err) {
      console.error("Error attempting to enable full-screen mode:", err);
      // Still start if it fails, but ideally they should be in full screen
      setHasStarted(true);
    }
  };

  const handleSubmit = useCallback(async (autoOption: string | null = null) => {
    const optionToSubmit = autoOption || selectedOption;
    if ((!optionToSubmit && !autoOption) || isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      // If time ran out and no option selected, we submit a dummy incorrect option (or the first option which will likely be wrong or just recorded as incorrect if not matching)
      // Actually, passing "TIMEOUT" will result in incorrect on server side since it won't match correctOptionId
      const res = await submitAnswerAction(sessionId, participantId, questions[currentIndex].id, optionToSubmit || "TIMEOUT");
      setFeedback(res.isCorrect);
      
      // Wait a moment so they can see if it was correct
      setTimeout(() => {
        setFeedback(null);
        setSelectedOption(null);
        setIsSubmitting(false);
        setTimeLeft(30);
        setCurrentIndex(prev => prev + 1);
      }, 1500);
    } catch (e) {
      console.error(e);
      setIsSubmitting(false);
    }
  }, [selectedOption, isSubmitting, sessionId, participantId, questions, currentIndex]);

  // Anti-cheat visibility & fullscreen listener
  useEffect(() => {
    if (!hasStarted) return;
    
    const handleVisibilityChange = async () => {
      if (document.hidden && currentIndex < questions.length) {
        // Instant terminate on tab switch
        finishQuizAction(sessionId).then(() => {
          router.push(`/session/${joinCode}/results?participantId=${participantId}&cheated=true&reason=tab-switch`);
        });
      }
    };

    const handleFullscreenChange = async () => {
      if (!document.fullscreenElement && currentIndex < questions.length) {
        // Instant terminate on exiting fullscreen
        finishQuizAction(sessionId).then(() => {
          router.push(`/session/${joinCode}/results?participantId=${participantId}&cheated=true&reason=exit-fullscreen`);
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [currentIndex, questions.length, sessionId, joinCode, participantId, router, hasStarted]);

  // Timer logic
  useEffect(() => {
    if (!hasStarted || currentIndex >= questions.length || feedback !== null || isSubmitting) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit("TIMEOUT");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentIndex, questions.length, feedback, isSubmitting, handleSubmit]);

  if (currentIndex >= questions.length) {
    // Attempt to exit fullscreen when done
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.error(err));
    }
    return (
      <div className="glass-panel text-center">
        <h2>You've completed all questions!</h2>
        <p className="mb-6">Waiting for others or finish the quiz now.</p>
        <button 
          className="btn w-full"
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

  if (!hasStarted) {
    return (
      <div className="glass-panel text-center w-full max-w-md">
        <h2 className="mb-4">Ready to Begin?</h2>
        <p className="mb-6 text-sm">
          This quiz requires <strong>Full Screen mode</strong> and active attention. 
          If you switch tabs or exit full screen, the quiz will instantly terminate.
        </p>
        <button className="btn w-full" onClick={enterFullScreen}>
          Enter Full Screen & Start
        </button>
      </div>
    );
  }

  const question = questions[currentIndex];

  // handleSubmit is defined above with useCallback

  return (
    <div 
      className="glass-panel w-full max-w-2xl text-center relative"
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="text-sm text-gray-400">
          Question {currentIndex + 1} of {questions.length}
        </div>
        <div className={`text-sm font-bold px-3 py-1 rounded-full ${timeLeft <= 10 ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-white/10 text-gray-400'}`}>
          {timeLeft}s
        </div>
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
        onClick={() => handleSubmit()}
      >
        Submit Answer
      </button>
    </div>
  );
}
