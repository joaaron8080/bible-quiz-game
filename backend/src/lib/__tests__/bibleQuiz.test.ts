import {
  PASSING_SCORE,
  completeLevel,
  defaultProgress,
  evaluateAnswer,
  isLevelPassed,
  loadProgress,
  pickRandomQuestions,
  questionTypes,
  saveProgress,
  type Question,
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
    expect(selected.every((question) => question.type === "multiple_choice")).toBe(true);
  });

  it("exposes the QuestionType vocabulary from the generic model", () => {
    expect(questionTypes).toEqual([
      "multiple_choice",
      "true_false",
      "fill_blank",
      "ordering",
      "matching",
      "image_quiz",
    ]);
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

  it("evaluates multiple choice, OX, and fill blank answers", () => {
    const multipleChoice = questionBank.find((question) => question.id === "L1-01-1");
    const trueFalse = questionBank.find((question) => question.id === "L1-01-tf-1");
    const fillBlank = questionBank.find((question) => question.id === "L1-01-blank-1");

    expect(multipleChoice?.type).toBe("multiple_choice");
    expect(trueFalse?.type).toBe("true_false");
    expect(fillBlank?.type).toBe("fill_blank");

    if (!multipleChoice || multipleChoice.type !== "multiple_choice") throw new Error("Expected multiple choice");
    if (!trueFalse || trueFalse.type !== "true_false") throw new Error("Expected OX");
    if (!fillBlank || fillBlank.type !== "fill_blank") throw new Error("Expected fill blank");

    expect(multipleChoice && evaluateAnswer(multipleChoice, multipleChoice.answer.index)).toBe(true);
    expect(trueFalse && evaluateAnswer(trueFalse, true)).toBe(true);
    expect(fillBlank && evaluateAnswer(fillBlank, ` ${fillBlank.answer.text} `)).toBe(true);
  });

  it("represents migrated multiple choice questions through type, payload, and answer", () => {
    const question = questionBank.find((item) => item.id === "L1-01-1");
    if (!question || question.type !== "multiple_choice") throw new Error("Expected multiple choice");

    expect(question).toMatchObject({
      type: "multiple_choice",
      payload: {
        choices: expect.any(Array),
      },
      answer: {
        index: expect.any(Number),
      },
      explanation: expect.any(String),
      reference: expect.any(String),
    });
    expect("options" in question).toBe(false);
    expect(question.payload.choices).toHaveLength(4);
    expect(question.payload.choices[question.answer.index]).toBeDefined();
  });

  it("evaluates a generic multiple choice question without the old options shape", () => {
    const question: Question<"multiple_choice"> = {
      id: "generic-mc-1",
      level: 1,
      type: "multiple_choice",
      category: "generic",
      difficulty: "easy",
      question: "Which answer is correct?",
      payload: {
        choices: ["wrong 1", "correct", "wrong 2", "wrong 3"],
      },
      answer: {
        index: 1,
      },
      explanation: "The answer is stored by index in the generic answer field.",
      reference: "Test 1:1",
    };

    expect("options" in question).toBe(false);
    expect(evaluateAnswer(question, 1)).toBe(true);
    expect(evaluateAnswer(question, 0)).toBe(false);
  });

  it("picks released non-classic mode questions end to end", () => {
    const oxQuestions = pickRandomQuestions(questionBank, 1, 10, () => 0.42, "true_false");
    const fillBlankQuestions = pickRandomQuestions(questionBank, 1, 10, () => 0.42, "fill_blank");

    expect(oxQuestions).toHaveLength(10);
    expect(fillBlankQuestions).toHaveLength(10);
    expect(oxQuestions.every((question) => question.type === "true_false")).toBe(true);
    expect(fillBlankQuestions.every((question) => question.type === "fill_blank")).toBe(true);
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
