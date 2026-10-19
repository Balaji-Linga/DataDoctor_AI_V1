import { X, Crosshair, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import type { SelectedVoxel } from '../lab/DataMatrix3D';
import type { NumericalSummaryItem } from '../../types/dataset';

interface HolographicInspectorProps {
  voxel: SelectedVoxel | null;
  onClose: () => void;
  numericalSummary?: Record<string, NumericalSummaryItem>;
}

export default function HolographicInspector({
  voxel,
  onClose,
  numericalSummary = {},
}: HolographicInspectorProps) {
  if (!voxel) return null;

  const colSummary = numericalSummary[voxel.column];

  return (
    <aside
      className="fixed top-20 right-4 sm:right-6 z-40 w-80 sm:w-88 rounded-2xl border backdrop-blur-2xl shadow-2xl p-4 select-none animate-in fade-in slide-in-from-right-4"
      style={{
        background: 'rgba(5, 10, 24, 0.94)',
        borderColor: voxel.isMissing
          ? 'rgba(239, 68, 68, 0.4)'
          : voxel.isOutlier
          ? 'rgba(201, 169, 97, 0.4)'
          : 'rgba(0, 212, 255, 0.35)',
        boxShadow: voxel.isMissing
          ? '0 10px 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(239, 68, 68, 0.15)'
          : '0 10px 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 212, 255, 0.15)',
      }}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Crosshair size={14} className="text-[#00d4ff] animate-spin" />
          <span className="text-xs font-mono font-bold uppercase text-[#00d4ff]">
            VOXEL INSPECTOR
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-[#6b7280] hover:text-[#f0f0f5] cursor-pointer"
        >
          <X size={15} />
        </button>
      </div>

      {/* Target Coordinates */}
      <div className="py-3 border-b border-white/10 space-y-1.5 font-mono text-xs">
        <div className="flex justify-between">
          <span className="text-[#6b7280]">ROW INDEX:</span>
          <strong className="text-[#f0f0f5]">#{voxel.row}</strong>
        </div>
        <div className="flex justify-between">
          <span className="text-[#6b7280]">FEATURE / COL:</span>
          <strong className="text-[#00d4ff]">{voxel.column}</strong>
        </div>
        <div className="flex justify-between">
          <span className="text-[#6b7280]">CELL VALUE:</span>
          <strong
            className={
              voxel.isMissing
                ? 'text-[#ef4444]'
                : voxel.isOutlier
                ? 'text-[#c9a961]'
                : 'text-[#22c55e]'
            }
          >
            {voxel.value === null || voxel.value === undefined || voxel.value === ''
              ? 'NULL / EMPTY'
              : String(voxel.value)}
          </strong>
        </div>
      </div>

      {/* Quality Diagnostic Tag */}
      <div className="py-3 border-b border-white/10">
        <span className="text-[10px] font-mono text-[#6b7280] block mb-1.5 uppercase">
          INTEGRITY STATUS:
        </span>
        {voxel.isMissing ? (
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-red-950/40 border border-red-500/30 text-red-400 text-xs font-mono">
            <AlertTriangle size={14} />
            <span>MISSING CELL ANOMALY</span>
          </div>
        ) : voxel.isOutlier ? (
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs font-mono">
            <AlertTriangle size={14} />
            <span>IQR BOUNDARY OUTLIER</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
            <CheckCircle size={14} />
            <span>VALID DATA POINT</span>
          </div>
        )}
      </div>

      {/* Feature Statistical Context */}
      {colSummary && colSummary.mean !== null && (
        <div className="pt-3 font-mono text-[11px] space-y-1">
          <span className="text-[10px] text-[#6b7280] block mb-1 uppercase">
            FEATURE CONTEXT:
          </span>
          <div className="flex justify-between text-[#94a3b8]">
            <span>Mean:</span>
            <strong>{colSummary.mean.toFixed(2)}</strong>
          </div>
          <div className="flex justify-between text-[#94a3b8]">
            <span>Range:</span>
            <strong>
              {colSummary.minimum} &rarr; {colSummary.maximum}
            </strong>
          </div>
        </div>
      )}

      {/* Hint */}
      <div className="mt-3 pt-2 text-[10px] text-[#6b7280] font-mono flex items-center gap-1">
        <Info size={11} />
        <span>Click anywhere in 3D space to dismiss</span>
      </div>
    </aside>
  );
}

