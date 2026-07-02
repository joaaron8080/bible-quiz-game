"use client";

import { useEffect, useState } from "react";
import type { Question, SubmittedAnswer } from "@/lib/bibleQuiz";

export function QuestionAnswerControls({
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

  if (question.type === "memory_verse") {
    return <MemoryVerseAnswer question={question} onAnswer={onAnswer} />;
  }

  return (
    <div className="rounded-lg border border-gold/25 bg-white/70 p-5 text-center text-sm font-bold text-brown-dark/65">
      이 모드는 다음 릴리스에서 플레이할 수 있습니다.
    </div>
  );
}

function MemoryVerseAnswer({
  question,
  onAnswer,
}: {
  question: Extract<Question, { type: "memory_verse" }>;
  onAnswer: (answer: SubmittedAnswer) => void;
}) {
  const blankCount = question.payload.segments.length - 1;
  const [values, setValues] = useState<string[]>(() => Array(blankCount).fill(""));

  useEffect(() => {
    setValues(Array(blankCount).fill(""));
  }, [question.id, blankCount]);

  function updateValue(index: number, value: string) {
    setValues((current) => current.map((item, position) => (position === index ? value : item)));
  }

  const allFilled = values.length === blankCount && values.every((value) => value.trim().length > 0);

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!allFilled) return;
        onAnswer(values);
      }}
    >
      <div className="rounded-lg border border-gold/25 bg-white/75 p-5 text-lg leading-loose shadow-sm sm:text-xl">
        {question.payload.segments.map((segment, index) => (
          <span key={`${question.id}-segment-${index}`}>
            {segment}
            {index < blankCount && (
              <input
                aria-label={`빈칸 ${index + 1}`}
                className="mx-1 inline-block min-w-24 rounded-md border-b-2 border-gold bg-cream-dark/40 px-2 py-1 text-center text-base font-bold outline-none transition focus:bg-cream-dark sm:text-lg"
                onChange={(event) => updateValue(index, event.target.value)}
                placeholder={`${index + 1}`}
                value={values[index] ?? ""}
              />
            )}
          </span>
        ))}
      </div>
      <p className="text-sm font-bold text-brown-dark/60">괄호 {blankCount}개를 순서대로 채우세요. 띄어쓰기는 채점하지 않습니다.</p>
      <button className="primary-button w-full" disabled={!allFilled} type="submit">
        제출
      </button>
    </form>
  );
}

export function ImagePrompt({ question }: { question: Extract<Question, { type: "image_quiz" }> }) {
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
  return (
    <div className="grid gap-3">
      {question.payload.choices?.map((option, index) => (
        <button className="answer-button" key={`${question.id}-${option}`} onClick={() => onAnswer(index)} type="button">
          <span>{String.fromCharCode(65 + index)}</span>
          {option}
        </button>
      ))}
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

  const PAIR_COLORS = [
    "border-blue-400/60 bg-blue-50",
    "border-purple-400/60 bg-purple-50",
    "border-orange-400/60 bg-orange-50",
    "border-pink-400/60 bg-pink-50",
    "border-teal-400/60 bg-teal-50",
  ];

  const completedCount = Object.keys(matches).length;
  const canSubmit = completedCount === leftItems.length;

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-2">
          <p className="text-sm font-black uppercase text-brown-dark/55">Left</p>
          {leftItems.map((left, index) => {
            const selected = selectedLeft === left;
            const pairedRight = matches[left];
            const pairColor = PAIR_COLORS[index % PAIR_COLORS.length];
            return (
              <button
                aria-pressed={selected}
                className={`min-h-16 rounded-lg border px-4 py-3 text-left font-bold shadow-sm transition ${
                  selected
                    ? "border-gold bg-gold text-white"
                    : pairedRight
                      ? `${pairColor} text-brown-dark`
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
            const pairIndex = pairedLeft ? leftItems.indexOf(pairedLeft) : -1;
            const pairColor = pairIndex >= 0 ? PAIR_COLORS[pairIndex % PAIR_COLORS.length] : "";
            return (
              <button
                aria-pressed={selected}
                className={`min-h-16 rounded-lg border px-4 py-3 text-left font-bold shadow-sm transition ${
                  selected
                    ? "border-gold bg-gold text-white"
                    : pairedLeft
                      ? `${pairColor} text-brown-dark`
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
                <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" width="20"><line x1="12" x2="12" y1="19" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
              </button>
              <button
                aria-label={`Move ${item} down`}
                className="grid h-11 w-11 place-items-center rounded-md border border-gold/30 bg-white text-lg font-black text-brown-dark transition hover:bg-cream-dark disabled:cursor-not-allowed disabled:opacity-35"
                disabled={index === items.length - 1}
                onClick={() => moveItem(index, 1)}
                type="button"
              >
                <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" width="20"><line x1="12" x2="12" y1="5" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
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
