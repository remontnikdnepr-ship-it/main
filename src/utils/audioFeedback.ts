let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;

  if (!sharedAudioCtx) {
    sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

function strikeBoxingBell(ctx: AudioContext, startAt: number, decaySec = 1.25, gainLevel = 0.28) {
  const partials = [
    { freq: 720, amp: 1.0 },
    { freq: 1095, amp: 0.65 },
    { freq: 1580, amp: 0.42 },
    { freq: 2240, amp: 0.24 },
  ];

  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, startAt);
  master.gain.exponentialRampToValueAtTime(gainLevel, startAt + 0.008);
  master.gain.exponentialRampToValueAtTime(0.0001, startAt + decaySec);
  master.connect(ctx.destination);

  partials.forEach(({ freq, amp }) => {
    const osc = ctx.createOscillator();
    const partialGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startAt);
    partialGain.gain.setValueAtTime(amp, startAt);
    osc.connect(partialGain);
    partialGain.connect(master);
    osc.start(startAt);
    osc.stop(startAt + decaySec + 0.05);
  });
}

export function triggerBellCue(
  kind: 'roundStart' | 'roundEnd' | 'workoutFinished',
  soundEnabled: boolean,
  vibrationEnabled: boolean
) {
  if (soundEnabled) {
    const ctx = getAudioContext();
    if (ctx) {
      const now = ctx.currentTime;
      if (kind === 'roundStart') {
        strikeBoxingBell(ctx, now, 1.15, 0.3);
      } else if (kind === 'roundEnd') {
        strikeBoxingBell(ctx, now, 0.9, 0.28);
        strikeBoxingBell(ctx, now + 0.22, 1.15, 0.28);
      } else {
        strikeBoxingBell(ctx, now, 0.85, 0.28);
        strikeBoxingBell(ctx, now + 0.2, 0.85, 0.28);
        strikeBoxingBell(ctx, now + 0.4, 1.4, 0.32);
      }
    }
  }

  if (vibrationEnabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      if (kind === 'roundStart') {
        navigator.vibrate(200);
      } else if (kind === 'roundEnd') {
        navigator.vibrate([160, 80, 160]);
      } else {
        navigator.vibrate([200, 90, 200, 90, 320]);
      }
    } catch {
      // Ignore vibration blocks on unsupported browsers
    }
  }
}
