import { useState } from 'react';
import { Terminal, ChevronUp, ChevronDown } from 'lucide-react';

interface TerminalStreamProps {
  logs: string[];
}

export default function TerminalStream({ logs }: TerminalStreamProps) {
  const [collapsed, setCollapsed] = useState<boolean>(false);

  return (
    <div
      className="fixed bottom-20 sm:bottom-6 left-4 z-40 w-80 sm:w-96 rounded-xl border backdrop-blur-xl shadow-2xl transition-all select-none pointer-events-auto"
      style={{
        background: 'rgba(5, 10, 24, 0.9)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Header */}
      <div
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-between px-3 py-2 border-b cursor-pointer"
        style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}
      >
        <div className="flex items-center gap-2 text-xs font-mono text-[#00d4ff]">
          <Terminal size={13} />
          <span className="font-bold tracking-wider text-[11px] uppercase">
            TELEMETRY STREAM
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#00d4ff] animate-ping" />
        </div>
        <button type="button" className="text-[#6b7280] hover:text-[#f0f0f5]">
          {collapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Terminal log output */}
      {!collapsed && (
        <div className="p-3 font-mono text-[11px] leading-relaxed max-h-36 overflow-y-auto space-y-1 scrollbar-thin">
          {logs.map((log, idx) => (
            <div key={idx} className="flex items-start gap-1.5">
              <span className="text-[#00d4ff] select-none">&gt;</span>
              <span
                className={
                  log.includes('FAIL') || log.includes('ERROR') || log.includes('ALERT')
                    ? 'text-[#ef4444]'
                    : log.includes('REMEDIATED') || log.includes('SUCCESS')
                    ? 'text-[#22c55e]'
                    : log.includes('INGEST') || log.includes('SCAN')
                    ? 'text-[#c9a961]'
                    : 'text-[#94a3b8]'
                }
              >
                {log}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

