"use client";

import { useEffect, useRef, useState } from "react";
import { evaluateAnswer, getCorrectAnswerText, type Question, type SubmittedAnswer } from "@/lib/bibleQuiz";
import {
  CHALLENGE_MAX_QUESTIONS,
  CHALLENGE_READY_SECONDS,
  CHALLENGE_TIME_SECONDS,
  buildChallengePool,
  getQuestionPoints,
} from "@/lib/challenge";
import { getMyNickname, pushChallengeScore } from "@/lib/leaderboard";
import { questionBank } from "@/lib/questionBank";
import { preloadSounds, sounds } from "@/lib/sounds";
import { ImagePrompt, QuestionAnswerControls } from "@/components/QuestionAnswerControls";

type Phase = "READY" | "RUNNING" | "ENDED";
type Outcome = "failed" | "timeout" | "complete";

export function Challenge({
  storage,
  onClose,
  onOpenLeaderboard,
}: {
  storage: Storage | null;
  onClose: () => void;
  onOpenLeaderboard: () => void;
}) {
  const nickname = getMyNickname(storage ?? undefined);

  const [pool, setPool] = useState<Question[]>(() => buildChallengePool(questionBank));
  const [phase, setPhase] = useState<Phase>("READY");
  const [readyLeft, setReadyLeft] = useState(CHALLENGE_READY_SECONDS);
  const [timeLeft, setTimeLeft] = useState(CHALLENGE_TIME_SECONDS);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [bonus, setBonus] = useState(0);
  const [failedQuestion, setFailedQuestion] = useState<Question | null>(null);
  const scoreRef = useRef(0);
  const timeLeftRef = useRef(CHALLENGE_TIME_SECONDS);

  useEffect(() => {
    preloadSounds();
  }, []);

  useEffect(() => {
    if (phase !== "READY") return;
    if (readyLeft <= 0) {
      setPhase("RUNNING");
      return;
    }
    const timer = setTimeout(() => setReadyLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, readyLeft]);

  useEffect(() => {
    if (phase !== "RUNNING") return;
    if (timeLeft <= 0) {
      finish("timeout", scoreRef.current);
      return;
    }
    const timer = setTimeout(() => {
      timeLeftRef.current = timeLeft - 1;
      setTimeLeft(timeLeft - 1);
    }, 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, timeLeft]);

  function finish(result: Outcome, finalScore: number) {
    setPhase("ENDED");
    setOutcome(result);
    setScore(finalScore);
    scoreRef.current = finalScore;

    if (result === "complete") {
      sounds.levelup();
    } else if (result === "failed") {
      sounds.wrong();
    }

    if (nickname) {
      void pushChallengeScore(nickname, finalScore);
    }
  }

  function handleAnswer(answer: SubmittedAnswer) {
    if (phase !== "RUNNING") return;
    const question = pool[index];
    if (!question) return;

    if (!evaluateAnswer(question, answer)) {
      setFailedQuestion(question);
      finish("failed", scoreRef.current);
      return;
    }

    sounds.correct();
    const nextScore = scoreRef.current + getQuestionPoints(question.type);
    scoreRef.current = nextScore;
    setScore(nextScore);

    if (index + 1 >= pool.length) {
      const remaining = timeLeftRef.current;
      setBonus(remaining);
      finish("complete", nextScore + remaining);
      return;
    }

    setIndex(index + 1);
  }

  function retry() {
    setPool(buildChallengePool(questionBank));
    setPhase("READY");
    setReadyLeft(CHALLENGE_READY_SECONDS);
    setTimeLeft(CHALLENGE_TIME_SECONDS);
    setIndex(0);
    setScore(0);
    setOutcome(null);
    setBonus(0);
    setFailedQuestion(null);
    scoreRef.current = 0;
    timeLeftRef.current = CHALLENGE_TIME_SECONDS;
  }

  if (!nickname) {
    return (
      <section className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-5 py-10 text-center">
        <div className="w-full space-y-5 rounded-lg border border-gold/30 bg-white/65 p-7 shadow-sm sm:p-10">
          <p className="text-sm font-bold text-gold">Challenge Mode</p>
          <h2 className="font-serif text-3xl font-extrabold">리더보드 등록이 필요합니다</h2>
          <p className="text-brown-dark/75">
            챌린지 모드는 Leader Board에 닉네임을 등록한 사람만 참여할 수 있습니다.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button className="primary-button" onClick={onOpenLeaderboard}>
              Leader Board에서 등록하기
            </button>
            <button className="secondary-button" onClick={onClose}>
              모드 선택으로
            </button>
          </div>
        </div>
      </section>
    );
  }

  const currentQuestion = phase === "RUNNING" ? pool[index] : null;

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-5 py-8">
      {phase === "READY" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
          <p className="text-sm font-bold uppercase text-gold">Challenge Mode</p>
          <h2 className="font-serif text-5xl font-extrabold">준비하세요!</h2>
          <div className="grid h-32 w-32 place-items-center rounded-full border-4 border-gold bg-white/70 font-serif text-7xl font-black text-gold shadow-lg">
            {readyLeft}
          </div>
          <p className="text-brown-dark/70">
            {CHALLENGE_TIME_SECONDS}초 동안 랜덤 {CHALLENGE_MAX_QUESTIONS}문제에 도전합니다. 한 문제라도 틀리면 종료됩니다.
          </p>
          <button className="secondary-button" onClick={onClose}>
            취소
          </button>
        </div>
      )}

      {phase === "RUNNING" && currentQuestion && (
        <>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="rounded-md border border-gold/25 bg-white/55 px-2 py-2 text-center sm:px-4 sm:py-3">
              <p className="text-xs font-bold text-brown-dark/55">남은 시간</p>
              <p className={`text-lg font-black sm:text-xl ${timeLeft <= 10 ? "text-red-600" : ""}`}>{timeLeft}초</p>
            </div>
            <div className="rounded-md border border-gold/25 bg-white/55 px-2 py-2 text-center sm:px-4 sm:py-3">
              <p className="text-xs font-bold text-brown-dark/55">문제</p>
              <p className="text-lg font-black sm:text-xl">
                {index + 1}/{pool.length}
              </p>
            </div>
            <div className="rounded-md border border-gold/25 bg-white/55 px-2 py-2 text-center sm:px-4 sm:py-3">
              <p className="text-xs font-bold text-brown-dark/55">점수</p>
              <p className="text-lg font-black sm:text-xl">{score}점</p>
            </div>
          </div>
          <div className="h-3 overflow-hidden rounded-full border border-gold/20 bg-cream-dark">
            <div
              className={`h-full rounded-full transition-all ${timeLeft <= 10 ? "bg-red-500" : "bg-gold"}`}
              style={{ width: `${Math.round((timeLeft / CHALLENGE_TIME_SECONDS) * 100)}%` }}
            />
          </div>
          <div className="rounded-lg border border-gold/30 bg-white/70 p-5 shadow-sm sm:p-7">
            {(currentQuestion.type === "memory_verse" || currentQuestion.type === "fill_blank") && (
              <p className="mb-3 text-sm font-bold text-gold">{currentQuestion.category ?? "성경말씀"}</p>
            )}
            {currentQuestion.type === "image_quiz" && <ImagePrompt question={currentQuestion} />}
            <h2 className="font-serif text-2xl font-bold leading-relaxed sm:text-3xl">{currentQuestion.question}</h2>
          </div>
          <QuestionAnswerControls question={currentQuestion} onAnswer={handleAnswer} />
        </>
      )}

      {phase === "ENDED" && (
        <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-5 text-center">
          <div className="w-full space-y-5 rounded-lg border border-gold/30 bg-white/65 p-7 shadow-sm sm:p-10">
            <p className="text-sm font-bold text-gold">Challenge Mode</p>
            <h2 className="font-serif text-4xl font-extrabold">
              {outcome === "failed" && "도전에 실패했습니다"}
              {outcome === "timeout" && "시간 종료!"}
              {outcome === "complete" && `${CHALLENGE_MAX_QUESTIONS}문제 완주!`}
            </h2>
            <p className="font-serif text-5xl font-black text-gold">{score}점</p>
            {outcome === "complete" && bonus > 0 && (
              <p className="text-sm font-bold text-brown-dark/70">남은 시간 보너스 +{bonus}점 포함</p>
            )}
            {outcome === "failed" && failedQuestion && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-left text-sm leading-6 text-red-900">
                <p className="font-bold">{failedQuestion.question}</p>
                <p className="mt-1">
                  정답: <strong>{getCorrectAnswerText(failedQuestion)}</strong> [{failedQuestion.reference}]
                </p>
              </div>
            )}
            <p className="text-sm text-brown-dark/70">
              최고 기록만 챌린지 순위에 반영됩니다. Leader Board의 챌린지 순위에서 확인하세요.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button className="primary-button" onClick={retry}>
                다시 도전
              </button>
              <button className="secondary-button" onClick={onOpenLeaderboard}>
                챌린지 순위 보기
              </button>
              <button className="secondary-button" onClick={onClose}>
                모드 선택으로
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
