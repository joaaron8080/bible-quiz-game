"use client";

import { useEffect, useMemo, useState } from "react";
import {
  GameProgress,
  QUESTIONS_PER_RUN,
  TOTAL_LEVELS,
  completeLevel,
  defaultProgress,
  levelMeta,
  loadProgress,
  resetProgress,
  saveProgress,
} from "@/lib/bibleQuiz";
import {
  answerCurrentQuestion,
  continueAfterFeedback,
  defaultSession,
  getCurrentQuestion,
  goHome,
  isSessionPassed,
  resumeSession,
  showCelebration,
  showQuestion,
  startLevelSession,
  startNextProgressLevelSession,
} from "@/lib/gameSession";
import { questionBank } from "@/lib/questionBank";
import { sounds } from "@/lib/sounds";

export default function Home() {
  const [session, setSession] = useState(defaultSession);
  const [progress, setProgress] = useState<GameProgress>(defaultProgress);
  const [hydrated, setHydrated] = useState(false);

  const meta = levelMeta[session.level - 1];
  const currentQuestion = getCurrentQuestion(session);
  const passed = isSessionPassed(session);
  const completedAll = progress.completedLevels.length === TOTAL_LEVELS;

  useEffect(() => {
    const stored = loadProgress(window.localStorage);
    setProgress(stored);
    setSession(resumeSession(stored, questionBank));
    setHydrated(true);
  }, []);

  const stats = useMemo(() => {
    const completed = progress.completedLevels.length;
    return {
      completed,
      percent: Math.round((completed / TOTAL_LEVELS) * 100),
    };
  }, [progress.completedLevels.length]);

  function beginLevel(targetLevel?: number) {
    setSession(
      targetLevel === undefined
        ? startNextProgressLevelSession(progress, questionBank)
        : startLevelSession(targetLevel, questionBank),
    );
  }

  function answerQuestion(optionIndex: number) {
    const result = answerCurrentQuestion(session, optionIndex);
    setSession(result.session);

    if (result.correct) {
      sounds.correct();
    } else {
      sounds.wrong();
    }
  }

  function skipFeedback() {
    setSession(continueAfterFeedback(session));
  }

  function resolveLevelResult() {
    if (!passed) {
      beginLevel(session.level);
      return;
    }

    const next = completeLevel(progress, session.level);
    setProgress(next);
    saveProgress(next, window.localStorage);
    if (session.level === TOTAL_LEVELS) {
      sounds.finalFanfare();
    } else {
      sounds.fanfare();
    }
    setSession(showCelebration(session));
  }

  function nextLevel() {
    if (session.level >= TOTAL_LEVELS) {
      setSession(goHome(session));
      return;
    }
    beginLevel(session.level + 1);
  }

  function handleReset() {
    const next = resetProgress(window.localStorage);
    setProgress(next);
    setSession(defaultSession);
  }

  return (
    <main className="min-h-screen bg-cream text-brown-dark">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-5 sm:px-8">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-gold/25 pb-4">
          <button className="flex items-center gap-3 text-left" onClick={() => setSession(goHome(session))}>
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

        {session.screen === "HOME" && (
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

        {session.screen === "LEVEL_INTRO" && (
          <CenteredPanel>
            <p className="text-sm font-bold text-gold">
              {meta.difficulty} · {meta.scope}
            </p>
            <h2 className="font-serif text-4xl font-extrabold">
              {session.level}단계: {meta.title}
            </h2>
            <p className="text-brown-dark/75">
              30문제 풀에서 무작위로 10문제가 출제됩니다. 7문제 이상 맞히면 다음 단계로 이동합니다.
            </p>
            <button className="primary-button" onClick={() => setSession(showQuestion(session))}>
              문제 풀기
            </button>
          </CenteredPanel>
        )}

        {session.screen === "QUESTION" && currentQuestion && (
          <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-5 py-8">
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <Status label="단계" value={`${session.level}/${TOTAL_LEVELS}`} />
              <Status label="문제" value={`${session.currentIndex + 1}/${QUESTIONS_PER_RUN}`} />
              <Status label="점수" value={`${session.score}점`} />
            </div>
            <ProgressBar
              percent={Math.round(((session.currentIndex + 1) / QUESTIONS_PER_RUN) * 100)}
              label={`${session.currentIndex + 1}번째 문제`}
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

        {session.screen === "FEEDBACK" && session.feedback && (
          <div
            className={`fixed inset-0 z-20 grid place-items-center px-6 ${
              session.feedback.correct ? "bg-emerald-700" : "bg-red-700"
            }`}
          >
            <div className="max-w-xl text-center text-white">
              <div className="text-[8rem] font-black leading-none sm:text-[12rem]">{session.feedback.correct ? "O" : "X"}</div>
              <p className="text-2xl font-bold">
                {session.feedback.correct ? "정답입니다" : `정답: ${session.feedback.answer}`}
              </p>
              <p className="mt-3 text-lg font-bold text-white">[{session.feedback.reference}]</p>
              <p className="mt-3 text-base text-white/85">{session.feedback.explanation}</p>
              <button
                className="mt-7 rounded-md border border-white/60 bg-white px-5 py-3 text-sm font-bold text-brown-dark shadow-sm transition hover:bg-cream"
                onClick={skipFeedback}
              >
                Skip
              </button>
            </div>
          </div>
        )}

        {session.screen === "LEVEL_RESULT" && (
          <CenteredPanel>
            <p className="text-sm font-bold text-gold">{session.level}단계 결과</p>
            <h2 className="font-serif text-4xl font-extrabold">
              {session.score}/{QUESTIONS_PER_RUN} 정답
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

        {session.screen === "CELEBRATION" && (
          <CenteredPanel>
            <div className="text-6xl">✦</div>
            <p className="text-sm font-bold text-gold">Level Clear</p>
            <h2 className="font-serif text-4xl font-extrabold">
              {session.level === TOTAL_LEVELS ? "모든 단계를 완료했습니다" : `${session.level}단계 완료`}
            </h2>
            <p className="text-brown-dark/75">
              {session.level === TOTAL_LEVELS
                ? "구약과 신약을 아우르는 전체 여정을 마쳤습니다."
                : `${session.level + 1}단계에서 더 깊은 성경 지식을 확인해 보세요.`}
            </p>
            <button className="primary-button" onClick={nextLevel}>
              {session.level === TOTAL_LEVELS ? "홈으로 이동" : "다음 단계"}
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
    <div className="rounded-md border border-gold/25 bg-white/55 px-2 py-2 text-center sm:px-4 sm:py-3">
      <p className="text-xs font-bold text-brown-dark/55">{label}</p>
      <p className="text-lg font-black sm:text-xl">{value}</p>
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
