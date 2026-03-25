let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

function playTone(frequency: number, durationSec: number, volume: number, type: OscillatorType = "sine"): void {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + durationSec);
}

export function playEmergencyAlert(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    for (let i = 0; i < 3; i += 1) {
      const offset = i * 0.4;

      const oscHigh = ctx.createOscillator();
      const gainHigh = ctx.createGain();
      oscHigh.type = "square";
      oscHigh.frequency.value = 880;
      gainHigh.gain.setValueAtTime(0.17, now + offset);
      gainHigh.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.2);
      oscHigh.connect(gainHigh);
      gainHigh.connect(ctx.destination);
      oscHigh.start(now + offset);
      oscHigh.stop(now + offset + 0.2);

      const oscLow = ctx.createOscillator();
      const gainLow = ctx.createGain();
      oscLow.type = "square";
      oscLow.frequency.value = 620;
      gainLow.gain.setValueAtTime(0.17, now + offset + 0.2);
      gainLow.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.4);
      oscLow.connect(gainLow);
      gainLow.connect(ctx.destination);
      oscLow.start(now + offset + 0.2);
      oscLow.stop(now + offset + 0.4);
    }
  } catch {
    // Silent fallback.
  }
}

export function playPriorityTone(): void {
  try {
    playTone(760, 0.12, 0.1, "triangle");
    setTimeout(() => {
      try {
        playTone(980, 0.12, 0.08, "triangle");
      } catch {
        // Silent fallback.
      }
    }, 140);
  } catch {
    // Silent fallback.
  }
}

export function playMessageSound(): void {
  try {
    playTone(600, 0.15, 0.08, "sine");
  } catch {
    // Silent fallback.
  }
}

export function playDisconnectWarning(): void {
  try {
    playTone(330, 0.18, 0.1, "sawtooth");
    setTimeout(() => {
      try {
        playTone(220, 0.24, 0.1, "sawtooth");
      } catch {
        // Silent fallback.
      }
    }, 170);
  } catch {
    // Silent fallback.
  }
}
