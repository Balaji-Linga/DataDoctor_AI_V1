import { Cpu, ArrowRight, Maximize2 } from 'lucide-react';
import type { AnalysisResponse, CleaningResponse } from '../../types/dataset';

interface PipelineFunnelChartProps {
  analysis: AnalysisResponse | null;
  cleanResult: CleaningResponse | null;
  onNavigateToEngines?: () => void;
  onOpenChart?: (chartId: number) => void;
}

export default function PipelineFunnelChart({
  analysis,
  cleanResult,
  onNavigateToEngines,
  onOpenChart,
}: PipelineFunnelChartProps) {
  if (!analysis) {
    return (
      <div className="midnight-card rounded-2xl p-5 flex flex-col justify-between h-full select-none">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <h3 className="text-sm font-semibold text-[#f8fafc] tracking-wide">
            Automated Remediation Pipeline
          </h3>
          <span className="text-[11px] font-mono text-[#64748b]">STANDBY</span>
        </div>
        <div className="flex flex-col items-center justify-center my-auto py-10 text-center">
          <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-[#64748b] mb-2">
            <Cpu size={18} />
          </div>
          <span className="text-xs text-[#64748b]">Pipeline idle — awaiting dataset ingestion</span>
        </div>
      </div>
    );
  }

  const rows = analysis.dataset.row_count;
  const cols = analysis.dataset.column_count;
  const missing = cleanResult
    ? cleanResult.cleaning.report.missing_cells_after
    : analysis.statistics.missing_cells;
  const cleanRows = cleanResult ? cleanResult.cleaning.report.rows_after : rows;

  const totalCells = Math.max(1, rows * cols);
  const cleanEfficiency = cleanResult
    ? '100% Remediation Complete'
    : `${(Math.max(0, 1 - missing / totalCells) * 100).toFixed(1)}% Matrix Integrity`;

  const steps = [
    { num: '1', title: 'Raw Ingestion', count: `${rows.toLocaleString()} rows`, pct: '100%' },
    { num: '2', title: 'Schema Check', count: `${cols} features`, pct: '100%' },
    { num: '3', title: 'Quality Profiling', count: `${analysis.quality_report.total_issues} defects`, pct: cleanResult ? '0 left' : 'Flagged' },
    { num: '4', title: 'Decontaminated', count: cleanResult ? `${cleanRows.toLocaleString()} rows` : 'Ready', pct: cleanResult ? '100%' : 'Pending' },
  ];

  return (
    <div
      onClick={() => onOpenChart?.(14)}
      className="midnight-card rounded-2xl p-5 flex flex-col justify-between h-full select-none cursor-pointer group hover:border-blue-500/40 transition-all"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
        <h3 className="text-sm font-semibold text-[#f8fafc] tracking-wide">
          Automated Remediation Pipeline
        </h3>
        <div className="flex items-center gap-2">
          {onOpenChart && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenChart(14);
              }}
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-[10px] font-mono text-[#00f0ff] transition-all cursor-pointer"
            >
              <Maximize2 size={11} />
              <span>Studio #14</span>
            </button>
          )}
          {onNavigateToEngines && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onNavigateToEngines();
              }}
              className="flex items-center gap-1 text-[11px] font-mono text-[#00f0ff] hover:underline cursor-pointer"
            >
              <span>Engine Status</span>
              <ArrowRight size={11} />
            </button>
          )}
          <span className="text-[11px] font-mono text-[#00f0ff] uppercase tracking-wider">
            RFC-4180 ENGINE
          </span>
        </div>
      </div>

      {/* Top 4 Step Metrics */}
      <div className="grid grid-cols-4 gap-2 pt-4 pb-2">
        {steps.map((st, i) => (
          <div key={i} className="flex flex-col items-center text-center">
            <span className="text-[10px] text-[#94a3b8] font-medium truncate w-full">
              {st.num}. {st.title}
            </span>
            <span className="text-xs sm:text-sm font-bold font-mono text-[#f8fafc] my-1 truncate w-full">
              {st.count}
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-white/[0.04] border border-white/[0.08] text-[#94a3b8]">
              {st.pct}
            </span>
          </div>
        ))}
      </div>

      {/* Flowing Funnel River SVG */}
      <div className="relative w-full h-24 my-2 overflow-hidden">
        <svg
          viewBox="0 0 600 90"
          preserveAspectRatio="none"
          className="w-full h-full overflow-visible"
        >
          <defs>
            <linearGradient id="funnelGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.8" />
              <stop offset="35%" stopColor="#2563eb" stopOpacity="0.85" />
              <stop offset="70%" stopColor="#0284c7" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#00f0ff" stopOpacity="0.9" />
            </linearGradient>
            <filter id="funnelGlow" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Flowing Stream / Funnel Shape */}
          <path
            d="M 0 10 
               C 150 15, 200 35, 300 38 
               C 400 40, 480 44, 600 44 
               L 600 46 
               C 480 46, 400 50, 300 52 
               C 200 55, 150 75, 0 80 
               Z"
            fill="url(#funnelGrad)"
            filter="url(#funnelGlow)"
          />

          {/* Vertical Milestone Dashed Lines */}
          <line x1="150" y1="5" x2="150" y2="85" stroke="rgba(255,255,255,0.12)" strokeDasharray="3 3" />
          <line x1="300" y1="5" x2="300" y2="85" stroke="rgba(255,255,255,0.12)" strokeDasharray="3 3" />
          <line x1="450" y1="5" x2="450" y2="85" stroke="rgba(255,255,255,0.12)" strokeDasharray="3 3" />
        </svg>
      </div>

      {/* Bottom Conversion / Health Banner */}
      <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] mt-1">
        <span className="text-xs text-[#94a3b8] font-medium">
          Remediation Pipeline Status
        </span>
        <span className={`text-xs font-mono font-bold ${cleanResult ? 'text-emerald-400' : 'text-[#00f0ff]'}`}>
          {cleanEfficiency}
        </span>
      </div>
    </div>
  );
}
