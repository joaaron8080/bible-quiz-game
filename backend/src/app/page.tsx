"use client";

import { useEffect, useState } from "react";
import {
  GameProgress,
  ModeProgressMap,
  QUESTIONS_PER_RUN,
  TOTAL_LEVELS,
  completeLevel,
  getModeProgress,
  levelMeta,
  loadProgressMap,
  releasedQuizModes,
  resetModeProgress,
  saveProgressMap,
  setModeProgress,
  type Question,
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
import { sounds } from "@/lib/sounds";

export default function Home() {
  const [session, setSession] = useState(defaultSession);
  const [progressMap, setProgressMap] = useState<ModeProgressMap>({});
  const [hydrated, setHydrated] = useState(false);

  const meta = levelMeta[session.level - 1];
  const currentQuestion = getCurrentQuestion(session);
  const passed = isSessionPassed(session);
  const modeProgress = getModeProgress(progressMap, session.mode);
  const modeCompleted = modeProgress.completedLevels.length;
  const modeCompletedAll = modeCompleted === TOTAL_LEVELS;
  const startLevel = modeCompletedAll ? 1 : modeProgress.currentLevel;

  useEffect(() => {
    setProgressMap(loadProgressMap(window.localStorage));
    setHydrated(true);
  }, []);

  function enterMode(mode: QuizMode) {
    setSession(selectMode(mode, getModeProgress(progressMap, mode).currentLevel));
  }

  function beginLevel(level: number) {
    setSession(startLevelSession(level, questionBank, Math.random, session.mode));
  }

  function restartMode() {
    const next = resetModeProgress(progressMap, session.mode);
    setProgressMap(next);
    saveProgressMap(next, window.localStorage);
    setSession(startLevelSession(1, questionBank, Math.random, session.mode));
  }

  function answerQuestion(answer: SubmittedAnswer) {
    const result = answerCurrentQuestion(session, answer);
    setSession(result.session);

    if (result.correct) {
      sounds.correct();
    } else {
      sounds.wrong();
    }
  }

  function skipFeedback() {
    sounds.skipClick();
    setSession(continueAfterFeedback(session));
  }

  function resolveLevelResult() {
    if (!passed) {
      beginLevel(session.level);
      return;
    }

    const next = setModeProgress(progressMap, session.mode, completeLevel(modeProgress, session.level));
    setProgressMap(next);
    saveProgressMap(next, window.localStorage);

    sounds.levelup();
    setSession(showCelebration(session));
  }

  function nextLevel() {
    if (session.level >= TOTAL_LEVELS) {
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
                {getModeLabel(session.mode)} 완료 {modeCompleted}/{TOTAL_LEVELS}
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

        {session.screen === "MODE_SELECT" && (
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
                        {completed}/{TOTAL_LEVELS}
                      </span>
                    </span>
                    <span className="block text-sm leading-6 text-brown-dark/65">{mode.description}</span>
                    <StageProgressGraph progress={progress} compact />
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {session.screen === "MODE_HOME" && (
          <CenteredPanel>
            <p className="text-sm font-bold text-gold">{getModeLabel(session.mode)}</p>
            <h2 className="font-serif text-4xl font-extrabold">
              {modeCompletedAll ? "모든 단계를 완료했습니다" : `${startLevel}단계부터 진행`}
            </h2>
            <p className="text-brown-dark/75">현재까지 {modeCompleted}/{TOTAL_LEVELS}단계 완료</p>
            <StageProgressGraph progress={modeProgress} />
            <div className="flex flex-wrap justify-center gap-3 pt-1">
              <button className="primary-button" disabled={!hydrated} onClick={() => beginLevel(startLevel)}>
                {modeCompletedAll ? "1단계부터 다시 도전" : `${startLevel}단계 시작`}
              </button>
              <button className="secondary-button" onClick={restartMode}>
                처음부터 시작
              </button>
            </div>
          </CenteredPanel>
        )}

        {session.screen === "QUESTION" && currentQuestion && (
          <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-5 py-8">
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <Status label="단계" value={`${session.level}/${TOTAL_LEVELS}`} />
              <Status label="문제" value={`${session.currentIndex + 1}/${QUESTIONS_PER_RUN}`} />
              <Status label="점수" value={`${session.score}점`} />
            </div>
            <Status label="모드" value={getModeLabel(session.mode)} />
            <ProgressBar
              percent={Math.round(((session.currentIndex + 1) / QUESTIONS_PER_RUN) * 100)}
              label={`${session.currentIndex + 1}번째 문제`}
            />
            <div className="rounded-lg border border-gold/30 bg-white/70 p-5 shadow-sm sm:p-7">
              <p className="mb-3 text-sm font-bold text-gold">{meta.title}</p>
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
              {session.level === TOTAL_LEVELS ? "모드 홈으로" : "다음 단계"}
            </button>
          </CenteredPanel>
        )}
      </div>
    </main>
  );
}

function QuestionAnswerControls({
  question,
  onAnswer,
}: {
  question: Question;
  onAnswer: (answer: SubmittedAnswer) => void;
}) {
  if (question.type === "multiple_choice") {
    return (
      <div className="grid gap-3">
        {question.payload.choices.map((option, index) => (
          <button className="answer-button" key={`${question.id}-${option}`} onClick={() => onAnswer(index)}>
            <span>{String.fromCharCode(65 + index)}</span>
            {option}
          </button>
        ))}
      </div>
    );
  }

  if (question.type === "true_false") {
    return (
      <div className="grid grid-cols-2 gap-3">
        <button className="answer-button justify-center text-center" onClick={() => onAnswer(true)}>
          <span>O</span>
          맞음
        </button>
        <button className="answer-button justify-center text-center" onClick={() => onAnswer(false)}>
          <span>X</span>
          틀림
        </button>
      </div>
    );
  }

  if (question.type === "fill_blank") {
    return <FillBlankAnswer onAnswer={onAnswer} />;
  }

  if (question.type === "ordering") {
    return <OrderingAnswer question={question} onAnswer={onAnswer} />;
  }

  if (question.type === "matching") {
    return <MatchingAnswer question={question} onAnswer={onAnswer} />;
  }

  if (question.type === "image_quiz") {
    return <ImageQuizAnswer question={question} onAnswer={onAnswer} />;
  }

  return (
    <div className="rounded-lg border border-gold/25 bg-white/70 p-5 text-center text-sm font-bold text-brown-dark/65">
      이 모드는 다음 릴리스에서 플레이할 수 있습니다.
    </div>
  );
}

function ImagePrompt({ question }: { question: Extract<Question, { type: "image_quiz" }> }) {
  const [hasImageError, setHasImageError] = useState(false);

  useEffect(() => {
    setHasImageError(false);
  }, [question.id, question.payload.imageUrl]);

  if (hasImageError) {
    return (
      <div
        className="mb-5 grid min-h-56 place-items-center rounded-lg border border-dashed border-gold/45 bg-cream-dark/70 px-5 text-center"
        role="img"
        aria-label={question.payload.imageAlt}
      >
        <div>
          <p className="font-serif text-xl font-bold">Image clue unavailable</p>
          <p className="mt-2 text-sm font-bold text-brown-dark/65">{question.payload.imageAlt}</p>
        </div>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={question.payload.imageAlt}
      className="mb-5 aspect-video w-full rounded-lg border border-gold/25 bg-cream-dark object-cover shadow-sm"
      onError={() => setHasImageError(true)}
      src={question.payload.imageUrl}
    />
  );
}

function ImageQuizAnswer({
  question,
  onAnswer,
}: {
  question: Extract<Question, { type: "image_quiz" }>;
  onAnswer: (answer: SubmittedAnswer) => void;
}) {
  const [value, setValue] = useState("");

  useEffect(() => {
    setValue("");
  }, [question.id]);

  return (
    <div className="grid gap-4">
      {question.payload.choices && (
        <div className="grid gap-3">
          {question.payload.choices.map((option, index) => (
            <button className="answer-button" key={`${question.id}-${option}`} onClick={() => onAnswer(index)} type="button">
              <span>{String.fromCharCode(65 + index)}</span>
              {option}
            </button>
          ))}
        </div>
      )}
      <form
        className="grid gap-3 rounded-lg border border-gold/20 bg-white/55 p-4"
        onSubmit={(event) => {
          event.preventDefault();
          onAnswer(value);
        }}
      >
        <label className="text-sm font-black uppercase text-brown-dark/55" htmlFor={`image-answer-${question.id}`}>
          Type answer
        </label>
        <input
          className="min-h-14 rounded-lg border border-gold/25 bg-white/80 px-4 text-lg font-bold outline-none transition focus:border-gold"
          id={`image-answer-${question.id}`}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Enter the Bible story answer"
          value={value}
        />
        <button className="primary-button w-full" disabled={!value.trim()} type="submit">
          Submit typed answer
        </button>
      </form>
    </div>
  );
}

function MatchingAnswer({
  question,
  onAnswer,
}: {
  question: Extract<Question, { type: "matching" }>;
  onAnswer: (answer: SubmittedAnswer) => void;
}) {
  const leftItems = question.payload.pairs.map((pair) => pair.left);
  const rightItems = question.payload.pairs.map((pair) => pair.right);
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);

  useEffect(() => {
    setMatches({});
    setSelectedLeft(null);
    setSelectedRight(null);
  }, [question.id]);

  function pairItems(left: string, right: string) {
    setMatches((current) => {
      const next = Object.fromEntries(
        Object.entries(current).filter(([existingLeft, existingRight]) => existingLeft !== left && existingRight !== right),
      );
      next[left] = right;
      return next;
    });
    setSelectedLeft(null);
    setSelectedRight(null);
  }

  function chooseLeft(left: string) {
    if (selectedRight) {
      pairItems(left, selectedRight);
      return;
    }

    setSelectedLeft((current) => (current === left ? null : left));
  }

  function chooseRight(right: string) {
    if (selectedLeft) {
      pairItems(selectedLeft, right);
      return;
    }

    setSelectedRight((current) => (current === right ? null : right));
  }

  function getRightOwner(right: string) {
    return Object.entries(matches).find(([, matchedRight]) => matchedRight === right)?.[0];
  }

  const completedCount = Object.keys(matches).length;
  const canSubmit = completedCount === leftItems.length;

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-2">
          <p className="text-sm font-black uppercase text-brown-dark/55">Left</p>
          {leftItems.map((left) => {
            const selected = selectedLeft === left;
            const pairedRight = matches[left];
            return (
              <button
                aria-pressed={selected}
                className={`min-h-16 rounded-lg border px-4 py-3 text-left font-bold shadow-sm transition ${
                  selected
                    ? "border-gold bg-gold text-white"
                    : pairedRight
                      ? "border-emerald-700/35 bg-emerald-50 text-brown-dark"
                      : "border-gold/25 bg-white/75 hover:border-gold hover:bg-white"
                }`}
                key={`${question.id}-left-${left}`}
                onClick={() => chooseLeft(left)}
                type="button"
              >
                <span className="block text-base leading-6">{left}</span>
                {pairedRight && <span className="mt-1 block text-xs font-bold opacity-75">Paired with {pairedRight}</span>}
              </button>
            );
          })}
        </div>
        <div className="grid gap-2">
          <p className="text-sm font-black uppercase text-brown-dark/55">Right</p>
          {rightItems.map((right) => {
            const selected = selectedRight === right;
            const pairedLeft = getRightOwner(right);
            return (
              <button
                aria-pressed={selected}
                className={`min-h-16 rounded-lg border px-4 py-3 text-left font-bold shadow-sm transition ${
                  selected
                    ? "border-gold bg-gold text-white"
                    : pairedLeft
                      ? "border-emerald-700/35 bg-emerald-50 text-brown-dark"
                      : "border-gold/25 bg-white/75 hover:border-gold hover:bg-white"
                }`}
                key={`${question.id}-right-${right}`}
                onClick={() => chooseRight(right)}
                type="button"
              >
                <span className="block text-base leading-6">{right}</span>
                {pairedLeft && <span className="mt-1 block text-xs font-bold opacity-75">Paired with {pairedLeft}</span>}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-bold text-brown-dark/65">
          {completedCount}/{leftItems.length} pairs connected
        </p>
        <button
          className="secondary-button"
          disabled={completedCount === 0}
          onClick={() => {
            setMatches({});
            setSelectedLeft(null);
            setSelectedRight(null);
          }}
          type="button"
        >
          Clear
        </button>
      </div>
      <button
        className="primary-button w-full"
        disabled={!canSubmit}
        onClick={() => onAnswer(Object.entries(matches).map(([left, right]) => ({ left, right })))}
        type="button"
      >
        Submit
      </button>
    </div>
  );
}

function OrderingAnswer({
  question,
  onAnswer,
}: {
  question: Extract<Question, { type: "ordering" }>;
  onAnswer: (answer: SubmittedAnswer) => void;
}) {
  const [items, setItems] = useState(question.payload.items);

  useEffect(() => {
    setItems(question.payload.items);
  }, [question.id, question.payload.items]);

  function moveItem(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= items.length) return;

    setItems((current) => {
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  }

  return (
    <div className="grid gap-4">
      <ol className="grid gap-3">
        {items.map((item, index) => (
          <li
            className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg border border-gold/25 bg-white/75 px-3 py-3 shadow-sm sm:px-4"
            key={`${question.id}-${item}`}
          >
            <span className="grid h-9 w-9 place-items-center rounded-full bg-cream-dark text-sm font-black text-gold">
              {index + 1}
            </span>
            <span className="text-base font-bold leading-6 sm:text-lg">{item}</span>
            <span className="flex gap-2">
              <button
                aria-label={`Move ${item} up`}
                className="grid h-11 w-11 place-items-center rounded-md border border-gold/30 bg-white text-lg font-black text-brown-dark transition hover:bg-cream-dark disabled:cursor-not-allowed disabled:opacity-35"
                disabled={index === 0}
                onClick={() => moveItem(index, -1)}
                type="button"
              >
                U
              </button>
              <button
                aria-label={`Move ${item} down`}
                className="grid h-11 w-11 place-items-center rounded-md border border-gold/30 bg-white text-lg font-black text-brown-dark transition hover:bg-cream-dark disabled:cursor-not-allowed disabled:opacity-35"
                disabled={index === items.length - 1}
                onClick={() => moveItem(index, 1)}
                type="button"
              >
                D
              </button>
            </span>
          </li>
        ))}
      </ol>
      <button className="primary-button w-full" onClick={() => onAnswer(items)} type="button">
        제출
      </button>
    </div>
  );
}

function FillBlankAnswer({ onAnswer }: { onAnswer: (answer: SubmittedAnswer) => void }) {
  const [value, setValue] = useState("");

  return (
    <form
      className="grid gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        onAnswer(value);
        setValue("");
      }}
    >
      <input
        className="min-h-14 rounded-lg border border-gold/25 bg-white/80 px-4 text-lg font-bold outline-none transition focus:border-gold"
        onChange={(event) => setValue(event.target.value)}
        placeholder="정답 입력"
        value={value}
      />
      <button className="primary-button w-full" disabled={!value.trim()} type="submit">
        제출
      </button>
    </form>
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

function StageProgressGraph({ progress, compact = false }: { progress: GameProgress; compact?: boolean }) {
  const completed = progress.completedLevels.length;
  const label = `단계 진행 ${completed}/${TOTAL_LEVELS}`;

  return (
    <div className="w-full space-y-1.5">
      {!compact && <p className="text-xs font-bold uppercase text-brown-dark/55">{label}</p>}
      <div aria-label={label} className="flex gap-1" role="img">
        {Array.from({ length: TOTAL_LEVELS }, (_, index) => {
          const level = index + 1;
          const done = progress.completedLevels.includes(level);
          const current = !done && completed < TOTAL_LEVELS && level === progress.currentLevel;
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
