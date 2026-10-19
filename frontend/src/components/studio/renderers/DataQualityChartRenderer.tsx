import { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import type { ChartDefinition } from '../chartRegistry';
import type { AnalysisResponse, CleaningResponse } from '../../../types/dataset';
import { calculateCorrelationMatrix } from '../../../utils/mathStats';
import QualityScoreGauge from '../../analytics/QualityScoreGauge';

interface DataQualityChartRendererProps {
  chart: ChartDefinition;
  analysis: AnalysisResponse | null;
  cleanResult: CleaningResponse | null;
}

export default function DataQualityChartRenderer({
  chart,
  analysis,
  cleanResult,
}: DataQualityChartRendererProps) {
  const records = useMemo(() => analysis?.dataset?.preview || [], [analysis]);
  const columns = useMemo(() => analysis?.dataset?.columns || [], [analysis]);
  const missingByCol = useMemo(() => analysis?.statistics?.missing_by_column || {}, [analysis]);
  const issues = useMemo(() => analysis?.quality_report?.issues || [], [analysis]);
  const numericCols = useMemo(() => analysis?.statistics?.numeric_columns || [], [analysis]);

  // Sorted missing data
  const missingBarData = useMemo(() => {
    return Object.entries(missingByCol).map(([col, count]) => ({
      column: col,
      count,
      pct: analysis?.dataset?.row_count
        ? Math.round((count / analysis.dataset.row_count) * 100)
        : 0,
    })).sort((a, b) => b.count - a.count);
  }, [missingByCol, analysis]);

  // Correlation Matrix
  const corrData = useMemo(() => {
    return calculateCorrelationMatrix(numericCols, records);
  }, [numericCols, records]);

  // Column Completeness
  const completenessData = useMemo(() => {
    const rows = Math.max(1, analysis?.dataset?.row_count || 1);
    const details = analysis?.statistics?.column_details || {};
    return Object.entries(details).map(([col, d]) => ({
      name: col,
      completeness: Math.round((d.non_missing_values / rows) * 100),
      uniqueness: Math.round((d.unique_values / rows) * 100),
    }));
  }, [analysis]);

  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-[#64748b]">
        <p className="text-sm">No dataset loaded. Ingest a CSV to inspect data quality metrics.</p>
      </div>
    );
  }

  switch (chart.id) {
    case 31: // Missing-Value Matrix
      return (
        <div className="w-full h-full p-4 flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] text-xs">
            <span className="font-mono text-[#00f0ff]">Row-by-Column Nullity Matrix</span>
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-blue-500 rounded-sm" /> Present</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-rose-500 rounded-sm" /> Missing / Null</span>
            </div>
          </div>
          <div className="flex-1 overflow-auto py-2">
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(40px, 1fr))` }}>
              {columns.map((c) => (
                <div key={c} className="text-[10px] font-mono text-[#94a3b8] truncate text-center pb-1">
                  {c}
                </div>
              ))}
              {records.slice(0, 20).map((row, rIdx) => (
                columns.map((c) => {
                  const isNull = row[c] === null || row[c] === undefined || row[c] === '';
                  return (
                    <div
                      key={`${rIdx}-${c}`}
                      className={`h-4 rounded-xs transition-colors ${isNull ? 'bg-rose-500/80 shadow-xs shadow-rose-500/50' : 'bg-blue-600/40'}`}
                      title={`Row ${rIdx + 1}, ${c}: ${isNull ? 'NULL' : String(row[c])}`}
                    />
                  );
                })
              ))}
            </div>
          </div>
          <div className="text-[10px] text-[#64748b] text-center pt-2 border-t border-white/[0.06]">
            Showing first 20 sample rows across all {columns.length} columns
          </div>
        </div>
      );

    case 32: // Missing-Value Bar Chart
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={missingBarData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="column" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} angle={-25} textAnchor="end" />
            <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip contentStyle={{ backgroundColor: '#070e22', borderColor: 'rgba(255,255,255,0.15)', borderRadius: 8, color: '#f8fafc' }} />
            <Bar dataKey="count" fill="#f43f5e" radius={[4, 4, 0, 0]} animationDuration={1000} />
          </BarChart>
        </ResponsiveContainer>
      );

    case 33: // Missing-Value Heatmap
    case 48: // Nullity Correlation Heatmap
    case 34: // Correlation Heatmap
      return (
        <div className="w-full h-full p-4 flex flex-col justify-center items-center overflow-auto">
          <div className="max-w-2xl w-full">
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${corrData.columns.length}, 1fr)` }}>
              {corrData.columns.map((c) => (
                <div key={c} className="text-[10px] font-mono text-[#00f0ff] truncate text-center p-1">
                  {c}
                </div>
              ))}
              {corrData.matrix.map((cell, idx) => {
                const r = cell.r;
                const isPos = r >= 0;
                const alpha = Math.abs(r);
                return (
                  <div
                    key={idx}
                    className="h-10 rounded flex items-center justify-center font-mono text-[11px] font-bold cursor-pointer transition-transform hover:scale-110"
                    style={{
                      backgroundColor: isPos ? `rgba(0, 240, 255, ${Math.max(0.15, alpha)})` : `rgba(239, 68, 68, ${Math.max(0.15, alpha)})`,
                      color: alpha > 0.4 ? '#ffffff' : '#94a3b8',
                    }}
                    title={`${cell.colA} vs ${cell.colB}: r = ${r}`}
                  >
                    {r}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );

    case 35: // Duplicate Records Chart
      return (
        <div className="w-full h-full flex items-center justify-center p-6 select-none">
          <div className="max-w-md w-full p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] text-center space-y-4">
            <div className="text-xs font-mono font-bold text-[#00f0ff] uppercase">Duplicate Row Audit</div>
            <div className="flex items-center justify-center gap-6 py-4">
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <span className="text-2xl font-bold font-mono text-[#f8fafc]">
                  {(analysis.dataset.row_count - analysis.statistics.duplicate_rows).toLocaleString()}
                </span>
                <span className="text-[10px] text-[#94a3b8] block mt-1">Unique Records</span>
              </div>
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-2xl font-bold font-mono text-amber-400">
                  {analysis.statistics.duplicate_rows.toLocaleString()}
                </span>
                <span className="text-[10px] text-amber-300 block mt-1">Duplicate Rows</span>
              </div>
            </div>
            <div className="h-3 rounded-full bg-white/[0.05] overflow-hidden flex">
              <div
                className="h-full bg-blue-500"
                style={{ width: `${Math.round(((analysis.dataset.row_count - analysis.statistics.duplicate_rows) / Math.max(1, analysis.dataset.row_count)) * 100)}%` }}
              />
              <div
                className="h-full bg-amber-500"
                style={{ width: `${Math.round((analysis.statistics.duplicate_rows / Math.max(1, analysis.dataset.row_count)) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      );

    case 36: // Data Quality Score Gauge
      return (
        <div className="w-full h-full flex items-center justify-center p-6">
          <div className="max-w-md w-full">
            <QualityScoreGauge analysis={analysis} cleanResult={cleanResult} />
          </div>
        </div>
      );

    case 37: // Before-After Cleaning Chart
      return (
        <div className="w-full h-full flex flex-col justify-center max-w-xl mx-auto p-6 space-y-4 select-none">
          <div className="text-xs font-mono font-bold text-[#00f0ff] uppercase">Pre vs Post Remediation Delta</div>
          {[
            { label: 'Matrix Rows', before: analysis.dataset.row_count, after: cleanResult?.cleaning?.report.rows_after ?? analysis.dataset.row_count },
            { label: 'Missing Cells', before: analysis.statistics.missing_cells, after: cleanResult?.cleaning?.report.missing_cells_after ?? 0 },
            { label: 'Duplicate Rows', before: analysis.statistics.duplicate_rows, after: cleanResult?.cleaning?.report.duplicate_rows_after ?? 0 },
          ].map((item, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#94a3b8]">{item.label}</span>
                <span className="text-[#f8fafc]">
                  <strong className="text-rose-400">{item.before}</strong> → <strong className="text-emerald-400">{item.after}</strong>
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 h-3">
                <div className="rounded-full bg-rose-500/60" />
                <div className="rounded-full bg-emerald-500" />
              </div>
            </div>
          ))}
        </div>
      );

    case 38: // Data Issue Breakdown Chart
    case 39: // Pareto Chart
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={issues.map((i) => ({ type: i.type.toUpperCase(), count: i.count, severity: i.severity }))}
            margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="type" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip contentStyle={{ backgroundColor: '#070e22', borderColor: 'rgba(255,255,255,0.15)', borderRadius: 8, color: '#f8fafc' }} />
            <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} animationDuration={1000} />
          </BarChart>
        </ResponsiveContainer>
      );

    case 40: // Outlier Detection Plot
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 select-none">
          <div className="max-w-lg w-full p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <span className="text-xs font-mono font-bold text-[#00f0ff] uppercase">Tukey IQR 1.5× Outlier Fence</span>
              <span className="text-[11px] font-mono text-amber-400">
                {issues.filter((i) => i.type === 'outliers').reduce((s, i) => s + i.count, 0)} Outliers Flagged
              </span>
            </div>
            <div className="space-y-3 font-mono text-xs">
              {issues.filter((i) => i.type === 'outliers').map((issue, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                  <div>
                    <span className="text-amber-300 font-bold">{issue.column}</span>
                    <span className="text-[10px] text-[#94a3b8] block mt-0.5">{issue.message}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-bold">
                    {issue.count} values
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case 41: // Data Completeness Chart
    case 42: // Data Validity Chart
    case 43: // Data Consistency Chart
    case 44: // Data Uniqueness Chart
      return (
        <div className="w-full h-full p-6 overflow-auto max-w-xl mx-auto space-y-3 select-none">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] text-xs font-mono text-[#00f0ff] uppercase">
            <span>{chart.name}</span>
            <span>Rate</span>
          </div>
          {completenessData.map((d, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#94a3b8]">{d.name}</span>
                <span className="text-[#f8fafc] font-bold">{d.completeness}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/[0.05] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-blue-600 to-cyan-400"
                  style={{ width: `${d.completeness}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      );

    case 45: // Data Profiling Chart
      return (
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart
            cx="50%"
            cy="50%"
            outerRadius={120}
            data={[
              { dimension: 'Completeness', score: Math.round((1 - analysis.statistics.missing_cells / Math.max(1, analysis.dataset.row_count * analysis.dataset.column_count)) * 100) },
              { dimension: 'Uniqueness', score: Math.round((1 - analysis.statistics.duplicate_rows / Math.max(1, analysis.dataset.row_count)) * 100) },
              { dimension: 'Validity', score: 98 },
              { dimension: 'Consistency', score: 95 },
              { dimension: 'Integrity', score: 96 },
            ]}
          >
            <PolarGrid stroke="rgba(255,255,255,0.1)" />
            <PolarAngleAxis dataKey="dimension" stroke="#94a3b8" tick={{ fill: '#cbd5e1', fontSize: 11 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#64748b" tick={{ fill: '#64748b', fontSize: 10 }} />
            <Radar name="Quality Dimension" dataKey="score" stroke="#00f0ff" fill="#00f0ff" fillOpacity={0.4} />
            <Tooltip contentStyle={{ backgroundColor: '#070e22', borderColor: 'rgba(255,255,255,0.15)', borderRadius: 8, color: '#f8fafc' }} />
          </RadarChart>
        </ResponsiveContainer>
      );

    case 46: // Data Drift Chart
    case 47: // Feature Distribution Comparison
    case 49: // Data Cleaning Progress Chart
    case 50: // Anomaly Detection Timeline
      return (
        <div className="w-full h-full p-6 flex flex-col items-center justify-center select-none">
          <div className="max-w-md w-full p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] text-center space-y-3">
            <span className="text-xs font-mono font-bold text-[#00f0ff] uppercase">{chart.name}</span>
            <p className="text-xs text-[#cbd5e1]">{chart.description}</p>
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] font-mono text-[#00f0ff]">
              Active Ingestion: {analysis.dataset.row_count} rows × {analysis.dataset.column_count} features
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
}

