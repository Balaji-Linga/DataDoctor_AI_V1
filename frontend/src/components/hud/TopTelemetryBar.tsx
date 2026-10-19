import { useState, useEffect } from 'react';
import { Volume2, VolumeX, Eye, Activity, RotateCcw, Globe } from 'lucide-react';
import { soundManager } from '../../audio/soundManager';
import { checkHealth } from '../../services/api';

interface TopTelemetryBarProps {
  machineState: string;
  freeLook: boolean;
  onToggleFreeLook: () => void;
  onResetCamera: () => void;
  showGlobeDemo?: boolean;
  onToggleGlobeDemo?: () => void;
}

export default function TopTelemetryBar({
  machineState,
  freeLook,
  onToggleFreeLook,
  onResetCamera,
  showGlobeDemo,
  onToggleGlobeDemo,
}: TopTelemetryBarProps) {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [latency, setLatency] = useState<number>(14);

  useEffect(() => {
    let mounted = true;
    const start = performance.now();
    checkHealth()
      .then(() => {
        if (!mounted) return;
        const dur = Math.round(performance.now() - start);
        setLatency(dur > 0 ? dur : 12);
        setApiOnline(true);
      })
      .catch(() => {
        if (!mounted) return;
        setApiOnline(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleToggleSound = () => {
    const isNowOn = soundManager.toggleMute();
    setSoundEnabled(isNowOn);
    if (isNowOn) soundManager.playClick();
  };

  const getStatusColor = () => {
    switch (machineState) {
      case 'analyzing':
        return '#c9a961';
      case 'cleaning':
        return '#22c55e';
      case 'failed':
        return '#ef4444';
      default:
        return '#00d4ff';
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 px-4 sm:px-6 py-3 flex items-center justify-between pointer-events-none select-none">
      {/* Brand & System Readout */}
      <div className="flex items-center gap-3 pointer-events-auto">
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border backdrop-blur-xl"
          style={{
            background: 'rgba(5, 10, 24, 0.85)',
            borderColor: 'rgba(0, 212, 255, 0.25)',
            boxShadow: '0 0 15px rgba(0, 212, 255, 0.12)',
          }}
        >
          <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: getStatusColor() }} />
          <span className="text-xs font-black tracking-widest text-[#f0f0f5] uppercase font-mono">
            DATADOCTOR // 3D-LAB
          </span>
          <span className="text-[10px] text-[#6b7280] font-mono">v2.5</span>
        </div>

        {/* Machine Mode Badge */}
        <div
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border backdrop-blur-xl text-[11px] font-mono uppercase"
          style={{
            background: 'rgba(5, 10, 24, 0.75)',
            borderColor: 'rgba(255, 255, 255, 0.08)',
            color: getStatusColor(),
          }}
        >
          <span>MODE: {machineState}</span>
        </div>
      </div>

      {/* Right Controls: API status, sound toggle, free-look toggle */}
      <div className="flex items-center gap-2 pointer-events-auto">
        {/* Backend Status indicator */}
        <div
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border backdrop-blur-xl text-[11px] font-mono"
          style={{
            background: 'rgba(5, 10, 24, 0.75)',
            borderColor: 'rgba(255, 255, 255, 0.08)',
          }}
        >
          <Activity size={13} className={apiOnline ? 'text-[#22c55e]' : 'text-[#ef4444]'} />
          <span className="text-[#94a3b8]">
            {apiOnline ? `ONLINE (${latency}ms)` : 'OFFLINE'}
          </span>
        </div>

        {/* Free Look Toggle */}
        <button
          type="button"
          onClick={() => {
            soundManager.playClick();
            onToggleFreeLook();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border backdrop-blur-xl text-xs font-mono transition-all cursor-pointer"
          style={{
            background: freeLook ? 'rgba(0, 212, 255, 0.2)' : 'rgba(5, 10, 24, 0.85)',
            borderColor: freeLook ? 'rgba(0, 212, 255, 0.6)' : 'rgba(255, 255, 255, 0.1)',
            color: freeLook ? '#00d4ff' : '#94a3b8',
          }}
          title={freeLook ? 'Disable Free-Look Camera' : 'Enable Free-Look Camera'}
        >
          <Eye size={13} />
          <span className="hidden sm:inline">{freeLook ? 'FREE-LOOK' : 'ORBIT'}</span>
        </button>

        {/* Reset Camera */}
        <button
          type="button"
          onClick={() => {
            soundManager.playClick();
            onResetCamera();
          }}
          className="p-2 rounded-lg border backdrop-blur-xl text-[#94a3b8] hover:text-[#00d4ff] transition-all cursor-pointer"
          style={{
            background: 'rgba(5, 10, 24, 0.85)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
          }}
          title="Reset Camera View"
        >
          <RotateCcw size={13} />
        </button>

        {/* Aceternity 3D Globe Demo Toggle */}
        {onToggleGlobeDemo && (
          <button
            type="button"
            onClick={() => {
              soundManager.playClick();
              onToggleGlobeDemo();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border backdrop-blur-xl text-xs font-mono transition-all cursor-pointer"
            style={{
              background: showGlobeDemo ? 'rgba(0, 212, 255, 0.25)' : 'rgba(5, 10, 24, 0.85)',
              borderColor: showGlobeDemo ? 'rgba(0, 212, 255, 0.6)' : 'rgba(255, 255, 255, 0.1)',
              color: showGlobeDemo ? '#00d4ff' : '#94a3b8',
            }}
            title="Toggle Aceternity UI 3D Globe Demo"
          >
            <Globe size={13} />
            <span className="hidden sm:inline">GLOBE DEMO</span>
          </button>
        )}

        {/* Sound Toggle */}
        <button
          type="button"
          onClick={handleToggleSound}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border backdrop-blur-xl text-xs font-mono transition-all cursor-pointer"
          style={{
            background: soundEnabled ? 'rgba(5, 10, 24, 0.85)' : 'rgba(239, 68, 68, 0.15)',
            borderColor: soundEnabled ? 'rgba(255, 255, 255, 0.1)' : 'rgba(239, 68, 68, 0.3)',
            color: soundEnabled ? '#00d4ff' : '#ef4444',
          }}
          title={soundEnabled ? 'Mute Sound Effects' : 'Unmute Sound Effects'}
        >
          {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
          <span className="hidden sm:inline">{soundEnabled ? 'SFX' : 'MUTED'}</span>
        </button>
      </div>
    </header>
  );
}

