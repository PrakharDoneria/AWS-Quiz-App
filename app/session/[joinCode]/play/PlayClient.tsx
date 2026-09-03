"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Question } from "@/types/quiz";
import { submitAnswerAction, finishQuizAction } from "./actions";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle } from "lucide-react";

export default function PlayClient({
  sessionId,
  quizId,
  joinCode,
  participantId,
  questions,
  existingAnswers,
}: {
  sessionId: string;
  quizId: string;
  joinCode: string;
  participantId: string;
  questions: Question[];
  existingAnswers: any[];
}) {
  const router = useRouter();
  
  // Track which questions are answered
  const [answeredMap, setAnsweredMap] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    existingAnswers.forEach(a => {
      map[a.questionId] = true;
    });
    return map;
  });

  const initialIndex = questions.findIndex(q => !answeredMap[q.id]);
  const [currentIndex, setCurrentIndex] = useState(initialIndex === -1 ? 0 : initialIndex);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Array of time left per question
  const [timers, setTimers] = useState<number[]>(() => {
    return questions.map(q => q.timeLimit || 30);
  });

  const [hasStarted, setHasStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(initialIndex === -1 && existingAnswers.length === questions.length);

  const enterFullScreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      setHasStarted(true);
    } catch (err) {
      console.error("Error attempting to enable full-screen mode:", err);
      setHasStarted(true);
    }
  };

  const handleFinishQuiz = useCallback(async () => {
    setIsFinished(true);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.error(err));
    }
    await finishQuizAction(sessionId, participantId, quizId);
    router.push(`/session/${joinCode}/results?participantId=${participantId}`);
  }, [sessionId, participantId, quizId, joinCode, router]);

  const handleSubmit = useCallback(async (autoOption: string | null = null, forceIndex: number = currentIndex) => {
    const q = questions[forceIndex];
    if (answeredMap[q.id] || isSubmitting) return;

    const optionToSubmit = autoOption || selectedOption;
    if (!optionToSubmit && !autoOption) return;
    
    setIsSubmitting(true);
    
    try {
      await submitAnswerAction(sessionId, participantId, q.id, optionToSubmit || "TIMEOUT");
      
      setAnsweredMap(prev => ({ ...prev, [q.id]: true }));
      setSelectedOption(null);
      setIsSubmitting(false);
      
      // If we auto-submitted due to timeout on the active question, find next unanswered
      if (forceIndex === currentIndex) {
        const nextIndex = questions.findIndex((qItem, idx) => idx > forceIndex && !answeredMap[qItem.id]);
        if (nextIndex !== -1) {
          setCurrentIndex(nextIndex);
        } else {
          // Look from beginning
          const anyNextIndex = questions.findIndex(qItem => !answeredMap[qItem.id] && qItem.id !== q.id);
          if (anyNextIndex !== -1) {
            setCurrentIndex(anyNextIndex);
          }
        }
      }
    } catch (e) {
      console.error(e);
      setIsSubmitting(false);
    }
  }, [selectedOption, isSubmitting, sessionId, participantId, questions, currentIndex, answeredMap]);

  // Timer logic for ACTIVE question
  useEffect(() => {
    if (!hasStarted || isFinished || isSubmitting) return;
    const currentQId = questions[currentIndex].id;
    if (answeredMap[currentQId]) return; // Stop ticking if already answered

    const timer = setInterval(() => {
      setTimers((prev) => {
        const newTimers = [...prev];
        const timeLeft = newTimers[currentIndex];
        
        if (timeLeft <= 1) {
          clearInterval(timer);
          newTimers[currentIndex] = 0;
          handleSubmit("TIMEOUT", currentIndex);
          return newTimers;
        }
        
        newTimers[currentIndex] = timeLeft - 1;
        return newTimers;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [hasStarted, isFinished, isSubmitting, currentIndex, answeredMap, questions, handleSubmit]);

  // Anti-cheat visibility & fullscreen listener
  useEffect(() => {
    if (!hasStarted || isFinished) return;
    
    const handleVisibilityChange = async () => {
      if (document.hidden) {
        finishQuizAction(sessionId, participantId, quizId).then(() => {
          router.push(`/session/${joinCode}/results?participantId=${participantId}&cheated=true&reason=tab-switch`);
        });
      }
    };

    const handleFullscreenChange = async () => {
      if (!document.fullscreenElement) {
        finishQuizAction(sessionId, participantId, quizId).then(() => {
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
  }, [hasStarted, isFinished, sessionId, joinCode, participantId, router, quizId]);

  // Anti-cheat localstorage check
  useEffect(() => {
    try {
      if (localStorage.getItem(`attempted_quiz_${quizId}`)) {
        router.push(`/?error=${encodeURIComponent("You have already attempted this quiz and cannot rejoin.")}`);
      }
    } catch (e) {
      console.error(e);
    }
  }, [quizId, router]);

  if (isFinished) {
    return (
      <div className="glass-panel text-center">
        <h2>Quiz Completed!</h2>
        <p className="mb-6">Redirecting to results...</p>
      </div>
    );
  }

  if (!hasStarted) {
    return (
      <div className="glass-panel text-center w-full max-w-md mx-auto">
        <h2 className="mb-4">Ready to Begin?</h2>
        <p className="mb-6 text-sm text-gray-400">
          This quiz requires <strong>Full Screen mode</strong>. 
          If you switch tabs or exit full screen, the quiz will instantly terminate.
        </p>
        <button className="btn w-full" onClick={enterFullScreen}>
          Enter Full Screen & Start
        </button>
      </div>
    );
  }

  const question = questions[currentIndex];
  const isAnswered = answeredMap[question.id];
  const timeLeft = timers[currentIndex];

  const allAnswered = questions.every(q => answeredMap[q.id] || timers[questions.findIndex(x => x.id === q.id)] === 0);

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row gap-6 mt-8">
      {/* LEFT: Sidebar / Navigation */}
      <div className="w-full md:w-64 flex flex-col gap-4">
        <div className="glass-panel p-4">
          <h3 className="text-lg mb-4 text-center">Questions</h3>
          <div className="grid grid-cols-4 gap-2">
            {questions.map((q, idx) => {
              const isQAnswered = answeredMap[q.id];
              const isActive = idx === currentIndex;
              let bg = "bg-gray-800 text-gray-400 border-gray-700";
              
              if (isActive) {
                bg = "bg-tertiary text-white border-tertiary shadow-[2px_2px_0px_0px_var(--tertiary)]";
              } else if (isQAnswered) {
                bg = "bg-white/10 text-gray-300 border-white/20";
              }
              
              return (
                <button
                  key={q.id}
                  onClick={() => {
                    setSelectedOption(null);
                    setCurrentIndex(idx);
                  }}
                  className={`flex items-center justify-center h-12 w-full font-bold border-2 transition-all ${bg}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
          
          <button 
            className="btn btn-secondary w-full mt-6"
            onClick={handleFinishQuiz}
          >
            {allAnswered ? "Finish Quiz" : "Finish Early"}
          </button>
        </div>
      </div>

      {/* RIGHT: Active Question */}
      <div 
        className="glass-panel flex-1 relative"
        onContextMenu={(e) => e.preventDefault()}
        onCopy={(e) => e.preventDefault()}
      >
        <div className="flex justify-between items-center mb-6">
          <div className="text-sm text-gray-400 font-bold uppercase tracking-wider">
            Question {currentIndex + 1}
          </div>
          <div className={`text-sm font-bold px-4 py-2 border-2 ${
            timeLeft <= 10 && !isAnswered ? 'border-danger text-danger' : 'border-white/20 text-gray-300'
          }`}>
            {isAnswered ? "SUBMITTED" : `${timeLeft}s REMAINING`}
          </div>
        </div>
        
        <h2 className="mb-8 text-2xl">{question.text}</h2>
        
        <div className="flex flex-col gap-4">
          {question.options.map((opt) => {
            const isSelected = selectedOption === opt.id;
            // Since we don't know the exact option they submitted previously in this context,
            // we just show options. If answered, we don't highlight their past choice unless we fetch it.
            // For simplicity, we just disable them.
            return (
              <button
                key={opt.id}
                disabled={isAnswered || isSubmitting}
                onClick={() => setSelectedOption(opt.id)}
                className={`p-4 border-2 text-left flex items-center justify-between transition-all ${
                  isSelected 
                    ? "bg-primary/20 border-primary text-primary" 
                    : "bg-black/40 border-white/10 hover:border-white/30"
                } ${isAnswered ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span className="font-medium text-lg">{opt.text}</span>
              </button>
            );
          })}
        </div>
        
        {!isAnswered && (
          <button 
            className="btn mt-8 w-full"
            disabled={!selectedOption || isSubmitting}
            onClick={() => handleSubmit()}
          >
            Submit Answer
          </button>
        )}
        
        {isAnswered && (
          <div className="mt-8 text-center text-gray-400 font-bold">
            Answer submitted. Select another question from the sidebar.
          </div>
        )}
      </div>
    </div>
  );
}
