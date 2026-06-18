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

  it("uses who for person clue questions and what for non-person clue questions", () => {
    expect(questionBank.find((question) => question.id === "L1-01-1")?.question).toContain("누구입니까?");
    expect(questionBank.find((question) => question.id === "L1-03-1")?.question).toContain("무엇입니까?");
    expect(questionBank.find((question) => question.id === "L5-04-1")?.question).toContain("무엇입니까?");
    expect(questionBank.find((question) => question.id === "L5-10-1")?.question).toContain("무엇입니까?");
  });

  it("uses the correct topic and particle for second variant questions", () => {
    expect(questionBank.find((question) => question.id === "L3-06-2")?.question).toContain("솔로몬의 지혜와");
    expect(questionBank.find((question) => question.id === "L5-05-2")?.question).toContain("탕자의 비유와");
    expect(questionBank.find((question) => question.id === "L5-07-2")?.question).toContain("나사로와");
    expect(questionBank.find((question) => question.id === "L6-06-2")?.question).toContain("빌립과 에디오피아 내시와");
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
