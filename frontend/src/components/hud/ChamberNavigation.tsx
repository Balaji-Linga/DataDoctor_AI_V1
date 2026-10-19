import { useEffect } from 'react';
import { Cpu, Grid3X3, Mountain, Orbit, Sparkles, Binary } from 'lucide-react';
import type { LabChamber } from '../lab/CameraController';
import { soundManager } from '../../audio/soundManager';

interface ChamberNavigationProps {
  currentChamber: LabChamber;
  onSelectChamber: (chamber: LabChamber) => void;
  hasDataset: boolean;
  hasCleaningResult: boolean;
}

export default function ChamberNavigation({
  currentChamber,
  onSelectChamber,
  hasDataset,
  hasCleaningResult,
}: ChamberNavigationProps) {
  const chambers: { id: LabChamber; label: string; num: string; icon: typeof Cpu; locked?: boolean }[] = [
    { id: 'core', label: 'REACTOR CORE', num: '1', icon: Cpu },
    { id: 'matrix', label: 'VOXEL MATRIX', num: '2', icon: Binary, locked: !hasDataset },
    { id: 'mountain', label: 'TOPOGRAPHY', num: '3', icon: Mountain, locked: !hasDataset },
    { id: 'scatter', label: '3D SCATTER', num: '4', icon: Orbit, locked: !hasDataset },
    { id: 'correlation', label: 'CORRELATION', num: '5', icon: Grid3X3, locked: !hasDataset },
    { id: 'cleaning', label: 'REMEDIATION', num: '6', icon: Sparkles, locked: !hasDataset },
  ];

  // Number key shortcuts 1-6
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      const keyMap: Record<string, LabChamber> = {
        '1': 'core',
        '2': 'matrix',
        '3': 'mountain',
        '4': 'scatter',
        '5': 'correlation',
        '6': 'cleaning',
      };
      const target = keyMap[e.key];
      if (target) {
        if (target !== 'core' && !hasDataset) return;
        soundManager.playChamberSwitch();
        onSelectChamber(target);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasDataset, onSelectChamber]);

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-full px-4 pointer-events-none select-none">
      <div
        className="flex items-center gap-1.5 p-1.5 rounded-2xl border backdrop-blur-2xl pointer-events-auto shadow-2xl overflow-x-auto max-w-full"
        style={{
          background: 'rgba(5, 10, 24, 0.92)',
          borderColor: 'rgba(0, 212, 255, 0.25)',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 212, 255, 0.1)',
        }}
      >
        {chambers.map((ch) => {
          const isActive = currentChamber === ch.id;
          const IconComp = ch.icon;

          return (
            <button
              key={ch.id}
              type="button"
              disabled={ch.locked}
              onClick={() => {
                if (ch.locked) return;
                soundManager.playChamberSwitch();
                onSelectChamber(ch.id);
              }}
              onMouseEnter={() => {
                if (!ch.locked) soundManager.playHover();
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-mono transition-all duration-200 cursor-pointer whitespace-nowrap ${
                ch.locked ? 'opacity-35 cursor-not-allowed' : ''
              }`}
              style={{
                background: isActive
                  ? ch.id === 'cleaning' && hasCleaningResult
                    ? 'rgba(34, 197, 94, 0.25)'
                    : 'rgba(0, 212, 255, 0.2)'
                  : 'transparent',
                border: isActive
                  ? ch.id === 'cleaning' && hasCleaningResult
                    ? '1px solid #22c55e'
                    : '1px solid #00d4ff'
                  : '1px solid transparent',
                color: isActive ? '#f0f0f5' : '#94a3b8',
                boxShadow: isActive ? '0 0 15px rgba(0, 212, 255, 0.25)' : 'none',
              }}
            >
              <span className="text-[10px] text-[#6b7280] font-bold">[{ch.num}]</span>
              <IconComp size={14} className={isActive ? 'text-[#00d4ff]' : 'text-[#6b7280]'} />
              <span className="font-semibold tracking-wider text-[11px]">{ch.label}</span>
              {ch.locked && (
                <span className="text-[9px] bg-white/5 px-1 py-0.2 rounded text-[#6b7280]">
                  LOCK
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

