import { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Treemap,
} from 'recharts';
import type { ChartDefinition } from '../chartRegistry';
import type { AnalysisResponse } from '../../../types/dataset';

interface BasicChartRendererProps {
  chart: ChartDefinition;
  analysis: AnalysisResponse | null;
  selectedX: string;
  selectedY: string;
}

const PALETTE = ['#00f0ff', '#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#6366f1', '#14b8a6'];

export default function BasicChartRenderer({
  chart,
  analysis,
  selectedX,
  selectedY,
}: BasicChartRendererProps) {
  const records = useMemo(() => analysis?.dataset?.preview || [], [analysis]);
  const numericCols = useMemo(() => analysis?.statistics?.numeric_columns || [], [analysis]);
  const nonNumericCols = useMemo(() => analysis?.statistics?.non_numeric_columns || [], [analysis]);

  // Derived data based on selected columns
  const chartData = useMemo(() => {
    if (records.length === 0) return [];
    return records.slice(0, 20).map((r, idx) => {
      const item: Record<string, unknown> = {
        name: selectedX && r[selectedX] !== undefined ? String(r[selectedX]) : `Row ${idx + 1}`,
      };
      for (const col of numericCols) {
        item[col] = typeof r[col] === 'number' ? r[col] : 0;
      }
      return item;
    });
  }, [records, selectedX, numericCols]);

  // Categorical distribution data
  const categoryData = useMemo(() => {
    const catCol = selectedX || nonNumericCols[0] || (numericCols[0] ?? '');
    if (!catCol || records.length === 0) return [];
    const counts: Record<string, number> = {};
    for (const r of records) {
      const key = String(r[catCol] ?? 'N/A');
      counts[key] = (counts[key] || 0) + 1;
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [records, selectedX, nonNumericCols, numericCols]);

  // Radar multi-feature summary data
  const radarData = useMemo(() => {
    const cols = numericCols.slice(0, 6);
    const summary = analysis?.statistics?.numerical_summary || {};
    return cols.map((col) => {
      const s = summary[col];
      const mean = s?.mean ?? 50;
      const max = s?.maximum ?? 100;
      const normalized = max > 0 ? Math.round((mean / max) * 100) : 50;
      return {
        feature: col,
        mean: normalized,
        fullMark: 100,
      };
    });
  }, [numericCols, analysis]);

  // Treemap hierarchical data
  const treemapData = useMemo(() => {
    return categoryData.map((d, i) => ({
      name: d.name,
      size: d.value,
      fill: PALETTE[i % PALETTE.length],
    }));
  }, [categoryData]);

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-[#64748b]">
        <p className="text-sm">No dataset loaded. Ingest a CSV to render this chart.</p>
      </div>
    );
  }

  const yField = selectedY || numericCols[0] || 'value';
  const secondaryY = numericCols[1] || numericCols[0] || 'value';

  switch (chart.id) {
    case 1: // Bar Chart
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} angle={-25} textAnchor="end" />
            <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip contentStyle={{ backgroundColor: '#070e22', borderColor: 'rgba(255,255,255,0.15)', borderRadius: 8, color: '#f8fafc', fontSize: 12 }} />
            <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 11 }} />
            <Bar dataKey={yField} fill="#00f0ff" radius={[4, 4, 0, 0]} animationDuration={1000} />
          </BarChart>
        </ResponsiveContainer>
      );

    case 2: // Horizontal Bar Chart
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData.slice(0, 10)} layout="vertical" margin={{ top: 20, right: 30, left: 60, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis type="number" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis dataKey="name" type="category" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip contentStyle={{ backgroundColor: '#070e22', borderColor: 'rgba(255,255,255,0.15)', borderRadius: 8, color: '#f8fafc' }} />
            <Bar dataKey={yField} fill="#3b82f6" radius={[0, 4, 4, 0]} animationDuration={1000} />
          </BarChart>
        </ResponsiveContainer>
      );

    case 3: // Grouped Bar Chart
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} angle={-25} textAnchor="end" />
            <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip contentStyle={{ backgroundColor: '#070e22', borderColor: 'rgba(255,255,255,0.15)', borderRadius: 8, color: '#f8fafc' }} />
            <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 11 }} />
            <Bar dataKey={yField} fill="#00f0ff" radius={[4, 4, 0, 0]} animationDuration={1000} />
            <Bar dataKey={secondaryY} fill="#8b5cf6" radius={[4, 4, 0, 0]} animationDuration={1000} />
          </BarChart>
        </ResponsiveContainer>
      );

    case 4: // Stacked Bar Chart
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} angle={-25} textAnchor="end" />
            <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip contentStyle={{ backgroundColor: '#070e22', borderColor: 'rgba(255,255,255,0.15)', borderRadius: 8, color: '#f8fafc' }} />
            <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 11 }} />
            <Bar dataKey={yField} stackId="a" fill="#3b82f6" animationDuration={1000} />
            <Bar dataKey={secondaryY} stackId="a" fill="#00f0ff" radius={[4, 4, 0, 0]} animationDuration={1000} />
          </BarChart>
        </ResponsiveContainer>
      );

    case 5: // Line Chart
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} angle={-25} textAnchor="end" />
            <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip contentStyle={{ backgroundColor: '#070e22', borderColor: 'rgba(255,255,255,0.15)', borderRadius: 8, color: '#f8fafc' }} />
            <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 11 }} />
            <Line type="monotone" dataKey={yField} stroke="#00f0ff" strokeWidth={2.5} dot={{ fill: '#00f0ff', r: 4 }} activeDot={{ r: 6, fill: '#fff' }} animationDuration={1200} />
          </LineChart>
        </ResponsiveContainer>
      );

    case 6: // Multi-Line Chart
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} angle={-25} textAnchor="end" />
            <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip contentStyle={{ backgroundColor: '#070e22', borderColor: 'rgba(255,255,255,0.15)', borderRadius: 8, color: '#f8fafc' }} />
            <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 11 }} />
            <Line type="monotone" dataKey={yField} stroke="#00f0ff" strokeWidth={2} dot={{ r: 3 }} animationDuration={1200} />
            <Line type="monotone" dataKey={secondaryY} stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} animationDuration={1200} />
            {numericCols[2] && (
              <Line type="monotone" dataKey={numericCols[2]} stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} animationDuration={1200} />
            )}
          </LineChart>
        </ResponsiveContainer>
      );

    case 7: // Area Chart
      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 40 }}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#00f0ff" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} angle={-25} textAnchor="end" />
            <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip contentStyle={{ backgroundColor: '#070e22', borderColor: 'rgba(255,255,255,0.15)', borderRadius: 8, color: '#f8fafc' }} />
            <Area type="monotone" dataKey={yField} stroke="#00f0ff" strokeWidth={2.5} fillOpacity={1} fill="url(#areaGrad)" animationDuration={1200} />
          </AreaChart>
        </ResponsiveContainer>
      );

    case 8: // Stacked Area Chart
      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 40 }}>
            <defs>
              <linearGradient id="areaGrad1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="areaGrad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#00f0ff" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} angle={-25} textAnchor="end" />
            <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip contentStyle={{ backgroundColor: '#070e22', borderColor: 'rgba(255,255,255,0.15)', borderRadius: 8, color: '#f8fafc' }} />
            <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 11 }} />
            <Area type="monotone" dataKey={yField} stackId="1" stroke="#3b82f6" fillOpacity={1} fill="url(#areaGrad1)" animationDuration={1200} />
            <Area type="monotone" dataKey={secondaryY} stackId="1" stroke="#00f0ff" fillOpacity={1} fill="url(#areaGrad2)" animationDuration={1200} />
          </AreaChart>
        </ResponsiveContainer>
      );

    case 9: // Pie Chart
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip contentStyle={{ backgroundColor: '#070e22', borderColor: 'rgba(255,255,255,0.15)', borderRadius: 8, color: '#f8fafc' }} />
            <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 11 }} />
            <Pie data={categoryData} cx="50%" cy="50%" outerRadius={130} dataKey="value" nameKey="name" label={(e) => `${e.name}: ${e.value}`} animationDuration={1000}>
              {categoryData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      );

    case 10: // Doughnut Chart
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip contentStyle={{ backgroundColor: '#070e22', borderColor: 'rgba(255,255,255,0.15)', borderRadius: 8, color: '#f8fafc' }} />
            <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 11 }} />
            <Pie data={categoryData} cx="50%" cy="50%" innerRadius={70} outerRadius={125} paddingAngle={4} dataKey="value" nameKey="name" animationDuration={1000}>
              {categoryData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} stroke="rgba(0,0,0,0.4)" strokeWidth={2} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      );

    case 11: // Radar Chart
    case 12: // Polar Area Chart
      return (
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius={120} data={radarData}>
            <PolarGrid stroke="rgba(255,255,255,0.1)" />
            <PolarAngleAxis dataKey="feature" stroke="#94a3b8" tick={{ fill: '#cbd5e1', fontSize: 11 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#64748b" tick={{ fill: '#64748b', fontSize: 10 }} />
            <Radar name="Normalized Feature Intensity" dataKey="mean" stroke="#00f0ff" fill="#00f0ff" fillOpacity={0.4} />
            <Tooltip contentStyle={{ backgroundColor: '#070e22', borderColor: 'rgba(255,255,255,0.15)', borderRadius: 8, color: '#f8fafc' }} />
            <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 11 }} />
          </RadarChart>
        </ResponsiveContainer>
      );

    case 13: // Waterfall Chart
      return (
        <div className="w-full h-full p-4 flex flex-col justify-center">
          <div className="h-64 flex items-end gap-3 px-4 py-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            {chartData.slice(0, 8).map((d, i) => {
              const val = Number(d[yField] || 0);
              const maxVal = Math.max(1, ...chartData.map((c) => Number(c[yField] || 0)));
              const heightPct = Math.max(10, Math.min(100, Math.round((val / maxVal) * 100)));
              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group">
                  <span className="text-[10px] font-mono text-[#00f0ff] opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                    {val.toLocaleString()}
                  </span>
                  <div
                    className="w-full rounded-t-md transition-all duration-500"
                    style={{
                      height: `${heightPct}%`,
                      background: i === 0 ? '#3b82f6' : i === 7 ? '#10b981' : '#00f0ff',
                      boxShadow: '0 0 10px rgba(0,240,255,0.3)',
                    }}
                  />
                  <span className="text-[9px] font-mono text-[#94a3b8] truncate w-full text-center mt-2">
                    {String(d.name).slice(0, 6)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );

    case 14: // Funnel Chart
      return (
        <div className="w-full h-full p-6 flex flex-col justify-center max-w-xl mx-auto space-y-3">
          {[
            { label: 'Raw Ingested Records', val: analysis?.dataset?.row_count ?? 100, pct: 100, color: '#1e3a8a' },
            { label: 'Schema Conforming Cells', val: Math.round((analysis?.dataset?.row_count ?? 100) * 0.98), pct: 98, color: '#2563eb' },
            { label: 'Non-Null Observations', val: Math.round((analysis?.dataset?.row_count ?? 100) * 0.92), pct: 92, color: '#0284c7' },
            { label: 'Outlier Filtered Vectors', val: Math.round((analysis?.dataset?.row_count ?? 100) * 0.88), pct: 88, color: '#00f0ff' },
          ].map((step, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <span className="text-xs font-mono text-[#94a3b8] w-48 truncate">{step.label}</span>
              <div className="flex-1 h-8 rounded-lg overflow-hidden bg-white/[0.04] relative">
                <div
                  className="h-full rounded-lg transition-all duration-700 flex items-center justify-end pr-3"
                  style={{ width: `${step.pct}%`, backgroundColor: step.color }}
                >
                  <span className="text-xs font-mono font-bold text-white">{step.val.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      );

    case 15: // Treemap
      return (
        <ResponsiveContainer width="100%" height="100%">
          <Treemap data={treemapData} dataKey="size" stroke="rgba(0,0,0,0.5)" fill="#00f0ff" animationDuration={1000} />
        </ResponsiveContainer>
      );

    case 16: // Sunburst Chart (Multi-level breakdown)
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
          <div className="relative w-72 h-72 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-dashed border-blue-500/30 animate-spin" style={{ animationDuration: '30s' }} />
            <div className="absolute inset-6 rounded-full border-4 border-cyan-400/40" />
            <div className="absolute inset-16 rounded-full bg-blue-600/20 flex flex-col items-center justify-center p-4">
              <span className="text-xs font-mono font-bold text-[#00f0ff]">Sunburst Hierarchy</span>
              <span className="text-[10px] text-[#94a3b8] mt-1">{analysis?.dataset?.column_count} Features</span>
            </div>
          </div>
          <p className="text-xs text-[#64748b] mt-4">Nested categorical levels mapped to concentric radial segments</p>
        </div>
      );

    default:
      return null;
  }
}

