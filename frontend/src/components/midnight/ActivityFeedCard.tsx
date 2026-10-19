import { Activity, Clock } from 'lucide-react';
import type { AnalysisResponse, CleaningResponse } from '../../types/dataset';

interface ActivityFeedCardProps {
  analysis: AnalysisResponse | null;
  cleanResult: CleaningResponse | null;
  onViewLogs?: () => void;
}

export default function ActivityFeedCard({
  analysis,
  cleanResult,
  onViewLogs,
}: ActivityFeedCardProps) {
  if (!analysis && !cleanResult) {
    return (
      <div className="midnight-card rounded-2xl p-5 flex flex-col justify-between h-full select-none">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <h3 className="text-sm font-semibold text-[#f8fafc] tracking-wide">
            Recent Pipeline Activity
          </h3>
          <span className="text-[11px] text-[#64748b] font-mono">Standby</span>
        </div>
        <div className="flex flex-col items-center justify-center my-auto py-10 text-center">
          <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-[#64748b] mb-2">
            <Activity size={18} />
          </div>
          <span className="text-xs text-[#64748b]">No active pipeline executions</span>
        </div>
      </div>
    );
  }

  const events = [];

  if (cleanResult) {
    const report = cleanResult.cleaning.report;
    const resolvedMissing = report.missing_cells_before - report.missing_cells_after;
    const droppedDupes = report.duplicate_rows_before - report.duplicate_rows_after;
    events.push({
      title: `Remediation Reactor completed: ${report.rows_after} rows clean (${resolvedMissing} nulls imputed, ${droppedDupes} dupes purged)`,
      time: 'Just now',
      color: '#10b981',
    });
  }

  if (analysis) {
    if (analysis.quality_report.total_issues > 0) {
      events.push({
        title: `Quality Issue Detector: Flagged ${analysis.quality_report.total_issues} defects (${analysis.statistics.missing_cells} nulls, ${analysis.statistics.duplicate_rows} dupes)`,
        time: cleanResult ? '2m ago' : 'Just now',
        color: '#f59e0b',
      });
    }

    events.push({
      title: `Dataset Profiler: Indexed ${analysis.dataset.column_count} features (${analysis.statistics.numeric_columns.length} numeric, ${analysis.statistics.non_numeric_columns.length} categorical)`,
      time: cleanResult ? '3m ago' : '1m ago',
      color: '#3b82f6',
    });

    events.push({
      title: `CSV Ingestion Engine: Streamed ${analysis.dataset.row_count.toLocaleString()} rows from ${analysis.dataset.file_name}`,
      time: cleanResult ? '4m ago' : '2m ago',
      color: '#00f0ff',
    });
  }

  return (
    <div className="midnight-card rounded-2xl p-5 flex flex-col justify-between h-full select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
        <h3 className="text-sm font-semibold text-[#f8fafc] tracking-wide">
          Recent Pipeline Activity
        </h3>
        {onViewLogs && (
          <button
            type="button"
            onClick={onViewLogs}
            className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[11px] text-[#94a3b8] hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
          >
            Engine Details
          </button>
        )}
      </div>

      {/* Activity Items */}
      <div className="flex flex-col gap-3 py-3 my-auto">
        {events.map((ev, idx) => (
          <div key={idx} className="flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{
                  backgroundColor: ev.color,
                  boxShadow: `0 0 6px ${ev.color}88`,
                }}
              />
              <span className="text-[#cbd5e1] font-medium truncate">
                {ev.title}
              </span>
            </div>
            <span className="text-[#64748b] font-mono text-[11px] shrink-0 flex items-center gap-1">
              <Clock size={10} />
              {ev.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
