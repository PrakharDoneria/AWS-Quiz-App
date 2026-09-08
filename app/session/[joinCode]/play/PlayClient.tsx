"use client";

import { useState, useEffect, useCallback } from "react";
import { Question } from "@/types/quiz";
import { submitAnswerAction, finishQuizAction, checkQuizStatusAction } from "./actions";
import { useRouter } from "next/navigation";
import { CheckCircle, Flag, SkipForward, Zap, Clock, ChevronRight, AlertTriangle, Trophy, Maximize2 } from "lucide-react";

const OPTION_LABELS = ["A", "B", "C", "D", "E", "F"];

export default function PlayClient({
  sessionId,
  quizId,
  joinCode,
  participantId,
  questions,
  existingAnswers,
  quiz,
}: {
  sessionId: string;
  quizId: string;
  joinCode: string;
  participantId: string;
  questions: Question[];
  existingAnswers: any[];
  quiz?: any;
}) {
  const router = useRouter();

  // Track which questions are answered
  const [answeredMap, setAnsweredMap] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    existingAnswers.forEach(a => { map[a.questionId] = true; });
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
  const [timers, setTimers] = useState<number[]>(() => questions.map(q => q.timeLimit || 30));
  const [hasStarted, setHasStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(initialIndex === -1 && existingAnswers.length === questions.length);
  const [quizEnded, setQuizEnded] = useState(false);

  // Auto-submit logic for quiz end
  useEffect(() => {
    if (isFinished || quizEnded) return;
    if (quiz?.scheduleMode === 'AUTO' && quiz.endTime) {
      const endT = new Date(quiz.endTime).getTime();
      const checkEnd = setInterval(() => {
        if (Date.now() >= endT) setQuizEnded(true);
      }, 1000);
      return () => clearInterval(checkEnd);
    } else {
      const poll = setInterval(async () => {
        try {
          const status = await checkQuizStatusAction(quizId);
          if (status === 'ENDED') setQuizEnded(true);
        } catch (e) {}
      }, 10000);
      return () => clearInterval(poll);
    }
  }, [quiz, quizId, isFinished, quizEnded]);

  useEffect(() => {
    if (quizEnded && !isFinished) handleFinishQuiz();
  }, [quizEnded, isFinished]);

  const enterFullScreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      setHasStarted(true);
    } catch (err) {
      setHasStarted(true);
    }
  };

  const handleFinishQuiz = useCallback(async () => {
    setIsFinished(true);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
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

      if (forceIndex === currentIndex) {
        const nextIndex = questions.findIndex((qItem, idx) => idx > forceIndex && !answeredMap[qItem.id]);
        if (nextIndex !== -1) {
          setCurrentIndex(nextIndex);
        } else {
          const anyNextIndex = questions.findIndex(qItem => !answeredMap[qItem.id] && qItem.id !== q.id);
          if (anyNextIndex !== -1) setCurrentIndex(anyNextIndex);
        }
      }
    } catch (e) {
      setIsSubmitting(false);
    }
  }, [selectedOption, isSubmitting, sessionId, participantId, questions, currentIndex, answeredMap, timers]);

  // Timer logic for ACTIVE question
  useEffect(() => {
    if (!hasStarted || isFinished || isSubmitting) return;
    const currentQId = questions[currentIndex].id;
    if (answeredMap[currentQId]) return;

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

  // Anti-cheat
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

  // Anti-cheat localstorage
  useEffect(() => {
    try {
      if (localStorage.getItem(`attempted_quiz_${quizId}`)) {
        router.push(`/?error=${encodeURIComponent("You have already attempted this quiz and cannot rejoin.")}`);
      }
    } catch (e) {}
  }, [quizId, router]);

  // ─── FINISHED STATE ───────────────────────────────────────────────────────────
  if (isFinished) {
    return (
      <div className="fixed inset-0 bg-[#0a0d12] flex items-center justify-center">
        <div className="text-center space-y-6 px-8">
          <div className="relative inline-flex items-center justify-center">
            <div className="absolute w-32 h-32 rounded-full bg-[var(--primary)]/20 animate-ping" />
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center shadow-[0_0_60px_var(--primary)]">
              <Trophy size={44} className="text-white" />
            </div>
          </div>
          <h2 className="text-4xl font-black text-white tracking-tight">
            {quizEnded ? "Quiz Ended by Admin" : "Quiz Completed!"}
          </h2>
          <p className="text-gray-400 text-lg">Submitting your answers and calculating score…</p>
          <div className="flex justify-center gap-1.5 mt-2">
            {[0,1,2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-[var(--primary)] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── START SCREEN ─────────────────────────────────────────────────────────────
  if (!hasStarted) {
    const answeredCount = Object.values(answeredMap).filter(Boolean).length;
    return (
      <div className="fixed inset-0 bg-[#0a0d12] flex items-center justify-center px-4">
        {/* Ambient glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[var(--primary)]/8 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative w-full max-w-lg">
          {/* Header badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 bg-[var(--primary)]/15 border border-[var(--primary)]/40 rounded-full px-5 py-2">
              <Zap size={14} className="text-[var(--primary)]" />
              <span className="text-[var(--primary)] text-sm font-bold tracking-widest uppercase">AWS Quiz</span>
            </div>
          </div>

          {/* Card */}
          <div className="bg-[#12161e] border border-[#2a3040] rounded-2xl overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.6)]">
            {/* Card Header */}
            <div className="bg-gradient-to-r from-[var(--primary)]/15 via-transparent to-[var(--secondary)]/10 px-8 pt-8 pb-6 border-b border-[#2a3040]">
              <h1 className="text-3xl font-black text-white tracking-tight mb-1">Ready to Begin?</h1>
              <p className="text-gray-400 text-sm">{questions.length} questions • Full-screen required</p>
            </div>

            <div className="p-8 space-y-6">
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Questions", value: questions.length, color: "var(--primary)" },
                  { label: "Answered", value: answeredCount, color: "var(--success)" },
                  { label: "Remaining", value: questions.length - answeredCount, color: "var(--tertiary)" },
                ].map(stat => (
                  <div key={stat.label} className="bg-[#0e1117] rounded-xl p-4 text-center border border-[#1e2535]">
                    <div className="text-2xl font-black" style={{ color: stat.color }}>{stat.value}</div>
                    <div className="text-xs text-gray-500 mt-1 font-medium uppercase tracking-wider">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Warning */}
              <div className="flex gap-3 items-start bg-red-500/8 border border-red-500/25 rounded-xl p-4">
                <AlertTriangle size={18} className="text-red-400 mt-0.5 shrink-0" />
                <p className="text-red-300 text-sm leading-relaxed">
                  <span className="font-bold text-red-400">Strict Mode Active.</span>{" "}
                  Switching tabs or exiting full-screen will immediately terminate your session and submit your current answers.
                </p>
              </div>

              {/* CTA */}
              <button
                onClick={enterFullScreen}
                className="w-full group relative overflow-hidden bg-gradient-to-r from-[var(--primary)] to-[#e08700] text-black font-black text-lg py-4 rounded-xl transition-all duration-200 hover:shadow-[0_8px_32px_var(--primary)/50] hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3"
              >
                <Maximize2 size={20} />
                Enter Full Screen & Start
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── MAIN QUIZ VIEW ──────────────────────────────────────────────────────────
  const question = questions[currentIndex];
  const isAnswered = answeredMap[question.id];
  const timeLeft = timers[currentIndex];
  const maxTime = question.timeLimit || 30;
  const timerPct = Math.max(0, (timeLeft / maxTime) * 100);
  const answeredCount = Object.values(answeredMap).filter(Boolean).length;
  const allAnswered = questions.every(q => answeredMap[q.id] || timers[questions.findIndex(x => x.id === q.id)] === 0);

  const timerColor = timeLeft <= 5 ? "#ff4444" : timeLeft <= 10 ? "var(--primary)" : "var(--success)";

  return (
    <div
      className="fixed inset-0 bg-[#0a0d12] flex flex-col md:flex-row overflow-hidden"
      style={{ fontFamily: "var(--font-family)" }}
      onContextMenu={e => e.preventDefault()}
      onCopy={e => e.preventDefault()}
    >
      {/* ── SIDEBAR ───────────────────────────────────────────────── */}
      <aside className="w-full md:w-64 shrink-0 bg-[#0e1117] border-b md:border-b-0 md:border-r border-[#1e2535] flex flex-col">
        {/* Sidebar header */}
        <div className="px-4 py-3 md:px-5 md:py-4 border-b border-[#1e2535] hidden md:block">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={14} className="text-[var(--primary)]" />
            <span className="text-[var(--primary)] font-bold text-xs uppercase tracking-widest">AWS Quiz</span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-white font-black text-sm">{answeredCount}/{questions.length} Done</span>
            <span className="text-xs text-gray-500 font-medium">{Math.round((answeredCount / questions.length) * 100)}%</span>
          </div>
          {/* Progress bar */}
          <div className="mt-2 h-1.5 bg-[#1e2535] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] rounded-full transition-all duration-500"
              style={{ width: `${(answeredCount / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Legend */}
        <div className="hidden md:flex px-5 py-3 border-b border-[#1e2535] gap-4 text-[10px] font-bold uppercase tracking-wider text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--tertiary)]" />Active
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--success)]/70" />Done
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-yellow-400" />Flagged
          </span>
        </div>

        {/* Question grid / list */}
        <div className="flex-1 overflow-x-auto md:overflow-y-auto px-4 py-3 md:px-5 md:py-4 scrollbar-hide">
          <div className="flex md:grid md:grid-cols-4 gap-2 min-w-max md:min-w-0">
            {questions.map((q, idx) => {
              const isQAnswered = answeredMap[q.id];
              const isReview = reviewMap[q.id];
              const isActive = idx === currentIndex;

              let classes = "relative flex items-center justify-center shrink-0 md:shrink w-10 md:w-full aspect-square rounded-lg text-sm font-black transition-all duration-200 border cursor-pointer hover:scale-105 active:scale-95 ";
              if (isActive) {
                classes += "bg-[var(--tertiary)]/20 text-[var(--tertiary)] border-[var(--tertiary)] shadow-[0_0_12px_var(--tertiary)/30]";
              } else if (isQAnswered) {
                classes += "bg-[var(--success)]/10 text-[var(--success)]/60 border-[var(--success)]/30";
              } else if (isReview) {
                classes += "bg-yellow-400/15 text-yellow-400 border-yellow-400/50";
              } else {
                classes += "bg-[#161b24] text-gray-500 border-[#2a3040] hover:border-gray-500 hover:text-gray-300";
              }

              return (
                <button
                  key={q.id}
                  onClick={() => { setSelectedOption(null); setCurrentIndex(idx); }}
                  className={classes}
                  title={`Question ${idx + 1}`}
                >
                  {isQAnswered && (
                    <span className="absolute top-0.5 right-0.5">
                      <CheckCircle size={8} className="text-[var(--success)]/80" />
                    </span>
                  )}
                  {isReview && !isQAnswered && (
                    <span className="absolute top-0.5 right-0.5">
                      <Flag size={8} className="text-yellow-400" />
                    </span>
                  )}
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Finish button */}
        <div className="p-3 md:p-4 border-t border-[#1e2535] hidden md:block">
          <button
            onClick={handleFinishQuiz}
            className={`w-full py-3 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
              allAnswered
                ? "bg-gradient-to-r from-[var(--primary)] to-[#e08700] text-black hover:shadow-[0_4px_20px_var(--primary)/40] hover:-translate-y-0.5"
                : "bg-[#161b24] text-gray-400 border border-[#2a3040] hover:border-gray-500 hover:text-white"
            }`}
          >
            <Trophy size={15} />
            {allAnswered ? "Submit Quiz" : "Finish Early"}
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ──────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top bar */}
        <header className="shrink-0 bg-[#0e1117]/80 backdrop-blur-sm border-b border-[#1e2535] px-4 py-2 md:px-8 md:py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[var(--tertiary)]/15 border border-[var(--tertiary)]/30 rounded-lg px-3 py-1.5">
              <span className="text-[var(--tertiary)] font-black text-sm">Q{currentIndex + 1}</span>
              <span className="text-gray-500 text-sm font-medium"> / {questions.length}</span>
            </div>

            {question.difficulty && (
              <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                question.difficulty === 'EASY' ? 'bg-green-500/10 text-green-400 border-green-500/30' :
                question.difficulty === 'HARD' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
              }`}>
                {question.difficulty}
              </span>
            )}

            {!isAnswered && (
              <button
                onClick={() => toggleReview(question.id)}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                  reviewMap[question.id]
                    ? 'bg-yellow-400/15 text-yellow-400 border-yellow-400/50'
                    : 'bg-[#161b24] text-gray-500 border-[#2a3040] hover:border-gray-500 hover:text-gray-300'
                }`}
              >
                <Flag size={12} />
                {reviewMap[question.id] ? 'Flagged' : 'Flag'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {isAnswered ? (
              <div className="flex items-center gap-1 md:gap-2 bg-[var(--success)]/10 border border-[var(--success)]/30 rounded-lg px-2 py-1 md:px-4 md:py-2">
                <CheckCircle size={15} className="text-[var(--success)] hidden md:block" />
                <span className="text-[var(--success)] font-bold text-xs md:text-sm">Answered</span>
              </div>
            ) : (
              <>
                {/* Circular timer */}
                <div className="relative flex items-center justify-center w-10 h-10 md:w-12 md:h-12 shrink-0">
                  <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1e2535" strokeWidth="3" />
                    <circle
                      cx="18" cy="18" r="15.9" fill="none"
                      stroke={timerColor}
                      strokeWidth="3"
                      strokeDasharray="100"
                      strokeDashoffset={100 - timerPct}
                      strokeLinecap="round"
                      style={{ transition: "stroke-dashoffset 1s linear, stroke 0.5s" }}
                    />
                  </svg>
                  <span className="relative text-[10px] md:text-xs font-black" style={{ color: timerColor }}>{timeLeft}</span>
                </div>
                <div className="text-right hidden md:block">
                  <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Time Left</div>
                  <div className="font-black text-white text-sm">{timeLeft}s</div>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Question + Options */}
        <div className="flex-1 overflow-y-auto px-4 py-4 md:px-8 md:py-6">
          {/* Question */}
          <div className="mb-6 md:mb-8 max-w-3xl">
            <div className="text-[10px] md:text-xs text-gray-500 uppercase tracking-widest font-bold mb-2 md:mb-3 flex items-center gap-2">
              <span className="w-4 h-px bg-[var(--primary)]" />
              Question
            </div>
            <h2 className="text-xl md:text-3xl font-bold text-white leading-relaxed tracking-tight">{question.text}</h2>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-4xl">
            {question.options.map((opt, optIdx) => {
              const isSelected = selectedOption === opt.id;
              const label = OPTION_LABELS[optIdx] || String(optIdx + 1);

              return (
                <button
                  key={opt.id}
                  disabled={isAnswered || isSubmitting}
                  onClick={() => setSelectedOption(opt.id)}
                  className={`group relative text-left p-5 rounded-xl border-2 transition-all duration-200 flex items-start gap-4 ${
                    isAnswered
                      ? 'opacity-40 cursor-not-allowed border-[#1e2535] bg-[#0e1117]'
                      : isSelected
                        ? 'border-[var(--primary)] bg-[var(--primary)]/8 shadow-[0_0_24px_var(--primary)/20] -translate-y-0.5'
                        : 'border-[#2a3040] bg-[#0e1117] hover:border-[#445167] hover:bg-[#12161e] hover:-translate-y-0.5 cursor-pointer'
                  }`}
                >
                  {/* Option label badge */}
                  <span className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-sm font-black transition-all ${
                    isSelected
                      ? 'bg-[var(--primary)] text-black shadow-[0_0_12px_var(--primary)/40]'
                      : 'bg-[#161b24] text-gray-500 group-hover:bg-[#1e2535] group-hover:text-gray-300'
                  }`}>
                    {label}
                  </span>
                  <span className={`font-semibold text-base leading-relaxed mt-0.5 transition-colors ${
                    isSelected ? 'text-white' : 'text-gray-300 group-hover:text-white'
                  }`}>
                    {opt.text}
                  </span>
                  {isSelected && (
                    <CheckCircle size={18} className="shrink-0 ml-auto text-[var(--primary)] mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Answered notice */}
          {isAnswered && (
            <div className="mt-6 max-w-4xl flex flex-col gap-4">
              <div className="flex items-center gap-3 bg-[var(--success)]/8 border border-[var(--success)]/25 rounded-xl px-4 py-3 md:px-5 md:py-4">
                <CheckCircle size={18} className="text-[var(--success)] shrink-0" />
                <p className="text-[var(--success)] font-semibold text-xs md:text-sm">Answer recorded. Pick another question from the top bar.</p>
              </div>
              
              {/* Mobile Finish Button (shown when viewing an answered question) */}
              <button
                onClick={handleFinishQuiz}
                className={`md:hidden w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 mt-4 ${
                  allAnswered
                    ? "bg-gradient-to-r from-[var(--primary)] to-[#e08700] text-black shadow-[0_4px_16px_var(--primary)/40]"
                    : "bg-[#161b24] text-gray-400 border border-[#2a3040]"
                }`}
              >
                <Trophy size={16} />
                {allAnswered ? "Submit Quiz" : "Finish Early"}
              </button>
            </div>
          )}
        </div>

        {/* Action bar */}
        {!isAnswered && (
          <footer className="shrink-0 bg-[#0e1117]/80 backdrop-blur-sm border-t border-[#1e2535] px-4 py-3 md:px-8 md:py-4">
            <div className="flex items-center gap-3 max-w-4xl">
              <button
                disabled={isSubmitting}
                onClick={handleSkip}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#161b24] text-gray-400 border border-[#2a3040] font-bold text-sm hover:border-gray-500 hover:text-white transition-all disabled:opacity-40"
              >
                <SkipForward size={16} />
                Skip
              </button>

              <button
                disabled={!selectedOption || isSubmitting}
                onClick={() => handleSubmit()}
                className="flex-[2] flex items-center justify-center gap-2 md:gap-2.5 py-3 rounded-xl font-black text-sm md:text-base transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed bg-gradient-to-r from-[var(--primary)] to-[#e08700] text-black hover:shadow-[0_4px_24px_var(--primary)/50] hover:-translate-y-0.5 active:translate-y-0"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Submitting…
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} className="md:w-[18px] md:h-[18px]" />
                    Confirm
                  </>
                )}
              </button>
            </div>
          </footer>
        )}
      </main>
    </div>
  );
}
