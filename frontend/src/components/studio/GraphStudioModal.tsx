import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  RotateCcw,
  Sliders,
  Database,
  Compass,
} from 'lucide-react';
import { CHART_REGISTRY, type ChartDefinition } from './chartRegistry';
import type { AnalysisResponse, CleaningResponse } from '../../types/dataset';
import type { PipelineExecutionEvent } from '../../types/engine';
import ChartRenderer from './ChartRenderer';
import { soundManager } from '../../audio/soundManager';

interface GraphStudioModalProps {
  chartId: number | null;
  onClose: () => void;
  analysis: AnalysisResponse | null;
  cleanResult: CleaningResponse | null;
  events: PipelineExecutionEvent[];
}

export default function GraphStudioModal({
  chartId,
  onClose,
  analysis,
  cleanResult,
  events,
}: GraphStudioModalProps) {
  const [userChartId, setUserChartId] = useState<number | null>(null);
  const [prevChartId, setPrevChartId] = useState<number | null>(chartId);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Sync state when chartId prop changes
  if (chartId !== prevChartId) {
    setPrevChartId(chartId);
    setUserChartId(null);
  }

  const currentId = userChartId ?? (chartId ?? 1);

  const chart: ChartDefinition = useMemo(() => {
    return CHART_REGISTRY.find((c) => c.id === currentId) || CHART_REGISTRY[0];
  }, [currentId]);

  const columns = useMemo(() => analysis?.dataset?.columns || [], [analysis]);
  const numericCols = useMemo(() => analysis?.statistics?.numeric_columns || [], [analysis]);
  const nonNumericCols = useMemo(() => analysis?.statistics?.non_numeric_columns || [], [analysis]);

  // Dynamic axis selections derived without effect setState
  const defaultX = nonNumericCols[0] || columns[0] || '';
  const defaultY = numericCols[0] || '';

  const [userSelectedX, setUserSelectedX] = useState<string | null>(null);
  const [userSelectedY, setUserSelectedY] = useState<string | null>(null);

  const selectedX = (userSelectedX && columns.includes(userSelectedX)) ? userSelectedX : defaultX;
  const selectedY = (userSelectedY && numericCols.includes(userSelectedY)) ? userSelectedY : defaultY;

  // Lock body scroll and restore on unmount
  useEffect(() => {
    if (chartId === null) return;
    const previousOverflow = document.body.style.overflow;
    const scrollY = window.scrollY;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
      window.scrollTo(0, scrollY);
    };
  }, [chartId]);

  // Keyboard navigation: Escape closes, ArrowLeft/Right cycles charts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        setUserChartId((prev) => {
          const cur = prev ?? (chartId ?? 1);
          return cur > 1 ? cur - 1 : 115;
        });
      } else if (e.key === 'ArrowRight') {
        setUserChartId((prev) => {
          const cur = prev ?? (chartId ?? 1);
          return cur < 115 ? cur + 1 : 1;
        });
      }
    },
    [onClose, chartId]
  );

  useEffect(() => {
    if (chartId !== null) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [chartId, handleKeyDown]);

  if (chartId === null) return null;

  const handlePrev = () => {
    soundManager.playClick();
    setUserChartId(currentId > 1 ? currentId - 1 : 115);
  };

  const handleNext = () => {
    soundManager.playClick();
    setUserChartId(currentId < 115 ? currentId + 1 : 1);
  };

  const handleReset = () => {
    soundManager.playClick();
    setUserSelectedX(null);
    setUserSelectedY(null);
  };

  const isImplemented = chart.status === 'implemented';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/90 backdrop-blur-md animate-in fade-in select-none">
      <div
        className={`relative w-full rounded-2xl border border-white/20 shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${
          isFullscreen ? 'h-full max-w-full' : 'h-[92vh] max-w-6xl'
        }`}
        style={{ background: 'rgba(4, 9, 22, 0.98)' }}
      >
        {/* Top Header Bar */}
        <header className="px-6 py-4 border-b border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          {/* Left: Chart Identity & Category */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-[#00f0ff] font-mono font-bold text-sm shadow-lg shadow-blue-500/20">
              #{chart.id}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#f8fafc] font-mono tracking-tight">
                  {chart.name}
                </h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-semibold ${
                    isImplemented
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {chart.statusLabel}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#94a3b8] mt-0.5 font-mono">
                <span>{chart.categoryName}</span>
                <span>•</span>
                <span className="text-[#64748b]">{chart.description}</span>
              </div>
            </div>
          </div>

          {/* Right: Controls & Navigation */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            {/* Quick Prev / Next */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.08]">
              <button
                type="button"
                onClick={handlePrev}
                className="p-1 rounded-lg hover:bg-white/10 text-[#94a3b8] hover:text-[#f8fafc] transition-colors cursor-pointer"
                title="Previous Visualization (ArrowLeft)"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-[11px] font-mono text-[#cbd5e1] px-1">
                {chart.id} / 115
              </span>
              <button
                type="button"
                onClick={handleNext}
                className="p-1 rounded-lg hover:bg-white/10 text-[#94a3b8] hover:text-[#f8fafc] transition-colors cursor-pointer"
                title="Next Visualization (ArrowRight)"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Reset View */}
            <button
              type="button"
              onClick={handleReset}
              className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[#94a3b8] hover:text-[#f8fafc] transition-colors cursor-pointer"
              title="Reset Axes & Perspective"
            >
              <RotateCcw size={15} />
            </button>

            {/* Fullscreen Expand */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[#94a3b8] hover:text-[#f8fafc] transition-colors cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Expand Fullscreen'}
            >
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[#94a3b8] hover:text-[#f8fafc] transition-colors cursor-pointer"
              title="Close Viewer (Esc)"
            >
              <X size={15} />
            </button>
          </div>
        </header>

        {/* Secondary Toolbar: Dynamic Column Selectors & Dataset Context */}
        <div className="px-6 py-2.5 bg-white/[0.02] border-b border-white/[0.04] flex flex-wrap items-center justify-between gap-3 text-xs font-mono shrink-0">
          {/* Active Dataset Pill */}
          <div className="flex items-center gap-2 text-[#94a3b8]">
            <Database size={13} className="text-[#00f0ff]" />
            <span>Dataset:</span>
            <span className="text-[#f8fafc] font-semibold">
              {analysis?.dataset?.file_name ?? 'Active Matrix Stream'}
            </span>
            <span className="text-[#64748b]">
              ({analysis?.dataset?.row_count ?? 0} rows × {columns.length} cols)
            </span>
          </div>

          {/* Dynamic Column Selectors for interactive charts */}
          {columns.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Sliders size={12} className="text-[#64748b]" />
                <span className="text-[#94a3b8] text-[11px]">X-Axis:</span>
                <select
                  value={selectedX}
                  onChange={(e) => setUserSelectedX(e.target.value)}
                  className="px-2 py-0.5 rounded-lg bg-black/50 border border-white/10 text-xs text-[#00f0ff] outline-none cursor-pointer"
                >
                  {columns.map((c) => (
                    <option key={`x-${c}`} value={c} className="bg-[#050b18] text-[#f8fafc]">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {numericCols.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[#94a3b8] text-[11px]">Y-Axis:</span>
                  <select
                    value={selectedY}
                    onChange={(e) => setUserSelectedY(e.target.value)}
                    className="px-2 py-0.5 rounded-lg bg-black/50 border border-white/10 text-xs text-[#00f0ff] outline-none cursor-pointer"
                  >
                    {numericCols.map((c) => (
                      <option key={`y-${c}`} value={c} className="bg-[#050b18] text-[#f8fafc]">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Main Chart Stage */}
        <main className="flex-1 w-full min-h-0 relative p-4 sm:p-6 overflow-hidden flex flex-col justify-center">
          <ChartRenderer
            chart={chart}
            analysis={analysis}
            cleanResult={cleanResult}
            events={events}
            selectedX={selectedX}
            selectedY={selectedY}
          />
        </main>

        {/* Footer Bar */}
        <footer className="px-6 py-2.5 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-[#64748b] shrink-0">
          <div className="flex items-center gap-2">
            <Compass size={12} className="text-[#00f0ff]" />
            <span>Interactive Graph Studio Engine</span>
          </div>
          <span>Use ← / → Arrow Keys to browse all 115 charts • Press Esc to close</span>
        </footer>
      </div>
    </div>
  );
}

