import type { Question } from "./bibleQuiz";
import { fillBlankQuestions } from "./banks/fillBlankBank";
import { imageQuizQuestions } from "./banks/imageQuizBank";
import { matchingQuestions } from "./banks/matchingBank";
import { multipleChoiceQuestions } from "./banks/multipleChoiceBank";
import { orderingQuestions } from "./banks/orderingBank";
import { trueFalseQuestions } from "./banks/trueFalseBank";

export const questionBank: Question[] = [
  ...multipleChoiceQuestions,
  ...trueFalseQuestions,
  ...fillBlankQuestions,
  ...orderingQuestions,
  ...matchingQuestions,
  ...imageQuizQuestions,
];
