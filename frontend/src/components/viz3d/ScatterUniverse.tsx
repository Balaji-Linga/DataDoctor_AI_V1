import { useState, useMemo, useRef, useCallback, memo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Line, Text } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { Orbit, RotateCcw, X as CloseIcon } from "lucide-react";
import type { DataRow, NumericalSummaryItem } from "../../types/dataset";

export interface ScatterUniverseProps {
  columns: string[];
  records: DataRow[];
  numericalSummary: Record<string, NumericalSummaryItem>;
  outlierColumns?: Set<string>;
  reducedMotion?: boolean;
}

interface ScatterPoint {
  id: string;
  rowIndex: number;
  position: [number, number, number];
  rawX: number | null;
  rawY: number | null;
  rawZ: number | null;
  isOutlier: boolean;
}

const BOUNDS = 3.5;

// Individual Sphere Point
const UniversePoint = memo(function UniversePoint({
  point,
  isSelected,
  isHovered,
  onSelect,
  onHover,
  onUnhover,
}: {
  point: ScatterPoint;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: (pt: ScatterPoint) => void;
  onHover: (pt: ScatterPoint) => void;
  onUnhover: () => void;
}) {
  let color = "#4169E1"; // standard accent blue
  let emissive = "#1e3a8a";
  let radius = 0.12;

  if (point.isOutlier) {
    color = "#ef4444"; // outlier red
    emissive = "#991b1b";
  }

  if (isHovered) {
    color = "#38bdf8";
    emissive = "#0284c7";
    radius = 0.18;
  }

  if (isSelected) {
    color = "#ffffff";
    emissive = "#60a5fa";
    radius = 0.22;
  }

  return (
    <group position={point.position}>
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onSelect(point);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(point);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          onUnhover();
        }}
      >
        <sphereGeometry args={[radius, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={isSelected ? 1.0 : isHovered ? 0.7 : 0.3}
          roughness={0.25}
          metalness={0.6}
        />
      </mesh>
      {isSelected && (
        <mesh>
          <ringGeometry args={[0.26, 0.32, 24]} />
          <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} transparent opacity={0.8} />
        </mesh>
      )}
    </group>
  );
});

// Scene coordinate frame & axis guides
function CoordinateFrame({
  xLabel,
  yLabel,
  zLabel,
}: {
  xLabel: string;
  yLabel: string;
  zLabel: string;
}) {
  const min = -BOUNDS;
  const max = BOUNDS;

  return (
    <group>
      {/* Primary Axes Lines */}
      {/* X Axis (Cyan) */}
      <Line
        points={[
          [min, min, min],
          [max, min, min],
        ]}
        color="#00d4ff"
        lineWidth={2}
      />
      {/* Y Axis (Green) */}
      <Line
        points={[
          [min, min, min],
          [min, max, min],
        ]}
        color="#22c55e"
        lineWidth={2}
      />
      {/* Z Axis (Gold) */}
      <Line
        points={[
          [min, min, min],
          [min, min, max],
        ]}
        color="#c9a961"
        lineWidth={2}
      />

      {/* Subtle Bounding Wireframe Box */}
      <Line
        points={[
          [max, min, min],
          [max, max, min],
          [min, max, min],
          [min, max, max],
          [max, max, max],
          [max, min, max],
          [min, min, max],
          [min, max, max],
        ]}
        color="#1e293b"
        lineWidth={1}
      />
      <Line
        points={[
          [max, max, min],
          [max, max, max],
        ]}
        color="#1e293b"
        lineWidth={1}
      />
      <Line
        points={[
          [max, min, min],
          [max, min, max],
        ]}
        color="#1e293b"
        lineWidth={1}
      />

      {/* Axis Labels */}
      <Text
        position={[max + 0.6, min, min]}
        fontSize={0.28}
        color="#00d4ff"
        anchorX="left"
        anchorY="middle"
      >
        X: {xLabel.length > 12 ? `${xLabel.slice(0, 11)}…` : xLabel}
      </Text>

      <Text
        position={[min, max + 0.5, min]}
        fontSize={0.28}
        color="#22c55e"
        anchorX="center"
        anchorY="bottom"
      >
        Y: {yLabel.length > 12 ? `${yLabel.slice(0, 11)}…` : yLabel}
      </Text>

      <Text
        position={[min, min, max + 0.6]}
        fontSize={0.28}
        color="#c9a961"
        anchorX="left"
        anchorY="middle"
      >
        Z: {zLabel.length > 12 ? `${zLabel.slice(0, 11)}…` : zLabel}
      </Text>
    </group>
  );
}

