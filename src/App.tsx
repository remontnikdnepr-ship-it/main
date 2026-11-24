import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, Swords, Timer } from 'lucide-react';
import { BoxingPanel } from './components/BoxingPanel';
import { StopwatchPanel } from './components/StopwatchPanel';
import { BoxingConfig, BoxingPhase, LapRecord, TimerMode } from './types/timer';
import { triggerBellCue } from './utils/audioFeedback';

const STORAGE_KEY = 'ring_timer_state_v1';

interface PersistedConfig {
  mode: TimerMode;
  boxingConfig: BoxingConfig;
}

const DEFAULT_BOXING_CONFIG: BoxingConfig = {
  roundDurationSec: 180,
  restDurationSec: 60,
  totalRounds: 3,
  soundEnabled: true,
  vibrationEnabled: true,
};

function loadSavedState(): PersistedConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { mode: 'boxing', boxingConfig: DEFAULT_BOXING_CONFIG };
    const parsed = JSON.parse(raw) as Partial<PersistedConfig>;
    return {
      mode: parsed.mode === 'stopwatch' ? 'stopwatch' : 'boxing',
      boxingConfig: {
        ...DEFAULT_BOXING_CONFIG,
        ...(parsed.boxingConfig ?? {}),
      },
    };
  } catch {
    return { mode: 'boxing', boxingConfig: DEFAULT_BOXING_CONFIG };
  }
}

