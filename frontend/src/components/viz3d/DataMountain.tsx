import React, { useState, useMemo, useRef, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Float, Text, Grid } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { Mountain, RotateCcw, Eye } from "lucide-react";
import type { DataRow, NumericalSummaryItem } from "../../types/dataset";

export interface DataMountainProps {
  columns: string[];
  records: DataRow[];
  numericalSummary: Record<string, NumericalSummaryItem>;
  outlierColumns?: Set<string>;
  reducedMotion?: boolean;
}

interface BarData {
  id: string;
  x: number;
  z: number;
  height: number;
  color: string;
  emissive: string;
  column: string;
  rowIndex: number;
  rawValue: number | null;
  mean: number | null;
  min: number | null;
  max: number | null;
  isPeak: boolean;
  isOutlier: boolean;
}

const BAR_WIDTH = 0.55;
const BAR_DEPTH = 0.55;
const SPACING_X = 1.0;
const SPACING_Z = 0.9;
const MAX_ROWS = 20;
const MAX_COLS = 6;

// Single Mountain Bar Mesh
const MountainBar = React.memo(function MountainBar({
  bar,
  isHovered,
  onHover,
  onUnhover,
}: {
  bar: BarData;
  isHovered: boolean;
  onHover: (b: BarData) => void;
  onUnhover: () => void;
}) {
  const posY = Math.max(bar.height / 2, 0.05);

  return (
    <mesh
      position={[bar.x, posY, bar.z]}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(bar);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        onUnhover();
      }}
    >
      <boxGeometry args={[BAR_WIDTH, Math.max(bar.height, 0.05), BAR_DEPTH]} />
      <meshStandardMaterial
        color={isHovered ? "#ffffff" : bar.color}
        emissive={isHovered ? "#60a5fa" : bar.emissive}
        emissiveIntensity={isHovered ? 0.6 : 0.25}
        metalness={0.4}
        roughness={0.3}
      />
    </mesh>
  );
});

// Scene content inside Canvas
function MountainScene({
  bars,
  columnNames,
  rowIndices,
  hoveredBar,
  onHover,
  onUnhover,
  reducedMotion,
}: {
  bars: BarData[];
  columnNames: { name: string; x: number }[];
  rowIndices: { label: string; z: number }[];
  hoveredBar: BarData | null;
  onHover: (b: BarData) => void;
  onUnhover: () => void;
  reducedMotion?: boolean;
}) {
  return (
    <group position={[0, -0.5, 0]}>
      {/* Ground Grid */}
      <Grid
        position={[0, 0, 0]}
        args={[16, 22]}
        cellSize={0.5}
        cellThickness={1}
        cellColor="#1e293b"
        sectionSize={2}
        sectionThickness={1.5}
        sectionColor="#334155"
        fadeDistance={24}
        fadeStrength={1.2}
      />

      {/* Floating container for bars */}
      <Float
        speed={reducedMotion ? 0 : 1.2}
        rotationIntensity={reducedMotion ? 0 : 0.08}
        floatIntensity={reducedMotion ? 0 : 0.15}
        floatingRange={[-0.05, 0.05]}
      >
        <group>
          {bars.map((bar) => (
            <MountainBar
              key={bar.id}
              bar={bar}
              isHovered={hoveredBar?.id === bar.id}
              onHover={onHover}
              onUnhover={onUnhover}
            />
          ))}

          {/* Column labels along X-axis */}
          {columnNames.map((col) => (
            <group key={col.name} position={[col.x, 0.05, (MAX_ROWS * SPACING_Z) / 2 + 0.6]}>
              <Text
                fontSize={0.24}
                color="#94a3b8"
                anchorX="center"
                anchorY="middle"
                rotation={[-Math.PI / 2.5, 0, 0]}
              >
                {col.name.length > 10 ? `${col.name.slice(0, 9)}…` : col.name}
              </Text>
            </group>
          ))}

          {/* Row index markers along Z-axis */}
          {rowIndices.map((row) => (
            <group key={row.label} position={[-(MAX_COLS * SPACING_X) / 2 - 0.7, 0.05, row.z]}>
              <Text
                fontSize={0.18}
                color="#64748b"
                anchorX="right"
                anchorY="middle"
                rotation={[-Math.PI / 2.5, 0, 0]}
              >
                {row.label}
              </Text>
            </group>
          ))}
        </group>
      </Float>
    </group>
  );
}

