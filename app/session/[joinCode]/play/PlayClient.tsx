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
  const [reviewMap, setReviewMap] = useState<Record<string, boolean>>({});

  const handleSkip = useCallback(() => {
    const nextIndex = questions.findIndex((qItem, idx) => idx > currentIndex && !answeredMap[qItem.id]);
    if (nextIndex !== -1) {
      setCurrentIndex(nextIndex);
    } else {
      const anyNextIndex = questions.findIndex(qItem => !answeredMap[qItem.id] && qItem.id !== questions[currentIndex].id);
      if (anyNextIndex !== -1) setCurrentIndex(anyNextIndex);
    }
  }, [currentIndex, answeredMap, questions]);

  const toggleReview = useCallback((id: string) => {
    setReviewMap(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);
  
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
      const timeLimit = q.timeLimit || 30;
      const timeTaken = timeLimit - timers[forceIndex];
      await submitAnswerAction(sessionId, participantId, q.id, optionToSubmit || "TIMEOUT", timeTaken);
      
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
  }, [selectedOption, isSubmitting, sessionId, participantId, questions, currentIndex, answeredMap, timers]);

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
      <div className="bg-[#10141a] border-4 border-[#324054] p-12 rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)] text-center w-full max-w-2xl mx-auto mt-20">
        <h2 className="text-3xl font-black text-white mb-4 uppercase tracking-wider">Quiz Completed!</h2>
        <p className="text-gray-400 font-bold mb-6">Redirecting to results...</p>
      </div>
    );
  }

  if (!hasStarted) {
    return (
      <div className="bg-[#10141a] border-4 border-[#324054] p-12 rounded-xl shadow-[12px_12px_0px_0px_rgba(0,0,0,0.8)] text-center w-full max-w-md mx-auto mt-20">
        <h2 className="text-3xl font-black text-white mb-6 uppercase tracking-wider shadow-none" style={{ textShadow: '3px 3px 0px var(--primary)' }}>Ready to Begin?</h2>
        <div className="bg-[#1a202c] border-2 border-danger p-4 mb-8 text-left shadow-[4px_4px_0px_0px_var(--danger)]">
          <p className="text-sm font-bold text-gray-300">
            <span className="text-danger uppercase">Warning:</span> This quiz requires Full Screen mode. 
            If you switch tabs or exit full screen, the quiz will instantly terminate.
          </p>
        </div>
        <button 
          className="bg-primary text-white font-black text-xl uppercase tracking-wider py-4 px-6 border-2 border-black shadow-[6px_6px_0px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#000] transition-all w-full"
          onClick={enterFullScreen}
        >
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
    <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row gap-8 mt-8 mb-16 px-4">
      {/* LEFT: Sidebar / Navigation */}
      <div className="w-full md:w-72 flex flex-col gap-6">
        <div className="bg-[#10141a] border-4 border-[#324054] p-6 rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)]">
          <h3 className="text-xl font-bold uppercase tracking-wider text-gray-400 mb-6 text-center border-b-2 border-[#324054] pb-4">Questions</h3>
          <div className="grid grid-cols-4 gap-3">
            {questions.map((q, idx) => {
              const isQAnswered = answeredMap[q.id];
              const isReview = reviewMap[q.id];
              const isActive = idx === currentIndex;
              
              let bg = "bg-[#1a202c] text-gray-400 border-[#445167]";
              let shadow = "";
              
              if (isActive) {
                bg = "bg-tertiary text-white border-white";
                shadow = "shadow-[3px_3px_0px_0px_#fff]";
              } else if (isQAnswered) {
                bg = "bg-[#0d1117] text-gray-600 border-[#1a202c] opacity-50";
              } else if (isReview) {
                bg = "bg-yellow-500/20 text-yellow-500 border-yellow-500";
                shadow = "shadow-[3px_3px_0px_0px_#eab308]";
              }
              
              return (
                <button
                  key={q.id}
                  onClick={() => {
                    setSelectedOption(null);
                    setCurrentIndex(idx);
                  }}
                  className={`flex items-center justify-center aspect-square font-black text-lg border-2 transition-all ${bg} ${shadow} hover:-translate-y-1`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
          
          <button 
            className="mt-8 bg-[#212836] text-white font-bold uppercase tracking-wider py-4 px-6 border-2 border-[#445167] shadow-[4px_4px_0px_0px_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#000] transition-all w-full"
            onClick={handleFinishQuiz}
          >
            {allAnswered ? "Finish Quiz" : "Finish Early"}
          </button>
        </div>
      </div>

      {/* RIGHT: Active Question */}
      <div 
        className="bg-[#10141a] border-4 border-[#324054] rounded-xl p-8 md:p-12 shadow-[12px_12px_0px_0px_rgba(0,0,0,0.8)] flex-1 relative flex flex-col"
        onContextMenu={(e) => e.preventDefault()}
        onCopy={(e) => e.preventDefault()}
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b-2 border-[#324054] pb-6">
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-400 font-bold uppercase tracking-wider bg-[#1a202c] px-4 py-2 border-2 border-[#445167]">
              Question {currentIndex + 1} of {questions.length}
            </div>
            {!isAnswered && (
              <button 
                onClick={() => toggleReview(question.id)}
                className={`text-xs font-bold uppercase px-3 py-2 border-2 transition-colors ${
                  reviewMap[question.id] 
                    ? 'bg-yellow-500 text-black border-yellow-500 shadow-[2px_2px_0px_0px_#eab308]' 
                    : 'bg-[#1a202c] text-gray-400 border-[#445167] hover:bg-[#212836]'
                }`}
              >
                {reviewMap[question.id] ? '★ Flagged' : '☆ Flag for Review'}
              </button>
            )}
          </div>
          <div className={`text-sm font-bold px-6 py-2 border-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] ${
            timeLeft <= 10 && !isAnswered 
              ? 'bg-danger/20 border-danger text-danger shadow-[4px_4px_0px_0px_var(--danger)]' 
              : 'bg-[#1a202c] border-[#445167] text-gray-300'
          }`}>
            {isAnswered ? "SUBMITTED" : `${timeLeft}s REMAINING`}
          </div>
        </div>
        
        <h2 className="mb-10 text-3xl font-bold leading-relaxed text-white">{question.text}</h2>
        
        <div className="flex flex-col gap-4 mb-auto">
          {question.options.map((opt) => {
            const isSelected = selectedOption === opt.id;
            return (
              <button
                key={opt.id}
                disabled={isAnswered || isSubmitting}
                onClick={() => setSelectedOption(opt.id)}
                className={`p-6 border-4 text-left flex items-center justify-between transition-all ${
                  isSelected 
                    ? "bg-primary/10 border-primary text-white shadow-[6px_6px_0px_0px_var(--primary)] -translate-y-1" 
                    : "bg-[#1a202c] border-[#324054] text-gray-300 hover:border-gray-400 hover:text-white"
                } ${isAnswered ? 'opacity-50 cursor-not-allowed border-[#1a202c]' : 'cursor-pointer'}`}
              >
                <span className="font-bold text-xl">{opt.text}</span>
              </button>
            );
          })}
        </div>
        
        {!isAnswered && (
          <div className="mt-12 flex flex-col md:flex-row gap-6 w-full pt-8 border-t-2 border-[#324054]">
            <button 
              className="flex-[1] bg-[#1a202c] border-2 border-white text-white font-black text-xl py-5 px-6 uppercase tracking-wider shadow-[6px_6px_0px_0px_#fff] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_#fff] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#fff] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
              onClick={handleSkip}
            >
              Skip for Now
            </button>
            <button 
              className="flex-[2] bg-primary text-white font-black text-xl py-5 px-6 uppercase tracking-wider border-2 border-black shadow-[6px_6px_0px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#000] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-3"
              disabled={!selectedOption || isSubmitting}
              onClick={() => handleSubmit()}
            >
              Submit Answer <CheckCircle size={24} />
            </button>
          </div>
        )}
        
        {isAnswered && (
          <div className="mt-12 text-center text-xl text-gray-400 font-bold bg-[#1a202c] border-2 border-[#445167] py-6 px-4">
            Answer submitted. Select another question from the sidebar.
          </div>
        )}
      </div>
    </div>
  );
}
