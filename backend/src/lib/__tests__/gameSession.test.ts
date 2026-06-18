import { DEFAULT_QUIZ_MODE, QUESTIONS_PER_RUN, completeLevel, defaultProgress } from "../bibleQuiz";
import {
  answerCurrentQuestion,
  continueAfterFeedback,
  isSessionPassed,
  resumeSession,
  showQuestion,
  startLevelSession,
  startNextProgressLevelSession,
} from "../gameSession";
import { questionBank } from "../questionBank";

describe("game session logic", () => {
  it("starts a level session with intro screen and fresh score", () => {
    const session = startLevelSession(2, questionBank, () => 0.42);

    expect(session.screen).toBe("LEVEL_INTRO");
    expect(session.mode).toBe(DEFAULT_QUIZ_MODE);
    expect(session.level).toBe(2);
    expect(session.questions).toHaveLength(QUESTIONS_PER_RUN);
    expect(session.questions.every((question) => question.type === "multiple_choice")).toBe(true);
    expect(session.currentIndex).toBe(0);
    expect(session.score).toBe(0);
    expect(session.feedback).toBeNull();
  });

  it("retains the selected Multiple Choice mode through session start and question rendering", () => {
    const session = showQuestion(startNextProgressLevelSession(defaultProgress, questionBank, () => 0.42, "multiple_choice"));
    const currentQuestion = session.questions[session.currentIndex];

    expect(session.mode).toBe("multiple_choice");
    expect(session.screen).toBe("QUESTION");
    expect(currentQuestion.type).toBe("multiple_choice");
    if (currentQuestion.type !== "multiple_choice") throw new Error("Expected multiple choice question");
    expect(currentQuestion.payload.choices).toHaveLength(4);
  });

  it("answers the current question and exposes feedback", () => {
    const session = showQuestion(startLevelSession(1, questionBank, () => 0.42));
    const currentQuestion = session.questions[0];
    if (currentQuestion.type !== "multiple_choice") throw new Error("Expected multiple choice question");

    const result = answerCurrentQuestion(session, currentQuestion.answer.index);

    expect(result.correct).toBe(true);
    expect(result.session.screen).toBe("FEEDBACK");
    expect(result.session.score).toBe(1);
    expect(result.session.feedback).toMatchObject({
      correct: true,
      answer: currentQuestion.payload.choices[currentQuestion.answer.index],
      explanation: currentQuestion.explanation,
      reference: currentQuestion.reference,
    });
  });

  it("plays a full Classic Level Mode run with migrated multiple choice questions", () => {
    let session = showQuestion(startLevelSession(1, questionBank, () => 0.42, "multiple_choice"));

    for (let index = 0; index < QUESTIONS_PER_RUN; index += 1) {
      const currentQuestion = session.questions[session.currentIndex];
      if (currentQuestion.type !== "multiple_choice") throw new Error("Expected multiple choice question");

      const result = answerCurrentQuestion(session, currentQuestion.answer.index);
      expect(result.correct).toBe(true);
      expect(result.session.feedback?.answer).toBe(currentQuestion.payload.choices[currentQuestion.answer.index]);

      session = continueAfterFeedback(result.session);
    }

    expect(session.screen).toBe("LEVEL_RESULT");
    expect(session.score).toBe(QUESTIONS_PER_RUN);
  });

  it("continues from feedback to the next question or result", () => {
    const session = showQuestion(startLevelSession(1, questionBank, () => 0.42));
    const currentQuestion = session.questions[0];
    if (currentQuestion.type !== "multiple_choice") throw new Error("Expected multiple choice question");

    const answered = answerCurrentQuestion(session, currentQuestion.answer.index).session;
    const nextQuestion = continueAfterFeedback(answered);

    expect(nextQuestion.screen).toBe("QUESTION");
    expect(nextQuestion.currentIndex).toBe(1);
    expect(nextQuestion.feedback).toBeNull();

    const finalFeedback = {
      ...answered,
      currentIndex: QUESTIONS_PER_RUN - 1,
    };

    expect(continueAfterFeedback(finalFeedback).screen).toBe("LEVEL_RESULT");
  });

  it("resumes saved progress into the current level intro", () => {
    const progress = completeLevel(defaultProgress, 3);
    const session = resumeSession(progress, questionBank, () => 0.42);

    expect(session.screen).toBe("LEVEL_INTRO");
    expect(session.level).toBe(4);
  });

  it("plays a full OX Quiz run through feedback and level result", () => {
    let session = showQuestion(startLevelSession(1, questionBank, () => 0.42, "true_false"));

    expect(session.mode).toBe("true_false");
    expect(session.questions).toHaveLength(QUESTIONS_PER_RUN);
    expect(session.questions.every((question) => question.type === "true_false")).toBe(true);

    for (let index = 0; index < QUESTIONS_PER_RUN; index += 1) {
      const currentQuestion = session.questions[session.currentIndex];
      if (currentQuestion.type !== "true_false") throw new Error("Expected OX question");

      const result = answerCurrentQuestion(session, currentQuestion.answer.value);
      expect(result.correct).toBe(true);
      expect(result.session.feedback?.answer).toBe(currentQuestion.answer.value ? "O" : "X");

      session = continueAfterFeedback(result.session);
    }

    expect(session.screen).toBe("LEVEL_RESULT");
    expect(session.score).toBe(QUESTIONS_PER_RUN);
    expect(isSessionPassed(session)).toBe(true);
  });

  it("runs a fill blank quiz session", () => {
    const session = showQuestion(startLevelSession(1, questionBank, () => 0.42, "fill_blank"));
    const currentQuestion = session.questions[0];
    if (currentQuestion.type !== "fill_blank") throw new Error("Expected fill blank question");

    const result = answerCurrentQuestion(session, currentQuestion.answer.text);

    expect(session.mode).toBe("fill_blank");
    expect(result.correct).toBe(true);
    expect(result.session.score).toBe(1);
  });

  it("scores correct and incorrect ordering quiz submissions", () => {
    const session = showQuestion(startLevelSession(1, questionBank, () => 0.42, "ordering"));
    const currentQuestion = session.questions[0];
    if (currentQuestion.type !== "ordering") throw new Error("Expected ordering question");

    const correct = answerCurrentQuestion(session, currentQuestion.answer.order);
    const incorrect = answerCurrentQuestion(session, [...currentQuestion.answer.order].reverse());

    expect(session.mode).toBe("ordering");
    expect(correct.correct).toBe(true);
    expect(correct.session.score).toBe(1);
    expect(correct.session.feedback?.answer).toBe(currentQuestion.answer.order.join(" > "));
    expect(incorrect.correct).toBe(false);
    expect(incorrect.session.score).toBe(0);
  });

  it("plays a full Ordering Quiz run through feedback and level result", () => {
    let session = showQuestion(startLevelSession(1, questionBank, () => 0.42, "ordering"));

    expect(session.questions).toHaveLength(QUESTIONS_PER_RUN);
    expect(session.questions.every((question) => question.type === "ordering")).toBe(true);

    for (let index = 0; index < QUESTIONS_PER_RUN; index += 1) {
      const currentQuestion = session.questions[session.currentIndex];
      if (currentQuestion.type !== "ordering") throw new Error("Expected ordering question");

      const result = answerCurrentQuestion(session, currentQuestion.answer.order);
      expect(result.correct).toBe(true);

      session = continueAfterFeedback(result.session);
    }

    expect(session.screen).toBe("LEVEL_RESULT");
    expect(session.score).toBe(QUESTIONS_PER_RUN);
    expect(isSessionPassed(session)).toBe(true);
  });

  it("scores correct and incorrect matching quiz submissions", () => {
    const session = showQuestion(startLevelSession(1, questionBank, () => 0.42, "matching"));
    const currentQuestion = session.questions[0];
    if (currentQuestion.type !== "matching") throw new Error("Expected matching question");

    const mismatchedPairs = currentQuestion.answer.pairs.map((pair, index, pairs) => ({
      left: pair.left,
      right: pairs[(index + 1) % pairs.length].right,
    }));
    const correct = answerCurrentQuestion(session, currentQuestion.answer.pairs);
    const incorrect = answerCurrentQuestion(session, mismatchedPairs);

    expect(session.mode).toBe("matching");
    expect(correct.correct).toBe(true);
    expect(correct.session.score).toBe(1);
    expect(correct.session.feedback?.answer).toBe(
      currentQuestion.answer.pairs.map((pair) => `${pair.left}: ${pair.right}`).join(", "),
    );
    expect(incorrect.correct).toBe(false);
    expect(incorrect.session.score).toBe(0);
  });

  it("plays a full Matching Quiz run through feedback and level result", () => {
    let session = showQuestion(startLevelSession(1, questionBank, () => 0.42, "matching"));

    expect(session.questions).toHaveLength(QUESTIONS_PER_RUN);
    expect(session.questions.every((question) => question.type === "matching")).toBe(true);

    for (let index = 0; index < QUESTIONS_PER_RUN; index += 1) {
      const currentQuestion = session.questions[session.currentIndex];
      if (currentQuestion.type !== "matching") throw new Error("Expected matching question");

      const result = answerCurrentQuestion(session, currentQuestion.answer.pairs);
      expect(result.correct).toBe(true);

      session = continueAfterFeedback(result.session);
    }

    expect(session.screen).toBe("LEVEL_RESULT");
    expect(session.score).toBe(QUESTIONS_PER_RUN);
    expect(isSessionPassed(session)).toBe(true);
  });

  it("plays a full Image Quiz run through feedback and level result", () => {
    let session = showQuestion(startLevelSession(1, questionBank, () => 0.42, "image_quiz"));

    expect(session.mode).toBe("image_quiz");
    expect(session.questions).toHaveLength(QUESTIONS_PER_RUN);
    expect(session.questions.every((question) => question.type === "image_quiz")).toBe(true);

    for (let index = 0; index < QUESTIONS_PER_RUN; index += 1) {
      const currentQuestion = session.questions[session.currentIndex];
      if (currentQuestion.type !== "image_quiz") throw new Error("Expected image quiz question");

      expect(currentQuestion.payload.imageAlt).toEqual(expect.any(String));
      expect(currentQuestion.payload.imageUrl).toEqual(expect.any(String));

      const result = answerCurrentQuestion(session, index % 2 === 0 ? (currentQuestion.answer.index ?? -1) : currentQuestion.answer.text ?? "");
      expect(result.correct).toBe(true);
      expect(result.session.feedback?.answer).toBe(currentQuestion.answer.text);

      session = continueAfterFeedback(result.session);
    }

    expect(session.screen).toBe("LEVEL_RESULT");
    expect(session.score).toBe(QUESTIONS_PER_RUN);
    expect(isSessionPassed(session)).toBe(true);
  });

  it("restarts from level one when all levels are complete", () => {
    const progress = {
      highestLevel: 10,
      currentLevel: 10,
      completedLevels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    };

    const session = startNextProgressLevelSession(progress, questionBank, () => 0.42);

    expect(session.level).toBe(1);
  });
});
