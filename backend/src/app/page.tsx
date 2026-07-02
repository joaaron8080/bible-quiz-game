"use client";

import { useEffect, useState } from "react";
import {
  GameProgress,
  ModeProgressMap,
  MAX_WRONG_ANSWERS,
  QUESTIONS_PER_RUN,
  TOTAL_LEVELS,
  completeLevel,
  getModeLevelCount,
  getModeProgress,
  loadProgressMap,
  releasedQuizModes,
  resetModeProgress,
  saveProgressMap,
  setModeProgress,
  type QuizMode,
  type SubmittedAnswer,
} from "@/lib/bibleQuiz";
import {
  answerCurrentQuestion,
  continueAfterFeedback,
  defaultSession,
  getCurrentQuestion,
  goToModeHome,
  goToModeSelect,
  isSessionPassed,
  selectMode,
  showCelebration,
  startLevelSession,
} from "@/lib/gameSession";
import { questionBank } from "@/lib/questionBank";
import { preloadSounds, sounds } from "@/lib/sounds";
import { Leaderboard } from "@/components/Leaderboard";
import { Challenge } from "@/components/Challenge";
import { ImagePrompt, QuestionAnswerControls } from "@/components/QuestionAnswerControls";
import { CHALLENGE_MAX_QUESTIONS, CHALLENGE_TIME_SECONDS } from "@/lib/challenge";
import { addTotalScore, getMyNickname, getTotalScore, isSupabaseConfigured, pushScore } from "@/lib/leaderboard";
import type { GameSession } from "@/lib/gameSession";

