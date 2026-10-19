import React, { useState, useMemo } from "react";
import {
  Mountain,
  Orbit,
  Grid3X3,
  BarChart3,
  Sparkles,
  Maximize2,
  Minimize2,
  Activity,
  Lock,
} from "lucide-react";
import type { AnalysisResponse, CleaningResponse } from "../../types/dataset";
import DataMountain from "./DataMountain";
import ScatterUniverse from "./ScatterUniverse";
import CorrelationMatrix from "./CorrelationMatrix";
import DistributionExplorer from "./DistributionExplorer";
import CleaningReactor from "./CleaningReactor";

export interface ObservatoryContainerProps {
  analysis: AnalysisResponse;
  cleanResult: CleaningResponse | null;
  reducedMotion?: boolean;
}

type TabKey = "mountain" | "scatter" | "correlation" | "distribution" | "cleaning";

interface TabDefinition {
  id: TabKey;
  label: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
  disabledBadge?: string;
}

export default function ObservatoryContainer({
  analysis,
  cleanResult,
  reducedMotion = false,
}: ObservatoryContainerProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("mountain");
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Extract outlier columns from quality report
  const outlierColumns = useMemo(() => {
    const set = new Set<string>();
    if (analysis?.quality_report?.issues) {
      for (const issue of analysis.quality_report.issues) {
        if (
          issue.column &&
          (issue.type.toLowerCase().includes("outlier") ||
            issue.message.toLowerCase().includes("outlier"))
        ) {
          set.add(issue.column);
        }
      }
    }
    return set;
  }, [analysis]);

  const hasCleaningResult = Boolean(cleanResult?.cleaning?.report);

  // Define tabs
  const tabs: TabDefinition[] = useMemo(
    () => [
      {
        id: "mountain",
        label: "Data Mountain",
        subtitle: "3D Feature Elevation",
        icon: Mountain,
      },
      {
        id: "scatter",
        label: "Scatter Universe",
        subtitle: "Tri-Axis Coordinates",
        icon: Orbit,
      },
      {
        id: "correlation",
        label: "Correlation Matrix",
        subtitle: "Pearson Prisms",
        icon: Grid3X3,
      },
      {
        id: "distribution",
        label: "Distribution Explorer",
        subtitle: "Spatial Density",
        icon: BarChart3,
      },
      {
        id: "cleaning",
        label: "Cleaning Reactor",
        subtitle: "Remediation Diff",
        icon: Sparkles,
        disabled: !hasCleaningResult,
        disabledBadge: "Run Clean First",
      },
    ],
    [hasCleaningResult]
  );

  const columns = analysis.dataset.columns || [];
  const records = analysis.dataset.preview || [];
  const numericalSummary = analysis.statistics.numerical_summary || {};
  const numericColumns = analysis.statistics.numeric_columns || [];

  return (
    <section
      className={`relative w-full rounded-3xl border transition-all duration-300 ${
        isFullscreen
          ? "fixed inset-4 z-50 rounded-2xl shadow-2xl overflow-y-auto"
          : "p-6 md:p-8"
      }`}
      style={{
        background: "linear-gradient(180deg, #070a18 0%, #050510 100%)",
        borderColor: "rgba(255, 255, 255, 0.08)",
        boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
      }}
    >
      {/* Container Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{
                background: "linear-gradient(135deg, #00d4ff, #4169E1)",
                color: "#050510",
              }}
            >
              3D
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[#f0f0f5]">
              3D Data Observatory
            </h2>
            <span
              className="text-[11px] font-mono px-2 py-0.5 rounded-full border hidden sm:inline-block"
              style={{
                background: "rgba(0, 212, 255, 0.08)",
                borderColor: "rgba(0, 212, 255, 0.25)",
                color: "#00d4ff",
              }}
            >
              Interactive WebGL
            </span>
          </div>
          <p className="text-xs md:text-sm text-[#6b7280]">
            Explore multi-dimensional dataset topography, pairwise correlation prisms, and real-time remediation deltas.
          </p>
        </div>

        {/* Telemetry pill & Fullscreen Toggle */}
        <div className="flex items-center gap-3">
          <div
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs"
            style={{
              background: "rgba(15, 17, 37, 0.8)",
              borderColor: "rgba(255, 255, 255, 0.08)",
            }}
          >
            <Activity className="w-3.5 h-3.5 text-[#00d4ff]" />
            <span className="text-[#94a3b8]">Dataset:</span>
            <span className="font-mono font-semibold text-white">
              {analysis.dataset.row_count.toLocaleString()} rows × {analysis.dataset.column_count} cols
            </span>
          </div>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-xl border transition-all cursor-pointer hover:bg-white/5"
            style={{
              background: "rgba(15, 17, 37, 0.8)",
              borderColor: "rgba(255, 255, 255, 0.08)",
              color: "#94a3b8",
            }}
            title={isFullscreen ? "Exit Fullscreen" : "Expand View"}
            aria-label={isFullscreen ? "Exit Fullscreen" : "Expand View"}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4 text-[#00d4ff]" />
            ) : (
              <Maximize2 className="w-4 h-4 text-[#94a3b8]" />
            )}
          </button>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none border-b border-white/5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isDisabled = tab.disabled;

          return (
            <button
              key={tab.id}
              onClick={() => !isDisabled && setActiveTab(tab.id)}
              disabled={isDisabled}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer whitespace-nowrap border ${
                isDisabled
                  ? "opacity-40 cursor-not-allowed border-white/5 text-[#6b7280] bg-transparent"
                  : isActive
                  ? "bg-[#0f1125] border-[#00d4ff]/40 text-white shadow-lg shadow-[#00d4ff]/5"
                  : "border-transparent text-[#94a3b8] hover:text-white hover:bg-[#0f1125]/50"
              }`}
            >
              <Icon
                className={`w-4 h-4 ${
                  isActive ? "text-[#00d4ff]" : isDisabled ? "text-[#6b7280]" : "text-[#94a3b8]"
                }`}
              />
              <div className="flex flex-col text-left">
                <span className="font-semibold leading-tight">{tab.label}</span>
                <span className="text-[10px] text-[#6b7280] font-normal leading-tight hidden sm:inline">
                  {tab.subtitle}
                </span>
              </div>

              {isDisabled && tab.disabledBadge && (
                <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/5 text-[#6b7280]">
                  <Lock className="w-2.5 h-2.5" />
                  {tab.disabledBadge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Visualization Viewport */}
      <div className="relative w-full rounded-2xl overflow-hidden min-h-[520px]">
        {activeTab === "mountain" && (
          <DataMountain
            columns={columns}
            records={records}
            numericalSummary={numericalSummary}
            outlierColumns={outlierColumns}
            reducedMotion={reducedMotion}
          />
        )}

        {activeTab === "scatter" && (
          <ScatterUniverse
            columns={columns}
            records={records}
            numericalSummary={numericalSummary}
            outlierColumns={outlierColumns}
            reducedMotion={reducedMotion}
          />
        )}

        {activeTab === "correlation" && (
          <CorrelationMatrix
            columns={columns}
            records={records}
            numericColumns={numericColumns}
            reducedMotion={reducedMotion}
          />
        )}

        {activeTab === "distribution" && (
          <DistributionExplorer
            columns={columns}
            records={records}
            numericalSummary={numericalSummary}
            reducedMotion={reducedMotion}
          />
        )}

        {activeTab === "cleaning" && cleanResult && (
          <CleaningReactor
            analysis={analysis}
            cleanResult={cleanResult}
            reducedMotion={reducedMotion}
          />
        )}
      </div>
    </section>
  );
}
