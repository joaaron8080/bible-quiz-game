import {
  PASSING_SCORE,
  completeLevel,
  defaultProgress,
  evaluateAnswer,
  getModeProgress,
  isLevelPassed,
  loadProgressMap,
  pickRandomQuestions,
  questionTypes,
  releasedQuizModes,
  saveProgressMap,
  setModeProgress,
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

  it("exposes OX Quiz as a released selectable mode", () => {
    expect(releasedQuizModes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "true_false",
          label: "OX Quiz",
        }),
      ]),
    );
  });

  it("exposes Ordering Quiz as a released selectable mode", () => {
    expect(releasedQuizModes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "ordering",
          label: "Ordering Quiz",
        }),
      ]),
    );
  });

  it("exposes Matching Quiz as a released selectable mode", () => {
    expect(releasedQuizModes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "matching",
          label: "Matching Quiz",
        }),
      ]),
    );
  });

  it("exposes Image Quiz as a released selectable mode", () => {
    expect(releasedQuizModes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "image_quiz",
          label: "Image Quiz",
        }),
      ]),
    );
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

  it("evaluates multiple choice, OX true and false, and fill blank answers", () => {
    const multipleChoice = questionBank.find((question) => question.id === "L1-01-1");
    const trueAnswer = questionBank.find((question) => question.type === "true_false" && question.answer.value === true);
    const falseAnswer = questionBank.find((question) => question.type === "true_false" && question.answer.value === false);
    const fillBlank = questionBank.find((question) => question.type === "fill_blank" && question.level === 1);

    if (!multipleChoice || multipleChoice.type !== "multiple_choice") throw new Error("Expected multiple choice");
    if (!trueAnswer || trueAnswer.type !== "true_false") throw new Error("Expected OX true question");
    if (!falseAnswer || falseAnswer.type !== "true_false") throw new Error("Expected OX false question");
    if (!fillBlank || fillBlank.type !== "fill_blank") throw new Error("Expected fill blank");

    expect(evaluateAnswer(multipleChoice, multipleChoice.answer.index)).toBe(true);
    expect(evaluateAnswer(trueAnswer, true)).toBe(true);
    expect(evaluateAnswer(trueAnswer, false)).toBe(false);
    expect(evaluateAnswer(falseAnswer, false)).toBe(true);
    expect(evaluateAnswer(falseAnswer, true)).toBe(false);
    expect(evaluateAnswer(fillBlank, ` ${fillBlank.answer.text} `)).toBe(true);
  });

  it("provides at least ten dedicated questions per type for every level", () => {
    const dedicatedTypes = ["true_false", "fill_blank", "ordering", "matching", "image_quiz"] as const;
    for (const type of dedicatedTypes) {
      for (let level = 1; level <= 10; level += 1) {
        const count = questionBank.filter((question) => question.type === type && question.level === level).length;
        expect(count).toBeGreaterThanOrEqual(10);
      }
    }
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
    const orderingQuestions = pickRandomQuestions(questionBank, 1, 10, () => 0.42, "ordering");
    const matchingQuestions = pickRandomQuestions(questionBank, 1, 10, () => 0.42, "matching");
    const imageQuestions = pickRandomQuestions(questionBank, 1, 10, () => 0.42, "image_quiz");

    expect(oxQuestions).toHaveLength(10);
    expect(fillBlankQuestions).toHaveLength(10);
    expect(orderingQuestions).toHaveLength(10);
    expect(matchingQuestions).toHaveLength(10);
    expect(imageQuestions).toHaveLength(10);
    expect(oxQuestions.every((question) => question.type === "true_false")).toBe(true);
    expect(fillBlankQuestions.every((question) => question.type === "fill_blank")).toBe(true);
    expect(orderingQuestions.every((question) => question.type === "ordering")).toBe(true);
    expect(matchingQuestions.every((question) => question.type === "matching")).toBe(true);
    expect(imageQuestions.every((question) => question.type === "image_quiz")).toBe(true);
  });

  it("evaluates correct and incorrect ordering submissions", () => {
    const ordering = questionBank.find((question) => question.type === "ordering" && question.level === 1);
    if (!ordering || ordering.type !== "ordering") throw new Error("Expected ordering question");

    expect(evaluateAnswer(ordering, ordering.answer.order)).toBe(true);
    expect(evaluateAnswer(ordering, [...ordering.answer.order].reverse())).toBe(false);
  });

  it("evaluates complete matching submissions and rejects mismatches", () => {
    const matching = questionBank.find((question) => question.type === "matching" && question.level === 1);
    if (!matching || matching.type !== "matching") throw new Error("Expected matching question");

    const mismatchedPairs = matching.answer.pairs.map((pair, index, pairs) => ({
      left: pair.left,
      right: pairs[(index + 1) % pairs.length].right,
    }));
    const partialPairs = matching.answer.pairs.slice(0, matching.answer.pairs.length - 1);

    expect(matching.payload.pairs).toHaveLength(4);
    expect(evaluateAnswer(matching, matching.answer.pairs)).toBe(true);
    expect(evaluateAnswer(matching, Object.fromEntries(matching.answer.pairs.map((pair) => [pair.left, pair.right])))).toBe(true);
    expect(evaluateAnswer(matching, mismatchedPairs)).toBe(false);
    expect(evaluateAnswer(matching, partialPairs)).toBe(false);
  });

  it("renders image quiz payload assumptions and evaluates choice or typed answers", () => {
    const imageQuestion = questionBank.find((question) => question.type === "image_quiz" && question.level === 1);
    if (!imageQuestion || imageQuestion.type !== "image_quiz") throw new Error("Expected image quiz question");

    expect(imageQuestion.payload.imageUrl).toMatch(/^\/images\/quiz\/L\d+_\d{2}\.png$/);
    expect(imageQuestion.payload.imageAlt).toEqual(expect.any(String));
    expect(imageQuestion.payload.imageAlt.length).toBeGreaterThan(10);
    expect(imageQuestion.payload.choices).toHaveLength(4);
    expect(imageQuestion.answer.index).toEqual(expect.any(Number));
    expect(imageQuestion.answer.text).toEqual(expect.any(String));

    expect(evaluateAnswer(imageQuestion, imageQuestion.answer.index ?? -1)).toBe(true);
    expect(evaluateAnswer(imageQuestion, ` ${imageQuestion.answer.text} `)).toBe(true);
    expect(evaluateAnswer(imageQuestion, "not the answer")).toBe(false);
  });

  it("saves completed level progress", () => {
    const progress = completeLevel(defaultProgress, 1);

    expect(progress.highestLevel).toBe(1);
    expect(progress.currentLevel).toBe(2);
    expect(progress.completedLevels).toEqual([1]);
  });

  it("saves and loads per-mode progress from localStorage independently", () => {
    const storage = window.localStorage;
    storage.clear();

    const map = setModeProgress({}, "true_false", completeLevel(defaultProgress, 3));
    saveProgressMap(map, storage);

    const loaded = loadProgressMap(storage);

    expect(getModeProgress(loaded, "true_false")).toEqual({
      highestLevel: 3,
      currentLevel: 4,
      completedLevels: [3],
    });
    expect(getModeProgress(loaded, "ordering")).toEqual({
      highestLevel: 0,
      currentLevel: 1,
      completedLevels: [],
    });
  });
});
