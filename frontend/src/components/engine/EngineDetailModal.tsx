import { X, CheckCircle2, ArrowRight, Zap, Code } from 'lucide-react';
import type { EngineDefinition } from '../../types/engine';

interface EngineDetailModalProps {
  engine: EngineDefinition | null;
  onClose: () => void;
}

export default function EngineDetailModal({ engine, onClose }: EngineDetailModalProps) {
  if (!engine) return null;

  const isImplemented = engine.implementation === 'implemented';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in select-none">
      <div
        className="relative w-full max-w-2xl rounded-2xl border border-white/20 p-6 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        style={{ background: 'rgba(5, 11, 26, 0.98)' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-white/[0.08] shrink-0">
          <div>
            <div className="flex items-center gap-2.5">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  engine.status === 'running'
                    ? 'bg-[#00f0ff] animate-ping'
                    : engine.status === 'success'
                    ? 'bg-emerald-400'
                    : engine.status === 'failed'
                    ? 'bg-rose-500'
                    : isImplemented
                    ? 'bg-blue-400'
                    : 'bg-slate-500'
                }`}
              />
              <h2 className="text-base font-bold text-[#f8fafc] font-mono tracking-tight">
                {engine.name}
              </h2>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-semibold ${
                  isImplemented
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                }`}
              >
                {isImplemented ? 'Operational' : 'Planned / Roadmap'}
              </span>
            </div>
            <p className="text-xs text-[#94a3b8] mt-1">
              {engine.purpose}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-[#64748b] hover:text-[#f8fafc] p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto py-4 space-y-4 text-xs font-mono pr-1">
          {/* Backend Module Path */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[#94a3b8]">
              <Code size={13} className="text-[#00f0ff]" />
              <span>Backend Module:</span>
            </div>
            <code className="text-[#00f0ff] text-[11px] truncate max-w-[320px]">
              {engine.backendModule}
            </code>
          </div>

          {/* Execution Telemetry (Real Measured Values) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <span className="text-[10px] text-[#64748b] block mb-1">CURRENT STATUS</span>
              <span
                className={`text-xs font-bold uppercase ${
                  engine.status === 'success'
                    ? 'text-emerald-400'
                    : engine.status === 'running'
                    ? 'text-[#00f0ff]'
                    : engine.status === 'failed'
                    ? 'text-rose-400'
                    : 'text-[#94a3b8]'
                }`}
              >
                {engine.status}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <span className="text-[10px] text-[#64748b] block mb-1">MEASURED DURATION</span>
              <span className="text-xs font-bold text-[#f8fafc]">
                {engine.executionDurationMs !== null ? `${engine.executionDurationMs} ms` : '—'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <span className="text-[10px] text-[#64748b] block mb-1">LAST EXECUTED</span>
              <span className="text-xs font-medium text-[#94a3b8] truncate block">
                {engine.lastRunTime ?? 'Awaiting Request'}
              </span>
            </div>
          </div>

          {/* Algorithm & Specification */}
          <div className="p-3.5 rounded-xl bg-blue-500/[0.04] border border-blue-500/20">
            <div className="flex items-center gap-2 text-[#00f0ff] font-semibold mb-1.5">
              <Zap size={13} />
              <span>Algorithm & Mathematical Specification</span>
            </div>
            <p className="text-xs text-[#cbd5e1] font-sans leading-relaxed">
              {engine.algorithm}
            </p>
          </div>

          {/* Engine Responsibilities */}
          <div>
            <span className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider block mb-2">
              Key Responsibilities
            </span>
            <ul className="space-y-1.5 font-sans text-xs text-[#94a3b8]">
              {engine.responsibilities.map((resp, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span>{resp}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Real Live Metrics Output */}
          {Object.keys(engine.metrics).length > 0 && (
            <div>
              <span className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider block mb-2">
                Live Engine Metrics
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(engine.metrics).map(([key, val]) => (
                  <div key={key} className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                    <span className="text-[10px] text-[#64748b] uppercase block truncate">{key}</span>
                    <span className="text-sm font-bold text-[#00f0ff]">{String(val)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Input & Output Contracts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <span className="text-[10px] text-[#64748b] uppercase tracking-wider block mb-1">
                Accepted Inputs
              </span>
              <ul className="space-y-1 font-sans text-xs text-[#cbd5e1]">
                {engine.inputs.map((inp, idx) => (
                  <li key={idx} className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-[#00f0ff]" />
                    <span>{inp}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <span className="text-[10px] text-[#64748b] uppercase tracking-wider block mb-1">
                Emitted Artifacts
              </span>
              <ul className="space-y-1 font-sans text-xs text-[#cbd5e1]">
                {engine.outputs.map((out, idx) => (
                  <li key={idx} className="flex items-center gap-1.5">
                    <ArrowRight size={11} className="text-emerald-400" />
                    <span>{out}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs text-[#64748b] shrink-0 font-mono">
          <span>DataDoctor Engine Subsystem</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-[#f8fafc] cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