export default function ScatterUniverse({
  columns,
  records,
  numericalSummary,
  outlierColumns,
  reducedMotion = false,
}: ScatterUniverseProps) {
  // Extract all valid numeric columns from numericalSummary
  const numericCols = useMemo(() => {
    if (!numericalSummary) return [];
    const valid = Object.keys(numericalSummary).filter((col) => {
      const summary = numericalSummary[col];
      return summary && summary.count > 0 && summary.minimum !== null && summary.maximum !== null;
    });
    if (columns && columns.length > 0) {
      return columns.filter((c) => valid.includes(c));
    }
    return valid;
  }, [columns, numericalSummary]);

  // User chosen axes
  const [userXAxis, setUserXAxis] = useState<string>("");
  const [userYAxis, setUserYAxis] = useState<string>("");
  const [userZAxis, setUserZAxis] = useState<string>("");

  const xAxis =
    userXAxis && numericCols.includes(userXAxis) ? userXAxis : numericCols[0] || "";
  const yAxis =
    userYAxis && numericCols.includes(userYAxis)
      ? userYAxis
      : numericCols[1] || numericCols[0] || "";
  const zAxis =
    userZAxis && numericCols.includes(userZAxis)
      ? userZAxis
      : numericCols.length > 2
      ? numericCols[2]
      : numericCols[0] || "";

  const [hoveredPoint, setHoveredPoint] = useState<ScatterPoint | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<ScatterPoint | null>(null);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  // Normalize a single value to [-3.5, 3.5]
  const normalizeCoord = useCallback(
    (colName: string, val: unknown): number => {
      if (typeof val !== "number" || isNaN(val) || !isFinite(val)) return 0;
      const summary = numericalSummary[colName];
      if (!summary || summary.minimum === null || summary.maximum === null) return 0;
      const range = summary.maximum - summary.minimum;
      if (range === 0) return 0;
      const ratio = (val - summary.minimum) / range;
      const clamped = Math.max(0, Math.min(1, ratio));
      return -BOUNDS + clamped * (BOUNDS * 2);
    },
    [numericalSummary]
  );

  // Compute 3D scatter points
  const points = useMemo(() => {
    if (!records || records.length === 0 || !xAxis || !yAxis) {
      return [];
    }

    const maxRecords = Math.min(records.length, 250);
    const result: ScatterPoint[] = [];

    for (let i = 0; i < maxRecords; i++) {
      const row = records[i];
      const rawX = row[xAxis];
      const rawY = row[yAxis];
      const rawZ = zAxis ? row[zAxis] : null;

      const numX = typeof rawX === "number" && !isNaN(rawX) && isFinite(rawX) ? rawX : null;
      const numY = typeof rawY === "number" && !isNaN(rawY) && isFinite(rawY) ? rawY : null;
      const numZ = typeof rawZ === "number" && !isNaN(rawZ) && isFinite(rawZ) ? rawZ : null;

      // Skip row if both X and Y are missing
      if (numX === null && numY === null) continue;

      const px = normalizeCoord(xAxis, numX);
      const py = normalizeCoord(yAxis, numY);
      const pz = zAxis ? normalizeCoord(zAxis, numZ) : 0;

      // Check if this point exhibits outlier behavior in any selected axis
      let isOutlier = false;
      const checkOutlier = (col: string, val: number | null) => {
        if (!outlierColumns?.has(col) || val === null) return false;
        const s = numericalSummary[col];
        if (s?.mean !== null && s?.standard_deviation && s.standard_deviation > 0) {
          const zScore = Math.abs((val - s.mean) / s.standard_deviation);
          return zScore >= 2.0;
        }
        return true;
      };

      if (
        checkOutlier(xAxis, numX) ||
        checkOutlier(yAxis, numY) ||
        (zAxis && checkOutlier(zAxis, numZ))
      ) {
        isOutlier = true;
      }

      result.push({
        id: `pt-${i}`,
        rowIndex: i + 1,
        position: [px, py, pz],
        rawX: numX,
        rawY: numY,
        rawZ: numZ,
        isOutlier,
      });
    }

    return result;
  }, [records, xAxis, yAxis, zAxis, normalizeCoord, outlierColumns, numericalSummary]);

  const handleResetCamera = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  }, []);

  // Empty state if less than 2 numeric columns
  if (numericCols.length < 2) {
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
            background: "rgba(0, 212, 255, 0.15)",
            border: "1px solid rgba(0, 212, 255, 0.3)",
          }}
        >
          <Orbit className="w-7 h-7 text-[#00d4ff]" />
        </div>
        <h3 className="text-lg font-semibold text-[#f0f0f5] mb-2">
          At least 2 Numeric Columns Required
        </h3>
        <p className="text-sm text-[#6b7280] max-w-md">
          Scatter Universe requires at least two numeric columns (X and Y coordinates) to visualize multi-dimensional point clusters.
        </p>
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-[540px] rounded-2xl overflow-hidden border select-none"
      style={{
        background: "radial-gradient(ellipse at 50% 40%, #091026 0%, #050510 100%)",
        borderColor: "rgba(255, 255, 255, 0.08)",
      }}
    >
      {/* Top Header & Dimension Selectors */}
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
            <Orbit className="w-3.5 h-3.5 text-[#00d4ff]" />
            <span className="font-semibold uppercase tracking-wider text-[11px] text-[#00d4ff]">
              Scatter Universe
            </span>
            <span className="text-[#6b7280]">|</span>
            <span className="font-mono text-[#94a3b8] text-[11px]">
              {points.length} / {records.length} points
            </span>
          </div>

          {/* X Selector */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg backdrop-blur-md border text-xs bg-[#0f1125]/85 border-white/10">
            <span className="text-[#00d4ff] font-bold text-[11px]">X:</span>
            <select
              value={xAxis}
              onChange={(e) => setUserXAxis(e.target.value)}
              className="bg-transparent text-xs text-[#f0f0f5] focus:outline-none cursor-pointer max-w-[110px] truncate"
            >
              {numericCols.map((c) => (
                <option key={`x-${c}`} value={c} className="bg-[#0f1125] text-white">
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Y Selector */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg backdrop-blur-md border text-xs bg-[#0f1125]/85 border-white/10">
            <span className="text-[#22c55e] font-bold text-[11px]">Y:</span>
            <select
              value={yAxis}
              onChange={(e) => setUserYAxis(e.target.value)}
              className="bg-transparent text-xs text-[#f0f0f5] focus:outline-none cursor-pointer max-w-[110px] truncate"
            >
              {numericCols.map((c) => (
                <option key={`y-${c}`} value={c} className="bg-[#0f1125] text-white">
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Z Selector */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg backdrop-blur-md border text-xs bg-[#0f1125]/85 border-white/10">
            <span className="text-[#c9a961] font-bold text-[11px]">Z:</span>
            <select
              value={zAxis}
              onChange={(e) => setUserZAxis(e.target.value)}
              className="bg-transparent text-xs text-[#f0f0f5] focus:outline-none cursor-pointer max-w-[110px] truncate"
            >
              {numericCols.map((c) => (
                <option key={`z-${c}`} value={c} className="bg-[#0f1125] text-white">
                  {c}
                </option>
              ))}
            </select>
          </div>
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

      {/* Selected Point HUD Detail Card */}
      {selectedPoint && (
        <div
          className="absolute bottom-4 left-4 z-20 p-4 rounded-xl backdrop-blur-xl border shadow-2xl animate-in fade-in"
          style={{
            background: "rgba(15, 17, 37, 0.94)",
            borderColor: selectedPoint.isOutlier ? "rgba(239, 68, 68, 0.6)" : "rgba(0, 212, 255, 0.4)",
            minWidth: "260px",
            maxWidth: "320px",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-[#f0f0f5]">Point Detail</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-white">
                Row #{selectedPoint.rowIndex}
              </span>
            </div>
            <button
              onClick={() => setSelectedPoint(null)}
              className="text-[#94a3b8] hover:text-white transition-colors cursor-pointer p-0.5"
            >
              <CloseIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#00d4ff] font-medium truncate max-w-[120px]">{xAxis}:</span>
              <span className="font-mono text-[#f0f0f5]">
                {selectedPoint.rawX !== null ? selectedPoint.rawX.toLocaleString() : "N/A"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#22c55e] font-medium truncate max-w-[120px]">{yAxis}:</span>
              <span className="font-mono text-[#f0f0f5]">
                {selectedPoint.rawY !== null ? selectedPoint.rawY.toLocaleString() : "N/A"}
              </span>
            </div>
            {zAxis && (
              <div className="flex items-center justify-between">
                <span className="text-[#c9a961] font-medium truncate max-w-[120px]">{zAxis}:</span>
                <span className="font-mono text-[#f0f0f5]">
                  {selectedPoint.rawZ !== null ? selectedPoint.rawZ.toLocaleString() : "N/A"}
                </span>
              </div>
            )}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
              <span className="text-[10px] text-[#6b7280]">Outlier Detection:</span>
              <span
                className="text-[11px] font-medium"
                style={{ color: selectedPoint.isOutlier ? "#ef4444" : "#22c55e" }}
              >
                {selectedPoint.isOutlier ? "Outlier Detected" : "Normal Point"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Legend & Hint */}
      <div className="absolute bottom-4 right-4 z-10 pointer-events-none hidden sm:flex items-center gap-3 text-[11px] text-[#94a3b8] bg-[#0f1125]/80 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-md">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#4169E1]" /> Normal
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" /> Outlier
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-white ring-1 ring-blue-400" /> Selected
        </span>
      </div>

      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [8, 6, 8], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ powerPreference: "high-performance", antialias: true }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 15, 10]} intensity={1.3} color="#ffffff" />
        <directionalLight position={[-10, -5, -8]} intensity={0.4} color="#00d4ff" />

        <CoordinateFrame xLabel={xAxis} yLabel={yAxis} zLabel={zAxis || "Z"} />

        <group>
          {points.map((pt) => (
            <UniversePoint
              key={pt.id}
              point={pt}
              isSelected={selectedPoint?.id === pt.id}
              isHovered={hoveredPoint?.id === pt.id}
              onSelect={setSelectedPoint}
              onHover={setHoveredPoint}
              onUnhover={() => setHoveredPoint(null)}
            />
          ))}
        </group>

        <OrbitControls
          ref={controlsRef}
          makeDefault
          enableDamping={!reducedMotion}
          dampingFactor={0.05}
          minDistance={3}
          maxDistance={25}
        />
      </Canvas>
    </div>
  );
}
