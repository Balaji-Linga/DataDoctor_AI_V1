import { ShieldAlert, Sparkles, Maximize2 } from 'lucide-react';
import type { AnalysisResponse } from '../../types/dataset';

interface DefectsBreakdownCardProps {
  analysis: AnalysisResponse | null;
  onOpenChart?: (chartId: number) => void;
}

export default function DefectsBreakdownCard({ analysis, onOpenChart }: DefectsBreakdownCardProps) {
  if (!analysis) {
    return (
      <div className="midnight-card rounded-2xl p-5 flex flex-col justify-between h-full select-none">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <h3 className="text-sm font-semibold text-[#f8fafc] tracking-wide">
            Quality Defects Breakdown
          </h3>
          <span className="text-[11px] text-[#64748b] font-mono">Standby</span>
        </div>
        <div className="flex flex-col items-center justify-center my-auto py-10 text-center">
          <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-[#64748b] mb-2">
            <ShieldAlert size={18} />
          </div>
          <span className="text-xs text-[#64748b]">No active defect scan</span>
        </div>
      </div>
    );
  }

  const missing = analysis.statistics.missing_cells || 0;
  const duplicates = analysis.statistics.duplicate_rows || 0;
  const outlierIssues = analysis.quality_report.issues?.filter((i) => i.type === 'outliers') || [];
  const outliers = outlierIssues.reduce((acc, curr) => acc + (curr.count || 0), 0);
  const otherIssues = Math.max(0, analysis.quality_report.total_issues - outliers);

  const totalDefects = missing + duplicates + outliers + otherIssues;

  if (totalDefects === 0) {
    return (
      <div className="midnight-card rounded-2xl p-5 flex flex-col justify-between h-full select-none">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <h3 className="text-sm font-semibold text-[#f8fafc] tracking-wide">
            Quality Defects Breakdown
          </h3>
          <span className="text-[11px] text-emerald-400 font-mono">0 Defects</span>
        </div>
        <div className="flex flex-col items-center justify-center my-auto py-8 text-center">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2">
            <Sparkles size={18} />
          </div>
          <span className="text-xs font-semibold text-emerald-400">100% Quality Integrity</span>
          <span className="text-[11px] text-[#64748b] mt-1">Zero missing cells, duplicates, or anomalies found</span>
        </div>
      </div>
    );
  }

  const missingPct = Math.round((missing / totalDefects) * 100);
  const outlierPct = Math.round((outliers / totalDefects) * 100);
  const dupePct = Math.round((duplicates / totalDefects) * 100);
  const otherPct = Math.max(0, 100 - missingPct - outlierPct - dupePct);

  return (
    <div
      onClick={() => onOpenChart?.(38)}
      className="midnight-card rounded-2xl p-5 flex flex-col justify-between h-full select-none cursor-pointer group hover:border-blue-500/40 transition-all"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
        <h3 className="text-sm font-semibold text-[#f8fafc] tracking-wide">
          Quality Defects Breakdown
        </h3>
        <div className="flex items-center gap-2">
          {onOpenChart && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenChart(38);
              }}
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-[10px] font-mono text-[#00f0ff] transition-all cursor-pointer"
            >
              <Maximize2 size={11} />
              <span>Studio #38</span>
            </button>
          )}
          <span className="text-[11px] text-[#94a3b8] font-mono">
            {totalDefects.toLocaleString()} Total
          </span>
        </div>
      </div>

      {/* Bubble Chart Cluster driven by real percentages */}
      <div className="relative w-full h-44 my-auto flex items-center justify-center">
        {/* Bubble 1: Missing Values */}
        {missing > 0 && (
          <div
            className="absolute rounded-full flex flex-col items-center justify-center text-center p-2 shadow-lg transition-transform hover:scale-105 select-none"
            style={{
              width: `${Math.max(64, Math.min(108, 50 + missingPct * 0.9))}px`,
              height: `${Math.max(64, Math.min(108, 50 + missingPct * 0.9))}px`,
              left: '10%',
              top: '18%',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.35)',
            }}
          >
            <span className="text-xs sm:text-sm font-bold text-white font-mono">{missingPct}%</span>
            <span className="text-[9px] text-white/80 leading-tight">Missing ({missing})</span>
          </div>
        )}

        {/* Bubble 2: Outliers */}
        {outliers > 0 && (
          <div
            className="absolute rounded-full flex flex-col items-center justify-center text-center p-1.5 shadow-lg transition-transform hover:scale-105 select-none"
            style={{
              width: `${Math.max(56, Math.min(96, 44 + outlierPct * 0.8))}px`,
              height: `${Math.max(56, Math.min(96, 44 + outlierPct * 0.8))}px`,
              right: '18%',
              top: '10%',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              boxShadow: '0 0 16px rgba(16, 185, 129, 0.35)',
            }}
          >
            <span className="text-xs font-bold text-white font-mono">{outlierPct}%</span>
            <span className="text-[8px] text-white/80 leading-tight">Outliers ({outliers})</span>
          </div>
        )}

        {/* Bubble 3: Duplicates */}
        {duplicates > 0 && (
          <div
            className="absolute rounded-full flex flex-col items-center justify-center text-center p-1 shadow-lg transition-transform hover:scale-105 select-none"
            style={{
              width: `${Math.max(48, Math.min(84, 40 + dupePct * 0.7))}px`,
              height: `${Math.max(48, Math.min(84, 40 + dupePct * 0.7))}px`,
              right: '34%',
              bottom: '8%',
              background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
              boxShadow: '0 0 14px rgba(6, 182, 212, 0.35)',
            }}
          >
            <span className="text-xs font-bold text-white font-mono">{dupePct}%</span>
            <span className="text-[7.5px] text-white/80 leading-tight">Dupes ({duplicates})</span>
          </div>
        )}

        {/* Bubble 4: Other Schema Defects */}
        {otherIssues > 0 && (
          <div
            className="absolute rounded-full flex flex-col items-center justify-center text-center p-1 shadow-lg transition-transform hover:scale-105 select-none"
            style={{
              width: `${Math.max(42, Math.min(76, 36 + otherPct * 0.6))}px`,
              height: `${Math.max(42, Math.min(76, 36 + otherPct * 0.6))}px`,
              right: '10%',
              bottom: '12%',
              background: 'linear-gradient(135deg, #3730a3 0%, #312e81 100%)',
              boxShadow: '0 0 10px rgba(55, 48, 163, 0.35)',
            }}
          >
            <span className="text-[11px] font-bold text-white font-mono">{otherPct}%</span>
            <span className="text-[7px] text-white/80 leading-tight">Schema ({otherIssues})</span>
          </div>
        )}
      </div>
    </div>
  );
}
