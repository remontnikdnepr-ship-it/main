export type TimerMode = 'stopwatch' | 'boxing';

export type BoxingPhase = 'idle' | 'round' | 'rest' | 'finished';

export interface LapRecord {
  number: number;
  splitTimeMs: number;
  totalTimeMs: number;
}

export interface BoxingConfig {
  roundDurationSec: number;
  restDurationSec: number;
  totalRounds: number;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export function formatStopwatchTime(elapsedMs: number): string {
  const clamped = Math.max(0, elapsedMs);
  const totalTenths = Math.floor(clamped / 100);
  const tenths = totalTenths % 10;
  const totalSeconds = Math.floor(totalTenths / 10);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);

  const pad2 = (n: number) => String(n).padStart(2, '0');
  if (hours > 0) {
    return `${hours}:${pad2(minutes)}:${pad2(seconds)}.${tenths}`;
  }
  return `${pad2(totalMinutes)}:${pad2(seconds)}.${tenths}`;
}

export function formatCountdownTime(remainingMs: number): string {
  const clamped = Math.max(0, remainingMs);
  const displaySeconds = clamped === 0 ? 0 : Math.ceil(clamped / 1000);
  const minutes = Math.floor(displaySeconds / 60);
  const seconds = displaySeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function formatDurationShort(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  if (minutes > 0 && seconds === 0) return `${minutes} мин`;
  if (minutes > 0) return `${minutes}:${String(seconds).padStart(2, '0')}`;
  return `${seconds} сек`;
}
