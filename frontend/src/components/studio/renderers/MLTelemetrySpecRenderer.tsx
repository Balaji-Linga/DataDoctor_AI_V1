import { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import type { ChartDefinition } from '../chartRegistry';
import type { AnalysisResponse } from '../../../types/dataset';
import { BrainCircuit, Info, Eye, EyeOff } from 'lucide-react';

interface MLTelemetrySpecRendererProps {
  chart: ChartDefinition;
  analysis: AnalysisResponse | null;
}

export default function MLTelemetrySpecRenderer({
  chart,
  analysis,
}: MLTelemetrySpecRendererProps) {
  const [showBenchmarkPreview, setShowBenchmarkPreview] = useState<boolean>(false);
  const numericCols = useMemo(() => analysis?.statistics?.numeric_columns || [], [analysis]);

  // Real Feature Variance / Correlation Importance data
  const featureImportanceData = useMemo(() => {
    const summary = analysis?.statistics?.numerical_summary || {};
    return numericCols.map((col) => {
      const std = summary[col]?.standard_deviation ?? 10;
      const mean = summary[col]?.mean ?? 50;
      const cv = mean !== 0 ? Math.abs(std / mean) : 0.5;
      return {
        feature: col,
        importance: Number((Math.min(1, cv / 2)).toFixed(3)),
      };
    }).sort((a, b) => b.importance - a.importance);
  }, [numericCols, analysis]);

  // Synthetic benchmark vectors for educational preview
  const benchmarkLossData = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      epoch: i + 1,
      trainLoss: Number((1.5 * Math.exp(-i * 0.18) + 0.12).toFixed(3)),
      valLoss: Number((1.6 * Math.exp(-i * 0.15) + 0.18 + (i > 14 ? (i - 14) * 0.03 : 0)).toFixed(3)),
      trainAcc: Number((0.55 + 0.42 * (1 - Math.exp(-i * 0.2))).toFixed(3)),
      valAcc: Number((0.52 + 0.40 * (1 - Math.exp(-i * 0.18))).toFixed(3)),
    }));
  }, []);

  const benchmarkRocData = useMemo(() => {
    return [
      { fpr: 0.0, tpr: 0.0 },
      { fpr: 0.02, tpr: 0.35 },
      { fpr: 0.05, tpr: 0.62 },
      { fpr: 0.10, tpr: 0.78 },
      { fpr: 0.18, tpr: 0.88 },
      { fpr: 0.30, tpr: 0.94 },
      { fpr: 0.50, tpr: 0.97 },
      { fpr: 0.75, tpr: 0.99 },
      { fpr: 1.0, tpr: 1.0 },
    ];
  }, []);

  if (chart.id === 58) {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={featureImportanceData} layout="vertical" margin={{ top: 20, right: 30, left: 60, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis type="number" stroke="#64748b" domain={[0, 1]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
          <YAxis dataKey="feature" type="category" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
          <Tooltip contentStyle={{ backgroundColor: '#070e22', borderColor: 'rgba(255,255,255,0.15)', borderRadius: 8, color: '#f8fafc' }} />
          <Bar dataKey="importance" fill="#00f0ff" radius={[0, 4, 4, 0]} animationDuration={1000} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <div className="w-full h-full p-6 flex flex-col justify-center items-center select-none overflow-auto">
      <div className="max-w-xl w-full p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <BrainCircuit size={18} className="text-[#00f0ff]" />
            <h3 className="text-sm font-bold font-mono text-[#f8fafc] uppercase">{chart.name}</h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase">
            Model Contract Required
          </span>
        </div>

        {/* Technical Requirement Description */}
        <p className="text-xs text-[#cbd5e1] leading-relaxed">
          {chart.description}
        </p>

        {/* Input Contract Specification */}
        <div className="p-3.5 rounded-xl bg-blue-500/[0.03] border border-blue-500/20 text-xs font-mono space-y-1.5">
          <div className="flex items-center gap-1.5 text-[#00f0ff] font-bold text-[11px]">
            <Info size={12} />
            <span>REQUIRED INPUT SCHEMA</span>
          </div>
          <code className="text-xs text-[#cbd5e1] block bg-black/40 p-2 rounded-lg border border-white/5">
            {chart.requiredData}
          </code>
          <div className="text-[11px] text-[#94a3b8] pt-1">
            Current Dataset: Tabular CSV matrix ({analysis?.dataset?.row_count ?? 0} rows). Machine Learning evaluation history is not present in raw CSV files.
          </div>
        </div>

        {/* Synthetic Benchmark Toggle */}
        <div className="pt-2 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowBenchmarkPreview(!showBenchmarkPreview)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-xs font-mono text-[#00f0ff] transition-all cursor-pointer"
          >
            {showBenchmarkPreview ? <EyeOff size={13} /> : <Eye size={13} />}
            <span>{showBenchmarkPreview ? 'Hide Benchmark Preview' : 'Preview with Synthetic Benchmark Vector'}</span>
          </button>
          <span className="text-[10px] font-mono text-[#64748b]">Educational Simulation</span>
        </div>

        {/* Benchmark Visualizer (Only visible when user toggles) */}
        {showBenchmarkPreview && (
          <div className="mt-4 pt-4 border-t border-white/[0.08] animate-in fade-in space-y-2">
            <div className="px-3 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-[10px] font-mono text-amber-300">
              SYNTHETIC BENCHMARK VECTOR — DEMONSTRATION OF CHART VISUALIZATION
            </div>
            <div className="h-56 w-full pt-2">
              {chart.id === 56 || chart.id === 57 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={benchmarkRocData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="fpr" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 10 }} label={{ value: 'False Positive Rate', position: 'insideBottom', fill: '#64748b', fontSize: 10 }} />
                    <YAxis dataKey="tpr" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 10 }} label={{ value: 'True Positive Rate', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#070e22', borderColor: 'rgba(255,255,255,0.15)', borderRadius: 8, color: '#f8fafc', fontSize: 11 }} />
                    <Line type="monotone" dataKey="tpr" stroke="#00f0ff" strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={benchmarkLossData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="epoch" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 10 }} label={{ value: 'Epoch', position: 'insideBottom', fill: '#64748b', fontSize: 10 }} />
                    <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#070e22', borderColor: 'rgba(255,255,255,0.15)', borderRadius: 8, color: '#f8fafc', fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="trainLoss" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="valLoss" stroke="#00f0ff" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

