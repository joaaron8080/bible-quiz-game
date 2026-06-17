export type Question = {
  id: string;
  level: number;
  question: string;
  options: [string, string, string, string];
  answer: number;
  explanation: string;
  reference: string;
};

export type GameProgress = {
  highestLevel: number;
  currentLevel: number;
  completedLevels: number[];
};

export const TOTAL_LEVELS = 10;
export const QUESTIONS_PER_RUN = 10;
export const PASSING_SCORE = 7;
export const STORAGE_KEY = "bible-quiz-progress-v1";

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
) {
  const pool = questions.filter((question) => question.level === level);
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
  const indexed = question.options.map((option, index) => ({ option, index }));
  const shuffled = shuffleQuestions(indexed, random);
  return {
    ...question,
    options: shuffled.map((item) => item.option) as [string, string, string, string],
    answer: shuffled.findIndex((item) => item.index === question.answer),
  };
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

export function loadProgress(storage?: Storage): GameProgress {
  if (!storage) return defaultProgress;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return raw ? normalizeProgress(JSON.parse(raw)) : defaultProgress;
  } catch {
    return defaultProgress;
  }
}

export function saveProgress(progress: GameProgress, storage?: Storage) {
  if (!storage) return;
  storage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function resetProgress(storage?: Storage) {
  storage?.removeItem(STORAGE_KEY);
  return defaultProgress;
}

function clampLevel(level: number, min: number) {
  return Math.min(TOTAL_LEVELS, Math.max(min, level));
}
