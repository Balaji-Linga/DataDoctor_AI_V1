import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Compass,
  Search,
  Sparkles,
  ChevronRight,
  X,
  ChevronDown,
  BarChart3,
  Layers,
  ShieldCheck,
  BrainCircuit,
  Activity,
  Boxes,
} from 'lucide-react';
import {
  CHART_REGISTRY,
  CATEGORY_DEFINITIONS,
  type ChartCategory,
} from './chartRegistry';
import type { AnalysisResponse } from '../../types/dataset';
import { soundManager } from '../../audio/soundManager';

interface GraphStudioDropdownProps {
  analysis: AnalysisResponse | null;
  onSelectChart: (chartId: number) => void;
}

const CATEGORY_ICONS: Record<ChartCategory, typeof BarChart3> = {
  basic: BarChart3,
  statistical: Layers,
  quality: ShieldCheck,
  ml: BrainCircuit,
  monitoring: Activity,
  advanced: Boxes,
};

export default function GraphStudioDropdown({
  analysis,
  onSelectChart,
}: GraphStudioDropdownProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<ChartCategory | 'all'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Recommended charts for current dataset
  const recommendedCharts = useMemo(() => {
    return CHART_REGISTRY.filter((c) => {
      if (c.recommendedIf) return c.recommendedIf(analysis);
      return false;
    }).slice(0, 6);
  }, [analysis]);

  // Filtered charts based on search & category
  const filteredCharts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return CHART_REGISTRY.filter((c) => {
      const matchesSearch =
        q === '' ||
        c.name.toLowerCase().includes(q) ||
        String(c.id).includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.categoryName.toLowerCase().includes(q);

      const matchesCategory = activeCategory === 'all' || c.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  const handleOpenDropdown = () => {
    soundManager.playClick();
    setIsOpen(!isOpen);
    setSearchQuery('');
  };

  const handlePickChart = (chartId: number) => {
    soundManager.playClick();
    setIsOpen(false);
    onSelectChart(chartId);
  };

  return (
    <div className="relative select-none" ref={dropdownRef}>
      {/* Trigger Button in Top Toolbar */}
      <button
        type="button"
        onClick={handleOpenDropdown}
        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-mono border transition-all cursor-pointer ${
          isOpen
            ? 'bg-blue-600/30 border-blue-500/60 text-[#00f0ff] shadow-lg shadow-blue-500/20'
            : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.1] text-[#94a3b8] hover:text-[#f8fafc]'
        }`}
        title="Explore all 115 DataDoctor Visualizations"
      >
        <Compass size={14} className={isOpen ? 'text-[#00f0ff] animate-spin' : 'text-[#00f0ff]'} />
        <span className="font-semibold text-[#f8fafc]">Graph Studio</span>
        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-blue-500/20 text-[#00f0ff] border border-blue-500/30">
          115
        </span>
        <ChevronDown size={12} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Expanded Studio Panel Drawer */}
      {isOpen && (
        <div
          className="absolute right-0 top-12 z-50 w-[92vw] max-w-3xl rounded-2xl border border-white/15 backdrop-blur-2xl shadow-2xl p-4 animate-in fade-in select-none flex flex-col"
          style={{ background: 'rgba(5, 11, 26, 0.98)', maxHeight: '82vh' }}
        >
          {/* Header & Search */}
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] gap-3 shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <Compass size={16} className="text-[#00f0ff]" />
                <h3 className="text-sm font-bold text-[#f8fafc] font-mono tracking-tight">
                  INTERACTIVE GRAPH STUDIO
                </h3>
                <span className="text-[10px] text-[#64748b] font-mono">115 Chart Library</span>
              </div>
              <p className="text-[11px] text-[#94a3b8] mt-0.5">
                Explore basic, statistical, quality, ML, monitoring, and specialized 3D visualizations
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-white/10 text-[#64748b] hover:text-[#f8fafc] transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Search Box */}
          <div className="pt-3 pb-2 shrink-0">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] focus-within:border-blue-500/50">
              <Search size={14} className="text-[#64748b]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, ID (#1 to #115), or category..."
                className="w-full bg-transparent border-none outline-none text-xs text-[#f8fafc] placeholder-[#64748b]"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-[#64748b] hover:text-[#f8fafc]"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Recommended for this dataset (Only when not actively filtering by text) */}
          {!searchQuery && recommendedCharts.length > 0 && (
            <div className="py-2 shrink-0 border-b border-white/[0.06]">
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#00f0ff] uppercase tracking-wider mb-2">
                <Sparkles size={11} />
                <span>Recommended for active dataset ({analysis?.dataset?.file_name ?? 'Dataset'})</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {recommendedCharts.map((rc) => (
                  <button
                    key={rc.id}
                    type="button"
                    onClick={() => handlePickChart(rc.id)}
                    className="p-2 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 hover:border-blue-500/40 text-left transition-all cursor-pointer group flex items-center justify-between"
                  >
                    <div className="truncate">
                      <span className="text-[10px] font-mono text-[#00f0ff] mr-1.5">#{rc.id}</span>
                      <span className="text-xs font-medium text-[#f8fafc] group-hover:text-[#00f0ff] transition-colors truncate">
                        {rc.name}
                      </span>
                    </div>
                    <ChevronRight size={12} className="text-[#64748b] group-hover:text-[#00f0ff] shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 py-2 overflow-x-auto shrink-0 border-b border-white/[0.06]">
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer shrink-0 ${
                activeCategory === 'all'
                  ? 'bg-blue-600/30 text-[#00f0ff] border border-blue-500/40'
                  : 'text-[#94a3b8] hover:text-[#f8fafc] hover:bg-white/[0.04]'
              }`}
            >
              All (115)
            </button>
            {(Object.keys(CATEGORY_DEFINITIONS) as ChartCategory[]).map((cat) => {
              const def = CATEGORY_DEFINITIONS[cat];
              const Icon = CATEGORY_ICONS[cat];
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-blue-600/30 text-[#00f0ff] border border-blue-500/40'
                      : 'text-[#94a3b8] hover:text-[#f8fafc] hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon size={12} />
                  <span>{def.name}</span>
                  <span className="text-[10px] text-[#64748b]">({def.count})</span>
                </button>
              );
            })}
          </div>

          {/* Chart Grid List */}
          <div className="flex-1 overflow-y-auto py-3 space-y-1 pr-1">
            {filteredCharts.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#64748b]">
                No visualizations match &quot;{searchQuery}&quot;. Try a different search term.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {filteredCharts.map((item) => {
                  const isImplemented = item.status === 'implemented';
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handlePickChart(item.id)}
                      className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] hover:border-blue-500/40 transition-all text-left flex items-start justify-between gap-3 cursor-pointer group"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-[#00f0ff] border border-blue-500/20">
                            #{item.id}
                          </span>
                          <span className="text-xs font-semibold text-[#f8fafc] group-hover:text-[#00f0ff] transition-colors truncate">
                            {item.name}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#94a3b8] line-clamp-1">
                          {item.description}
                        </p>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-mono shrink-0 uppercase ${
                          isImplemented
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {item.statusLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-[#64748b] shrink-0">
            <span>Showing {filteredCharts.length} of 115 Visualizations</span>
            <span>Click any card to launch Full-Screen Studio</span>
          </div>
        </div>
      )}
    </div>
  );
}

