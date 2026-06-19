import type { Difficulty } from "../bibleQuiz";

export function getDifficulty(level: number): Difficulty {
  if (level <= 3) return "easy";
  if (level <= 6) return "medium";
  if (level <= 8) return "hard";
  return "expert";
}

export function rotate<T extends unknown[]>(items: T, amount: number): T {
  const offset = ((amount % items.length) + items.length) % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)] as T;
}

export function questionId(level: number, suffix: string, index: number) {
  return `L${level}-${String(index + 1).padStart(2, "0")}-${suffix}`;
}

const imagePalettes = [
  ["#184E77", "#52B788", "#D8F3DC"],
  ["#7F4F24", "#DDA15E", "#FEFAE0"],
  ["#5A189A", "#F72585", "#FEE440"],
  ["#003049", "#D62828", "#F77F00"],
];

export function createImageDataUri(level: number, index: number) {
  const [background, accent, glow] = imagePalettes[(level + index) % imagePalettes.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 540" role="img" aria-label="Bible story image clue">
    <rect width="960" height="540" fill="${background}"/>
    <circle cx="${220 + (index % 4) * 80}" cy="150" r="110" fill="${glow}" opacity=".85"/>
    <path d="M0 395 C180 305 310 455 470 365 C650 265 770 365 960 285 L960 540 L0 540 Z" fill="${accent}"/>
    <path d="M180 420 L300 235 L420 420 Z" fill="#fff7db" opacity=".9"/>
    <path d="M560 430 C610 320 680 255 750 210 C770 305 750 375 700 430 Z" fill="#ffffff" opacity=".88"/>
    <rect x="98" y="72" width="764" height="396" rx="28" fill="none" stroke="#ffffff" stroke-opacity=".45" stroke-width="8"/>
    <text x="480" y="92" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="34" font-weight="700">Image Quiz</text>
  </svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
