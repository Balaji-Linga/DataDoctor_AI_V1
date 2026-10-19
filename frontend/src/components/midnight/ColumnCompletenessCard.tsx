import { CheckCircle2, Maximize2 } from 'lucide-react';
import type { AnalysisResponse } from '../../types/dataset';

interface ColumnCompletenessCardProps {
  analysis: AnalysisResponse | null;
  onOpenChart?: (chartId: number) => void;
}

export default function ColumnCompletenessCard({
  analysis,
  onOpenChart,
}: ColumnCompletenessCardProps) {
  if (!analysis) {
    return (
      <div className="midnight-card rounded-2xl p-5 flex flex-col justify-between h-full select-none">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <h3 className="text-sm font-semibold text-[#f8fafc] tracking-wide">
            Column Completeness
          </h3>
          <span className="text-[11px] text-[#64748b] font-mono">Standby</span>
        </div>
        <div className="flex flex-col items-center justify-center my-auto py-10 text-center">
          <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-[#64748b] mb-2">
            <CheckCircle2 size={18} />
          </div>
          <span className="text-xs text-[#64748b]">No active column telemetry</span>
        </div>
      </div>
    );
  }

  const details = analysis.statistics.column_details || {};
  const rows = Math.max(1, analysis.dataset.row_count);

  // Derive real column completeness
  const columns = Object.entries(details)
    .map(([col, d]) => {
      const nonMissing = d.non_missing_values;
      const pct = Math.round((nonMissing / rows) * 100);
      return { name: col, count: nonMissing, pct };
    })
    .sort((a, b) => a.pct - b.pct) // lowest completeness first for attention
    .slice(0, 5);

  return (
    <div
      onClick={() => onOpenChart?.(41)}
      className="midnight-card rounded-2xl p-5 flex flex-col justify-between h-full select-none cursor-pointer group hover:border-blue-500/50 transition-all"
      title="Click to inspect #41 Data Completeness Chart in Graph Studio"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
        <h3 className="text-sm font-semibold text-[#f8fafc] tracking-wide">
          Column Completeness
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-[#64748b]">
            Lowest 5
          </span>
          <span className="text-[#00f0ff] opacity-0 group-hover:opacity-100 transition-opacity">
            <Maximize2 size={12} />
          </span>
        </div>
      </div>

      {/* Column Rows */}
      <div className="flex flex-col gap-3 py-3 my-auto">
        {columns.map((col, idx) => (
          <div key={idx} className="flex items-center justify-between gap-3 text-xs">
            <span className="text-[#94a3b8] font-mono truncate w-28">
              {col.name}
            </span>

            {/* Glowing gradient progress bar */}
            <div className="flex-1 h-2 rounded-full bg-white/[0.05] overflow-hidden relative">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${col.pct}%`,
                  background: col.pct < 90
                    ? 'linear-gradient(90deg, #f59e0b 0%, #00f0ff 100%)'
                    : 'linear-gradient(90deg, #3b82f6 0%, #00f0ff 100%)',
                  boxShadow: '0 0 8px rgba(0, 240, 255, 0.4)',
                }}
              />
            </div>

            <div className="flex items-center gap-1.5 w-16 justify-end font-mono">
              <span className="text-[#f8fafc] text-[11px]">
                {col.pct}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
