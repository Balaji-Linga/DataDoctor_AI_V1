import { CheckCircle2, Download, ArrowRight, Sparkles, AlertCircle, Maximize2 } from 'lucide-react';
import type { AnalysisResponse, CleaningResponse } from '../../types/dataset';
import { recordsToCsv, triggerCsvDownload } from '../../services/api';
import { soundManager } from '../../audio/soundManager';

interface BeforeAfterComparisonChartProps {
  analysis: AnalysisResponse | null;
  cleanResult: CleaningResponse | null;
  onNavigateToCleaning: () => void;
  onOpenChart?: (chartId: number) => void;
}

export default function BeforeAfterComparisonChart({
  analysis,
  cleanResult,
  onNavigateToCleaning,
  onOpenChart,
}: BeforeAfterComparisonChartProps) {
  if (!analysis) {
    return (
      <div className="midnight-card rounded-2xl p-6 flex flex-col items-center justify-center min-h-[250px] text-center select-none">
        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[#00f0ff] mb-3">
          <Sparkles size={22} />
        </div>
        <h4 className="text-sm font-semibold text-[#f8fafc]">Remediation Impact Audit</h4>
        <p className="text-xs text-[#64748b] max-w-sm mt-1">
          No dataset loaded. Ingest a dataset to evaluate before-and-after cleaning deltas.
        </p>
      </div>
    );
  }

  const report = cleanResult?.cleaning?.report;
  const cleanedDataset = cleanResult?.cleaning?.cleaned_dataset;

  const handleDownloadCsv = () => {
    if (!cleanedDataset) return;
    soundManager.playClick();
    const csv = recordsToCsv(cleanedDataset.columns, cleanedDataset.records || cleanedDataset.preview);
    const filename = `cleaned_${analysis.dataset.file_name || 'dataset.csv'}`;
    triggerCsvDownload(filename, csv);
  };

  const rowsBefore = report ? report.rows_before : analysis.dataset.row_count;
  const rowsAfter = report ? report.rows_after : analysis.dataset.row_count;
  const missingBefore = report ? report.missing_cells_before : analysis.statistics.missing_cells;
  const missingAfter = report ? report.missing_cells_after : 0;
  const dupesBefore = report ? report.duplicate_rows_before : analysis.statistics.duplicate_rows;
  const dupesAfter = report ? report.duplicate_rows_after : 0;

  const rowsMax = Math.max(1, rowsBefore, rowsAfter);
  const missingMax = Math.max(1, missingBefore, missingAfter);
  const dupesMax = Math.max(1, dupesBefore, dupesAfter);

  return (
    <div
      onClick={() => onOpenChart?.(37)}
      className="midnight-card rounded-2xl p-5 flex flex-col justify-between h-full select-none cursor-pointer group hover:border-blue-500/40 transition-all"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <h3 className="text-sm font-semibold text-[#f8fafc] tracking-wide">
            Remediation Impact Audit
          </h3>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              cleanResult
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-white/[0.04] text-[#94a3b8] border border-white/[0.08]'
            }`}
          >
            {cleanResult ? 'DECONTAMINATED' : 'PRE-CLEAN BASELINE'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onOpenChart && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenChart(37);
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-xs font-mono text-[#00f0ff] transition-all cursor-pointer"
            >
              <Maximize2 size={12} />
              <span>Studio #37</span>
            </button>
          )}

          {cleanResult && cleanedDataset ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDownloadCsv();
              }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-xs font-mono font-medium text-emerald-300 transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
            >
              <Download size={13} />
              <span>Export Cleaned CSV</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onNavigateToCleaning();
              }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 text-xs font-mono text-[#00f0ff] transition-all cursor-pointer"
            >
              <span>Open Cleaning Reactor</span>
              <ArrowRight size={13} />
            </button>
          )}
        </div>
      </div>

      {cleanResult ? (
        /* Real Side-by-Side Comparison */
        <div className="py-4 space-y-4 my-auto">
          {/* Comparison 1: Dataset Rows */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-[#94a3b8] font-medium">Matrix Rows</span>
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="text-[#64748b]">{rowsBefore.toLocaleString()}</span>
                <span className="text-[#64748b]">→</span>
                <span className="text-[#f8fafc] font-bold">{rowsAfter.toLocaleString()}</span>
                {report && report.rows_removed > 0 && (
                  <span className="text-[10px] text-rose-400">(-{report.rows_removed})</span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 h-3.5">
              <div className="rounded-full bg-white/[0.04] overflow-hidden">
                <div
                  className="h-full bg-blue-600/60 rounded-full"
                  style={{ width: `${Math.round((rowsBefore / rowsMax) * 100)}%` }}
                />
              </div>
              <div className="rounded-full bg-white/[0.04] overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${Math.round((rowsAfter / rowsMax) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Comparison 2: Missing Cells */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-[#94a3b8] font-medium">Missing Cells</span>
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="text-rose-400">{missingBefore.toLocaleString()}</span>
                <span className="text-[#64748b]">→</span>
                <span className="text-emerald-400 font-bold">{missingAfter.toLocaleString()}</span>
                {missingBefore > missingAfter && (
                  <span className="text-[10px] text-emerald-400 font-bold">
                    (-{(missingBefore - missingAfter).toLocaleString()} resolved)
                  </span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 h-3.5">
              <div className="rounded-full bg-white/[0.04] overflow-hidden">
                <div
                  className="h-full bg-rose-500/70 rounded-full"
                  style={{ width: `${Math.round((missingBefore / missingMax) * 100)}%` }}
                />
              </div>
              <div className="rounded-full bg-white/[0.04] overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${Math.round((missingAfter / missingMax) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Comparison 3: Duplicate Rows */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-[#94a3b8] font-medium">Duplicate Rows</span>
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="text-amber-400">{dupesBefore.toLocaleString()}</span>
                <span className="text-[#64748b]">→</span>
                <span className="text-emerald-400 font-bold">{dupesAfter.toLocaleString()}</span>
                {dupesBefore > dupesAfter && (
                  <span className="text-[10px] text-emerald-400 font-bold">
                    (-{(dupesBefore - dupesAfter).toLocaleString()} purged)
                  </span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 h-3.5">
              <div className="rounded-full bg-white/[0.04] overflow-hidden">
                <div
                  className="h-full bg-amber-500/70 rounded-full"
                  style={{ width: `${Math.round((dupesBefore / dupesMax) * 100)}%` }}
                />
              </div>
              <div className="rounded-full bg-white/[0.04] overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${Math.round((dupesAfter / dupesMax) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Standby state before cleaning is run */
        <div className="py-6 my-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 mb-3">
            <AlertCircle size={14} />
            <span>Remediation Protocol Ready</span>
          </div>
          <p className="text-xs text-[#94a3b8] max-w-sm mx-auto mb-4">
            Identified {analysis.statistics.missing_cells.toLocaleString()} null cells and{' '}
            {analysis.statistics.duplicate_rows.toLocaleString()} duplicates. Fire the Cleaning Reactor to execute automated imputation and deduplication.
          </p>
          <button
            type="button"
            onClick={onNavigateToCleaning}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/25 transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <Sparkles size={14} />
            <span>Launch Cleaning Reactor</span>
          </button>
        </div>
      )}

      {/* Footer Info */}
      <div className="flex items-center justify-between pt-3 mt-2 border-t border-white/[0.06] text-[11px] text-[#64748b]">
        <span>Engine: pandas + C-accelerated clean_dataset</span>
        <span>RFC-4180 Invariant Enforced</span>
      </div>
    </div>
  );
}

