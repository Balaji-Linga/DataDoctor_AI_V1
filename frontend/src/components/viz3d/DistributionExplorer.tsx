import { useState, useMemo, useRef, useCallback, memo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text, Grid, Line } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { BarChart3, RotateCcw } from "lucide-react";
import type { DataRow, NumericalSummaryItem } from "../../types/dataset";
import { calculateHistogramBins, type HistogramBin } from "../../utils/mathStats";

export interface DistributionExplorerProps {
  columns: string[];
  records: DataRow[];
  numericalSummary: Record<string, NumericalSummaryItem>;
  reducedMotion?: boolean;
}

const BIN_WIDTH = 0.55;
const BIN_GAP = 0.15;
const BIN_STEP = BIN_WIDTH + BIN_GAP;
const BAR_DEPTH = 1.0;
const MAX_BAR_HEIGHT = 3.6;

// Single 3D Histogram Bar
const HistogramBarMesh = memo(function HistogramBarMesh({
  bin,
  x,
  height,
  isPeak,
  isHovered,
  onHover,
  onUnhover,
}: {
  bin: HistogramBin;
  x: number;
  height: number;
  isPeak: boolean;
  isHovered: boolean;
  onHover: (bin: HistogramBin) => void;
  onUnhover: () => void;
}) {
  const posY = Math.max(height / 2, 0.05);
  const color = isPeak ? "#c9a961" : "#4169E1";
  const emissive = isPeak ? "#78350f" : "#1e3a8a";

  return (
    <group position={[x, 0, 0]}>
      <mesh
        position={[0, posY, 0]}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(bin);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          onUnhover();
        }}
      >
        <boxGeometry args={[BIN_WIDTH, Math.max(height, 0.06), BAR_DEPTH]} />
        <meshStandardMaterial
          color={isHovered ? "#38bdf8" : color}
          emissive={isHovered ? "#0284c7" : emissive}
          emissiveIntensity={isHovered ? 0.8 : 0.35}
          metalness={0.3}
          roughness={0.3}
        />
      </mesh>

      {/* Bin mid label on the floor */}
      <group position={[0, 0.02, BAR_DEPTH / 2 + 0.35]}>
        <Text
          fontSize={0.18}
          color={isPeak ? "#c9a961" : "#94a3b8"}
          anchorX="center"
          anchorY="middle"
          rotation={[-Math.PI / 2.5, 0, 0]}
        >
          {bin.mid}
        </Text>
      </group>
    </group>
  );
});

