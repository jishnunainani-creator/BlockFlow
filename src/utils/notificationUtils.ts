import { ScheduledBlock } from '../types/timetable';
import { minutesToTimeStr } from './timeUtils';

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') {
    return true;
  }
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
}

export function sendBrowserNotification(title: string, body: string): void {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/favicon.ico',
    });
  }
}

/**
 * Plays a rich, soothing 7-second harmonic audio chime using Web Audio API.
 */
export function playReminderChime(): void {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();

    const totalDuration = 7.0;
    const now = ctx.currentTime;

    // 7-second ambient harmonic chime notes sequence (C Major 9 & Echoes)
    const notes = [
      // Wave 1: Initial chime burst (0.0s - 2.5s)
      { freq: 523.25, start: 0.0, len: 2.5, vol: 0.15 },  // C5
      { freq: 659.25, start: 0.3, len: 2.5, vol: 0.14 },  // E5
      { freq: 783.99, start: 0.6, len: 2.5, vol: 0.13 },  // G5
      { freq: 987.77, start: 0.9, len: 2.5, vol: 0.12 },  // B5
      { freq: 1046.50, start: 1.2, len: 2.5, vol: 0.15 }, // C6

      // Wave 2: Mid-chime pulse echo (2.8s - 5.0s)
      { freq: 523.25, start: 2.8, len: 2.2, vol: 0.12 },  // C5
      { freq: 783.99, start: 3.1, len: 2.2, vol: 0.12 },  // G5
      { freq: 1046.50, start: 3.4, len: 2.2, vol: 0.13 }, // C6

      // Wave 3: Final soothing fade out (4.8s - 7.0s)
      { freq: 659.25, start: 4.8, len: 2.2, vol: 0.10 },  // E5
      { freq: 1046.50, start: 5.2, len: 1.8, vol: 0.11 }, // C6
    ];

    notes.forEach(({ freq, start, len, vol }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + start);

      // Gentle attack envelope
      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(vol, now + start + 0.12);
      // Smooth exponential decay extending up to 7 seconds total
      gain.gain.exponentialRampToValueAtTime(0.001, now + Math.min(totalDuration, start + len));

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + start);
      osc.stop(now + Math.min(totalDuration, start + len));
    });
  } catch (e) {
    // Ignore audio context errors if browser blocks autoplay
  }
}

export function checkPendingReminders(
  blocks: ScheduledBlock[],
  alreadyNotifiedSet: Set<string>,
  onTrigger: (block: ScheduledBlock, minutesBefore: number) => void
): void {
  const now = new Date();
  const currentDayIndex = (now.getDay() + 6) % 7; // Mon = 0
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  for (const block of blocks) {
    if (block.dayOfWeek !== currentDayIndex || !block.reminderMinutes || block.reminderMinutes <= 0) {
      continue;
    }

    const reminderTriggerMinutes = block.startMinutes - block.reminderMinutes;
    const notificationKey = `${block.id}-${block.startMinutes}-${block.reminderMinutes}`;

    if (currentMinutes === reminderTriggerMinutes && !alreadyNotifiedSet.has(notificationKey)) {
      alreadyNotifiedSet.add(notificationKey);
      onTrigger(block, block.reminderMinutes);
    }
  }
}