export default function Home() {
  const [session, setSession] = useState(defaultSession);
  const [progressMap, setProgressMap] = useState<ModeProgressMap>({});
  const [hydrated, setHydrated] = useState(false);
  const [confirmRestart, setConfirmRestart] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showChallenge, setShowChallenge] = useState(false);

  const myNickname = hydrated ? getMyNickname(window.localStorage) : null;

  const currentQuestion = getCurrentQuestion(session);
  const passed = isSessionPassed(session);
  const failedEarly = session.wrong >= MAX_WRONG_ANSWERS;
  const levelCount = getModeLevelCount(session.mode);
  const modeProgress = getModeProgress(progressMap, session.mode);
  const modeCompleted = modeProgress.completedLevels.length;
  const modeCompletedAll = modeCompleted === levelCount;
  const startLevel = modeCompletedAll ? 1 : modeProgress.currentLevel;

  useEffect(() => {
    setProgressMap(loadProgressMap(window.localStorage));
    setHydrated(true);
  }, []);

  function enterMode(mode: QuizMode) {
    setSession(selectMode(mode, getModeProgress(progressMap, mode).currentLevel));
  }

  function beginLevel(level: number) {
    preloadSounds();
    setSession(startLevelSession(level, questionBank, Math.random, session.mode));
  }

  function restartMode() {
    const next = resetModeProgress(progressMap, session.mode);
    setProgressMap(next);
    saveProgressMap(next, window.localStorage);
    setConfirmRestart(false);
    setSession(startLevelSession(1, questionBank, Math.random, session.mode));
  }

  function recordRunScore(runScore: number) {
    if (!hydrated) return;
    const storage = window.localStorage;
    addTotalScore(runScore, storage);
    const nickname = getMyNickname(storage);
    if (nickname) {
      void pushScore(nickname, getTotalScore(storage));
    }
  }

  function advanceAfterFeedback(current: GameSession) {
    const next = continueAfterFeedback(current);
    if (next.screen === "LEVEL_RESULT" && current.screen !== "LEVEL_RESULT") {
      recordRunScore(next.score);
    }
    setSession(next);
  }

  function answerQuestion(answer: SubmittedAnswer) {
    const result = answerCurrentQuestion(session, answer);

    if (result.correct) {
      sounds.correct();
      advanceAfterFeedback(result.session);
    } else {
      sounds.wrong();
      setSession(result.session);
    }
  }

  function skipFeedback() {
    advanceAfterFeedback(session);
  }

  function resolveLevelResult() {
    if (!passed) {
      beginLevel(session.level);
      return;
    }

    const next = setModeProgress(progressMap, session.mode, completeLevel(modeProgress, session.level, levelCount));
    setProgressMap(next);
    saveProgressMap(next, window.localStorage);

    sounds.levelup();
    setSession(showCelebration(session));
  }

  function nextLevel() {
    if (session.level >= levelCount) {
      setSession(goToModeHome(session));
      return;
    }
    beginLevel(session.level + 1);
  }

  return (
    <main className="min-h-screen bg-cream text-brown-dark">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-5 sm:px-8">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-gold/25 pb-4">
          <button className="flex items-center gap-3 text-left" onClick={() => setSession(goToModeSelect(session))}>
            <span className="grid h-11 w-11 place-items-center rounded-full border border-gold/50 bg-cream-dark text-xl text-gold shadow-sm">
              ✦
            </span>
            <span>
              <span className="block font-serif text-xl font-bold">성경 퀴즈 게임</span>
              <span className="block text-sm text-brown-dark/65">유형을 골라 1단계부터 10단계까지</span>
            </span>
          </button>
          {session.screen !== "MODE_SELECT" && (
            <div className="flex items-center gap-2">
              <div className="rounded-md border border-gold/30 bg-white/45 px-3 py-2 text-sm">
                {getModeLabel(session.mode)} 완료 {modeCompleted}/{levelCount}
              </div>
              <button
                className="rounded-md border border-brown-dark/20 px-3 py-2 text-sm font-semibold transition hover:bg-cream-dark"
                onClick={() => setSession(goToModeSelect(session))}
              >
                모드 선택
              </button>
            </div>
          )}
        </header>

        {session.screen === "MODE_SELECT" && showChallenge && (
          <Challenge
            storage={hydrated ? window.localStorage : null}
            onClose={() => setShowChallenge(false)}
            onOpenLeaderboard={() => {
              setShowChallenge(false);
              setShowLeaderboard(true);
            }}
          />
        )}

        {session.screen === "MODE_SELECT" && showLeaderboard && !showChallenge && (
          <Leaderboard storage={hydrated ? window.localStorage : null} onClose={() => setShowLeaderboard(false)} />
        )}

        {session.screen === "MODE_SELECT" && !showLeaderboard && !showChallenge && (
          <section className="flex-1 space-y-7 py-8">
            <div className="space-y-4">
              <p className="text-sm font-bold uppercase text-gold">Quiz Mode</p>
              <h1 className="font-serif text-4xl font-extrabold leading-tight sm:text-5xl">
                먼저 퀴즈 유형을 선택하세요
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-brown-dark/75">
                유형을 고르면 해당 유형으로 1단계부터 10단계까지 진행합니다. 단계마다 10문제 중 7문제 이상
                맞히면 다음 단계가 열립니다.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {releasedQuizModes.map((mode) => {
                const progress = getModeProgress(progressMap, mode.id);
                const completed = progress.completedLevels.length;
                const modeLevels = getModeLevelCount(mode.id);
                return (
                  <button
                    className="flex flex-col gap-3 rounded-lg border border-gold/20 bg-white/40 p-5 text-left shadow-sm transition hover:border-gold hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={!hydrated}
                    key={mode.id}
                    onClick={() => enterMode(mode.id)}
                  >
                    <span className="flex items-center justify-between gap-3 font-serif text-xl font-bold">
                      {mode.label}
                      <span className="rounded-full bg-cream-dark px-2.5 py-1 text-xs font-black text-brown-dark/70">
                        {completed}/{modeLevels}
                      </span>
                    </span>
                    <span className="block text-sm leading-6 text-brown-dark/65">{mode.description}</span>
                    <StageProgressGraph progress={progress} levelCount={modeLevels} compact />
                  </button>
                );
              })}
              <button
                className="flex flex-col gap-3 rounded-lg border border-red-400/40 bg-red-50/60 p-5 text-left shadow-sm transition hover:border-red-400 hover:bg-red-50"
                disabled={!hydrated}
                onClick={() => setShowChallenge(true)}
              >
                <span className="flex items-center justify-between gap-3 font-serif text-xl font-bold">
                  챌린지 모드
                  <span className="rounded-full bg-red-500 px-2.5 py-1 text-xs font-black text-white">
                    {CHALLENGE_TIME_SECONDS}초
                  </span>
                </span>
                <span className="block text-sm leading-6 text-brown-dark/65">
                  전 모드 랜덤 {CHALLENGE_MAX_QUESTIONS}문제를 {CHALLENGE_TIME_SECONDS}초 안에! 한 문제라도 틀리면
                  종료됩니다.
                </span>
                <span className="mt-auto text-xs font-bold text-red-500">
                  {myNickname ? "도전 시작 →" : "Leader Board 등록 필요"}
                </span>
              </button>
              <button
                className="flex flex-col gap-3 rounded-lg border border-gold/40 bg-gold/10 p-5 text-left shadow-sm transition hover:border-gold hover:bg-gold/20"
                onClick={() => setShowLeaderboard(true)}
              >
                <span className="flex items-center justify-between gap-3 font-serif text-xl font-bold">
                  Leader Board
                  <span className="rounded-full bg-gold px-2.5 py-1 text-xs font-black text-white">순위</span>
                </span>
                <span className="block text-sm leading-6 text-brown-dark/65">
                  누적 점수로 다른 사람들과 실시간 순위를 겨뤄보세요. 등록은 선택입니다.
                </span>
                <span className="mt-auto text-xs font-bold text-gold">
                  {isSupabaseConfigured ? "실시간 랭킹 보기 →" : "설정 필요"}
                </span>
              </button>
            </div>
          </section>
        )}

        {session.screen === "MODE_HOME" && (
          <CenteredPanel>
            <p className="text-sm font-bold text-gold">{getModeLabel(session.mode)}</p>
            <h2 className="font-serif text-4xl font-extrabold">
              {modeCompletedAll ? "모든 단계를 완료했습니다" : `${startLevel}단계부터 진행`}
            </h2>
            <p className="text-brown-dark/75">현재까지 {modeCompleted}/{levelCount}단계 완료</p>
            <StageProgressGraph progress={modeProgress} levelCount={levelCount} />
            <div className="flex flex-wrap justify-center gap-3 pt-1">
              <button className="primary-button" disabled={!hydrated} onClick={() => beginLevel(startLevel)}>
                {modeCompletedAll ? "1단계부터 다시 도전" : `${startLevel}단계 시작`}
              </button>
              <button className="secondary-button" onClick={() => setConfirmRestart(true)}>
                처음부터 시작
              </button>
            </div>
          </CenteredPanel>
        )}

        {session.screen === "QUESTION" && currentQuestion && (
          <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-5 py-8">
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <Status label="단계" value={`${session.level}/${levelCount}`} />
              <Status label="문제" value={`${session.currentIndex + 1}/${QUESTIONS_PER_RUN}`} />
              <Status label="점수" value={`${session.score}점`} />
            </div>
            <Status label="모드" value={getModeLabel(session.mode)} />
            <ProgressBar
              percent={Math.round(((session.currentIndex + 1) / QUESTIONS_PER_RUN) * 100)}
              label={`${session.currentIndex + 1}번째 문제`}
            />
            <div className="rounded-lg border border-gold/30 bg-white/70 p-5 shadow-sm sm:p-7">
              {(session.mode === "memory_verse" || session.mode === "fill_blank") && (
                <p className="mb-3 text-sm font-bold text-gold">{currentQuestion?.category ?? "성경말씀"}</p>
              )}
              {currentQuestion.type === "image_quiz" && <ImagePrompt question={currentQuestion} />}
              <h2 className="font-serif text-2xl font-bold leading-relaxed sm:text-3xl">{currentQuestion.question}</h2>
            </div>
            <QuestionAnswerControls question={currentQuestion} onAnswer={answerQuestion} />
          </section>
        )}

        {session.screen === "FEEDBACK" && session.feedback && (
          <div
            className={`fixed inset-0 z-20 grid place-items-center px-6 ${
              session.feedback.correct ? "bg-emerald-700" : "bg-red-700"
            }`}
          >
            <div className="max-w-2xl text-center text-white">
              {session.feedback.verse ? (
                <>
                  <div className="text-[5rem] font-black leading-none sm:text-[7rem]">X</div>
                  <p className="text-lg font-bold">[{session.feedback.reference}]</p>
                  <p className="mt-4 text-left text-lg leading-loose sm:text-xl">
                    {session.feedback.verse.segments.map((segment, index) => (
                      <span key={`reveal-${index}`}>
                        {segment}
                        {session.feedback?.verse && index < session.feedback.verse.blanks.length && (
                          <strong className="mx-1 text-2xl font-black text-yellow-200 sm:text-3xl">
                            {session.feedback.verse.blanks[index]}
                          </strong>
                        )}
                      </span>
                    ))}
                  </p>
                </>
              ) : (
                <>
                  <div className="text-[8rem] font-black leading-none sm:text-[12rem]">
                    {session.feedback.correct ? "O" : "X"}
                  </div>
                  <p className="text-2xl font-bold">
                    {session.feedback.correct ? "정답입니다" : `정답: ${session.feedback.answer}`}
                  </p>
                  <p className="mt-3 text-lg font-bold text-white">[{session.feedback.reference}]</p>
                  <p className="mt-3 text-base text-white/85">{session.feedback.explanation}</p>
                </>
              )}
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
                : failedEarly
                  ? `${MAX_WRONG_ANSWERS}문제를 틀려 단계에 실패했습니다. 같은 단계를 다시 도전하시겠습니까?`
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
              {session.level === levelCount ? "모든 단계를 완료했습니다" : `${session.level}단계 완료`}
            </h2>
            <p className="text-brown-dark/75">
              {session.level === levelCount
                ? "구약과 신약을 아우르는 전체 여정을 마쳤습니다."
                : `${session.level + 1}단계에서 더 깊은 성경 지식을 확인해 보세요.`}
            </p>
            <button className="primary-button" onClick={nextLevel}>
              {session.level === levelCount ? "모드 홈으로" : "다음 단계"}
            </button>
          </CenteredPanel>
        )}

        {confirmRestart && (
          <div className="fixed inset-0 z-30 grid place-items-center bg-black/50 px-6">
            <div className="w-full max-w-sm space-y-5 rounded-lg border border-gold/30 bg-cream p-7 text-center shadow-lg">
              <h3 className="font-serif text-2xl font-extrabold">처음부터 시작할까요?</h3>
              <p className="text-brown-dark/75">
                {getModeLabel(session.mode)}의 모든 단계 진행 기록이 초기화됩니다.
              </p>
              <div className="flex justify-center gap-3">
                <button className="primary-button" onClick={restartMode}>
                  예, 초기화
                </button>
                <button className="secondary-button" onClick={() => setConfirmRestart(false)}>
                  아니요
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function getModeLabel(mode: QuizMode) {
  return releasedQuizModes.find((item) => item.id === mode)?.label ?? "Quiz";
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

function StageProgressGraph({
  progress,
  levelCount = TOTAL_LEVELS,
  compact = false,
}: {
  progress: GameProgress;
  levelCount?: number;
  compact?: boolean;
}) {
  const completed = progress.completedLevels.length;
  const label = `단계 진행 ${completed}/${levelCount}`;

  return (
    <div className="w-full space-y-1.5">
      {!compact && <p className="text-xs font-bold uppercase text-brown-dark/55">{label}</p>}
      <div aria-label={label} className="flex gap-1" role="img">
        {Array.from({ length: levelCount }, (_, index) => {
          const level = index + 1;
          const done = progress.completedLevels.includes(level);
          const current = !done && completed < levelCount && level === progress.currentLevel;
          return (
            <span
              className={`h-2.5 flex-1 rounded-full ${done ? "bg-gold" : current ? "bg-gold/40" : "bg-cream-dark"}`}
              key={level}
              title={`${level}단계${done ? " 완료" : current ? " 진행 예정" : ""}`}
            />
          );
        })}
      </div>
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
