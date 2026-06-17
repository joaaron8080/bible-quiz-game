type AudioContextType = typeof AudioContext;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = (window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: AudioContextType }).webkitAudioContext) as
    | AudioContextType
    | undefined;
  return Ctor ? new Ctor() : null;
}

function tone(ctx: AudioContext, frequency: number, start: number, duration: number, type: OscillatorType) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.15, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

function playSequence(notes: number[], duration = 0.14, type: OscillatorType = "sine") {
  const ctx = getAudioContext();
  if (!ctx) return;
  const start = ctx.currentTime;
  notes.forEach((note, index) => tone(ctx, note, start + index * duration, duration, type));
}

export const sounds = {
  correct: () => playSequence([523.25, 659.25, 783.99], 0.11, "triangle"),
  wrong: () => playSequence([233.08], 0.3, "sawtooth"),
  fanfare: () => playSequence([523.25, 659.25, 783.99, 1046.5, 1318.51], 0.13, "triangle"),
  finalFanfare: () =>
    playSequence([523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98, 2093], 0.12, "triangle"),
};
