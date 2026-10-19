import { FileText, BarChart3, AlertTriangle, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import type { EngineDefinition } from '../../types/engine';
import type { AnalysisResponse, CleaningResponse } from '../../types/dataset';

interface EnginePipelineVisualizerProps {
  engines: EngineDefinition[];
  onSelectEngine: (engine: EngineDefinition) => void;
  analysis: AnalysisResponse | null;
  cleanResult: CleaningResponse | null;
  isAnalyzing: boolean;
  isCleaning: boolean;
}

export default function EnginePipelineVisualizer({
  engines,
  onSelectEngine,
  analysis,
  cleanResult,
  isAnalyzing,
  isCleaning,
}: EnginePipelineVisualizerProps) {
  // Find engine definitions
  const readerEngine = engines.find((e) => e.id === 'csv-reader')!;
  const profilerEngine = engines.find((e) => e.id === 'profiler')!;
  const detectorEngine = engines.find((e) => e.id === 'quality-detector')!;
  const cleanerEngine = engines.find((e) => e.id === 'cleaner')!;
  const validatorEngine = engines.find((e) => e.id === 'validator')!;

  const stages = [
    {
      engine: readerEngine,
      icon: FileText,
      label: '1. CSV Reader',
      sublabel: analysis ? `${analysis.dataset.row_count} rows` : 'RFC-4180 Ingestion',
      isActive: isAnalyzing,
      isDone: Boolean(analysis),
      color: '#00f0ff',
    },
    {
      engine: profilerEngine,
      icon: BarChart3,
      label: '2. Dataset Profiler',
      sublabel: analysis ? `${analysis.dataset.column_count} cols (${analysis.statistics.numeric_columns.length} num)` : 'Statistical Compute',
      isActive: isAnalyzing,
      isDone: Boolean(analysis),
      color: '#3b82f6',
    },
    {
      engine: detectorEngine,
      icon: AlertTriangle,
      label: '3. Issue Detector',
      sublabel: analysis ? `${analysis.quality_report.total_issues} defects flagged` : 'IQR & Missing Scan',
      isActive: isAnalyzing,
      isDone: Boolean(analysis),
      color: '#f59e0b',
    },
    {
      engine: cleanerEngine,
      icon: Sparkles,
      label: '4. Cleaning Reactor',
      sublabel: cleanResult
        ? `${cleanResult.cleaning.report.missing_cells_before - cleanResult.cleaning.report.missing_cells_after} nulls fixed`
        : 'Mean / Median / Mode',
      isActive: isCleaning,
      isDone: Boolean(cleanResult),
      color: '#10b981',
    },
    {
      engine: validatorEngine,
      icon: CheckCircle2,
      label: '5. Schema Validator',
      sublabel: cleanResult ? '100% Verified' : 'Diff & Integrity',
      isActive: isCleaning,
      isDone: Boolean(cleanResult),
      color: '#8b5cf6',
    },
  ];

  return (
    <div className="midnight-card rounded-2xl p-5 w-full select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-4">
        <div>
          <h3 className="text-sm font-semibold text-[#f8fafc] tracking-wide flex items-center gap-2">
            <span>Live Analysis & Remediation Pipeline</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </h3>
          <p className="text-[11px] text-[#94a3b8] mt-0.5">
            Actual FastAPI backend execution stages. Click any stage to inspect algorithm specifications and runtime metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAnalyzing && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-[#00f0ff] border border-blue-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] animate-ping" />
              ANALYZING STREAM
            </span>
          )}
          {isCleaning && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              FIRING REACTOR
            </span>
          )}
        </div>
      </div>

      {/* Interactive Pipeline Stages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative py-2">
        {stages.map((st, idx) => {
          const Icon = st.icon;

          return (
            <div key={idx} className="relative flex flex-col items-center">
              {/* Card Node */}
              <button
                type="button"
                onClick={() => st.engine && onSelectEngine(st.engine)}
                className={`w-full p-3.5 rounded-xl border text-left transition-all duration-300 cursor-pointer group ${
                  st.isActive
                    ? 'bg-blue-600/20 border-[#00f0ff] shadow-lg shadow-blue-500/20 scale-102 ring-1 ring-[#00f0ff]/50'
                    : st.isDone
                    ? 'bg-white/[0.04] border-emerald-500/30 hover:border-emerald-400/50'
                    : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12] opacity-70'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{
                      backgroundColor: `${st.color}18`,
                      color: st.color,
                      border: `1px solid ${st.color}33`,
                    }}
                  >
                    <Icon size={14} className={st.isActive ? 'animate-pulse' : ''} />
                  </div>

                  <span
                    className={`text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded ${
                      st.isActive
                        ? 'bg-[#00f0ff]/20 text-[#00f0ff] animate-pulse'
                        : st.isDone
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-white/[0.04] text-[#64748b]'
                    }`}
                  >
                    {st.isActive ? 'Active' : st.isDone ? 'Completed' : 'Standby'}
                  </span>
                </div>

                <div className="font-mono text-xs font-bold text-[#f8fafc] truncate group-hover:text-[#00f0ff] transition-colors">
                  {st.label}
                </div>
                <div className="text-[10px] text-[#94a3b8] truncate font-mono mt-0.5">
                  {st.sublabel}
                </div>
              </button>

              {/* Connecting Arrow for larger screens */}
              {idx < stages.length - 1 && (
                <div className="hidden md:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-[#64748b]/60 pointer-events-none">
                  <ArrowRight size={14} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
