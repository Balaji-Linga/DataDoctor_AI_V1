import { useMemo } from 'react';
import { PieChart, Maximize2 } from 'lucide-react';
import type { AnalysisResponse } from '../../types/dataset';

interface DonutQualityChartProps {
  analysis: AnalysisResponse | null;
  onOpenChart?: (chartId: number) => void;
}

export default function DonutQualityChart({ analysis, onOpenChart }: DonutQualityChartProps) {
  const stats = analysis?.statistics;
  const numNumeric = stats?.numeric_columns?.length || 0;
  const numNonNumeric = stats?.non_numeric_columns?.length || 0;
  const missingCells = stats?.missing_cells || 0;
  const outlierIssues = analysis?.quality_report?.issues?.filter((i) => i.type === 'outliers') || [];
  const outlierCount = outlierIssues.reduce((acc, curr) => acc + (curr.count || 0), 0);

  // Derive donut segments from real analysis
  const segments = useMemo(() => {
    if (!analysis) return [];
    const raw = [
      { label: 'Numeric Features', value: Math.max(0, numNumeric), color: '#00f0ff', count: numNumeric },
      { label: 'Categorical Text', value: Math.max(0, numNonNumeric), color: '#3b82f6', count: numNonNumeric },
      { label: 'Missing / Nulls', value: Math.max(0, missingCells), color: '#8b5cf6', count: missingCells },
      { label: 'Statistical Outliers', value: Math.max(0, outlierCount), color: '#10b981', count: outlierCount },
    ].filter((item) => item.count > 0);

    const total = raw.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return [];

    return raw.map((item) => ({
      ...item,
      percentage: Math.round((item.value / total) * 100),
    }));
  }, [analysis, numNumeric, numNonNumeric, missingCells, outlierCount]);

  // SVG Donut calculation
  const size = 180;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativeOffset = 0;

  if (!analysis) {
    return (
      <div className="midnight-card rounded-2xl p-5 flex flex-col justify-between h-full select-none">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <h3 className="text-sm font-semibold text-[#f8fafc] tracking-wide">
            Dataset Feature Distribution
          </h3>
          <span className="text-[11px] text-[#64748b] font-mono">Standby</span>
        </div>
        <div className="flex flex-col items-center justify-center my-auto py-10 text-center">
          <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-[#64748b] mb-2">
            <PieChart size={18} />
          </div>
          <span className="text-xs text-[#64748b]">No active dataset loaded</span>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onOpenChart?.(10)}
      className="midnight-card rounded-2xl p-5 flex flex-col justify-between h-full select-none cursor-pointer group hover:border-blue-500/50 transition-all"
      title="Click to inspect #10 Doughnut Chart in Graph Studio"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
        <h3 className="text-sm font-semibold text-[#f8fafc] tracking-wide">
          Dataset Feature Distribution
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-[#64748b]">
            {analysis.dataset.column_count} Total Columns
          </span>
          <span className="text-[#00f0ff] opacity-0 group-hover:opacity-100 transition-opacity">
            <Maximize2 size={12} />
          </span>
        </div>
      </div>

      {/* Donut & Legend Container */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-4 my-auto">
        {/* SVG Donut */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg width={size} height={size} className="rotate-[-90deg]">
            <defs>
              <filter id="donutGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Background ring */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth={strokeWidth}
              fill="none"
            />

            {/* Colored Segments */}
            {segments.map((seg, idx) => {
              const dashLength = (seg.percentage / 100) * circumference;
              const dashOffset = -cumulativeOffset;
              cumulativeOffset += dashLength;

              return (
                <circle
                  key={idx}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={seg.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${dashLength} ${circumference}`}
                  strokeDashoffset={dashOffset}
                  fill="none"
                  strokeLinecap="round"
                  style={{
                    transition: 'stroke-dasharray 0.6s ease',
                  }}
                />
              );
            })}
          </svg>

          {/* Donut Center Readout */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-[#f8fafc] font-mono">
              {analysis.dataset.row_count.toLocaleString()}
            </span>
            <span className="text-[10px] text-[#94a3b8] font-medium uppercase tracking-wider">
              Total Records
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-3 w-full sm:w-auto">
          {segments.map((seg, idx) => (
            <div key={idx} className="flex items-center justify-between sm:justify-start gap-4 text-xs">
              <div className="flex items-center gap-2 min-w-[120px]">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{
                    backgroundColor: seg.color,
                    boxShadow: `0 0 8px ${seg.color}66`,
                  }}
                />
                <span className="text-[#94a3b8] font-medium truncate">{seg.label}</span>
              </div>
              <span className="text-[#f8fafc] font-mono font-semibold">{seg.count.toLocaleString()}</span>
              <span className="text-[#64748b] font-mono text-[11px] w-10 text-right">
                {seg.percentage}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
