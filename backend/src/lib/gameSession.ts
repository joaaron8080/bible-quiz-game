import {
  QUESTIONS_PER_RUN,
  MAX_WRONG_ANSWERS,
  DEFAULT_QUIZ_MODE,
  evaluateAnswer,
  getCorrectAnswerText,
  getModeLevelCount,
  isLevelPassed,
  pickRandomQuestions,
  type GameProgress,
  type Question,
  type QuizMode,
  type SubmittedAnswer,
} from "./bibleQuiz";

export type GameScreen = "MODE_SELECT" | "MODE_HOME" | "QUESTION" | "FEEDBACK" | "LEVEL_RESULT" | "CELEBRATION";

export type AnswerFeedback = {
  correct: boolean;
  answer: string;
  explanation: string;
  reference: string;
  verse?: {
    segments: string[];
    blanks: string[];
  };
};

export type GameSession = {
  screen: GameScreen;
  mode: QuizMode;
  level: number;
  questions: Question[];
  currentIndex: number;
  score: number;
  wrong: number;
  feedback: AnswerFeedback | null;
};

export type AnswerResult = {
  session: GameSession;
  correct: boolean;
};

export const defaultSession: GameSession = {
  screen: "MODE_SELECT",
  mode: DEFAULT_QUIZ_MODE,
  level: 1,
  questions: [],
  currentIndex: 0,
  score: 0,
  wrong: 0,
  feedback: null,
};

export function goToModeSelect(session: GameSession): GameSession {
  return {
    ...session,
    screen: "MODE_SELECT",
    feedback: null,
  };
}

export function selectMode(mode: QuizMode, currentLevel = 1): GameSession {
  return {
    ...defaultSession,
    screen: "MODE_HOME",
    mode,
    level: clampLevel(currentLevel, mode),
  };
}

export function goToModeHome(session: GameSession): GameSession {
  return {
    ...session,
    screen: "MODE_HOME",
    feedback: null,
  };
}

export function startNextProgressLevelSession(
  progress: GameProgress,
  questionBank: Question[],
  random = Math.random,
  mode: QuizMode = DEFAULT_QUIZ_MODE,
): GameSession {
  const completedAll = progress.completedLevels.length === getModeLevelCount(mode);
  return startLevelSession(completedAll ? 1 : progress.currentLevel, questionBank, random, mode);
}

export function startLevelSession(
  level: number,
  questionBank: Question[],
  random = Math.random,
  mode: QuizMode = DEFAULT_QUIZ_MODE,
): GameSession {
  const safeLevel = clampLevel(level, mode);

  return {
    screen: "QUESTION",
    mode,
    level: safeLevel,
    questions: pickRandomQuestions(questionBank, safeLevel, QUESTIONS_PER_RUN, random, mode),
    currentIndex: 0,
    score: 0,
    wrong: 0,
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
      wrong: correct ? session.wrong : session.wrong + 1,
      feedback: {
        correct,
        answer: getCorrectAnswerText(currentQuestion),
        explanation: currentQuestion.explanation,
        reference: currentQuestion.reference,
        verse:
          currentQuestion.type === "memory_verse"
            ? { segments: currentQuestion.payload.segments, blanks: currentQuestion.answer.blanks }
            : undefined,
      },
    },
  };
}

export function continueAfterFeedback(session: GameSession): GameSession {
  if (session.wrong >= MAX_WRONG_ANSWERS) {
    return {
      ...session,
      screen: "LEVEL_RESULT",
      feedback: null,
    };
  }

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

export function isSessionPassed(session: GameSession) {
  return isLevelPassed(session.score);
}

export function getCurrentQuestion(session: GameSession) {
  return session.questions[session.currentIndex];
}

function clampLevel(level: number, mode: QuizMode) {
  return Math.min(getModeLevelCount(mode), Math.max(1, level));
}
