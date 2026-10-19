import { useState } from 'react';
import { Sparkles, Download, CheckCircle, ShieldAlert } from 'lucide-react';
import type { CleaningResponse } from '../../types/dataset';
import { recordsToCsv, triggerCsvDownload } from '../../services/api';
import { soundManager } from '../../audio/soundManager';

interface RemediationConsoleProps {
  onRunClean: (options: {
    missing_strategy: string;
    fill_value?: string;
    drop_duplicates: boolean;
    drop_missing_rows: boolean;
  }) => void;
  isCleaning: boolean;
  cleanResult: CleaningResponse | null;
  className?: string;
}

export default function RemediationConsole({
  onRunClean,
  isCleaning,
  cleanResult,
  className,
}: RemediationConsoleProps) {
  const [strategy, setStrategy] = useState<string>('mean');
  const [fillVal, setFillVal] = useState<string>('');
  const [dropDupes, setDropDupes] = useState<boolean>(true);
  const [dropMissingRows, setDropMissingRows] = useState<boolean>(false);

  const report = cleanResult?.cleaning?.report;
  const cleanedDs = cleanResult?.cleaning?.cleaned_dataset;

  const handleExecute = () => {
    soundManager.playReactorBlast();
    onRunClean({
      missing_strategy: strategy,
      fill_value: strategy === 'constant' ? fillVal : undefined,
      drop_duplicates: dropDupes,
      drop_missing_rows: dropMissingRows,
    });
  };

  const handleDownload = () => {
    soundManager.playClick();
    if (!cleanedDs) return;
    const csvStr = recordsToCsv(cleanedDs.columns, cleanedDs.preview);
    triggerCsvDownload('decontaminated_dataset.csv', csvStr);
  };

  return (
    <aside
      className={
        className ??
        'fixed top-20 right-4 sm:right-6 z-40 w-84 sm:w-92 rounded-2xl border backdrop-blur-2xl shadow-2xl p-4 select-none pointer-events-auto'
      }
      style={{
        background: 'rgba(5, 10, 24, 0.95)',
        borderColor: cleanResult ? 'rgba(34, 197, 94, 0.4)' : 'rgba(0, 212, 255, 0.35)',
        boxShadow: cleanResult
          ? '0 10px 40px rgba(0, 0, 0, 0.8), 0 0 25px rgba(34, 197, 94, 0.15)'
          : '0 10px 40px rgba(0, 0, 0, 0.8), 0 0 25px rgba(0, 212, 255, 0.15)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className={cleanResult ? 'text-[#22c55e]' : 'text-[#00d4ff]'} />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#f0f0f5]">
            REMEDIATION REACTOR
          </span>
        </div>
        <span
          className="text-[10px] font-mono px-2 py-0.5 rounded"
          style={{
            background: cleanResult ? 'rgba(34, 197, 94, 0.2)' : 'rgba(0, 212, 255, 0.15)',
            color: cleanResult ? '#22c55e' : '#00d4ff',
          }}
        >
          {cleanResult ? 'DECONTAMINATED' : 'ARMED'}
        </span>
      </div>

      {/* Control Form */}
      <div className="py-3 space-y-3 font-mono text-xs">
        <div>
          <label className="text-[10px] text-[#6b7280] block mb-1">
            IMPUTATION STRATEGY:
          </label>
          <select
            value={strategy}
            onChange={(e) => setStrategy(e.target.value)}
            className="w-full bg-[#0f172a] border border-white/10 rounded-lg p-2 text-xs text-[#00d4ff] font-semibold focus:outline-none focus:border-[#00d4ff] cursor-pointer"
          >
            <option value="mean">MEAN (Parametric Numerical)</option>
            <option value="median">MEDIAN (Robust to Outliers)</option>
            <option value="mode">MODE (Most Frequent Value)</option>
            <option value="constant">CONSTANT (Custom Value)</option>
            <option value="none">NONE (Preserve Raw Blanks)</option>
          </select>
        </div>

        {strategy === 'constant' && (
          <div>
            <label className="text-[10px] text-[#6b7280] block mb-1">
              CONSTANT FILL VALUE:
            </label>
            <input
              type="text"
              value={fillVal}
              onChange={(e) => setFillVal(e.target.value)}
              placeholder="e.g. 0 or UNKNOWN"
              className="w-full bg-[#0f172a] border border-white/10 rounded-lg p-2 text-xs text-[#f0f0f5] focus:outline-none focus:border-[#00d4ff]"
            />
          </div>
        )}

        <div className="space-y-1.5 pt-1">
          <label className="flex items-center gap-2 text-[11px] text-[#94a3b8] cursor-pointer">
            <input
              type="checkbox"
              checked={dropDupes}
              onChange={(e) => setDropDupes(e.target.checked)}
              className="accent-[#00d4ff] rounded cursor-pointer"
            />
            <span>PURGE EXACT DUPLICATE ROWS</span>
          </label>

          <label className="flex items-center gap-2 text-[11px] text-[#94a3b8] cursor-pointer">
            <input
              type="checkbox"
              checked={dropMissingRows}
              onChange={(e) => setDropMissingRows(e.target.checked)}
              className="accent-[#00d4ff] rounded cursor-pointer"
            />
            <span>DROP ROWS WITH UNRESOLVED NULLS</span>
          </label>
        </div>

        {/* Action Button */}
        <button
          type="button"
          disabled={isCleaning}
          onClick={handleExecute}
          className="w-full py-2.5 px-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 text-[#050a18] shadow-lg"
          style={{
            background: isCleaning
              ? '#94a3b8'
              : 'linear-gradient(135deg, #00d4ff 0%, #3b82f6 100%)',
          }}
        >
          <Sparkles size={14} className={isCleaning ? 'animate-spin' : ''} />
          <span>{isCleaning ? 'FIRING REACTOR...' : 'ENGAGE PROTOCOL'}</span>
        </button>
      </div>

      {/* Post-Remediation Report */}
      {report && (
        <div className="pt-3 border-t border-white/10 space-y-2 font-mono text-[11px] animate-in fade-in">
          <div className="flex items-center gap-1.5 text-[#22c55e] font-bold">
            <CheckCircle size={13} />
            <span>DECONTAMINATION COMPLETE</span>
          </div>

          <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-white/5 border border-white/10">
            <div>
              <span className="text-[10px] text-[#6b7280] block">ROWS REMAINING</span>
              <strong className="text-white text-xs">{report.rows_after}</strong>
            </div>
            <div>
              <span className="text-[10px] text-[#6b7280] block">CELLS IMPUTED</span>
              <strong className="text-[#22c55e] text-xs">
                {report.missing_cells_before - report.missing_cells_after}
              </strong>
            </div>
            <div>
              <span className="text-[10px] text-[#6b7280] block">DUPES PURGED</span>
              <strong className="text-white text-xs">
                {report.duplicate_rows_before - report.duplicate_rows_after}
              </strong>
            </div>
            <div>
              <span className="text-[10px] text-[#6b7280] block">CHANGES LOGGED</span>
              <strong className="text-[#00d4ff] text-xs">
                {report.changes.length} operations
              </strong>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownload}
            className="w-full py-2 px-3 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-[#22c55e] text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Download size={13} />
            <span>DOWNLOAD CLEANED CSV</span>
          </button>
        </div>
      )}

      {/* Warning when raw outliers exist */}
      {!cleanResult && (
        <div className="mt-2 text-[10px] font-mono text-[#6b7280] flex items-center gap-1.5">
          <ShieldAlert size={12} className="text-[#c9a961]" />
          <span>Cleaning transforms voxels directly in 3D scene</span>
        </div>
      )}
    </aside>
  );
}

