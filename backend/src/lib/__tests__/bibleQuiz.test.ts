import {
  PASSING_SCORE,
  completeLevel,
  defaultProgress,
  isLevelPassed,
  loadProgress,
  pickRandomQuestions,
  saveProgress,
} from "../bibleQuiz";
import { questionBank } from "../questionBank";

describe("bible quiz logic", () => {
  it("passes at 7 answers and fails at 6", () => {
    expect(isLevelPassed(PASSING_SCORE - 1)).toBe(false);
    expect(isLevelPassed(PASSING_SCORE)).toBe(true);
  });

  it("picks 10 unique questions from a 30-question level pool", () => {
    const selected = pickRandomQuestions(questionBank, 1, 10, () => 0.42);
    const ids = new Set(selected.map((question) => question.id));

    expect(selected).toHaveLength(10);
    expect(ids.size).toBe(10);
    expect(selected.every((question) => question.level === 1)).toBe(true);
  });

  it("avoids repeating variants from the same fact in one run", () => {
    const selected = pickRandomQuestions(questionBank, 1, 10, () => 0.42);
    const factIds = new Set(selected.map((question) => question.id.replace(/-\d+$/, "")));

    expect(factIds.size).toBe(selected.length);
  });

  it("saves completed level progress", () => {
    const progress = completeLevel(defaultProgress, 1);

    expect(progress.highestLevel).toBe(1);
    expect(progress.currentLevel).toBe(2);
    expect(progress.completedLevels).toEqual([1]);
  });

  it("loads saved progress from localStorage", () => {
    const storage = window.localStorage;
    storage.clear();

    const progress = completeLevel(defaultProgress, 3);
    saveProgress(progress, storage);

    expect(loadProgress(storage)).toEqual({
      highestLevel: 3,
      currentLevel: 4,
      completedLevels: [3],
    });
  });
});
