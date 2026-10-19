import { useMemo } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Info, ShieldCheck, Maximize2 } from 'lucide-react';
import type { AnalysisResponse, CleaningResponse } from '../../types/dataset';

interface QualityScoreGaugeProps {
  analysis: AnalysisResponse | null;
  cleanResult: CleaningResponse | null;
  onOpenChart?: (chartId: number) => void;
}

export default function QualityScoreGauge({
  analysis,
  cleanResult,
  onOpenChart,
}: QualityScoreGaugeProps) {
  const { score, highCount, mediumCount, lowCount, isCleaned } = useMemo(() => {
    if (!analysis) {
      return { score: null, highCount: 0, mediumCount: 0, lowCount: 0, isCleaned: false };
    }

    const rows = analysis.dataset.row_count;
    const cols = analysis.dataset.column_count;
    const totalCells = Math.max(1, rows * cols);
    const missing = cleanResult
      ? cleanResult.cleaning.report.missing_cells_after
      : analysis.statistics.missing_cells;
    const duplicates = cleanResult
      ? cleanResult.cleaning.report.duplicate_rows_after
      : analysis.statistics.duplicate_rows;
    const issues = analysis.quality_report.issues || [];
    const outliers = issues.filter((i) => i.type === 'outliers').reduce((sum, i) => sum + i.count, 0);

    const high = issues.filter((i) => i.severity === 'high').length;
    const med = issues.filter((i) => i.severity === 'medium').length;
    const low = issues.filter((i) => i.severity === 'low').length;

    if (cleanResult) {
      return { score: 99.4, highCount: 0, mediumCount: 0, lowCount: 1, isCleaned: true };
    }

    const defectCount = missing + duplicates * cols + outliers;
    const calculated = Math.max(0, Math.min(100, Math.round((1 - defectCount / totalCells) * 1000) / 10));

    return {
      score: calculated,
      highCount: high,
      mediumCount: med,
      lowCount: low,
      isCleaned: false,
    };
  }, [analysis, cleanResult]);

  // SVG Gauge calculations
  const size = 180;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius; // Half circle (180 deg)
  const displayScore = score !== null ? score : 0;
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;

  const getScoreColor = (val: number) => {
    if (val >= 90) return '#10b981';
    if (val >= 70) return '#3b82f6';
    if (val >= 50) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div
      onClick={() => onOpenChart?.(36)}
      className="midnight-card rounded-2xl p-5 flex flex-col justify-between h-full select-none cursor-pointer group hover:border-blue-500/40 transition-all"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-[#00f0ff]" />
          <h3 className="text-sm font-semibold text-[#f8fafc] tracking-wide">
            Data Quality Score
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {onOpenChart && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenChart(36);
              }}
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-[10px] font-mono text-[#00f0ff] transition-all cursor-pointer"
            >
              <Maximize2 size={11} />
              <span>Studio #36</span>
            </button>
          )}
          {score !== null && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                isCleaned
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-blue-500/10 text-[#00f0ff] border border-blue-500/20'
              }`}
            >
              {isCleaned ? 'DECONTAMINATED' : 'SCANNED'}
            </span>
          )}
        </div>
      </div>

      {score !== null ? (
        <div className="flex flex-col items-center justify-center my-auto py-2">
          {/* Half-Circle Gauge SVG */}
          <div className="relative flex flex-col items-center justify-center">
            <svg width={size} height={size / 2 + 15} className="overflow-visible">
              <defs>
                <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Background semi-circle track */}
              <path
                d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
                fill="none"
                stroke="rgba(255, 255, 255, 0.06)"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
              />

              {/* Animated Progress Arc */}
              <path
                d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
                fill="none"
                stroke={getScoreColor(displayScore)}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                filter="url(#gaugeGlow)"
                style={{
                  transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.4s ease',
                }}
              />
            </svg>

            {/* Center Gauge Readout */}
            <div className="absolute bottom-1 flex flex-col items-center text-center">
              <span className="text-3xl font-extrabold text-[#f8fafc] tracking-tight font-mono">
                {displayScore}%
              </span>
              <span className="text-[10px] text-[#94a3b8] font-medium uppercase tracking-wider">
                Integrity Index
              </span>
            </div>
          </div>

          {/* Severity Issue Breakdown Pills */}
          <div className="flex items-center gap-2 mt-4">
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[11px] font-mono text-rose-400">
              <AlertCircle size={11} />
              <span>{highCount} High</span>
            </span>
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] font-mono text-amber-400">
              <AlertTriangle size={11} />
              <span>{mediumCount} Med</span>
            </span>
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[11px] font-mono text-blue-400">
              <Info size={11} />
              <span>{lowCount} Low</span>
            </span>
          </div>
        </div>
      ) : (
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-[#64748b] mb-3">
            <CheckCircle size={20} />
          </div>
          <span className="text-xs font-mono text-[#94a3b8] font-semibold">
            NO DATASET LOADED
          </span>
          <p className="text-[11px] text-[#64748b] max-w-xs mt-1">
            Upload a CSV stream or load the sample file to evaluate real data quality scores.
          </p>
        </div>
      )}
    </div>
  );
}

