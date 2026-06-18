# Domain Context

## Game Session

A Game Session is one active quiz run for a selected level. It owns the current screen, level, selected questions, current question index, score, and answer feedback.

The Game Session module is the place where quiz flow transitions live: level intro, question, feedback, level result, celebration, and home. UI code should act as an adapter that renders session state and sends user events into the Game Session interface.

## Classic Level Mode

Classic Level Mode is the current 10-level journey. Each level starts with 10 selected questions, passes at 7 correct answers, and advances to the next level after completion.

## Question Type

A Question Type identifies the interaction shape of a question. Each type owns its own payload (the data needed to render the question) and answer schema (the data needed to evaluate a user response). The current type set is:

- `multiple_choice` — 4 choices, answer is an index
- `true_false` — OX 선택, answer is a boolean
- `fill_blank` — 빈칸 채우기, answer is a string
- `ordering` — 사건 순서 맞추기, answer is a sorted index array
- `matching` — 인물·사건 연결, answer is a set of pairs
- `image_quiz` — 이미지 보고 고르기, payload carries imageUrl

The Question Type is the primary seam between the Question Bank (data), the Answer Evaluator (scoring), and the Question Renderer (UI).

## Answer Evaluator

The Answer Evaluator is the module responsible for comparing a user's response to the correct answer for a given Question Type. It exposes a single interface: `evaluate(question, response) → EvaluationResult`. The Game Session calls this and receives only the result — it does not contain any type-specific comparison logic itself.

## Question Renderer

The Question Renderer is a registry that maps each Question Type to a React component. It is the seam that lets new quiz types be added by registering a new component without modifying the Game Session or the main page layout.

## Quiz Mode

A Quiz Mode is a named collection of Question Types and rules that define a play experience. Modes planned in PRD v2:

- **Classic Level Mode** — existing 10-level journey, multiple_choice only (current)
- **Boss Battle Mode** — timed, high-stakes, mixed Question Types, lives system, planned for v2.0

## Boss Battle Mode

Boss Battle Mode is an alternate Game Session variant introduced in PRD v2.0. It uses a lives system, a timer, and a mix of Question Types. It is a distinct mode from Classic Level Mode and does not share the pass/fail level-completion logic.
