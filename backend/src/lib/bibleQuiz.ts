export const questionTypes = ["multiple_choice", "true_false", "fill_blank", "ordering", "matching", "image_quiz"] as const;

export type QuestionType = (typeof questionTypes)[number];

export type QuizMode = QuestionType | "boss_battle";

export type Difficulty = "easy" | "medium" | "hard" | "expert";

type QuestionBase = {
  id: string;
  level: number;
  type: QuestionType;
  category: string;
  difficulty: Difficulty;
  question: string;
  explanation: string;
  reference: string;
};

export type QuestionPayloadByType = {
  multiple_choice: {
    choices: [string, string, string, string];
  };
  true_false: Record<string, never>;
  fill_blank: {
    blankLabel?: string;
  };
  ordering: {
    items: string[];
  };
  matching: {
    pairs: Array<{ left: string; right: string }>;
  };
  image_quiz: {
    imageUrl: string;
    imageAlt: string;
    choices?: [string, string, string, string];
  };
};

export type QuestionAnswerByType = {
  multiple_choice: {
    index: number;
  };
  true_false: {
    value: boolean;
  };
  fill_blank: {
    text: string;
    accepted?: string[];
  };
  ordering: {
    order: string[];
  };
  matching: {
    pairs: Array<{ left: string; right: string }>;
  };
  image_quiz: {
    index?: number;
    text?: string;
  };
};

export type Question<TType extends QuestionType = QuestionType> = TType extends QuestionType
  ? QuestionBase & {
      type: TType;
      payload: QuestionPayloadByType[TType];
      answer: QuestionAnswerByType[TType];
    }
  : never;

export type MultipleChoiceQuestion = Question<"multiple_choice">;
export type TrueFalseQuestion = Question<"true_false">;
export type FillBlankQuestion = Question<"fill_blank">;
export type OrderingQuestion = Question<"ordering">;
export type MatchingQuestion = Question<"matching">;
export type ImageQuizQuestion = Question<"image_quiz">;

export type SubmittedAnswer =
  | number
  | boolean
  | string
  | string[]
  | Record<string, string>
  | Array<{ left: string; right: string }>;

export type GameProgress = {
  highestLevel: number;
  currentLevel: number;
  completedLevels: number[];
};

export const TOTAL_LEVELS = 10;
export const QUESTIONS_PER_RUN = 10;
export const PASSING_SCORE = 7;
export const STORAGE_KEY = "bible-quiz-progress-v2";
export const DEFAULT_QUIZ_MODE: QuizMode = "multiple_choice";

export const releasedQuizModes: Array<{ id: QuizMode; label: string; description: string }> = [
  {
    id: "multiple_choice",
    label: "Multiple Choice",
    description: "4지선다 10문제를 풀고 단계별 진행도를 올립니다.",
  },
  {
    id: "true_false",
    label: "OX Quiz",
    description: "문장이 맞는지 빠르게 판단합니다.",
  },
  {
    id: "fill_blank",
    label: "Fill Blank",
    description: "핵심 답을 직접 입력하며 암송 감각을 익힙니다.",
  },
  {
    id: "ordering",
    label: "Ordering Quiz",
    description: "성경에 나오는 사건들을 올바른 순서대로 배열하세요.",
  },
  {
    id: "matching",
    label: "Matching Quiz",
    description: "성경에 등장하는 인물과 사건을 올바른 쌍으로 연결하세요.",
  },
  {
    id: "image_quiz",
    label: "Image Quiz",
    description: "그림 단서를 보고 관련 성경 이야기의 정답을 맞혀보세요.",
  },
];

export const progressQuizModes: QuizMode[] = releasedQuizModes.map((mode) => mode.id);

export const plannedQuizModes: Array<{ id: QuizMode; label: string; description: string }> = [
  {
    id: "ordering",
    label: "Ordering Quiz",
    description: "성경 사건의 흐름을 순서대로 맞춥니다.",
  },
  {
    id: "matching",
    label: "Matching Quiz",
    description: "인물과 사건을 서로 연결합니다.",
  },
  {
    id: "image_quiz",
    label: "Image Quiz",
    description: "이미지를 보고 성경 이야기를 맞춥니다.",
  },
  {
    id: "boss_battle",
    label: "Boss Battle",
    description: "연속 문제와 생명력 규칙을 결합한 도전 모드입니다.",
  },
];

