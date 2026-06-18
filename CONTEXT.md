# Domain Context

## Game Session

A Game Session is one active quiz run for a selected level. It owns the current screen, level, selected questions, current question index, score, and answer feedback.

The Game Session module is the place where quiz flow transitions live: level intro, question, feedback, level result, celebration, and home. UI code should act as an adapter that renders session state and sends user events into the Game Session interface.

## Classic Level Mode

Classic Level Mode is the current 10-level journey. Each level starts with 10 selected questions, passes at 7 correct answers, and advances to the next level after completion.
