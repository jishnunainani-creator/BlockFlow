// ─── Web Audio API Focus Alarm Synthesizer ────────────────────────────────────
// 100% reliable local & deployed audio synthesizer using Web Audio API.
// No external MP3 assets, zero network latency, browser autoplay compliant.

export type SoundOption = 'bell' | 'chime' | 'digital' | 'soft_alarm' | 'none';

export interface FocusAudioSettings {
  sound: SoundOption;
  volume: number; // 0 to 100
}

const SETTINGS_KEY = 'blockflow_focus_audio_settings_v1';

export const DEFAULT_AUDIO_SETTINGS: FocusAudioSettings = {
  sound: 'bell',
  volume: 70,
};

export function loadFocusAudioSettings(): FocusAudioSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_AUDIO_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      sound: parsed.sound || 'bell',
      volume: typeof parsed.volume === 'number' ? Math.max(0, Math.min(100, parsed.volume)) : 70,
    };
  } catch {
    return DEFAULT_AUDIO_SETTINGS;
  }
}

export function saveFocusAudioSettings(settings: FocusAudioSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save focus audio settings:', err);
  }
}

// ─── Singleton AudioContext ──────────────────────────────────────────────────
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtxClass) {
      audioCtx = new AudioCtxClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Call on any user gesture (Start button, Test Sound button) to unlock audio.
 */
export function unlockAudioContext(): void {
  try {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  } catch {
    // Ignore audio unlock errors
  }
}

// ─── Sound Generators ────────────────────────────────────────────────────────

/**
 * Bell Sound: Resonant multi-tone chime (C5, E5, G5, C6) with smooth exponential decay.
 */
function playBell(ctx: AudioContext, gainNode: GainNode): void {
  const frequencies = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
  const now = ctx.currentTime;

  frequencies.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const noteGain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    const startTime = now + idx * 0.12;
    const duration = 1.2;

    noteGain.gain.setValueAtTime(0.001, startTime);
    noteGain.gain.exponentialRampToValueAtTime(0.4, startTime + 0.03);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(noteGain);
    noteGain.connect(gainNode);

    osc.start(startTime);
    osc.stop(startTime + duration);
  });
}

/**
 * Chime Sound: Soft ambient harmonic chord (F4, A4, C5, E5).
 */
function playChime(ctx: AudioContext, gainNode: GainNode): void {
  const chord = [349.23, 440.00, 523.25, 659.25]; // F4, A4, C5, E5
  const now = ctx.currentTime;

  chord.forEach((freq) => {
    const osc = ctx.createOscillator();
    const noteGain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);

    noteGain.gain.setValueAtTime(0.001, now);
    noteGain.gain.linearRampToValueAtTime(0.25, now + 0.15);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

    osc.connect(noteGain);
    noteGain.connect(gainNode);

    osc.start(now);
    osc.stop(now + 1.8);
  });
}

/**
 * Digital Sound: 3-beep electronic pulse (800Hz, 1000Hz, 1200Hz).
 */
function playDigital(ctx: AudioContext, gainNode: GainNode): void {
  const beeps = [800, 1000, 1200];
  const now = ctx.currentTime;

  beeps.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const noteGain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, now);

    const startTime = now + idx * 0.18;
    const duration = 0.12;

    noteGain.gain.setValueAtTime(0.001, startTime);
    noteGain.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
    noteGain.gain.linearRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(noteGain);
    noteGain.connect(gainNode);

    osc.start(startTime);
    osc.stop(startTime + duration);
  });
}

/**
 * Soft Alarm: Gentle warm sine wave pulses (440Hz with warm swell).
 */
function playSoftAlarm(ctx: AudioContext, gainNode: GainNode): void {
  const now = ctx.currentTime;

  [0, 0.4, 0.8].forEach((offset) => {
    const osc = ctx.createOscillator();
    const noteGain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now + offset);
    osc.frequency.exponentialRampToValueAtTime(554.37, now + offset + 0.25); // C#5

    const startTime = now + offset;
    const duration = 0.3;

    noteGain.gain.setValueAtTime(0.001, startTime);
    noteGain.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(noteGain);
    noteGain.connect(gainNode);

    osc.start(startTime);
    osc.stop(startTime + duration);
  });
}

// ─── Main Play Function ──────────────────────────────────────────────────────

export function playFocusCompletionAlarm(
  sound: SoundOption = 'bell',
  volume: number = 70
): void {
  if (sound === 'none' || volume <= 0) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const masterGain = ctx.createGain();
    const normalizedVol = (volume / 100) * 0.6; // Cap max volume at 0.6 for ear comfort
    masterGain.gain.setValueAtTime(normalizedVol, ctx.currentTime);
    masterGain.connect(ctx.destination);

    switch (sound) {
      case 'bell':
        playBell(ctx, masterGain);
        break;
      case 'chime':
        playChime(ctx, masterGain);
        break;
      case 'digital':
        playDigital(ctx, masterGain);
        break;
      case 'soft_alarm':
        playSoftAlarm(ctx, masterGain);
        break;
    }
  } catch (err) {
    console.error('Focus audio playback failed:', err);
  }
}

export function playTestSound(sound: SoundOption, volume: number): void {
  unlockAudioContext();
  playFocusCompletionAlarm(sound, volume);
}

export function playBreakCompletionAlarm(volume: number = 70): void {
  playFocusCompletionAlarm('chime', volume);
}