export default function DataMountain({
  columns,
  records,
  numericalSummary,
  outlierColumns,
  reducedMotion = false,
}: DataMountainProps) {
  const [hoveredBar, setHoveredBar] = useState<BarData | null>(null);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  // Filter numeric columns that are present in numericalSummary
  const numericCols = useMemo(() => {
    if (!numericalSummary) return [];
    const valid = Object.keys(numericalSummary).filter((col) => {
      const summary = numericalSummary[col];
      return summary && summary.count > 0 && summary.minimum !== null && summary.maximum !== null;
    });
    // Order based on provided columns array if possible
    if (columns && columns.length > 0) {
      return columns.filter((col) => valid.includes(col)).slice(0, MAX_COLS);
    }
    return valid.slice(0, MAX_COLS);
  }, [columns, numericalSummary]);

  // Compute 3D bars deterministically
  const { bars, columnNames, rowIndices } = useMemo(() => {
    if (numericCols.length === 0 || !records || records.length === 0) {
      return { bars: [], columnNames: [], rowIndices: [] };
    }

    const visibleRows = records.slice(0, MAX_ROWS);
    const colCount = numericCols.length;
    const rowCount = visibleRows.length;

    const offsetX = ((colCount - 1) * SPACING_X) / 2;
    const offsetZ = ((rowCount - 1) * SPACING_Z) / 2;

    const colsMetadata = numericCols.map((col, cIdx) => ({
      name: col,
      x: cIdx * SPACING_X - offsetX,
    }));

    const rowsMetadata = visibleRows
      .filter((_, rIdx) => rIdx % 4 === 0 || rIdx === rowCount - 1)
      .map((_, rIdx) => {
        const actualIdx = rIdx % 4 === 0 ? rIdx : rowCount - 1;
        return {
          label: `R${actualIdx + 1}`,
          z: actualIdx * SPACING_Z - offsetZ,
        };
      });

    const generatedBars: BarData[] = [];

    visibleRows.forEach((row, rIdx) => {
      const z = rIdx * SPACING_Z - offsetZ;

      numericCols.forEach((col, cIdx) => {
        const x = cIdx * SPACING_X - offsetX;
        const raw = row[col];
        const numVal = typeof raw === "number" && !isNaN(raw) && isFinite(raw) ? raw : null;
        const summary = numericalSummary[col];

        let normalizedHeight = 0.1;
        let isPeak = false;
        let isOutlier = false;

        if (numVal !== null && summary && summary.minimum !== null && summary.maximum !== null) {
          const range = summary.maximum - summary.minimum;
          if (range > 0) {
            const ratio = (numVal - summary.minimum) / range;
            const clamped = Math.max(0, Math.min(1, ratio));
            normalizedHeight = clamped * 2.8 + 0.2;
            isPeak = clamped >= 0.82;
          } else {
            normalizedHeight = 1.5;
          }

          // Outlier check: column listed in outlierColumns and value is far from mean
          if (outlierColumns?.has(col)) {
            if (summary.mean !== null && summary.standard_deviation !== null && summary.standard_deviation > 0) {
              const zScore = Math.abs((numVal - summary.mean) / summary.standard_deviation);
              if (zScore >= 2.0) {
                isOutlier = true;
              }
            } else {
              isOutlier = true;
            }
          }
        }

        // Determine colors
        let color = "#4169E1"; // standard accent blue
        let emissive = "#1e3a8a";

        if (isOutlier) {
          color = "#ef4444"; // outlier red
          emissive = "#7f1d1d";
        } else if (isPeak) {
          color = "#c9a961"; // summit gold
          emissive = "#78350f";
        }

        generatedBars.push({
          id: `bar-${rIdx}-${cIdx}`,
          x,
          z,
          height: normalizedHeight,
          color,
          emissive,
          column: col,
          rowIndex: rIdx + 1,
          rawValue: numVal,
          mean: summary?.mean ?? null,
          min: summary?.minimum ?? null,
          max: summary?.maximum ?? null,
          isPeak,
          isOutlier,
        });
      });
    });

    return { bars: generatedBars, columnNames: colsMetadata, rowIndices: rowsMetadata };
  }, [numericCols, records, numericalSummary, outlierColumns]);

  const handleHover = useCallback((bar: BarData) => {
    setHoveredBar(bar);
  }, []);

  const handleUnhover = useCallback(() => {
    setHoveredBar(null);
  }, []);

  const handleResetCamera = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  }, []);

  // Empty State
  if (numericCols.length === 0 || !records || records.length === 0) {
    return (
      <div
        className="w-full h-96 rounded-2xl flex flex-col items-center justify-center border p-8 text-center"
        style={{
          background: "radial-gradient(ellipse at center, #0f1125 0%, #050510 100%)",
          borderColor: "rgba(255, 255, 255, 0.08)",
        }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: "rgba(65, 105, 225, 0.15)", border: "1px solid rgba(65, 105, 225, 0.3)" }}
        >
          <Mountain className="w-7 h-7 text-[#00d4ff]" />
        </div>
        <h3 className="text-lg font-semibold text-[#f0f0f5] mb-2">No Numeric Data Available</h3>
        <p className="text-sm text-[#6b7280] max-w-md">
          The 3D Data Mountain requires at least one numeric column with statistical summaries to construct the topography.
        </p>
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-[520px] rounded-2xl overflow-hidden border select-none"
      style={{
        background: "radial-gradient(ellipse at 50% 30%, #0d122e 0%, #050510 100%)",
        borderColor: "rgba(255, 255, 255, 0.08)",
      }}
    >
      {/* Top Header & HUD Stats */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-3 pointer-events-none">
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg backdrop-blur-md border text-xs"
          style={{
            background: "rgba(15, 17, 37, 0.8)",
            borderColor: "rgba(255, 255, 255, 0.1)",
            color: "#f0f0f5",
          }}
        >
          <Mountain className="w-3.5 h-3.5 text-[#00d4ff]" />
          <span className="font-semibold tracking-wide uppercase text-[11px] text-[#00d4ff]">
            Data Mountain
          </span>
          <span className="text-[#6b7280]">|</span>
          <span className="font-mono text-[#94a3b8]">
            {Math.min(records.length, MAX_ROWS)} rows × {numericCols.length} features
          </span>
        </div>

        {/* Legend */}
        <div
          className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-lg backdrop-blur-md border text-[11px]"
          style={{
            background: "rgba(15, 17, 37, 0.75)",
            borderColor: "rgba(255, 255, 255, 0.08)",
          }}
        >
          <span className="flex items-center gap-1.5 text-[#94a3b8]">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#4169E1]" /> Normal
          </span>
          <span className="flex items-center gap-1.5 text-[#94a3b8]">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#c9a961]" /> Summit Peak
          </span>
          <span className="flex items-center gap-1.5 text-[#94a3b8]">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#ef4444]" /> Outlier
          </span>
        </div>
      </div>

      {/* Top Right Controls */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <button
          onClick={handleResetCamera}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer backdrop-blur-md border"
          style={{
            background: "rgba(15, 17, 37, 0.8)",
            borderColor: "rgba(255, 255, 255, 0.12)",
            color: "#f0f0f5",
          }}
          title="Reset Camera View"
        >
          <RotateCcw className="w-3.5 h-3.5 text-[#00d4ff]" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>

      {/* Hover Info HUD Overlay */}
      {hoveredBar && (
        <div
          className="absolute bottom-4 left-4 z-10 pointer-events-none p-3.5 rounded-xl backdrop-blur-xl border shadow-2xl transition-all duration-150 animate-in fade-in"
          style={{
            background: "rgba(15, 17, 37, 0.92)",
            borderColor: hoveredBar.isOutlier
              ? "rgba(239, 68, 68, 0.5)"
              : hoveredBar.isPeak
              ? "rgba(201, 169, 97, 0.5)"
              : "rgba(0, 212, 255, 0.3)",
            maxWidth: "320px",
          }}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#00d4ff] truncate">
              {hoveredBar.column}
            </span>
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded"
              style={{
                background: hoveredBar.isOutlier
                  ? "rgba(239, 68, 68, 0.2)"
                  : hoveredBar.isPeak
                  ? "rgba(201, 169, 97, 0.2)"
                  : "rgba(65, 105, 225, 0.2)",
                color: hoveredBar.isOutlier
                  ? "#ef4444"
                  : hoveredBar.isPeak
                  ? "#c9a961"
                  : "#60a5fa",
              }}
            >
              Row #{hoveredBar.rowIndex}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
            <div>
              <span className="text-[10px] text-[#6b7280] block">Value</span>
              <span className="font-mono font-bold text-[#f0f0f5]">
                {hoveredBar.rawValue !== null ? hoveredBar.rawValue.toLocaleString() : "N/A"}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#6b7280] block">Mean</span>
              <span className="font-mono text-[#94a3b8]">
                {hoveredBar.mean !== null ? hoveredBar.mean.toFixed(2) : "N/A"}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#6b7280] block">Min / Max</span>
              <span className="font-mono text-[#94a3b8] text-[11px]">
                {hoveredBar.min !== null ? hoveredBar.min.toFixed(1) : "?"} /{" "}
                {hoveredBar.max !== null ? hoveredBar.max.toFixed(1) : "?"}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#6b7280] block">Status</span>
              <span
                className="font-medium text-[11px]"
                style={{
                  color: hoveredBar.isOutlier
                    ? "#ef4444"
                    : hoveredBar.isPeak
                    ? "#c9a961"
                    : "#60a5fa",
                }}
              >
                {hoveredBar.isOutlier ? "Outlier Risk" : hoveredBar.isPeak ? "Summit Peak" : "Typical Range"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Orbit Controls Guidance */}
      <div className="absolute bottom-4 right-4 z-10 pointer-events-none hidden md:flex items-center gap-1.5 text-[11px] text-[#6b7280] bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm border border-white/5">
        <Eye className="w-3 h-3 text-[#6b7280]" />
        <span>Drag to rotate • Scroll to zoom • Hover bar for details</span>
      </div>

      {/* Three.js Canvas */}
      <Canvas
        camera={{ position: [7, 7, 9], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ powerPreference: "high-performance", antialias: true }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[10, 15, 8]} intensity={1.2} color="#ffffff" />
        <directionalLight position={[-10, 8, -6]} intensity={0.4} color="#00d4ff" />
        <pointLight position={[0, 4, 0]} intensity={0.6} color="#4169E1" distance={12} />

        <MountainScene
          bars={bars}
          columnNames={columnNames}
          rowIndices={rowIndices}
          hoveredBar={hoveredBar}
          onHover={handleHover}
          onUnhover={handleUnhover}
          reducedMotion={reducedMotion}
        />

        <OrbitControls
          ref={controlsRef}
          makeDefault
          enableDamping
          dampingFactor={0.05}
          minDistance={4}
          maxDistance={22}
          maxPolarAngle={Math.PI / 2.05}
        />
      </Canvas>
    </div>
  );
}
