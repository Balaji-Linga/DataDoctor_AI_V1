import { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import type { ChartDefinition } from '../chartRegistry';
import type { AnalysisResponse } from '../../../types/dataset';
import {
  calculateHistogramBins,
  calculateBoxPlotStats,
  calculateKDE,
  calculateECDF,
} from '../../../utils/mathStats';

interface StatisticalChartRendererProps {
  chart: ChartDefinition;
  analysis: AnalysisResponse | null;
  selectedX: string;
  selectedY: string;
}

export default function StatisticalChartRenderer({
  chart,
  analysis,
  selectedX,
  selectedY,
}: StatisticalChartRendererProps) {
  const records = useMemo(() => analysis?.dataset?.preview || [], [analysis]);
  const numericCols = useMemo(() => analysis?.statistics?.numeric_columns || [], [analysis]);

  const activeColX = selectedX || numericCols[0] || '';
  const activeColY = selectedY || numericCols[1] || numericCols[0] || '';

  // Extract clean numeric series
  const xValues = useMemo(() => {
    if (!activeColX || records.length === 0) return [];
    return records
      .map((r) => r[activeColX])
      .filter((v): v is number => typeof v === 'number' && !isNaN(v) && isFinite(v));
  }, [records, activeColX]);

  // Scatter pairs
  const scatterPairs = useMemo(() => {
    if (records.length === 0 || !activeColX || !activeColY) return [];
    return records
      .map((r, i) => {
        const x = r[activeColX];
        const y = r[activeColY];
        const z = numericCols[2] ? r[numericCols[2]] : 10;
        return typeof x === 'number' && typeof y === 'number'
          ? { x, y, z: typeof z === 'number' ? Math.max(5, Math.min(25, z / 5)) : 10, index: i + 1 }
          : null;
      })
      .filter((p): p is { x: number; y: number; z: number; index: number } => p !== null);
  }, [records, activeColX, activeColY, numericCols]);

  // Histogram bins
  const histBins = useMemo(() => {
    if (xValues.length === 0) return [];
    return calculateHistogramBins(xValues, 10);
  }, [xValues]);

  // Box plot stats
  const boxStats = useMemo(() => {
    if (xValues.length === 0) return null;
    return calculateBoxPlotStats(xValues);
  }, [xValues]);

  // KDE density curve
  const kdeData = useMemo(() => {
    if (xValues.length === 0) return [];
    return calculateKDE(xValues, 35);
  }, [xValues]);

  // ECDF curve
  const ecdfData = useMemo(() => {
    if (xValues.length === 0) return [];
    return calculateECDF(xValues);
  }, [xValues]);

  // Q-Q Plot: sorted sample values vs standard normal quantiles
  const qqData = useMemo(() => {
    if (xValues.length < 3) return [];
    const sorted = [...xValues].sort((a, b) => a - b);
    const n = sorted.length;
    return sorted.map((val, i) => {
      const p = (i + 0.5) / n;
      // Probit approximation for standard normal quantile
      const t = Math.sqrt(-2 * Math.log(p < 0.5 ? p : 1 - p));
      const c0 = 2.515517, c1 = 0.802853, c2 = 0.010328;
      const d1 = 1.432788, d2 = 0.189269, d3 = 0.001308;
      let qVal = t - (c0 + c1 * t + c2 * t * t) / (1 + d1 * t + d2 * t * t + d3 * t * t * t);
      if (p < 0.5) qVal = -qVal;
      return {
        theoretical: Number(qVal.toFixed(2)),
        sample: val,
      };
    });
  }, [xValues]);

  if (xValues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-[#64748b]">
        <p className="text-sm">No numeric data available for statistical plotting.</p>
        <p className="text-xs mt-1">Select a valid numeric column above.</p>
      </div>
    );
  }

  switch (chart.id) {
    case 17: // Histogram
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={histBins} margin={{ top: 20, right: 30, left: 10, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="mid" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} label={{ value: activeColX, position: 'insideBottom', offset: -10, fill: '#64748b' }} />
            <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} label={{ value: 'Frequency', angle: -90, position: 'insideLeft', fill: '#64748b' }} />
            <Tooltip contentStyle={{ backgroundColor: '#070e22', borderColor: 'rgba(255,255,255,0.15)', borderRadius: 8, color: '#f8fafc' }} />
            <Bar dataKey="count" fill="#00f0ff" radius={[4, 4, 0, 0]} animationDuration={1000} />
          </BarChart>
        </ResponsiveContainer>
      );

    case 18: // Box Plot
      if (!boxStats) return null;
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 select-none">
          <div className="max-w-md w-full bg-white/[0.02] border border-white/[0.08] rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <span className="text-xs font-mono font-bold text-[#00f0ff] uppercase">{activeColX} Box Plot</span>
              <span className="text-[11px] font-mono text-[#94a3b8]">IQR: {boxStats.iqr}</span>
            </div>

            {/* Visual Box & Whiskers Diagram */}
            <div className="relative h-20 flex items-center justify-center">
              {/* Whisker line */}
              <div className="absolute w-3/4 h-0.5 bg-blue-400" />
              {/* Min tick */}
              <div className="absolute left-[12%] h-8 w-1 bg-blue-400 rounded" />
              {/* Max tick */}
              <div className="absolute right-[12%] h-8 w-1 bg-blue-400 rounded" />
              {/* Box (Q1 to Q3) */}
              <div className="absolute left-[30%] right-[30%] h-14 rounded-lg bg-blue-600/30 border-2 border-[#00f0ff] flex items-center justify-center">
                {/* Median Line */}
                <div className="w-1 h-full bg-emerald-400" />
              </div>
            </div>

            {/* 5-Number Readout */}
            <div className="grid grid-cols-5 gap-2 text-center font-mono text-xs pt-2 border-t border-white/[0.06]">
              <div>
                <span className="text-[10px] text-[#64748b] block">MIN</span>
                <span className="text-[#f8fafc] font-bold">{boxStats.min}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#64748b] block">Q1</span>
                <span className="text-[#00f0ff] font-bold">{boxStats.q1}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#64748b] block">MEDIAN</span>
                <span className="text-emerald-400 font-bold">{boxStats.median}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#64748b] block">Q3</span>
                <span className="text-[#00f0ff] font-bold">{boxStats.q3}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#64748b] block">MAX</span>
                <span className="text-[#f8fafc] font-bold">{boxStats.max}</span>
              </div>
            </div>
          </div>
        </div>
      );

    case 19: // Violin Plot
      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={kdeData} margin={{ top: 20, right: 30, left: 10, bottom: 30 }}>
            <defs>
              <linearGradient id="violinGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.7} />
                <stop offset="95%" stopColor="#00f0ff" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="x" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip contentStyle={{ backgroundColor: '#070e22', borderColor: 'rgba(255,255,255,0.15)', borderRadius: 8, color: '#f8fafc' }} />
            <Area type="monotone" dataKey="density" stroke="#00f0ff" fill="url(#violinGrad)" strokeWidth={2.5} animationDuration={1200} />
          </AreaChart>
        </ResponsiveContainer>
      );

    case 20: // Scatter Plot
      return (
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis type="number" dataKey="x" name={activeColX} stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis type="number" dataKey="y" name={activeColY} stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#070e22', borderColor: 'rgba(255,255,255,0.15)', borderRadius: 8, color: '#f8fafc' }} />
            <Scatter name="Data Points" data={scatterPairs} fill="#00f0ff" animationDuration={1000}>
              {scatterPairs.map((_, index) => (
                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#00f0ff' : '#3b82f6'} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      );

    case 21: // Bubble Chart
      return (
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis type="number" dataKey="x" name={activeColX} stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis type="number" dataKey="y" name={activeColY} stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <ZAxis type="number" dataKey="z" range={[40, 200]} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#070e22', borderColor: 'rgba(255,255,255,0.15)', borderRadius: 8, color: '#f8fafc' }} />
            <Scatter name="Bubble Points" data={scatterPairs} fill="#8b5cf6" animationDuration={1000} />
          </ScatterChart>
        </ResponsiveContainer>
      );

    case 22: // Pair Plot
      return (
        <div className="w-full h-full p-4 grid grid-cols-2 gap-3 overflow-hidden">
          {numericCols.slice(0, 4).map((col, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col justify-between">
              <span className="text-[10px] font-mono text-[#00f0ff] uppercase">{col} vs {activeColY}</span>
              <div className="h-28 flex items-end gap-1 pt-2">
                {records.slice(0, 10).map((r, ri) => (
                  <div key={ri} className="flex-1 bg-blue-500/60 rounded-t-sm" style={{ height: `${Math.max(10, Math.min(100, Number(r[col] || 10)))}%` }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      );

    case 23: // Density Plot (KDE)
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={kdeData} margin={{ top: 20, right: 30, left: 10, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="x" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip contentStyle={{ backgroundColor: '#070e22', borderColor: 'rgba(255,255,255,0.15)', borderRadius: 8, color: '#f8fafc' }} />
            <Line type="monotone" dataKey="density" stroke="#00f0ff" strokeWidth={2.5} dot={false} animationDuration={1200} />
          </LineChart>
        </ResponsiveContainer>
      );

    case 24: // Q-Q Plot
      return (
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis type="number" dataKey="theoretical" name="Theoretical Quantiles" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis type="number" dataKey="sample" name="Sample Quantiles" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip contentStyle={{ backgroundColor: '#070e22', borderColor: 'rgba(255,255,255,0.15)', borderRadius: 8, color: '#f8fafc' }} />
            <Scatter name="Q-Q Points" data={qqData} fill="#00f0ff" animationDuration={1000} />
          </ScatterChart>
        </ResponsiveContainer>
      );

    case 25: // ECDF Plot
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={ecdfData} margin={{ top: 20, right: 30, left: 10, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="x" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis domain={[0, 1]} stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip contentStyle={{ backgroundColor: '#070e22', borderColor: 'rgba(255,255,255,0.15)', borderRadius: 8, color: '#f8fafc' }} />
            <Line type="stepAfter" dataKey="ecdf" stroke="#00f0ff" strokeWidth={2.5} dot={false} animationDuration={1200} />
          </LineChart>
        </ResponsiveContainer>
      );

    case 26: // Error Bar Chart
    case 27: // Strip Plot
    case 28: // Swarm Plot
    case 29: // Ridgeline Plot
    case 30: // Hexbin Plot
      return (
        <div className="w-full h-full p-6 flex flex-col items-center justify-center">
          <div className="w-full max-w-xl h-64 rounded-xl bg-white/[0.02] border border-white/[0.08] p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <span className="text-xs font-mono font-bold text-[#00f0ff] uppercase">{chart.name}</span>
              <span className="text-[10px] font-mono text-[#94a3b8]">{xValues.length} observations</span>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <div className="relative w-full h-32 flex items-center justify-center">
                {xValues.slice(0, 30).map((v, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 rounded-full bg-[#00f0ff]/80 transition-all hover:scale-150 cursor-pointer"
                    style={{
                      left: `${Math.max(5, Math.min(95, (i / 30) * 100))}%`,
                      top: `${Math.max(10, Math.min(85, (v / (Math.max(...xValues) || 1)) * 80))}%`,
                    }}
                    title={`Value: ${v}`}
                  />
                ))}
              </div>
            </div>
            <div className="text-[10px] text-[#64748b] text-center">
              Feature: <code className="text-[#00f0ff]">{activeColX}</code> • Bounded range: [{Math.min(...xValues)} to {Math.max(...xValues)}]
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
}