export const levelMeta = [
  { level: 1, title: "창세기와 족장", scope: "구약 유명 사건", difficulty: "쉬움" },
  { level: 2, title: "출애굽과 광야", scope: "구약 유명 사건", difficulty: "쉬움" },
  { level: 3, title: "다윗과 솔로몬", scope: "구약 유명 사건", difficulty: "쉬움" },
  { level: 4, title: "예수님의 생애", scope: "신약 유명 사건", difficulty: "중간" },
  { level: 5, title: "비유와 기적", scope: "신약 유명 사건", difficulty: "중간" },
  { level: 6, title: "사도행전", scope: "초대교회", difficulty: "중간" },
  { level: 7, title: "소선지서", scope: "구약 세부 내용", difficulty: "어려움" },
  { level: 8, title: "역사서", scope: "구약 세부 내용", difficulty: "어려움" },
  { level: 9, title: "서신서", scope: "신약 세부 내용", difficulty: "매우 어려움" },
  { level: 10, title: "요한계시록", scope: "종말과 새 창조", difficulty: "매우 어려움" },
] as const;

export const defaultProgress: GameProgress = {
  highestLevel: 0,
  currentLevel: 1,
  completedLevels: [],
};

export function isLevelPassed(score: number) {
  return score >= PASSING_SCORE;
}

