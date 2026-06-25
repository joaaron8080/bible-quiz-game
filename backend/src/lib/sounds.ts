const SRCS = {
  correct: "/sounds/correct.mp3",
  wrong: "/sounds/wrong.mp3",
  levelup: "/sounds/levelup.mp3",
} as const;

type SoundKey = keyof typeof SRCS;

const cache = new Map<SoundKey, HTMLAudioElement>();

function getAudio(key: SoundKey): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!cache.has(key)) {
    const audio = new Audio(SRCS[key]);
    audio.preload = "auto";
    cache.set(key, audio);
  }
  return cache.get(key)!;
}

function play(key: SoundKey) {
  const audio = getAudio(key);
  if (!audio) return;
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

export function preloadSounds() {
  (Object.keys(SRCS) as SoundKey[]).forEach(getAudio);
}

export const sounds = {
  correct: () => play("correct"),
  wrong: () => play("wrong"),
  levelup: () => play("levelup"),
};
