import { ShieldCheck, Maximize2 } from 'lucide-react';
import type { AnalysisResponse } from '../../types/dataset';

interface DatasetRiskTableProps {
  analysis: AnalysisResponse | null;
  onOpenChart?: (chartId: number) => void;
  onNavigateToCleaning?: () => void;
}

export default function DatasetRiskTable({
  analysis,
  onOpenChart,
  onNavigateToCleaning,
}: DatasetRiskTableProps) {
  if (!analysis) {
    return (
      <div className="midnight-card rounded-2xl p-6 w-full select-none">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div>
            <h3 className="text-sm font-semibold text-[#f8fafc] tracking-wide">
              Records at Risk & Diagnostic Inspector
            </h3>
            <p className="text-[11px] text-[#94a3b8] mt-0.5">
              Row-level quality triage and cell defect analysis
            </p>
          </div>
          <span className="text-[11px] text-[#64748b] font-mono">Standby</span>
        </div>
        <div className="py-12 text-center">
          <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-[#64748b] mx-auto mb-2">
            <ShieldCheck size={18} />
          </div>
          <p className="text-xs text-[#64748b]">
            No active dataset loaded. Ingest a CSV to perform row-level triage and detect affected records.
          </p>
        </div>
      </div>
    );
  }

  const preview = analysis.dataset.preview || [];
  const columns = analysis.dataset.columns || [];

  // Evaluate real preview rows for risk
  const riskRows = preview.slice(0, 7).map((row, idx) => {
    const missingKeys = Object.entries(row)
      .filter(([, v]) => v === null || v === undefined || v === '')
      .map(([k]) => k);

    const hasMissing = missingKeys.length > 0;
    const score = hasMissing ? Math.max(30, 100 - missingKeys.length * 20) : 98;

    return {
      id: `REC-${(idx + 1).toString().padStart(4, '0')}`,
      name: String(row[columns[0]] ?? `Row #${idx + 1}`),
      healthScore: score,
      trend: hasMissing ? `↓ -${missingKeys.length * 10}%` : '↑ Validated',
      status: hasMissing ? `${missingKeys.length} Missing Nulls` : 'Clean Cell Vector',
      action: hasMissing ? `Impute [${missingKeys.slice(0, 2).join(', ')}]` : 'Verified Stable',
      hasMissing,
    };
  });

  return (
    <div className="midnight-card rounded-2xl p-5 w-full select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
        <div>
          <h3 className="text-sm font-semibold text-[#f8fafc] tracking-wide">
            Records at Risk & Diagnostic Inspector
          </h3>
          <p className="text-[11px] text-[#94a3b8] mt-0.5">
            Row-level quality triage across sample preview rows
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenChart && (
            <button
              type="button"
              onClick={() => onOpenChart(31)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-xs font-mono text-[#00f0ff] hover:bg-blue-600/30 transition-colors cursor-pointer"
            >
              <Maximize2 size={13} />
              <span>Inspect in Missing Matrix (#31)</span>
            </button>
          )}
          {onNavigateToCleaning && (
            <button
              type="button"
              onClick={onNavigateToCleaning}
              className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-[#94a3b8] hover:text-[#f8fafc] transition-colors cursor-pointer"
            >
              Remediate in Reactor →
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto mt-2">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-white/[0.06] text-[#64748b] font-mono text-[11px] uppercase tracking-wider">
              <th className="py-3 px-3">RECORD ID</th>
              <th className="py-3 px-3">FEATURE ENTITY</th>
              <th className="py-3 px-3">HEALTH SCORE</th>
              <th className="py-3 px-3">STATUS</th>
              <th className="py-3 px-3">RECOMMENDED ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {riskRows.map((row) => (
              <tr key={row.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="py-3 px-3 font-mono text-[#00f0ff]">
                  {row.id}
                </td>
                <td className="py-3 px-3 font-medium text-[#f8fafc]">
                  {row.name}
                </td>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${row.healthScore}%`,
                          backgroundColor:
                            row.healthScore > 85 ? '#10b981' : row.healthScore > 65 ? '#f59e0b' : '#ef4444',
                        }}
                      />
                    </div>
                    <span className="font-mono text-[11px] text-[#94a3b8]">
                      {row.healthScore}%
                    </span>
                  </div>
                </td>
                <td className="py-3 px-3 font-mono text-[11px]">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      row.hasMissing
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {row.hasMissing ? '!' : '✓'} {row.status}
                  </span>
                </td>
                <td className="py-3 px-3 text-[#94a3b8] font-mono text-[11px]">
                  {row.action}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