export default function App() {
  const initial = useRef<PersistedConfig | null>(null);
  if (!initial.current) {
    initial.current = loadSavedState();
  }

  const [mode, setMode] = useState<TimerMode>(initial.current.mode);

  // Stopwatch state
  const [swElapsedMs, setSwElapsedMs] = useState(0);
  const [swRunning, setSwRunning] = useState(false);
  const [swLaps, setSwLaps] = useState<LapRecord[]>([]);
  const swAccumulatedRef = useRef(0);
  const swStartPerfRef = useRef<number | null>(null);

  // Boxing timer state
  const [boxingConfig, setBoxingConfig] = useState<BoxingConfig>(
    initial.current.boxingConfig
  );
  const [boxingPhase, setBoxingPhase] = useState<BoxingPhase>('idle');
  const [currentRound, setCurrentRound] = useState(1);
  const [remainingMs, setRemainingMs] = useState(
    initial.current.boxingConfig.roundDurationSec * 1000
  );
  const [boxingRunning, setBoxingRunning] = useState(false);
  const [visualCueActive, setVisualCueActive] = useState(false);

  const boxingEndPerfRef = useRef<number | null>(null);
  const boxingPhaseRef = useRef<BoxingPhase>('idle');
  const currentRoundRef = useRef(1);
  const boxingConfigRef = useRef(boxingConfig);

  useEffect(() => {
    boxingConfigRef.current = boxingConfig;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ mode, boxingConfig })
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [mode, boxingConfig]);

  const flashVisualCue = useCallback(() => {
    setVisualCueActive(true);
    window.setTimeout(() => setVisualCueActive(false), 380);
  }, []);

  // Stopwatch drift-free ticker
  useEffect(() => {
    if (!swRunning) return;
    const id = window.setInterval(() => {
      if (swStartPerfRef.current !== null) {
        setSwElapsedMs(
          swAccumulatedRef.current + (performance.now() - swStartPerfRef.current)
        );
      }
    }, 35);
    return () => window.clearInterval(id);
  }, [swRunning]);

  // Boxing drift-free ticker
  useEffect(() => {
    if (!boxingRunning) return;
    const id = window.setInterval(() => {
      const endTime = boxingEndPerfRef.current;
      if (endTime === null) return;
      const now = performance.now();
      const left = endTime - now;

      if (left > 0) {
        setRemainingMs(left);
        return;
      }

      const cfg = boxingConfigRef.current;
      const activePhase = boxingPhaseRef.current;
      const activeRound = currentRoundRef.current;

      if (activePhase === 'round') {
        if (activeRound < cfg.totalRounds) {
          if (cfg.restDurationSec > 0) {
            const restMs = cfg.restDurationSec * 1000;
            boxingPhaseRef.current = 'rest';
            boxingEndPerfRef.current = now + restMs;
            setBoxingPhase('rest');
            setRemainingMs(restMs);
            triggerBellCue('roundEnd', cfg.soundEnabled, cfg.vibrationEnabled);
            flashVisualCue();
          } else {
            const nextRound = activeRound + 1;
            const roundMs = cfg.roundDurationSec * 1000;
            currentRoundRef.current = nextRound;
            boxingPhaseRef.current = 'round';
            boxingEndPerfRef.current = now + roundMs;
            setCurrentRound(nextRound);
            setBoxingPhase('round');
            setRemainingMs(roundMs);
            triggerBellCue('roundStart', cfg.soundEnabled, cfg.vibrationEnabled);
            flashVisualCue();
          }
        } else {
          boxingPhaseRef.current = 'finished';
          boxingEndPerfRef.current = null;
          setBoxingPhase('finished');
          setRemainingMs(0);
          setBoxingRunning(false);
          triggerBellCue('workoutFinished', cfg.soundEnabled, cfg.vibrationEnabled);
          flashVisualCue();
        }
      } else if (activePhase === 'rest') {
        const nextRound = Math.min(activeRound + 1, cfg.totalRounds);
        const roundMs = cfg.roundDurationSec * 1000;
        currentRoundRef.current = nextRound;
        boxingPhaseRef.current = 'round';
        boxingEndPerfRef.current = now + roundMs;
        setCurrentRound(nextRound);
        setBoxingPhase('round');
        setRemainingMs(roundMs);
        triggerBellCue('roundStart', cfg.soundEnabled, cfg.vibrationEnabled);
        flashVisualCue();
      }
    }, 45);

    return () => window.clearInterval(id);
  }, [boxingRunning, flashVisualCue]);

  const handleToggleStopwatch = useCallback(() => {
    if (swRunning) {
      if (swStartPerfRef.current !== null) {
        swAccumulatedRef.current += performance.now() - swStartPerfRef.current;
        swStartPerfRef.current = null;
      }
      setSwElapsedMs(swAccumulatedRef.current);
      setSwRunning(false);
    } else {
      swStartPerfRef.current = performance.now();
      setSwRunning(true);
    }
  }, [swRunning]);

  const handleResetStopwatch = useCallback(() => {
    swAccumulatedRef.current = 0;
    swStartPerfRef.current = null;
    setSwRunning(false);
    setSwElapsedMs(0);
    setSwLaps([]);
  }, []);

  const handleRecordLap = useCallback(() => {
    if (!swRunning && swElapsedMs === 0) return;
    const currentTotal =
      swStartPerfRef.current !== null
        ? swAccumulatedRef.current + (performance.now() - swStartPerfRef.current)
        : swElapsedMs;

    setSwElapsedMs(currentTotal);
    setSwLaps((prev) => {
      const prevTotal = prev[0]?.totalTimeMs ?? 0;
      const split = Math.max(0, currentTotal - prevTotal);
      return [
        { number: prev.length + 1, splitTimeMs: split, totalTimeMs: currentTotal },
        ...prev,
      ];
    });
  }, [swRunning, swElapsedMs]);

  const handleToggleBoxing = useCallback(() => {
    if (boxingRunning) {
      if (boxingEndPerfRef.current !== null) {
        setRemainingMs(Math.max(0, boxingEndPerfRef.current - performance.now()));
      }
      boxingEndPerfRef.current = null;
      setBoxingRunning(false);
      return;
    }

    const now = performance.now();
    const isFreshStart = boxingPhase === 'idle' || boxingPhase === 'finished';

    if (isFreshStart) {
      const roundMs = boxingConfig.roundDurationSec * 1000;
      boxingPhaseRef.current = 'round';
      currentRoundRef.current = 1;
      boxingEndPerfRef.current = now + roundMs;
      setBoxingPhase('round');
      setCurrentRound(1);
      setRemainingMs(roundMs);
      setBoxingRunning(true);
      triggerBellCue(
        'roundStart',
        boxingConfig.soundEnabled,
        boxingConfig.vibrationEnabled
      );
      flashVisualCue();
    } else {
      const resumeMs = Math.max(100, remainingMs);
      boxingEndPerfRef.current = now + resumeMs;
      setBoxingRunning(true);
    }
  }, [
    boxingRunning,
    boxingPhase,
    boxingConfig.roundDurationSec,
    boxingConfig.soundEnabled,
    boxingConfig.vibrationEnabled,
    remainingMs,
    flashVisualCue,
  ]);

  const handleResetBoxing = useCallback(() => {
    boxingEndPerfRef.current = null;
    boxingPhaseRef.current = 'idle';
    currentRoundRef.current = 1;
    setBoxingRunning(false);
    setBoxingPhase('idle');
    setCurrentRound(1);
    setRemainingMs(boxingConfig.roundDurationSec * 1000);
  }, [boxingConfig.roundDurationSec]);

  const handleRoundDurationChange = (seconds: number) => {
    const clamped = Math.max(10, Math.min(600, seconds));
    setBoxingConfig((prev) => ({ ...prev, roundDurationSec: clamped }));
    if (boxingPhase === 'idle') {
      setRemainingMs(clamped * 1000);
    }
  };

  const handleRestDurationChange = (seconds: number) => {
    const clamped = Math.max(5, Math.min(300, seconds));
    setBoxingConfig((prev) => ({ ...prev, restDurationSec: clamped }));
  };

  const handleTotalRoundsChange = (rounds: number) => {
    const clamped = Math.max(1, Math.min(15, rounds));
    setBoxingConfig((prev) => ({ ...prev, totalRounds: clamped }));
  };

  const handleTestBell = () => {
    triggerBellCue('roundStart', true, boxingConfig.vibrationEnabled);
    flashVisualCue();
  };

  return (
    <div className="min-h-screen bg-[#0D0F14] text-[#F8FAFC] flex flex-col">
      <header className="border-b border-[#2A3142]/80 bg-[#0D0F14]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          <a
            href="#top"
            className="font-display text-2xl font-bold tracking-tight text-[#F8FAFC] whitespace-nowrap shrink-0"
          >
            Ринг Таймер
          </a>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#94A3B8]">
            <a
              href="#timer-stage"
              className="hover:text-[#F8FAFC] transition-colors whitespace-nowrap shrink-0"
            >
              Таймер
            </a>
            <a
              href="#workspace-panel"
              className="hover:text-[#F8FAFC] transition-colors whitespace-nowrap shrink-0"
            >
              {mode === 'boxing' ? 'Параметры' : 'Круги'}
            </a>
            <a
              href="#mode-switcher"
              className="hover:text-[#F8FAFC] transition-colors whitespace-nowrap shrink-0"
            >
              Режимы
            </a>
            <a
              href="#top"
              className="hover:text-[#F8FAFC] transition-colors whitespace-nowrap shrink-0"
            >
              Начало
            </a>
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={handleTestBell}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-[#212734] hover:bg-[#2B3344] text-[#F8FAFC] text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C8FF32]"
            >
              <Bell className="w-3.5 h-3.5 text-[#C8FF32]" />
              <span>Тест гонга</span>
            </button>
          </div>
        </div>
      </header>

      <main id="top" className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#F8FAFC] text-balance">
              {mode === 'boxing'
                ? 'Интервальный таймер для боксёрских раундов'
                : 'Спортивный секундомер с фиксацией кругов'}
            </h1>
            <p className="mt-1 text-sm text-[#94A3B8]">
              {mode === 'boxing'
                ? 'Звуковой гонг на старт и окончание раунда · Сохранение настроек в браузере'
                : 'Точный отсчёт до десятых долей секунды · Прокручиваемый журнал отрезков'}
            </p>
          </div>

          <div
            id="mode-switcher"
            role="tablist"
            aria-label="Выбор режима таймера"
            className="inline-grid grid-cols-2 p-1 rounded-2xl bg-[#171B24] border border-[#2A3142] shrink-0"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'stopwatch'}
              onClick={() => setMode('stopwatch')}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0 ${
                mode === 'stopwatch'
                  ? 'bg-[#C8FF32] text-[#0A0D06]'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              <Timer className="w-4 h-4" />
              <span>Секундомер</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={mode === 'boxing'}
              onClick={() => setMode('boxing')}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0 ${
                mode === 'boxing'
                  ? 'bg-[#C8FF32] text-[#0A0D06]'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              <Swords className="w-4 h-4" />
              <span>Боксёрские раунды</span>
            </button>
          </div>
        </div>

        <div id="timer-stage" className="scroll-mt-20">
          <div id="workspace-panel" className="scroll-mt-20">
            {mode === 'stopwatch' ? (
              <StopwatchPanel
                elapsedMs={swElapsedMs}
                isRunning={swRunning}
                laps={swLaps}
                onToggleStartPause={handleToggleStopwatch}
                onReset={handleResetStopwatch}
                onRecordLap={handleRecordLap}
              />
            ) : (
              <BoxingPanel
                config={boxingConfig}
                phase={boxingPhase}
                currentRound={currentRound}
                remainingMs={remainingMs}
                isRunning={boxingRunning}
                visualCueActive={visualCueActive}
                onToggleStartPause={handleToggleBoxing}
                onReset={handleResetBoxing}
                onRoundDurationChange={handleRoundDurationChange}
                onRestDurationChange={handleRestDurationChange}
                onTotalRoundsChange={handleTotalRoundsChange}
                onSoundToggle={(enabled) =>
                  setBoxingConfig((prev) => ({ ...prev, soundEnabled: enabled }))
                }
                onVibrationToggle={(enabled) =>
                  setBoxingConfig((prev) => ({ ...prev, vibrationEnabled: enabled }))
                }
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
