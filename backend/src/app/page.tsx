"use client";

import { useEffect, useMemo, useState } from "react";
import {
  GameProgress,
  QUESTIONS_PER_RUN,
  TOTAL_LEVELS,
  completeLevel,
  defaultProgress,
  isLevelPassed,
  levelMeta,
  loadProgress,
  pickRandomQuestions,
  resetProgress,
  saveProgress,
  type Question,
} from "@/lib/bibleQuiz";
import { questionBank } from "@/lib/questionBank";
import { sounds } from "@/lib/sounds";

type Screen = "HOME" | "LEVEL_INTRO" | "QUESTION" | "FEEDBACK" | "LEVEL_RESULT" | "CELEBRATION";
type Feedback = { correct: boolean; answer: string; explanation: string; reference: string } | null;

export default function Home() {
  const [screen, setScreen] = useState<Screen>("HOME");
  const [progress, setProgress] = useState<GameProgress>(defaultProgress);
  const [level, setLevel] = useState(1);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [hydrated, setHydrated] = useState(false);

  const meta = levelMeta[level - 1];
  const currentQuestion = questions[currentIndex];
  const passed = isLevelPassed(score);
  const completedAll = progress.completedLevels.length === TOTAL_LEVELS;

  useEffect(() => {
    const stored = loadProgress(window.localStorage);
    setProgress(stored);
    setLevel(stored.currentLevel);
    if (stored.highestLevel > 0 && stored.completedLevels.length < TOTAL_LEVELS) {
      setQuestions(pickRandomQuestions(questionBank, stored.currentLevel));
      setScreen("LEVEL_INTRO");
    }
    setHydrated(true);
  }, []);

  const stats = useMemo(() => {
    const completed = progress.completedLevels.length;
    return {
      completed,
      percent: Math.round((completed / TOTAL_LEVELS) * 100),
    };
  }, [progress.completedLevels.length]);

  function beginLevel(targetLevel = completedAll ? 1 : progress.currentLevel) {
    const safeLevel = Math.min(TOTAL_LEVELS, Math.max(1, targetLevel));
    setLevel(safeLevel);
    setQuestions(pickRandomQuestions(questionBank, safeLevel));
    setCurrentIndex(0);
    setScore(0);
    setFeedback(null);
    setScreen("LEVEL_INTRO");
  }

  function answerQuestion(optionIndex: number) {
    if (!currentQuestion) return;
    const correct = optionIndex === currentQuestion.answer;
    const nextScore = correct ? score + 1 : score;

    setScore(nextScore);
    setFeedback({
      correct,
      answer: currentQuestion.options[currentQuestion.answer],
      explanation: currentQuestion.explanation,
      reference: currentQuestion.reference,
    });
    if (correct) {
      sounds.correct();
    } else {
      sounds.wrong();
    }
    setScreen("FEEDBACK");
  }

  function skipFeedback() {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= QUESTIONS_PER_RUN) {
      setScreen("LEVEL_RESULT");
      return;
    }

    setCurrentIndex(nextIndex);
    setFeedback(null);
    setScreen("QUESTION");
  }

  function resolveLevelResult() {
    if (!passed) {
      beginLevel(level);
      return;
    }

    const next = completeLevel(progress, level);
    setProgress(next);
    saveProgress(next, window.localStorage);
    if (level === TOTAL_LEVELS) {
      sounds.finalFanfare();
    } else {
      sounds.fanfare();
    }
    setScreen("CELEBRATION");
  }

  function nextLevel() {
    if (level >= TOTAL_LEVELS) {
      setScreen("HOME");
      return;
    }
    beginLevel(level + 1);
  }

  function handleReset() {
    const next = resetProgress(window.localStorage);
    setProgress(next);
    setLevel(1);
    setQuestions([]);
    setScore(0);
    setCurrentIndex(0);
    setFeedback(null);
    setScreen("HOME");
  }

  return (
    <main className="min-h-screen bg-cream text-brown-dark">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-5 sm:px-8">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-gold/25 pb-4">
          <button className="flex items-center gap-3 text-left" onClick={() => setScreen("HOME")}>
            <span className="grid h-11 w-11 place-items-center rounded-full border border-gold/50 bg-cream-dark text-xl text-gold shadow-sm">
              ✦
            </span>
            <span>
              <span className="block font-serif text-xl font-bold">성경 퀴즈 게임</span>
              <span className="block text-sm text-brown-dark/65">구약에서 신약까지 10단계</span>
            </span>
          </button>
          <div className="flex items-center gap-2">
            <div className="rounded-md border border-gold/30 bg-white/45 px-3 py-2 text-sm">
              완료 {stats.completed}/{TOTAL_LEVELS}
            </div>
            <button
              className="rounded-md border border-brown-dark/20 px-3 py-2 text-sm font-semibold transition hover:bg-cream-dark"
              onClick={handleReset}
            >
              초기화
            </button>
          </div>
        </header>

        {screen === "HOME" && (
          <section className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-7">
              <div className="space-y-4">
                <p className="text-sm font-bold uppercase text-gold">Bible Quiz Journey</p>
                <h1 className="font-serif text-4xl font-extrabold leading-tight sm:text-6xl">
                  단계별로 익히는 성경 지식 퀴즈
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-brown-dark/75">
                  구약의 핵심 사건에서 신약 서신서와 요한계시록까지, 각 단계마다 10문제를 풀고
                  7문제 이상 맞히면 다음 단계가 열립니다.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button className="primary-button" disabled={!hydrated} onClick={() => beginLevel()}>
                  {completedAll ? "1단계부터 다시 도전" : `${progress.currentLevel}단계 시작`}
                </button>
                <button className="secondary-button" onClick={handleReset}>
                  처음부터 시작
                </button>
              </div>
              <ProgressBar percent={stats.percent} label={`전체 진행률 ${stats.percent}%`} />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {levelMeta.map((item) => {
                const done = progress.completedLevels.includes(item.level);
                const active = item.level === progress.currentLevel && !completedAll;
                return (
                  <div
                    className={`rounded-lg border p-4 shadow-sm ${
                      active
                        ? "border-gold bg-white/70"
                        : done
                          ? "border-emerald-700/25 bg-emerald-50/70"
                          : "border-gold/20 bg-white/35"
                    }`}
                    key={item.level}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <strong>{item.level}단계</strong>
                      <span className="rounded-full bg-cream-dark px-2.5 py-1 text-xs font-bold text-brown-dark/70">
                        {done ? "완료" : item.difficulty}
                      </span>
                    </div>
                    <p className="mt-2 font-serif text-lg font-bold">{item.title}</p>
                    <p className="text-sm text-brown-dark/65">{item.scope}</p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {screen === "LEVEL_INTRO" && (
          <CenteredPanel>
            <p className="text-sm font-bold text-gold">
              {meta.difficulty} · {meta.scope}
            </p>
            <h2 className="font-serif text-4xl font-extrabold">
              {level}단계: {meta.title}
            </h2>
            <p className="text-brown-dark/75">
              30문제 풀에서 무작위로 10문제가 출제됩니다. 7문제 이상 맞히면 다음 단계로 이동합니다.
            </p>
            <button className="primary-button" onClick={() => setScreen("QUESTION")}>
              문제 풀기
            </button>
          </CenteredPanel>
        )}

        {screen === "QUESTION" && currentQuestion && (
          <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-5 py-8">
            <div className="grid gap-3 sm:grid-cols-3">
              <Status label="단계" value={`${level}/${TOTAL_LEVELS}`} />
              <Status label="문제" value={`${currentIndex + 1}/${QUESTIONS_PER_RUN}`} />
              <Status label="점수" value={`${score}점`} />
            </div>
            <ProgressBar
              percent={Math.round(((currentIndex + 1) / QUESTIONS_PER_RUN) * 100)}
              label={`${currentIndex + 1}번째 문제`}
            />
            <div className="rounded-lg border border-gold/30 bg-white/70 p-5 shadow-sm sm:p-7">
              <p className="mb-3 text-sm font-bold text-gold">{meta.title}</p>
              <h2 className="font-serif text-2xl font-bold leading-relaxed sm:text-3xl">{currentQuestion.question}</h2>
            </div>
            <div className="grid gap-3">
              {currentQuestion.options.map((option, index) => (
                <button className="answer-button" key={`${currentQuestion.id}-${option}`} onClick={() => answerQuestion(index)}>
                  <span>{String.fromCharCode(65 + index)}</span>
                  {option}
                </button>
              ))}
            </div>
          </section>
        )}

        {screen === "FEEDBACK" && feedback && (
          <div
            className={`fixed inset-0 z-20 grid place-items-center px-6 ${
              feedback.correct ? "bg-emerald-700" : "bg-red-700"
            }`}
          >
            <div className="max-w-xl text-center text-white">
              <div className="text-[8rem] font-black leading-none sm:text-[12rem]">{feedback.correct ? "O" : "X"}</div>
              <p className="text-2xl font-bold">{feedback.correct ? "정답입니다" : `정답: ${feedback.answer}`}</p>
              <p className="mt-3 text-lg font-bold text-white">[{feedback.reference}]</p>
              <p className="mt-3 text-base text-white/85">{feedback.explanation}</p>
              <button
                className="mt-7 rounded-md border border-white/60 bg-white px-5 py-3 text-sm font-bold text-brown-dark shadow-sm transition hover:bg-cream"
                onClick={skipFeedback}
              >
                Skip
              </button>
            </div>
          </div>
        )}

        {screen === "LEVEL_RESULT" && (
          <CenteredPanel>
            <p className="text-sm font-bold text-gold">{level}단계 결과</p>
            <h2 className="font-serif text-4xl font-extrabold">
              {score}/{QUESTIONS_PER_RUN} 정답
            </h2>
            <p className="text-brown-dark/75">
              {passed
                ? "통과 기준을 달성했습니다. 축하 화면으로 이동하세요."
                : "통과 기준은 7문제입니다. 새 문제로 다시 도전할 수 있습니다."}
            </p>
            <button className={passed ? "primary-button" : "secondary-button"} onClick={resolveLevelResult}>
              {passed ? "완료 확인" : "다시 도전"}
            </button>
          </CenteredPanel>
        )}

        {screen === "CELEBRATION" && (
          <CenteredPanel>
            <div className="text-6xl">✦</div>
            <p className="text-sm font-bold text-gold">Level Clear</p>
            <h2 className="font-serif text-4xl font-extrabold">
              {level === TOTAL_LEVELS ? "모든 단계를 완료했습니다" : `${level}단계 완료`}
            </h2>
            <p className="text-brown-dark/75">
              {level === TOTAL_LEVELS
                ? "구약과 신약을 아우르는 전체 여정을 마쳤습니다."
                : `${level + 1}단계에서 더 깊은 성경 지식을 확인해 보세요.`}
            </p>
            <button className="primary-button" onClick={nextLevel}>
              {level === TOTAL_LEVELS ? "홈으로 이동" : "다음 단계"}
            </button>
          </CenteredPanel>
        )}
      </div>
    </main>
  );
}

function CenteredPanel({ children }: { children: React.ReactNode }) {
  return (
    <section className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-5 py-10 text-center">
      <div className="w-full space-y-5 rounded-lg border border-gold/30 bg-white/65 p-7 shadow-sm sm:p-10">
        {children}
      </div>
    </section>
  );
}

function Status({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-gold/25 bg-white/55 px-4 py-3">
      <p className="text-xs font-bold text-brown-dark/55">{label}</p>
      <p className="text-xl font-black">{value}</p>
    </div>
  );
}

function ProgressBar({ percent, label }: { percent: number; label: string }) {
  return (
    <div aria-label={label} className="h-3 overflow-hidden rounded-full border border-gold/20 bg-cream-dark">
      <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${percent}%` }} />
    </div>
  );
}
