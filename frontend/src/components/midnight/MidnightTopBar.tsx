import { useState } from 'react';
import { Search, Upload, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { soundManager } from '../../audio/soundManager';
import type { AnalysisResponse } from '../../types/dataset';
import GraphStudioDropdown from '../studio/GraphStudioDropdown';

interface MidnightTopBarProps {
  activeFile: File | null;
  onUploadClick: () => void;
  onLoadSample: () => void;
  isLoading: boolean;
  analysis: AnalysisResponse | null;
  onOpenStudioChart: (chartId: number) => void;
}

export default function MidnightTopBar({
  activeFile,
  onUploadClick,
  onLoadSample,
  isLoading,
  analysis,
  onOpenStudioChart,
}: MidnightTopBarProps) {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const handleToggleSound = () => {
    const isNowOn = soundManager.toggleMute();
    setSoundEnabled(isNowOn);
    if (isNowOn) soundManager.playClick();
  };

  return (
    <header className="h-16 px-6 border-b border-white/[0.06] flex items-center justify-between gap-4 select-none shrink-0 z-20">
      {/* Search Input */}
      <div className="flex-1 max-w-md relative">
        <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.14] transition-colors focus-within:border-blue-500/50">
          <Search size={14} className="text-[#64748b]" />
          <input
            type="text"
            placeholder="Search features, columns, anomalies..."
            className="w-full bg-transparent border-none outline-none text-xs text-[#f8fafc] placeholder-[#64748b]"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono text-[#94a3b8] bg-white/[0.06] border border-white/[0.08]">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Controls: Active Dataset, Ingestion CTAs, Sound, Graph Studio Dropdown */}
      <div className="flex items-center gap-3">
        {/* Active Dataset Pill */}
        {activeFile && (
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs font-mono text-[#00f0ff]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] animate-pulse" />
            <span className="truncate max-w-[140px]">{activeFile.name}</span>
          </div>
        )}

        {/* 1-Click Sample Button */}
        <button
          type="button"
          onClick={() => {
            soundManager.playClick();
            onLoadSample();
          }}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono text-[#94a3b8] hover:text-[#f8fafc] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all cursor-pointer disabled:opacity-50"
        >
          <Sparkles size={13} className="text-[#00f0ff]" />
          <span className="hidden sm:inline">Load Sample</span>
        </button>

        {/* Upload CSV CTA */}
        <button
          type="button"
          onClick={() => {
            soundManager.playClick();
            onUploadClick();
          }}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
        >
          <Upload size={13} />
          <span>Upload CSV</span>
        </button>

        {/* Complete 115-Chart Graph Studio Dropdown */}
        <GraphStudioDropdown
          analysis={analysis}
          onSelectChart={onOpenStudioChart}
        />

        {/* Audio Mute/Unmute */}
        <button
          type="button"
          onClick={handleToggleSound}
          className="p-2 rounded-xl text-[#94a3b8] hover:text-[#f8fafc] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-colors cursor-pointer"
          title={soundEnabled ? 'Mute Interface Sounds' : 'Unmute Interface Sounds'}
        >
          {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
        </button>
      </div>
    </header>
  );
}
