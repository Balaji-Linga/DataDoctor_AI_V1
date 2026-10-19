import { X, Orbit, Mountain, Grid3X3, BarChart2, Globe, Binary } from 'lucide-react';
import type { AnalysisResponse, CleaningResponse } from '../../types/dataset';
import DataMountain from '../viz3d/DataMountain';
import ScatterUniverse from '../viz3d/ScatterUniverse';
import CorrelationMatrix from '../viz3d/CorrelationMatrix';
import DistributionExplorer from '../viz3d/DistributionExplorer';
import Globe3DDemo from '../3d-globe-demo';

export type Graph3DType =
  | 'mountain'
  | 'scatter'
  | 'correlation'
  | 'distribution'
  | 'matrix'
  | 'globe'
  | null;

interface Graph3DModalProps {
  graphType: Graph3DType;
  onClose: () => void;
  analysis: AnalysisResponse | null;
  cleanResult: CleaningResponse | null;
}

export default function Graph3DModal({
  graphType,
  onClose,
  analysis,
}: Graph3DModalProps) {
  if (!graphType) return null;

  const dataset = analysis?.dataset;
  const statistics = analysis?.statistics;
  const quality = analysis?.quality_report;

  const columns = dataset?.columns || [];
  const records = dataset?.preview || [];
  const numericalSummary = statistics?.numerical_summary || {};
  const numericColumns = statistics?.numeric_columns || [];
  const outlierColumns = new Set(
    quality?.issues?.filter((i) => i.type === 'outliers').map((i) => i.column ?? '') || []
  );

  const getTitle = () => {
    switch (graphType) {
      case 'mountain':
        return { label: '3D Topography Data Mountain', icon: Mountain, desc: '3D terrain mapping normalized feature heights across preview rows' };
      case 'scatter':
        return { label: '3D Scatter Universe', icon: Orbit, desc: 'Multi-dimensional spatial point cloud across selectable X, Y, Z axes' };
      case 'correlation':
        return { label: '3D Pearson Correlation Prisms', icon: Grid3X3, desc: 'Extruded box prisms showing cross-feature linear correlation r-values' };
      case 'distribution':
        return { label: '3D Distribution Explorer', icon: BarChart2, desc: 'Spatial histogram bars illustrating frequency density and mean markers' };
      case 'globe':
        return { label: 'Aceternity UI // 3D Earth Globe', icon: Globe, desc: 'Global spherical node visualization with topological bump mapping' };
      case 'matrix':
        return { label: '3D Voxel Inspection Lattice', icon: Binary, desc: '3D spatial matrix of rows and columns with outlier and null beacons' };
      default:
        return { label: '3D Graph Inspector', icon: Orbit, desc: 'Interactive WebGL visualization' };
    }
  };

  const info = getTitle();
  const Icon = info.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in select-none">
      <div
        className="relative w-full max-w-5xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden flex flex-col"
        style={{ background: 'rgba(5, 11, 26, 0.98)', height: '82vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-[#00f0ff]">
              <Icon size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#f8fafc] font-mono tracking-tight">
                {info.label}
              </h2>
              <p className="text-xs text-[#94a3b8]">
                {info.desc}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-[#64748b]">
              Drag to Orbit • Scroll to Zoom
            </span>
            <button
              type="button"
              onClick={onClose}
              className="text-[#64748b] hover:text-[#f8fafc] p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 3D Canvas Body */}
        <div className="flex-1 w-full h-full relative overflow-hidden bg-[#030712]">
          {graphType === 'mountain' && (
            <DataMountain
              columns={columns}
              records={records}
              numericalSummary={numericalSummary}
              outlierColumns={outlierColumns}
            />
          )}

          {graphType === 'scatter' && (
            <ScatterUniverse
              columns={columns}
              records={records}
              numericalSummary={numericalSummary}
              outlierColumns={outlierColumns}
            />
          )}

          {graphType === 'correlation' && (
            <CorrelationMatrix
              columns={columns}
              records={records}
              numericColumns={numericColumns}
            />
          )}

          {graphType === 'distribution' && (
            <DistributionExplorer
              columns={columns}
              records={records}
              numericalSummary={numericalSummary}
            />
          )}

          {graphType === 'globe' && (
            <div className="w-full h-full flex items-center justify-center">
              <Globe3DDemo />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