export function shuffleQuestions<T>(items: T[], random = Math.random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function pickRandomQuestions(
  questions: Question[],
  level: number,
  count = QUESTIONS_PER_RUN,
  random = Math.random,
  mode: QuizMode = "multiple_choice",
) {
  const pool = questions.filter((question) => question.level === level && question.type === getQuestionTypeForMode(mode));
  const selectedIds = new Set<string>();
  const selected = shuffleQuestions(groupQuestionsByFact(pool), random)
    .flatMap((group) => shuffleQuestions(group, random).slice(0, 1))
    .slice(0, count);

  selected.forEach((question) => selectedIds.add(question.id));

  if (selected.length < count) {
    selected.push(
      ...shuffleQuestions(
        pool.filter((question) => !selectedIds.has(question.id)),
        random,
      ).slice(0, count - selected.length),
    );
  }

  return selected.map((question) => shuffleOptions(question, random));
}

export function shuffleOptions(question: Question, random = Math.random): Question {
  if (question.type === "multiple_choice") {
    const indexed = question.payload.choices.map((option, index) => ({ option, index }));
    const shuffled = shuffleQuestions(indexed, random);
    return {
      ...question,
      payload: {
        choices: shuffled.map((item) => item.option) as [string, string, string, string],
      },
      answer: {
        index: shuffled.findIndex((item) => item.index === question.answer.index),
      },
    };
  }

  if (question.type !== "image_quiz" || !question.payload.choices || question.answer.index === undefined) {
    return question;
  }

  const indexed = question.payload.choices.map((option, index) => ({ option, index }));
  const shuffled = shuffleQuestions(indexed, random);
  return {
    ...question,
    payload: {
      ...question.payload,
      choices: shuffled.map((item) => item.option) as [string, string, string, string],
    },
    answer: {
      ...question.answer,
      index: shuffled.findIndex((item) => item.index === question.answer.index),
    },
  };
}

export function evaluateAnswer(question: Question, submitted: SubmittedAnswer) {
  switch (question.type) {
    case "multiple_choice":
      return typeof submitted === "number" && submitted === question.answer.index;
    case "true_false":
      return typeof submitted === "boolean" && submitted === question.answer.value;
    case "fill_blank":
      if (typeof submitted !== "string") return false;
      return [question.answer.text, ...(question.answer.accepted ?? [])]
        .map(normalizeText)
        .includes(normalizeText(submitted));
    case "ordering":
      return Array.isArray(submitted) && submitted.every((item): item is string => typeof item === "string") && stringsEqual(submitted, question.answer.order);
    case "matching":
      return isMatchingAnswer(submitted) && matchingEqual(submitted, question.answer.pairs);
    case "image_quiz":
      if (typeof submitted === "number") {
        return question.answer.index !== undefined && submitted === question.answer.index;
      }
      return (
        typeof submitted === "string" &&
        [question.answer.text, getCorrectAnswerText(question)]
          .filter((answer): answer is string => Boolean(answer))
          .map(normalizeText)
          .includes(normalizeText(submitted))
      );
    default:
      return false;
  }
}

export function getCorrectAnswerText(question: Question) {
  switch (question.type) {
    case "multiple_choice":
      return question.payload.choices[question.answer.index];
    case "true_false":
      return question.answer.value ? "O" : "X";
    case "fill_blank":
      return question.answer.text;
    case "ordering":
      return question.answer.order.join(" > ");
    case "matching":
      return question.answer.pairs.map((pair) => `${pair.left}: ${pair.right}`).join(", ");
    case "image_quiz":
      if (question.answer.index !== undefined && question.payload.choices) {
        return question.payload.choices[question.answer.index];
      }
      return question.answer.text ?? "";
    default:
      return "";
  }
}

export function getQuestionTypeForMode(mode: QuizMode): QuestionType {
  return mode === "boss_battle" ? "multiple_choice" : mode;
}

function groupQuestionsByFact(questions: Question[]) {
  const groups = new Map<string, Question[]>();

  questions.forEach((question) => {
    const key = getQuestionFactId(question.id);
    const group = groups.get(key);
    if (group) {
      group.push(question);
    } else {
      groups.set(key, [question]);
    }
  });

  return Array.from(groups.values());
}

function getQuestionFactId(id: string) {
  return id.replace(/-\d+$/, "");
}

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

function stringsEqual(left: string[], right: string[]) {
  return left.length === right.length && left.every((item, index) => normalizeText(item) === normalizeText(right[index]));
}

function isMatchingAnswer(value: SubmittedAnswer): value is Record<string, string> | Array<{ left: string; right: string }> {
  if (Array.isArray(value)) {
    return value.every(
      (item) =>
        item &&
        typeof item === "object" &&
        "left" in item &&
        "right" in item &&
        typeof item.left === "string" &&
        typeof item.right === "string",
    );
  }

  return Boolean(
    value &&
      typeof value === "object" &&
      Object.entries(value).every(([left, right]) => typeof left === "string" && typeof right === "string"),
  );
}

function matchingEqual(submitted: Record<string, string> | Array<{ left: string; right: string }>, expected: Array<{ left: string; right: string }>) {
  const submittedPairs = Array.isArray(submitted)
    ? submitted
    : Object.entries(submitted).map(([left, right]) => ({ left, right }));
  const submittedMap = new Map(submittedPairs.map((pair) => [normalizeText(pair.left), normalizeText(pair.right)]));

  return (
    submittedPairs.length === expected.length &&
    expected.every((pair) => submittedMap.get(normalizeText(pair.left)) === normalizeText(pair.right))
  );
}

export function completeLevel(progress: GameProgress, level: number): GameProgress {
  const completedLevels = Array.from(new Set([...progress.completedLevels, level]))
    .filter((item) => item >= 1 && item <= TOTAL_LEVELS)
    .sort((a, b) => a - b);
  const highestLevel = Math.max(progress.highestLevel, level);

  return {
    completedLevels,
    highestLevel,
    currentLevel: Math.min(TOTAL_LEVELS, highestLevel + 1),
  };
}

export function normalizeProgress(value: unknown): GameProgress {
  if (!value || typeof value !== "object") return defaultProgress;
  const candidate = value as Partial<GameProgress>;
  const completedLevels = Array.isArray(candidate.completedLevels)
    ? Array.from(
        new Set(
          candidate.completedLevels
            .filter((level): level is number => Number.isInteger(level))
            .map((level) => clampLevel(level, 1)),
        ),
      ).sort((a, b) => a - b)
    : [];
  const inferredHighest = completedLevels.length ? Math.max(...completedLevels) : 0;
  const highestLevel = Math.max(clampLevel(candidate.highestLevel ?? inferredHighest, 0), inferredHighest);
  const currentLevel = clampLevel(candidate.currentLevel ?? Math.min(TOTAL_LEVELS, highestLevel + 1), 1);

  return {
    highestLevel,
    currentLevel,
    completedLevels,
  };
}

export type ModeProgressMap = Partial<Record<QuizMode, GameProgress>>;

export function normalizeProgressMap(value: unknown): ModeProgressMap {
  if (!value || typeof value !== "object") return {};
  const entries = Object.entries(value as Record<string, unknown>).filter(([mode]) =>
    progressQuizModes.includes(mode as QuizMode),
  );

  return Object.fromEntries(entries.map(([mode, progress]) => [mode, normalizeProgress(progress)]));
}

export function loadProgressMap(storage?: Storage): ModeProgressMap {
  if (!storage) return {};
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return raw ? normalizeProgressMap(JSON.parse(raw)) : {};
  } catch {
    return {};
  }
}

export function saveProgressMap(map: ModeProgressMap, storage?: Storage) {
  if (!storage) return;
  storage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function getModeProgress(map: ModeProgressMap, mode: QuizMode): GameProgress {
  return normalizeProgress(map[mode]);
}

export function setModeProgress(map: ModeProgressMap, mode: QuizMode, progress: GameProgress): ModeProgressMap {
  return { ...map, [mode]: progress };
}

export function resetModeProgress(map: ModeProgressMap, mode: QuizMode): ModeProgressMap {
  const next = { ...map };
  delete next[mode];
  return next;
}

function clampLevel(level: number, min: number) {
  return Math.min(TOTAL_LEVELS, Math.max(min, level));
}