export default function DistributionExplorer({
  columns,
  records,
  numericalSummary,
  reducedMotion = false,
}: DistributionExplorerProps) {
  // Extract all valid numeric columns
  const numericCols = useMemo(() => {
    if (!numericalSummary) return [];
    const valid = Object.keys(numericalSummary).filter((col) => {
      const s = numericalSummary[col];
      return s && s.count > 0 && s.minimum !== null && s.maximum !== null;
    });
    if (columns && columns.length > 0) {
      return columns.filter((c) => valid.includes(c));
    }
    return valid;
  }, [columns, numericalSummary]);

  const [userSelectedColumn, setUserSelectedColumn] = useState<string>("");
  const [hoveredBin, setHoveredBin] = useState<HistogramBin | null>(null);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  const selectedColumn =
    userSelectedColumn && numericCols.includes(userSelectedColumn)
      ? userSelectedColumn
      : numericCols[0] || "";

  const summary = selectedColumn ? numericalSummary[selectedColumn] : null;

  // Extract raw values for chosen column
  const columnValues = useMemo(() => {
    if (!selectedColumn || !records) return [];
    const vals: number[] = [];
    for (const r of records) {
      const v = r[selectedColumn];
      if (typeof v === "number" && !isNaN(v) && isFinite(v)) {
        vals.push(v);
      }
    }
    return vals;
  }, [selectedColumn, records]);

  // Compute 12 histogram bins using mathStats
  const bins = useMemo(() => {
    if (columnValues.length === 0) return [];
    return calculateHistogramBins(columnValues, 12);
  }, [columnValues]);

  const maxBinCount = useMemo(() => {
    if (bins.length === 0) return 1;
    return Math.max(...bins.map((b) => b.count), 1);
  }, [bins]);

  const totalWidth = (bins.length - 1) * BIN_STEP;
  const offsetX = totalWidth / 2;

  // Calculate X positions for mean and median lines
  const markers = useMemo(() => {
    if (bins.length === 0 || !summary || summary.minimum === null || summary.maximum === null) {
      return { meanX: null, medianX: null };
    }
    const range = summary.maximum - summary.minimum;
    if (range <= 0) return { meanX: null, medianX: null };

    const getX = (val: number | null): number | null => {
      if (val === null) return null;
      const ratio = (val - summary.minimum!) / range;
      const clamped = Math.max(0, Math.min(1, ratio));
      return clamped * totalWidth - offsetX;
    };

    return {
      meanX: getX(summary.mean),
      medianX: getX(summary.median),
    };
  }, [bins, summary, totalWidth, offsetX]);

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
          style={{
            background: "rgba(65, 105, 225, 0.15)",
            border: "1px solid rgba(65, 105, 225, 0.3)",
          }}
        >
          <BarChart3 className="w-7 h-7 text-[#00d4ff]" />
        </div>
        <h3 className="text-lg font-semibold text-[#f0f0f5] mb-2">No Numeric Features Available</h3>
        <p className="text-sm text-[#6b7280] max-w-md">
          Distribution Explorer requires at least one numeric feature with distribution parameters to build the 3D density histogram.
        </p>
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-[540px] rounded-2xl overflow-hidden border select-none"
      style={{
        background: "radial-gradient(ellipse at 50% 30%, #0d122e 0%, #050510 100%)",
        borderColor: "rgba(255, 255, 255, 0.08)",
      }}
    >
      {/* Top Header & Column Picker */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
          {/* Badge */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg backdrop-blur-md border text-xs"
            style={{
              background: "rgba(15, 17, 37, 0.85)",
              borderColor: "rgba(255, 255, 255, 0.1)",
              color: "#f0f0f5",
            }}
          >
            <BarChart3 className="w-3.5 h-3.5 text-[#00d4ff]" />
            <span className="font-semibold uppercase tracking-wider text-[11px] text-[#00d4ff]">
              Distribution Explorer
            </span>
          </div>

          {/* Feature Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg backdrop-blur-md border text-xs bg-[#0f1125]/85 border-white/10">
            <span className="text-[#94a3b8] text-[11px]">Feature:</span>
            <select
              value={selectedColumn}
              onChange={(e) => setUserSelectedColumn(e.target.value)}
              className="bg-transparent text-xs text-[#00d4ff] font-semibold focus:outline-none cursor-pointer max-w-[150px] truncate"
            >
              {numericCols.map((col) => (
                <option key={col} value={col} className="bg-[#0f1125] text-white">
                  {col}
                </option>
              ))}
            </select>
          </div>

          {/* Statistical Badges */}
          {summary && (
            <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-lg backdrop-blur-md border border-white/10 bg-[#0f1125]/75 text-[11px]">
              <span className="text-[#94a3b8]">
                Mean:{" "}
                <strong className="text-[#00d4ff] font-mono">
                  {summary.mean !== null ? summary.mean.toFixed(2) : "N/A"}
                </strong>
              </span>
              <span className="text-[#94a3b8]">
                Median:{" "}
                <strong className="text-[#22c55e] font-mono">
                  {summary.median !== null ? summary.median.toFixed(2) : "N/A"}
                </strong>
              </span>
              <span className="text-[#94a3b8]">
                Std Dev:{" "}
                <strong className="text-[#f0f0f5] font-mono">
                  {summary.standard_deviation !== null
                    ? summary.standard_deviation.toFixed(2)
                    : "N/A"}
                </strong>
              </span>
            </div>
          )}
        </div>

        {/* Top Right Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={handleResetCamera}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer backdrop-blur-md border transition-all"
            style={{
              background: "rgba(15, 17, 37, 0.85)",
              borderColor: "rgba(255, 255, 255, 0.12)",
              color: "#f0f0f5",
            }}
            title="Reset Perspective"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#00d4ff]" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Hovered Bin Tooltip Card */}
      {hoveredBin && (
        <div
          className="absolute bottom-4 left-4 z-20 p-3.5 rounded-xl backdrop-blur-xl border shadow-2xl pointer-events-none animate-in fade-in"
          style={{
            background: "rgba(15, 17, 37, 0.94)",
            borderColor: hoveredBin.count === maxBinCount ? "rgba(201, 169, 97, 0.7)" : "rgba(0, 212, 255, 0.4)",
            minWidth: "220px",
          }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-[#00d4ff] uppercase tracking-wider">
              Histogram Bin
            </span>
            {hoveredBin.count === maxBinCount && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#c9a961]/20 text-[#c9a961]">
                Summit Peak
              </span>
            )}
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-[#94a3b8]">Interval:</span>
              <span className="font-mono text-white">
                [{hoveredBin.binStart.toLocaleString()} — {hoveredBin.binEnd.toLocaleString()}]
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#94a3b8]">Sample Count:</span>
              <span className="font-mono font-bold text-white">
                {hoveredBin.count.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#94a3b8]">Density:</span>
              <span className="font-mono text-[#00d4ff]">{hoveredBin.percentage}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 right-4 z-10 pointer-events-none hidden sm:flex items-center gap-3 text-[11px] text-[#94a3b8] bg-[#0f1125]/80 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-md">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#4169E1]" /> Frequency Bin
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#c9a961]" /> Summit Peak
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-0.5 bg-[#00d4ff]" /> Mean
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-0.5 bg-[#22c55e]" /> Median
        </span>
      </div>

      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 4.5, 7.5], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ powerPreference: "high-performance", antialias: true }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[10, 15, 8]} intensity={1.2} color="#ffffff" />
        <directionalLight position={[-10, 5, -5]} intensity={0.5} color="#00d4ff" />

        {/* Floor Grid */}
        <Grid
          position={[0, 0, 0]}
          args={[16, 12]}
          cellSize={0.5}
          cellThickness={1}
          cellColor="#1e293b"
          sectionSize={2}
          sectionThickness={1.5}
          sectionColor="#334155"
          fadeDistance={18}
        />

        <group>
          {/* 3D Bars */}
          {bins.map((bin, idx) => {
            const x = idx * BIN_STEP - offsetX;
            const height = (bin.count / maxBinCount) * MAX_BAR_HEIGHT;
            const isPeak = bin.count === maxBinCount && bin.count > 0;

            return (
              <HistogramBarMesh
                key={`bin-${bin.binStart}-${bin.binEnd}`}
                bin={bin}
                x={x}
                height={height}
                isPeak={isPeak}
                isHovered={hoveredBin?.binStart === bin.binStart}
                onHover={setHoveredBin}
                onUnhover={() => setHoveredBin(null)}
              />
            );
          })}

          {/* Mean Marker Line */}
          {markers.meanX !== null && (
            <group position={[markers.meanX, 0, 0]}>
              <Line
                points={[
                  [0, 0, -BAR_DEPTH / 2 - 0.2],
                  [0, MAX_BAR_HEIGHT + 0.5, -BAR_DEPTH / 2 - 0.2],
                  [0, MAX_BAR_HEIGHT + 0.5, BAR_DEPTH / 2 + 0.2],
                  [0, 0, BAR_DEPTH / 2 + 0.2],
                ]}
                color="#00d4ff"
                lineWidth={2}
              />
              <Text
                position={[0, MAX_BAR_HEIGHT + 0.75, 0]}
                fontSize={0.22}
                color="#00d4ff"
                anchorX="center"
                anchorY="bottom"
              >
                Mean: {summary?.mean?.toFixed(2)}
              </Text>
            </group>
          )}

          {/* Median Marker Line */}
          {markers.medianX !== null && (
            <group position={[markers.medianX, 0, 0]}>
              <Line
                points={[
                  [0, 0, -BAR_DEPTH / 2 - 0.25],
                  [0, MAX_BAR_HEIGHT + 0.2, -BAR_DEPTH / 2 - 0.25],
                  [0, MAX_BAR_HEIGHT + 0.2, BAR_DEPTH / 2 + 0.25],
                  [0, 0, BAR_DEPTH / 2 + 0.25],
                ]}
                color="#22c55e"
                lineWidth={2}
              />
              <Text
                position={[0, MAX_BAR_HEIGHT + 0.45, 0]}
                fontSize={0.22}
                color="#22c55e"
                anchorX="center"
                anchorY="bottom"
              >
                Median: {summary?.median?.toFixed(2)}
              </Text>
            </group>
          )}
        </group>

        <OrbitControls
          ref={controlsRef}
          makeDefault
          enableDamping={!reducedMotion}
          dampingFactor={0.05}
          minDistance={4}
          maxDistance={20}
          maxPolarAngle={Math.PI / 2.05}
        />
      </Canvas>
    </div>
  );
}
