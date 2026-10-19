import { useState } from 'react';
import { BarChart3, AlertTriangle, Sparkles, Maximize2 } from 'lucide-react';
import type { AnalysisResponse } from '../../types/dataset';

interface QualityBarChartsProps {
  analysis: AnalysisResponse | null;
  onOpenChart: (chartId: number) => void;
}

export default function QualityBarCharts({ analysis, onOpenChart }: QualityBarChartsProps) {
  const [activeTab, setActiveTab] = useState<'missing' | 'issues'>('missing');

  if (!analysis) {
    return (
      <div className="midnight-card rounded-2xl p-6 flex flex-col items-center justify-center min-h-[300px] text-center select-none">
        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[#00f0ff] mb-3">
          <BarChart3 size={22} />
        </div>
        <h4 className="text-sm font-semibold text-[#f8fafc]">Column Quality Analytics</h4>
        <p className="text-xs text-[#64748b] max-w-sm mt-1">
          No dataset loaded. Ingest a CSV or click &quot;Load Sample&quot; to inspect real column missingness and defect distributions.
        </p>
      </div>
    );
  }

  const { row_count, column_count } = analysis.dataset;
  const missingByCol = analysis.statistics.missing_by_column || {};
  const issues = analysis.quality_report.issues || [];

  // Sort columns by missing count descending
  const missingSorted = Object.entries(missingByCol)
    .map(([col, count]) => ({
      column: col,
      count,
      pct: row_count > 0 ? Math.round((count / row_count) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Group issues by type
  const issueGroupMap = issues.reduce<Record<string, { count: number; high: number; med: number; low: number }>>((acc, issue) => {
    const key = issue.type;
    if (!acc[key]) acc[key] = { count: 0, high: 0, med: 0, low: 0 };
    acc[key].count += issue.count;
    if (issue.severity === 'high') acc[key].high += 1;
    else if (issue.severity === 'medium') acc[key].med += 1;
    else acc[key].low += 1;
    return acc;
  }, {});

  const issueGroups = Object.entries(issueGroupMap).map(([type, data]) => ({
    type: type.replace(/_/g, ' ').toUpperCase(),
    ...data,
  }));

  const maxMissing = Math.max(1, ...missingSorted.map((d) => d.count));
  const maxIssues = Math.max(1, ...issueGroups.map((d) => d.count));

  const targetChartId = activeTab === 'missing' ? 32 : 38;

  return (
    <div
      onClick={() => onOpenChart(targetChartId)}
      className="midnight-card rounded-2xl p-5 flex flex-col justify-between h-full select-none cursor-pointer group hover:border-blue-500/40 transition-all"
    >
      {/* Card Header with Tab Switcher & Fullscreen Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveTab('missing')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'missing'
                  ? 'bg-blue-600/30 text-[#00f0ff] border border-blue-500/30'
                  : 'text-[#94a3b8] hover:text-[#f8fafc]'
              }`}
            >
              Missing by Feature
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('issues')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'issues'
                  ? 'bg-blue-600/30 text-[#00f0ff] border border-blue-500/30'
                  : 'text-[#94a3b8] hover:text-[#f8fafc]'
              }`}
            >
              Quality Defects ({analysis.quality_report.total_issues})
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenChart(targetChartId);
          }}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-[11px] font-mono text-[#00f0ff] transition-all cursor-pointer"
          title="Open in Graph Studio"
        >
          <Maximize2 size={12} />
          <span>Graph Studio #{targetChartId}</span>
        </button>
      </div>

      {/* Tab Content: Missing by Column */}
      {activeTab === 'missing' && (
        <div className="py-3 flex-1 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-[#64748b] mb-2 px-1">
            <span>FEATURE ({column_count} TOTAL)</span>
            <span>NULL RATE (% OF {row_count.toLocaleString()} ROWS)</span>
          </div>

          <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
            {missingSorted.length === 0 ? (
              <div className="text-center py-8 text-xs text-emerald-400 flex items-center justify-center gap-2">
                <Sparkles size={14} />
                <span>Zero missing values detected across all features!</span>
              </div>
            ) : (
              missingSorted.slice(0, 7).map((item) => {
                const widthPct = Math.max(4, Math.round((item.count / maxMissing) * 100));
                const isHigh = item.pct > 20;

                return (
                  <div key={item.column} className="flex items-center justify-between gap-3 text-xs">
                    <span className="font-mono text-[#94a3b8] truncate w-32 shrink-0">
                      {item.column}
                    </span>

                    <div className="flex-1 h-3 rounded-full bg-white/[0.04] overflow-hidden relative">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${widthPct}%`,
                          background: isHigh
                            ? 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)'
                            : 'linear-gradient(90deg, #3b82f6 0%, #00f0ff 100%)',
                          boxShadow: isHigh
                            ? '0 0 8px rgba(239, 68, 68, 0.4)'
                            : '0 0 8px rgba(0, 240, 255, 0.4)',
                        }}
                      />
                    </div>

                    <div className="flex items-center gap-1.5 w-20 justify-end font-mono shrink-0">
                      <span className={`text-[11px] ${isHigh ? 'text-rose-400 font-bold' : 'text-[#f8fafc]'}`}>
                        {item.count}
                      </span>
                      <span className="text-[10px] text-[#64748b]">({item.pct}%)</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex items-center justify-between pt-3 mt-2 border-t border-white/[0.06] text-[11px] text-[#94a3b8]">
            <span>
              Total Null Cells:{' '}
              <strong className="text-[#00f0ff] font-mono">
                {analysis.statistics.missing_cells.toLocaleString()}
              </strong>
            </span>
            <span className="text-[10px] text-[#00f0ff] font-mono group-hover:underline">
              Click card to inspect in full-screen Studio →
            </span>
          </div>
        </div>
      )}

      {/* Tab Content: Quality Defects by Category */}
      {activeTab === 'issues' && (
        <div className="py-3 flex-1 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-[#64748b] mb-2 px-1">
            <span>DEFECT CATEGORY</span>
            <span>AFFECTED CELLS / ROWS</span>
          </div>

          <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
            {issueGroups.length === 0 ? (
              <div className="text-center py-8 text-xs text-emerald-400 flex items-center justify-center gap-2">
                <Sparkles size={14} />
                <span>Zero quality anomalies detected! Pristine matrix condition.</span>
              </div>
            ) : (
              issueGroups.map((group) => {
                const widthPct = Math.max(5, Math.round((group.count / maxIssues) * 100));

                return (
                  <div key={group.type} className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-1.5 w-36 shrink-0 truncate">
                      {group.high > 0 ? (
                        <AlertTriangle size={12} className="text-rose-400 shrink-0" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                      )}
                      <span className="font-mono text-[#94a3b8] truncate">
                        {group.type}
                      </span>
                    </div>

                    <div className="flex-1 h-3 rounded-full bg-white/[0.04] overflow-hidden relative">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${widthPct}%`,
                          background: group.high > 0
                            ? 'linear-gradient(90deg, #f97316 0%, #ef4444 100%)'
                            : 'linear-gradient(90deg, #3b82f6 0%, #6366f1 100%)',
                          boxShadow: group.high > 0
                            ? '0 0 8px rgba(239, 68, 68, 0.4)'
                            : '0 0 8px rgba(59, 130, 246, 0.4)',
                        }}
                      />
                    </div>

                    <div className="flex items-center gap-1 w-16 justify-end font-mono shrink-0">
                      <span className="text-[11px] font-bold text-[#f8fafc]">
                        {group.count}
                      </span>
                      {group.high > 0 && (
                        <span className="text-[9px] text-rose-400 font-bold">!</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex items-center justify-between pt-3 mt-2 border-t border-white/[0.06] text-[11px] text-[#94a3b8]">
            <span>
              Total Defects:{' '}
              <strong className="text-rose-400 font-mono">
                {analysis.quality_report.total_issues.toLocaleString()}
              </strong>
            </span>
            <span className="text-[10px] text-[#00f0ff] font-mono group-hover:underline">
              Click card to inspect in full-screen Studio →
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
