import { Flag, Pause, Play, RotateCcw } from 'lucide-react';
import { LapRecord, formatStopwatchTime } from '../types/timer';

interface StopwatchPanelProps {
  elapsedMs: number;
  isRunning: boolean;
  laps: LapRecord[];
  onToggleStartPause: () => void;
  onReset: () => void;
  onRecordLap: () => void;
}

export function StopwatchPanel({
  elapsedMs,
  isRunning,
  laps,
  onToggleStartPause,
  onReset,
  onRecordLap,
}: StopwatchPanelProps) {
  const statusLabel = isRunning
    ? 'Идёт отсчёт'
    : elapsedMs > 0
      ? 'Пауза'
      : 'Готов к старту';

  const statusColorClass = isRunning
    ? 'text-[#C8FF32]'
    : elapsedMs > 0
      ? 'text-[#FFB020]'
      : 'text-[#94A3B8]';

  const fastestSplit =
    laps.length > 1 ? Math.min(...laps.map((lap) => lap.splitTimeMs)) : null;
  const slowestSplit =
    laps.length > 1 ? Math.max(...laps.map((lap) => lap.splitTimeMs)) : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <section
        aria-label="Секундомер"
        className={`lg:col-span-7 rounded-3xl bg-[#171B24] border p-6 sm:p-8 transition-colors duration-200 ${
          isRunning ? 'border-[#C8FF32]/45' : 'border-[#2A3142]'
        }`}
      >
        <div className="flex items-center justify-between gap-4 border-b border-[#2A3142] pb-4">
          <div className="flex items-center gap-2 text-sm">
            <span className={`font-semibold ${statusColorClass}`}>{statusLabel}</span>
            <span aria-hidden="true" className="text-[#475569]">
              ·
            </span>
            <span className="text-[#94A3B8]">Точность 0.1 с</span>
          </div>
          <span className="text-xs text-[#94A3B8] font-timer whitespace-nowrap">
            Кругов: {laps.length}
          </span>
        </div>

        <div className="py-10 sm:py-14 flex flex-col items-center justify-center">
          <div
            className="font-timer text-[3.5rem] sm:text-[5rem] lg:text-[5.5rem] leading-none font-bold tracking-tight text-[#F8FAFC] select-none"
            aria-live="off"
          >
            {formatStopwatchTime(elapsedMs)}
          </div>
          <p className="mt-4 text-sm text-[#94A3B8] text-center">
            {laps.length > 0
              ? `Последний круг: +${formatStopwatchTime(laps[0].splitTimeMs)}`
              : 'Фиксируйте промежуточные отрезки кнопкой «Круг»'}
          </p>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={onToggleStartPause}
            className={`w-full min-h-[56px] px-6 py-3 rounded-2xl font-semibold text-base flex items-center justify-center gap-2.5 transition-colors duration-150 cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C8FF32] ${
              isRunning
                ? 'bg-[#FFB020] text-[#1A1100] hover:bg-[#FFC04D]'
                : 'bg-[#C8FF32] text-[#0A0D06] hover:bg-[#D6FF66]'
            }`}
          >
            {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            <span>
              {isRunning ? 'Пауза' : elapsedMs > 0 ? 'Продолжить' : 'Старт'}
            </span>
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onReset}
              disabled={elapsedMs === 0 && laps.length === 0 && !isRunning}
              className="min-h-[48px] px-4 py-2.5 rounded-xl border border-[#2A3142] bg-[#0D0F14]/60 text-[#F8FAFC] hover:bg-[#212734] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-semibold transition-colors duration-150 cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C8FF32]"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Сброс</span>
            </button>

            <button
              type="button"
              onClick={onRecordLap}
              disabled={!isRunning && elapsedMs === 0}
              className="min-h-[48px] px-4 py-2.5 rounded-xl bg-[#212734] text-[#F8FAFC] hover:bg-[#2B3344] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-semibold transition-colors duration-150 cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C8FF32]"
            >
              <Flag className="w-4 h-4 text-[#C8FF32]" />
              <span>Круг</span>
            </button>
          </div>
        </div>
      </section>

      <section
        id="laps-history"
        aria-label="Список кругов"
        className="lg:col-span-5 rounded-3xl bg-[#171B24] border border-[#2A3142] flex flex-col min-h-[360px] lg:h-[468px]"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A3142]">
          <h2 className="text-base font-semibold text-[#F8FAFC]">Зафиксированные круги</h2>
          <span className="text-xs text-[#94A3B8]">
            {laps.length === 0 ? 'Пусто' : `Записей: ${laps.length}`}
          </span>
        </div>

        {laps.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
            <p className="text-sm text-[#94A3B8] max-w-xs leading-relaxed">
              Запустите секундомер и нажимайте «Круг», чтобы сохранять время каждого отрезка.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-12 px-6 py-2.5 text-xs font-medium text-[#94A3B8] border-b border-[#2A3142]/70 sticky top-0 bg-[#171B24]">
              <span className="col-span-3">Круг</span>
              <span className="col-span-5 text-right">Отрезок</span>
              <span className="col-span-4 text-right">Общее</span>
            </div>

            <ul className="divide-y divide-[#2A3142]/60">
              {laps.map((lap) => {
                const isFastest =
                  fastestSplit !== null &&
                  slowestSplit !== null &&
                  fastestSplit !== slowestSplit &&
                  lap.splitTimeMs === fastestSplit;
                const isSlowest =
                  fastestSplit !== null &&
                  slowestSplit !== null &&
                  fastestSplit !== slowestSplit &&
                  lap.splitTimeMs === slowestSplit;

                return (
                  <li
                    key={lap.number}
                    className="grid grid-cols-12 items-center px-6 py-3.5 text-sm"
                  >
                    <div className="col-span-3 flex items-center gap-2">
                      <span className="font-timer font-semibold text-[#C8FF32]">
                        #{lap.number}
                      </span>
                      {isFastest && (
                        <span className="text-[11px] text-[#22C55E]">лучший</span>
                      )}
                      {isSlowest && (
                        <span className="text-[11px] text-[#FF3B5C]">медл.</span>
                      )}
                    </div>
                    <span className="col-span-5 text-right font-timer text-[#F8FAFC]">
                      +{formatStopwatchTime(lap.splitTimeMs)}
                    </span>
                    <span className="col-span-4 text-right font-timer text-[#94A3B8]">
                      {formatStopwatchTime(lap.totalTimeMs)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
