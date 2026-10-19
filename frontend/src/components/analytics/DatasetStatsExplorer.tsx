import { useState, useMemo } from 'react';
import { TrendingUp, Layers, Maximize2, BarChart2, Box } from 'lucide-react';
import type { AnalysisResponse } from '../../types/dataset';
import { calculateHistogramBins } from '../../utils/mathStats';

interface DatasetStatsExplorerProps {
  analysis: AnalysisResponse | null;
  onOpenChart: (chartId: number) => void;
}

export default function DatasetStatsExplorer({
  analysis,
  onOpenChart,
}: DatasetStatsExplorerProps) {
  const numericColumns = useMemo(() => {
    return analysis?.statistics?.numeric_columns || [];
  }, [analysis]);

  const [selectedColumn, setSelectedColumn] = useState<string>(() => {
    return numericColumns[0] || '';
  });

  // Sync selectedColumn if numericColumns change
  const activeCol = numericColumns.includes(selectedColumn)
    ? selectedColumn
    : numericColumns[0] || '';

  const summary = analysis?.statistics?.numerical_summary?.[activeCol];
  const previewRecords = useMemo(() => analysis?.dataset?.preview || [], [analysis]);

  // Calculate histogram from preview data values
  const bins = useMemo(() => {
    if (!activeCol || previewRecords.length === 0) return [];
    const values = previewRecords
      .map((r) => r[activeCol])
      .filter((v): v is number => typeof v === 'number' && !isNaN(v) && isFinite(v));
    if (values.length === 0) return [];
    return calculateHistogramBins(values, 8);
  }, [activeCol, previewRecords]);

  const maxBinCount = Math.max(1, ...bins.map((b) => b.count));

  if (!analysis || numericColumns.length === 0) {
    return (
      <div className="midnight-card rounded-2xl p-6 flex flex-col items-center justify-center min-h-[300px] text-center select-none">
        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[#00f0ff] mb-3">
          <Layers size={22} />
        </div>
        <h4 className="text-sm font-semibold text-[#f8fafc]">Numeric Feature Explorer</h4>
        <p className="text-xs text-[#64748b] max-w-sm mt-1">
          {!analysis
            ? 'Ingest a CSV or load sample data to explore statistical feature distributions and moments.'
            : 'No numeric features detected in this dataset.'}
        </p>
      </div>
    );
  }

  return (
    <div
      onClick={() => onOpenChart(17)}
      className="midnight-card rounded-2xl p-5 flex flex-col justify-between h-full select-none cursor-pointer group hover:border-blue-500/40 transition-all"
    >
      {/* Header with Column Selector & Studio Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <TrendingUp size={16} className="text-[#00f0ff]" />
          <h3 className="text-sm font-semibold text-[#f8fafc] tracking-wide">
            Feature Moments & Histogram
          </h3>
          <select
            value={activeCol}
            onChange={(e) => {
              e.stopPropagation();
              setSelectedColumn(e.target.value);
            }}
            onClick={(e) => e.stopPropagation()}
            className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.12] text-xs font-mono text-[#00f0ff] outline-none cursor-pointer hover:border-blue-500/50"
          >
            {numericColumns.map((col) => (
              <option key={col} value={col} className="bg-[#0b1329] text-[#f8fafc]">
                {col}
              </option>
            ))}
          </select>
        </div>

        {/* Studio Launchers */}
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onOpenChart(17)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-[11px] font-mono text-[#00f0ff] transition-all cursor-pointer"
            title="Inspect Histogram #17 in Graph Studio"
          >
            <BarChart2 size={12} />
            <span>#17 Histogram</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenChart(18)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-[11px] font-mono text-[#818cf8] transition-all cursor-pointer"
            title="Inspect Box Plot #18 in Graph Studio"
          >
            <Box size={12} />
            <span>#18 Box Plot</span>
          </button>
        </div>
      </div>

      {/* 5-Number Summary Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 my-3">
        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] text-center">
          <span className="text-[10px] text-[#64748b] uppercase block">Mean</span>
          <span className="text-xs font-bold font-mono text-[#f8fafc]">
            {summary?.mean != null ? summary.mean.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] text-center">
          <span className="text-[10px] text-[#64748b] uppercase block">Median</span>
          <span className="text-xs font-bold font-mono text-[#00f0ff]">
            {summary?.median != null ? summary.median.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] text-center">
          <span className="text-[10px] text-[#64748b] uppercase block">Std Dev</span>
          <span className="text-xs font-bold font-mono text-amber-400">
            {summary?.standard_deviation != null ? summary.standard_deviation.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] text-center">
          <span className="text-[10px] text-[#64748b] uppercase block">Minimum</span>
          <span className="text-xs font-bold font-mono text-[#94a3b8]">
            {summary?.minimum != null ? summary.minimum.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] text-center">
          <span className="text-[10px] text-[#64748b] uppercase block">Maximum</span>
          <span className="text-xs font-bold font-mono text-[#94a3b8]">
            {summary?.maximum != null ? summary.maximum.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] text-center">
          <span className="text-[10px] text-[#64748b] uppercase block">Sample N</span>
          <span className="text-xs font-bold font-mono text-[#f8fafc]">
            {summary?.count != null ? summary.count.toLocaleString() : '—'}
          </span>
        </div>
      </div>

      {/* Distribution Histogram preview */}
      <div className="mt-1 pt-2">
        <div className="flex items-center justify-between text-[11px] text-[#64748b] mb-1.5 px-1">
          <span>SAMPLE FREQUENCY HISTOGRAM</span>
          <span className="font-mono text-[10px]">
            {bins.length} BINS ({previewRecords.length} PREVIEW ROWS)
          </span>
        </div>

        <div className="h-28 flex items-end gap-1.5 px-2 py-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
          {bins.map((bin, idx) => {
            const heightPct = Math.max(8, Math.round((bin.count / maxBinCount) * 100));
            const isTop = bin.count === maxBinCount && bin.count > 0;

            return (
              <div
                key={idx}
                className="flex-1 flex flex-col items-center justify-end h-full group/bar relative cursor-pointer"
              >
                <div className="absolute -top-10 opacity-0 group-hover/bar:opacity-100 transition-opacity bg-[#030712] border border-white/20 rounded-md px-2 py-1 text-[10px] font-mono text-white pointer-events-none whitespace-nowrap z-20 shadow-xl">
                  [{bin.binStart.toFixed(1)} - {bin.binEnd.toFixed(1)}]: {bin.count} rows ({bin.percentage.toFixed(0)}%)
                </div>

                <div
                  className="w-full rounded-t-sm transition-all duration-300 group-hover/bar:brightness-125"
                  style={{
                    height: `${heightPct}%`,
                    background: isTop
                      ? 'linear-gradient(180deg, #00f0ff 0%, #2563eb 100%)'
                      : 'linear-gradient(180deg, #3b82f6 0%, #1e3a8a 100%)',
                    boxShadow: isTop ? '0 0 10px rgba(0, 240, 255, 0.4)' : undefined,
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/[0.06] text-[11px] text-[#94a3b8]">
        <span>
          Selected feature: <code className="text-[#00f0ff] font-mono">{activeCol}</code>
        </span>
        <span className="text-[#00f0ff] group-hover:underline flex items-center gap-1 font-mono text-[10px]">
          <Maximize2 size={11} />
          Click card to inspect full statistical suite →
        </span>
      </div>
    </div>
  );
}
