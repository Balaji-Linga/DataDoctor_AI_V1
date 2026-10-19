import {
  LayoutDashboard,
  Cpu,
  Globe,
  Sparkles,
  Table,
  Zap,
} from 'lucide-react';
import { soundManager } from '../../audio/soundManager';

export type DashboardView =
  | 'overview'
  | 'engines'
  | 'cleaning'
  | 'table'
  | 'globe';

interface NavItem {
  id: DashboardView;
  label: string;
  icon: typeof LayoutDashboard;
  disabled?: boolean;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface MidnightSidebarProps {
  currentView: DashboardView;
  onSelectView: (view: DashboardView) => void;
  hasDataset: boolean;
  hasCleaningResult: boolean;
  operationalEnginesCount?: number;
}

export default function MidnightSidebar({
  currentView,
  onSelectView,
  hasDataset,
  hasCleaningResult,
  operationalEnginesCount = 5,
}: MidnightSidebarProps) {
  const navSections: NavSection[] = [
    {
      title: 'PLATFORM WORKSPACE',
      items: [
        { id: 'overview', label: 'Overview & Analytics', icon: LayoutDashboard },
        {
          id: 'engines',
          label: 'Engine Control Center',
          icon: Cpu,
          badge: `${operationalEnginesCount} Active`,
        },
      ],
    },
    {
      title: 'DATA REMEDIATION',
      items: [
        {
          id: 'cleaning',
          label: 'Remediation Reactor',
          icon: Sparkles,
          disabled: !hasDataset,
          badge: hasCleaningResult ? 'Cleaned' : undefined,
        },
        {
          id: 'table',
          label: 'Dataset Inspection Grid',
          icon: Table,
          disabled: !hasDataset,
        },
      ],
    },
    {
      title: '3D SPATIAL VISUALIZATION',
      items: [
        { id: 'globe', label: 'Aceternity 3D Earth', icon: Globe },
      ],
    },
  ];

  const handleNavClick = (id: DashboardView, disabled?: boolean) => {
    if (disabled) return;
    soundManager.playClick();
    onSelectView(id);
  };

  return (
    <aside className="w-64 shrink-0 midnight-sidebar flex flex-col justify-between p-4 min-h-screen select-none z-30">
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 py-3 mb-6">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-400 p-0.5 shadow-lg shadow-blue-500/20">
            <div className="w-full h-full rounded-[10px] bg-[#050b18] flex items-center justify-center">
              <Zap className="text-[#00f0ff] animate-pulse" size={18} />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1 font-bold tracking-tight text-base text-[#f8fafc]">
              <span>DataDoctor</span>
              <span className="text-[#00f0ff] font-black">AI</span>
            </div>
            <span className="text-[10px] text-[#64748b] font-mono">
              Enterprise v2.5
            </span>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="space-y-6">
          {navSections.map((sec, sIdx) => (
            <div key={sIdx}>
              <span className="block px-3 text-[10px] font-bold tracking-wider text-[#64748b] uppercase mb-2">
                {sec.title}
              </span>
              <nav className="space-y-1">
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  const isDisabled = Boolean(item.disabled);

                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => handleNavClick(item.id, isDisabled)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                        isDisabled
                          ? 'opacity-35 cursor-not-allowed text-[#64748b]'
                          : isActive
                          ? 'text-[#f8fafc] bg-gradient-to-r from-blue-600/35 via-indigo-600/25 to-blue-500/10 border border-blue-500/30 shadow-lg shadow-blue-500/10'
                          : 'text-[#94a3b8] hover:text-[#f8fafc] hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          size={16}
                          className={isActive ? 'text-[#00f0ff]' : isDisabled ? 'text-[#64748b]' : 'text-[#94a3b8]'}
                        />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom FastAPI Status */}
      <div className="pt-4 border-t border-white/[0.06] px-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[11px] font-mono text-[#94a3b8]">
              FastAPI: <span className="text-emerald-400 font-semibold">Online</span>
            </span>
          </div>
          <span className="text-[10px] text-[#64748b] font-mono">127.0.0.1:8000</span>
        </div>
      </div>
    </aside>
  );
}
