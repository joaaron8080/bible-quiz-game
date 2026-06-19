function play(src: string) {
  if (typeof window === "undefined") return;
  const audio = new Audio(src);
  audio.play().catch(() => {});
}

export const sounds = {
  correct: () => play("/sounds/correct.mp3"),
  wrong: () => play("/sounds/wrong.mp3"),
  skipClick: () => play("/sounds/skip_click.mp3"),
  levelup: () => play("/sounds/levelup.mp3"),
};
