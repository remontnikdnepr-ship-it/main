import {
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Vibrate,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  BoxingConfig,
  BoxingPhase,
  formatCountdownTime,
  formatDurationShort,
} from '../types/timer';

interface BoxingPanelProps {
  config: BoxingConfig;
  phase: BoxingPhase;
  currentRound: number;
  remainingMs: number;
  isRunning: boolean;
  visualCueActive: boolean;
  onToggleStartPause: () => void;
  onReset: () => void;
  onRoundDurationChange: (seconds: number) => void;
  onRestDurationChange: (seconds: number) => void;
  onTotalRoundsChange: (rounds: number) => void;
  onSoundToggle: (enabled: boolean) => void;
  onVibrationToggle: (enabled: boolean) => void;
}

export function BoxingPanel({
  config,
  phase,
  currentRound,
  remainingMs,
  isRunning,
  visualCueActive,
  onToggleStartPause,
  onReset,
  onRoundDurationChange,
  onRestDurationChange,
  onTotalRoundsChange,
  onSoundToggle,
  onVibrationToggle,
}: BoxingPanelProps) {
  const canEditTiming = phase === 'idle' || phase === 'finished';

  const phaseTitle =
    phase === 'idle'
      ? `Раунд 1 из ${config.totalRounds}`
      : phase === 'round'
        ? `Раунд ${currentRound} из ${config.totalRounds}`
        : phase === 'rest'
          ? 'Отдых'
          : 'Тренировка завершена';

  const phaseSubtext =
    phase === 'idle'
      ? 'Готов к бою'
      : phase === 'round'
        ? isRunning
          ? 'Работа в ринге'
          : 'Пауза · Раунд'
        : phase === 'rest'
          ? isRunning
            ? `Восстановление · Далее раунд ${currentRound + 1}`
            : 'Пауза · Отдых'
          : 'Все раунды пройдены';

  const accentHex =
    phase === 'round'
      ? '#FF3B5C'
      : phase === 'rest'
        ? '#22C55E'
        : phase === 'finished'
          ? '#FFB020'
          : '#C8FF32';

  const totalPhaseMs =
    phase === 'rest'
      ? config.restDurationSec * 1000
      : phase === 'finished'
        ? 1
        : config.roundDurationSec * 1000;

  const progress =
    phase === 'idle'
      ? 1
      : phase === 'finished'
        ? 0
        : Math.max(0, Math.min(1, remainingMs / Math.max(1, totalPhaseMs)));

  const radius = 104;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference * (1 - progress);

  const startButtonLabel = isRunning
    ? 'Пауза'
    : phase === 'idle'
      ? 'Старт'
      : phase === 'finished'
        ? 'Начать заново'
        : 'Продолжить';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <section
        aria-label="Таймер боксёрских раундов"
        className="lg:col-span-7 rounded-3xl bg-[#171B24] border p-6 sm:p-8 transition-colors duration-200"
        style={{
          borderColor: visualCueActive
            ? accentHex
            : phase === 'idle'
              ? '#2A3142'
              : `${accentHex}70`,
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2A3142] pb-4">
          <div className="flex items-center gap-2.5">
            <span
              className="font-display text-2xl font-bold tracking-tight"
              style={{ color: accentHex }}
            >
              {phaseTitle}
            </span>
            <span aria-hidden="true" className="text-[#475569]">
              ·
            </span>
            <span className="text-sm text-[#94A3B8]">{phaseSubtext}</span>
          </div>

          <span className="text-xs text-[#94A3B8] font-timer whitespace-nowrap">
            {formatDurationShort(config.roundDurationSec)} / {formatDurationShort(config.restDurationSec)}
          </span>
        </div>

        <div className="py-8 flex flex-col items-center justify-center">
          <div className="relative w-[240px] h-[240px] sm:w-[264px] sm:h-[264px] flex items-center justify-center">
            <svg
              className="w-full h-full -rotate-90"
              viewBox="0 0 240 240"
              aria-hidden="true"
            >
              <circle
                cx="120"
                cy="120"
                r={radius}
                fill="none"
                stroke="#212734"
                strokeWidth="12"
              />
              <circle
                cx="120"
                cy="120"
                r={radius}
                fill="none"
                stroke={accentHex}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeOffset}
                className="transition-[stroke] duration-200"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
              <span className="font-timer text-5xl sm:text-6xl font-bold tracking-tight text-[#F8FAFC]">
                {formatCountdownTime(remainingMs)}
              </span>
              <span className="mt-2 text-xs text-[#94A3B8]">
                {phase === 'rest'
                  ? `отдых ${formatDurationShort(config.restDurationSec)}`
                  : `раунд ${formatDurationShort(config.roundDurationSec)}`}
              </span>
            </div>
          </div>

          <div
            className="mt-6 flex items-center justify-center gap-1.5 w-full max-w-sm"
            aria-label={`Прогресс по раундам: ${currentRound} из ${config.totalRounds}`}
          >
            {Array.from({ length: config.totalRounds }, (_, idx) => {
              const roundNum = idx + 1;
              let barColor = '#2A3142';
              if (phase === 'finished') {
                barColor = '#22C55E';
              } else if (phase !== 'idle') {
                if (roundNum < currentRound) barColor = '#22C55E';
                else if (roundNum === currentRound) {
                  barColor = phase === 'rest' ? '#22C55E' : accentHex;
                }
              }
              return (
                <div
                  key={roundNum}
                  className="h-1.5 flex-1 rounded-full transition-colors duration-200"
                  style={{ backgroundColor: barColor }}
                />
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <button
            type="button"
            onClick={onToggleStartPause}
            className={`sm:col-span-8 min-h-[56px] px-6 py-3 rounded-2xl font-semibold text-base flex items-center justify-center gap-2.5 transition-colors duration-150 cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C8FF32] ${
              isRunning
                ? 'bg-[#FFB020] text-[#1A1100] hover:bg-[#FFC04D]'
                : 'bg-[#C8FF32] text-[#0A0D06] hover:bg-[#D6FF66]'
            }`}
          >
            {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            <span>{startButtonLabel}</span>
          </button>

          <button
            type="button"
            onClick={onReset}
            disabled={phase === 'idle' && !isRunning}
            className="sm:col-span-4 min-h-[56px] px-4 py-3 rounded-2xl border border-[#2A3142] bg-[#0D0F14]/60 text-[#F8FAFC] hover:bg-[#212734] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-semibold transition-colors duration-150 cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C8FF32]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Сброс</span>
          </button>
        </div>
      </section>

      <section
        id="boxing-settings"
        aria-label="Параметры тренировки"
        className="lg:col-span-5 rounded-3xl bg-[#171B24] border border-[#2A3142] p-6 space-y-5"
      >
        <div className="flex items-center justify-between gap-2 border-b border-[#2A3142] pb-3.5">
          <h2 className="text-base font-semibold text-[#F8FAFC]">Параметры тренировки</h2>
          {!canEditTiming && (
            <span className="text-xs text-[#FFB020]">Сбросьте таймер для правки</span>
          )}
        </div>

        <StepperSetting
          label="Длительность раунда"
          valueLabel={formatDurationShort(config.roundDurationSec)}
          enabled={canEditTiming}
          canDecrease={config.roundDurationSec > 10}
          canIncrease={config.roundDurationSec < 600}
          onDecrease={() => onRoundDurationChange(config.roundDurationSec - 15)}
          onIncrease={() => onRoundDurationChange(config.roundDurationSec + 15)}
          presets={[
            { value: 60, label: '1 мин' },
            { value: 120, label: '2 мин' },
            { value: 180, label: '3 мин' },
            { value: 300, label: '5 мин' },
          ]}
          currentValue={config.roundDurationSec}
          onSelectPreset={onRoundDurationChange}
        />

        <div className="h-px bg-[#2A3142]/80" />

        <StepperSetting
          label="Отдых между раундами"
          valueLabel={formatDurationShort(config.restDurationSec)}
          enabled={canEditTiming}
          canDecrease={config.restDurationSec > 5}
          canIncrease={config.restDurationSec < 300}
          onDecrease={() => onRestDurationChange(config.restDurationSec - 15)}
          onIncrease={() => onRestDurationChange(config.restDurationSec + 15)}
          presets={[
            { value: 30, label: '30 сек' },
            { value: 45, label: '45 сек' },
            { value: 60, label: '1 мин' },
            { value: 90, label: '90 сек' },
          ]}
          currentValue={config.restDurationSec}
          onSelectPreset={onRestDurationChange}
        />

        <div className="h-px bg-[#2A3142]/80" />

        <StepperSetting
          label="Количество раундов"
          valueLabel={`${config.totalRounds}`}
          enabled={canEditTiming}
          canDecrease={config.totalRounds > 1}
          canIncrease={config.totalRounds < 15}
          onDecrease={() => onTotalRoundsChange(config.totalRounds - 1)}
          onIncrease={() => onTotalRoundsChange(config.totalRounds + 1)}
          presets={[
            { value: 3, label: '3' },
            { value: 5, label: '5' },
            { value: 8, label: '8' },
            { value: 12, label: '12' },
          ]}
          currentValue={config.totalRounds}
          onSelectPreset={onTotalRoundsChange}
        />

        <div className="h-px bg-[#2A3142]/80" />

        <div id="signals-settings" className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-sm text-[#F8FAFC]">
              {config.soundEnabled ? (
                <Volume2 className="w-4 h-4 text-[#C8FF32]" />
              ) : (
                <VolumeX className="w-4 h-4 text-[#94A3B8]" />
              )}
              <span>Звуковой сигнал (гонг)</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={config.soundEnabled}
              aria-label="Переключить звуковой сигнал"
              onClick={() => onSoundToggle(!config.soundEnabled)}
              className={`min-h-[44px] px-3 flex items-center cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C8FF32] rounded-xl`}
            >
              <span
                className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-150 flex items-center ${
                  config.soundEnabled ? 'bg-[#C8FF32] justify-end' : 'bg-[#2A3142] justify-start'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-[#0D0F14]" />
              </span>
            </button>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-sm text-[#F8FAFC]">
              <Vibrate
                className={`w-4 h-4 ${
                  config.vibrationEnabled ? 'text-[#C8FF32]' : 'text-[#94A3B8]'
                }`}
              />
              <span>Вибрация при смене фаз</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={config.vibrationEnabled}
              aria-label="Переключить вибрацию"
              onClick={() => onVibrationToggle(!config.vibrationEnabled)}
              className="min-h-[44px] px-3 flex items-center cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C8FF32] rounded-xl"
            >
              <span
                className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-150 flex items-center ${
                  config.vibrationEnabled
                    ? 'bg-[#C8FF32] justify-end'
                    : 'bg-[#2A3142] justify-start'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-[#0D0F14]" />
              </span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

interface StepperSettingProps {
  label: string;
  valueLabel: string;
  enabled: boolean;
  canDecrease: boolean;
  canIncrease: boolean;
  onDecrease: () => void;
  onIncrease: () => void;
  presets: Array<{ value: number; label: string }>;
  currentValue: number;
  onSelectPreset: (value: number) => void;
}

function StepperSetting({
  label,
  valueLabel,
  enabled,
  canDecrease,
  canIncrease,
  onDecrease,
  onIncrease,
  presets,
  currentValue,
  onSelectPreset,
}: StepperSettingProps) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-[#F8FAFC]">{label}</p>
          <p className="text-sm font-semibold font-timer text-[#C8FF32]">{valueLabel}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDecrease}
            disabled={!enabled || !canDecrease}
            aria-label={`Уменьшить: ${label}`}
            className="w-11 h-11 rounded-xl bg-[#212734] text-[#F8FAFC] hover:bg-[#2C3446] disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-center transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C8FF32]"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onIncrease}
            disabled={!enabled || !canIncrease}
            aria-label={`Увеличить: ${label}`}
            className="w-11 h-11 rounded-xl bg-[#212734] text-[#F8FAFC] hover:bg-[#2C3446] disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-center transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C8FF32]"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {presets.map((preset) => {
          const isSelected = currentValue === preset.value;
          return (
            <button
              key={preset.value}
              type="button"
              disabled={!enabled}
              onClick={() => onSelectPreset(preset.value)}
              className={`min-h-[40px] px-2 py-1.5 rounded-xl text-xs font-medium transition-colors duration-150 cursor-pointer whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C8FF32] ${
                isSelected
                  ? 'bg-[#C8FF32]/15 text-[#C8FF32] border border-[#C8FF32]/50'
                  : 'bg-[#0D0F14]/60 text-[#94A3B8] border border-[#2A3142] hover:text-[#F8FAFC]'
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
