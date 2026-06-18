import {
  QUESTIONS_PER_RUN,
  TOTAL_LEVELS,
  evaluateAnswer,
  getCorrectAnswerText,
  isLevelPassed,
  pickRandomQuestions,
  type GameProgress,
  type Question,
  type QuizMode,
  type SubmittedAnswer,
} from "./bibleQuiz";

export type GameScreen = "HOME" | "LEVEL_INTRO" | "QUESTION" | "FEEDBACK" | "LEVEL_RESULT" | "CELEBRATION";

export type AnswerFeedback = {
  correct: boolean;
  answer: string;
  explanation: string;
  reference: string;
};

export type GameSession = {
  screen: GameScreen;
  mode: QuizMode;
  level: number;
  questions: Question[];
  currentIndex: number;
  score: number;
  feedback: AnswerFeedback | null;
};

export type AnswerResult = {
  session: GameSession;
  correct: boolean;
};

export const defaultSession: GameSession = {
  screen: "HOME",
  mode: "multiple_choice",
  level: 1,
  questions: [],
  currentIndex: 0,
  score: 0,
  feedback: null,
};

export function resumeSession(progress: GameProgress, questionBank: Question[], random = Math.random): GameSession {
  if (progress.highestLevel > 0 && progress.completedLevels.length < TOTAL_LEVELS) {
    return startLevelSession(progress.currentLevel, questionBank, random, "multiple_choice");
  }

  return {
    ...defaultSession,
    level: progress.currentLevel,
  };
}

export function startNextProgressLevelSession(
  progress: GameProgress,
  questionBank: Question[],
  random = Math.random,
  mode: QuizMode = "multiple_choice",
): GameSession {
  const completedAll = progress.completedLevels.length === TOTAL_LEVELS;
  return startLevelSession(completedAll ? 1 : progress.currentLevel, questionBank, random, mode);
}

export function startLevelSession(
  level: number,
  questionBank: Question[],
  random = Math.random,
  mode: QuizMode = "multiple_choice",
): GameSession {
  const safeLevel = clampLevel(level);

  return {
    screen: "LEVEL_INTRO",
    mode,
    level: safeLevel,
    questions: pickRandomQuestions(questionBank, safeLevel, QUESTIONS_PER_RUN, random, mode),
    currentIndex: 0,
    score: 0,
    feedback: null,
  };
}

export function showQuestion(session: GameSession): GameSession {
  return {
    ...session,
    screen: "QUESTION",
  };
}

export function answerCurrentQuestion(session: GameSession, submittedAnswer: SubmittedAnswer): AnswerResult {
  const currentQuestion = getCurrentQuestion(session);
  if (!currentQuestion) {
    return {
      session,
      correct: false,
    };
  }

  const correct = evaluateAnswer(currentQuestion, submittedAnswer);

  return {
    correct,
    session: {
      ...session,
      screen: "FEEDBACK",
      score: correct ? session.score + 1 : session.score,
      feedback: {
        correct,
        answer: getCorrectAnswerText(currentQuestion),
        explanation: currentQuestion.explanation,
        reference: currentQuestion.reference,
      },
    },
  };
}

export function continueAfterFeedback(session: GameSession): GameSession {
  const nextIndex = session.currentIndex + 1;
  if (nextIndex >= QUESTIONS_PER_RUN) {
    return {
      ...session,
      screen: "LEVEL_RESULT",
    };
  }

  return {
    ...session,
    screen: "QUESTION",
    currentIndex: nextIndex,
    feedback: null,
  };
}

export function showCelebration(session: GameSession): GameSession {
  return {
    ...session,
    screen: "CELEBRATION",
  };
}

export function goHome(session: GameSession): GameSession {
  return {
    ...session,
    screen: "HOME",
  };
}

export function isSessionPassed(session: GameSession) {
  return isLevelPassed(session.score);
}

export function getCurrentQuestion(session: GameSession) {
  return session.questions[session.currentIndex];
}

function clampLevel(level: number) {
  return Math.min(TOTAL_LEVELS, Math.max(1, level));
}
