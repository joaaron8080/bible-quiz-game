import { shuffleOptions, shuffleQuestions, type Question, type QuestionType } from "./bibleQuiz";

export const CHALLENGE_MAX_QUESTIONS = 50;
export const CHALLENGE_TIME_SECONDS = 120;
export const CHALLENGE_READY_SECONDS = 3;

const DOUBLE_POINT_TYPES: QuestionType[] = ["fill_blank", "memory_verse"];

export function getQuestionPoints(type: QuestionType): number {
  return DOUBLE_POINT_TYPES.includes(type) ? 2 : 1;
}

export function buildChallengePool(questions: Question[], random = Math.random): Question[] {
  return shuffleQuestions(questions, random)
    .slice(0, CHALLENGE_MAX_QUESTIONS)
    .map((question) => shuffleOptions(question, random));
}
