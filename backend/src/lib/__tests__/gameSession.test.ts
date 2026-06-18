import { QUESTIONS_PER_RUN, completeLevel, defaultProgress } from "../bibleQuiz";
import {
  answerCurrentQuestion,
  continueAfterFeedback,
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
    expect(session.level).toBe(2);
    expect(session.questions).toHaveLength(QUESTIONS_PER_RUN);
    expect(session.currentIndex).toBe(0);
    expect(session.score).toBe(0);
    expect(session.feedback).toBeNull();
  });

  it("answers the current question and exposes feedback", () => {
    const session = showQuestion(startLevelSession(1, questionBank, () => 0.42));
    const currentQuestion = session.questions[0];
    const result = answerCurrentQuestion(session, currentQuestion.answer);

    expect(result.correct).toBe(true);
    expect(result.session.screen).toBe("FEEDBACK");
    expect(result.session.score).toBe(1);
    expect(result.session.feedback).toMatchObject({
      correct: true,
      answer: currentQuestion.options[currentQuestion.answer],
      explanation: currentQuestion.explanation,
      reference: currentQuestion.reference,
    });
  });

  it("continues from feedback to the next question or result", () => {
    const session = showQuestion(startLevelSession(1, questionBank, () => 0.42));
    const answered = answerCurrentQuestion(session, session.questions[0].answer).session;
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
