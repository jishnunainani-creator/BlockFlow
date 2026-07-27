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

export function playReminderChime(): void {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5 note
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); // A5 note

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.5);
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
