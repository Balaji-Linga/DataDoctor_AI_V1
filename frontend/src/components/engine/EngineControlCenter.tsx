import { useState } from 'react';
import { Cpu, CheckCircle2, Clock, ExternalLink, Activity, Info } from 'lucide-react';
import type { EngineDefinition, PipelineExecutionEvent } from '../../types/engine';
import type { AnalysisResponse, CleaningResponse } from '../../types/dataset';
import EnginePipelineVisualizer from './EnginePipelineVisualizer';
import EngineDetailModal from './EngineDetailModal';

interface EngineControlCenterProps {
  engines: EngineDefinition[];
  events: PipelineExecutionEvent[];
  analysis: AnalysisResponse | null;
  cleanResult: CleaningResponse | null;
  isAnalyzing: boolean;
  isCleaning: boolean;
}

export default function EngineControlCenter({
  engines,
  events,
  analysis,
  cleanResult,
  isAnalyzing,
  isCleaning,
}: EngineControlCenterProps) {
  const [selectedEngine, setSelectedEngine] = useState<EngineDefinition | null>(null);

  const implementedCount = engines.filter((e) => e.implementation === 'implemented').length;
  const plannedCount = engines.filter((e) => e.implementation === 'planned').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full p-6 select-none">
      {/* 1. Header & System Overview */}
      <div className="midnight-card rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/[0.06]">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-[#00f0ff]">
                <Cpu size={16} />
              </div>
              <h1 className="text-lg font-bold text-[#f8fafc] font-mono tracking-tight">
                ENGINE CONTROL CENTER
              </h1>
            </div>
            <p className="text-xs text-[#94a3b8] mt-1">
              Genuinely implemented backend engine registry, execution durations, algorithms, and real pipeline telemetry.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono">
              <span className="text-emerald-400 font-bold">{implementedCount} Operational</span>
              <span className="text-[#64748b] mx-1.5">•</span>
              <span className="text-amber-400 font-semibold">{plannedCount} Roadmap</span>
            </div>
          </div>
        </div>

        {/* Overview Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <span className="text-[10px] text-[#64748b] uppercase tracking-wider block mb-1">
              Active Engines
            </span>
            <span className="text-lg font-bold text-[#f8fafc] font-mono">
              5 / 5 Core
            </span>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <span className="text-[10px] text-[#64748b] uppercase tracking-wider block mb-1">
              Last Execution Latency
            </span>
            <span className="text-lg font-bold text-[#00f0ff] font-mono">
              {events.length > 0 ? `${events[events.length - 1].durationMs} ms` : '—'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <span className="text-[10px] text-[#64748b] uppercase tracking-wider block mb-1">
              Total Ingested Rows
            </span>
            <span className="text-lg font-bold text-[#f8fafc] font-mono">
              {analysis ? analysis.dataset.row_count.toLocaleString() : '—'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <span className="text-[10px] text-[#64748b] uppercase tracking-wider block mb-1">
              Quality Triage Status
            </span>
            <span className="text-lg font-bold text-emerald-400 font-mono">
              {cleanResult ? 'Decontaminated' : analysis ? 'Profiled' : 'Standby'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Live Pipeline Visualizer */}
      <EnginePipelineVisualizer
        engines={engines}
        onSelectEngine={setSelectedEngine}
        analysis={analysis}
        cleanResult={cleanResult}
        isAnalyzing={isAnalyzing}
        isCleaning={isCleaning}
      />

      {/* 3. Engine Registry Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-[#f8fafc] font-mono uppercase tracking-wider flex items-center gap-2">
            <span>Subsystem Engines Registry</span>
            <span className="text-xs text-[#64748b] font-normal">({engines.length} engines)</span>
          </h2>
          <span className="text-xs text-[#64748b] font-mono">Click card to view algorithm specs</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {engines.map((engine) => {
            const isImplemented = engine.implementation === 'implemented';

            return (
              <div
                key={engine.id}
                onClick={() => setSelectedEngine(engine)}
                className={`midnight-card rounded-2xl p-5 flex flex-col justify-between border transition-all cursor-pointer group hover:border-[#00f0ff]/40 hover:shadow-lg hover:shadow-blue-500/10 ${
                  isImplemented ? 'border-white/[0.08]' : 'border-amber-500/20 bg-amber-500/[0.02]'
                }`}
              >
                <div>
                  {/* Top Status */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase ${
                        isImplemented
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {isImplemented ? 'Operational' : 'Planned'}
                    </span>

                    <span className="text-[10px] font-mono text-[#64748b] flex items-center gap-1">
                      <Clock size={11} />
                      {engine.executionDurationMs !== null ? `${engine.executionDurationMs} ms` : '—'}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-[#f8fafc] font-mono group-hover:text-[#00f0ff] transition-colors">
                    {engine.name}
                  </h3>
                  <p className="text-xs text-[#94a3b8] mt-1 line-clamp-2 leading-relaxed">
                    {engine.purpose}
                  </p>

                  <div className="mt-3 py-1.5 px-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                    <span className="text-[10px] text-[#64748b] font-mono block">Backend Module:</span>
                    <code className="text-[11px] font-mono text-[#00f0ff] truncate block">
                      {engine.backendModule}
                    </code>
                  </div>
                </div>

                {/* Footer Metrics */}
                <div className="pt-4 mt-4 border-t border-white/[0.06] flex items-center justify-between text-xs">
                  <div className="text-[11px] font-mono text-[#94a3b8]">
                    {Object.keys(engine.metrics).length > 0 ? (
                      <span>{Object.entries(engine.metrics)[0][0]}: <strong className="text-[#f8fafc]">{String(Object.entries(engine.metrics)[0][1])}</strong></span>
                    ) : (
                      <span className="text-[#64748b]">Awaiting run</span>
                    )}
                  </div>

                  <span className="text-[#00f0ff] text-xs font-mono font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Inspect <ExternalLink size={12} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Real Execution Timeline */}
      <div className="midnight-card rounded-2xl p-5">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-4">
          <div className="flex items-center gap-2 font-mono">
            <Activity size={15} className="text-[#00f0ff]" />
            <h3 className="text-sm font-bold text-[#f8fafc] uppercase tracking-wider">
              Measured Engine Execution Log
            </h3>
          </div>
          <span className="text-xs text-[#64748b] font-mono">
            {events.length} real events captured
          </span>
        </div>

        {events.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-white/[0.06] text-[#64748b] text-[10px] uppercase">
                  <th className="py-2.5 px-3">TIMESTAMP</th>
                  <th className="py-2.5 px-3">OPERATION</th>
                  <th className="py-2.5 px-3">ENGINE</th>
                  <th className="py-2.5 px-3">DURATION</th>
                  <th className="py-2.5 px-3">STATUS</th>
                  <th className="py-2.5 px-3">METRICS / SUMMARY</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {events.slice(-8).reverse().map((ev) => (
                  <tr key={ev.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 px-3 text-[#94a3b8]">{ev.timestamp}</td>
                    <td className="py-2.5 px-3 text-[#f8fafc] font-semibold">{ev.operation}</td>
                    <td className="py-2.5 px-3 text-[#00f0ff]">{ev.engineId}</td>
                    <td className="py-2.5 px-3 text-[#cbd5e1]">{ev.durationMs} ms</td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 size={10} />
                        {ev.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#94a3b8] truncate max-w-xs">{ev.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-[#64748b] font-mono">
            <Info size={16} className="mx-auto mb-2 text-[#64748b]" />
            No engine executions measured yet. Load a dataset or fire remediation to capture live timings.
          </div>
        )}
      </div>

      {/* Engine Detail Modal */}
      <EngineDetailModal
        engine={selectedEngine}
        onClose={() => setSelectedEngine(null)}
      />
    </div>
  );
}
