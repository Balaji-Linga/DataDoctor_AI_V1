import { useState, useMemo, useRef, useCallback, memo, Fragment } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html, Text, Grid } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { Grid3X3, RotateCcw } from "lucide-react";
import type { DataRow } from "../../types/dataset";
import { calculateCorrelationMatrix, type CorrelationCell } from "../../utils/mathStats";

export interface CorrelationMatrixProps {
  columns: string[];
  records: DataRow[];
  numericColumns: string[];
  reducedMotion?: boolean;
}

const CELL_SIZE = 0.9;
const CELL_GAP = 0.15;
const STEP = CELL_SIZE + CELL_GAP;
const MAX_COLS = 8; // Limit to 8x8 for optimal 3D readability

function getCorrelationColor(r: number): { color: string; emissive: string; label: string } {
  if (r >= 0.7) {
    return { color: "#c9a961", emissive: "#78350f", label: "Strong Positive" };
  } else if (r >= 0.3) {
    return { color: "#4169E1", emissive: "#1e3a8a", label: "Moderate Positive" };
  } else if (r <= -0.7) {
    return { color: "#ec4899", emissive: "#831843", label: "Strong Negative" };
  } else if (r <= -0.3) {
    return { color: "#8b5cf6", emissive: "#4c1d95", label: "Moderate Negative" };
  } else {
    return { color: "#334155", emissive: "#0f172a", label: "Weak / Negligible" };
  }
}

// Single Extruded Prism
const MatrixPrism = memo(function MatrixPrism({
  cell,
  x,
  z,
  height,
  isSelected,
  isHovered,
  onSelect,
  onHover,
  onUnhover,
}: {
  cell: CorrelationCell;
  x: number;
  z: number;
  height: number;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: (cell: CorrelationCell, pos: [number, number, number]) => void;
  onHover: (cell: CorrelationCell) => void;
  onUnhover: () => void;
}) {
  const { color, emissive } = getCorrelationColor(cell.r);
  const posY = height / 2;

  return (
    <group position={[x, 0, z]}>
      <mesh
        position={[0, posY, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(cell, [x, height + 0.4, z]);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(cell);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          onUnhover();
        }}
      >
        <boxGeometry args={[CELL_SIZE, height, CELL_SIZE]} />
        <meshStandardMaterial
          color={isSelected ? "#ffffff" : isHovered ? "#60a5fa" : color}
          emissive={isSelected ? "#3b82f6" : isHovered ? "#1d4ed8" : emissive}
          emissiveIntensity={isSelected ? 0.9 : isHovered ? 0.6 : 0.3}
          metalness={0.35}
          roughness={0.3}
        />
      </mesh>

      {/* Numerical r label printed on top face if prism is reasonably large */}
      {height > 0.4 && (
        <Text
          position={[0, height + 0.02, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.22}
          color={Math.abs(cell.r) > 0.5 ? "#ffffff" : "#94a3b8"}
          anchorX="center"
          anchorY="middle"
        >
          {cell.r >= 0 ? `+${cell.r.toFixed(2)}` : cell.r.toFixed(2)}
        </Text>
      )}
    </group>
  );
});

export default function CorrelationMatrix({
  columns,
  records,
  numericColumns,
  reducedMotion = false,
}: CorrelationMatrixProps) {
  const [hoveredCell, setHoveredCell] = useState<CorrelationCell | null>(null);
  const [selectedCell, setSelectedCell] = useState<{
    cell: CorrelationCell;
    pos: [number, number, number];
  } | null>(null);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  // Filter valid numeric columns
  const validCols = useMemo(() => {
    const list = numericColumns && numericColumns.length > 0 ? numericColumns : columns;
    return (list || []).slice(0, MAX_COLS);
  }, [numericColumns, columns]);

  // Compute correlation matrix using pure math utility
  const { matrix, activeColumns } = useMemo(() => {
    if (!validCols || validCols.length < 2 || !records || records.length === 0) {
      return { matrix: [], activeColumns: [] };
    }
    const computed = calculateCorrelationMatrix(validCols, records);
    return {
      matrix: computed.matrix,
      activeColumns: computed.columns,
    };
  }, [validCols, records]);

  const n = activeColumns.length;
  const offset = ((n - 1) * STEP) / 2;

  const handleResetCamera = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  }, []);

  // Empty state if less than 2 numeric columns
  if (activeColumns.length < 2 || matrix.length === 0) {
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
            background: "rgba(201, 169, 97, 0.15)",
            border: "1px solid rgba(201, 169, 97, 0.3)",
          }}
        >
          <Grid3X3 className="w-7 h-7 text-[#c9a961]" />
        </div>
        <h3 className="text-lg font-semibold text-[#f0f0f5] mb-2">
          Insufficient Numeric Features for Correlation
        </h3>
        <p className="text-sm text-[#6b7280] max-w-md">
          At least two valid numeric features are required to compute the Pearson correlation matrix.
        </p>
      </div>
    );
  }

  const activeHoverOrSelect = selectedCell?.cell || hoveredCell;
  const currentBadgeInfo = activeHoverOrSelect
    ? getCorrelationColor(activeHoverOrSelect.r)
    : null;

  return (
    <div
      className="relative w-full h-[540px] rounded-2xl overflow-hidden border select-none"
      style={{
        background: "radial-gradient(ellipse at 50% 30%, #0d122e 0%, #050510 100%)",
        borderColor: "rgba(255, 255, 255, 0.08)",
      }}
    >
      {/* Top Header */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-3 pointer-events-none">
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg backdrop-blur-md border text-xs"
          style={{
            background: "rgba(15, 17, 37, 0.85)",
            borderColor: "rgba(255, 255, 255, 0.1)",
            color: "#f0f0f5",
          }}
        >
          <Grid3X3 className="w-3.5 h-3.5 text-[#c9a961]" />
          <span className="font-semibold uppercase tracking-wider text-[11px] text-[#c9a961]">
            Correlation Matrix
          </span>
          <span className="text-[#6b7280]">|</span>
          <span className="font-mono text-[#94a3b8] text-[11px]">
            {activeColumns.length} × {activeColumns.length} Pearson grid
          </span>
        </div>

        {/* Legend */}
        <div
          className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-lg backdrop-blur-md border text-[11px]"
          style={{
            background: "rgba(15, 17, 37, 0.75)",
            borderColor: "rgba(255, 255, 255, 0.08)",
          }}
        >
          <span className="flex items-center gap-1.5 text-[#94a3b8]">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#c9a961]" /> Strong (+0.7)
          </span>
          <span className="flex items-center gap-1.5 text-[#94a3b8]">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#4169E1]" /> Moderate (+0.3)
          </span>
          <span className="flex items-center gap-1.5 text-[#94a3b8]">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#334155]" /> Weak (0.0)
          </span>
          <span className="flex items-center gap-1.5 text-[#94a3b8]">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#8b5cf6]" /> Moderate Negative (-0.3)
          </span>
          <span className="flex items-center gap-1.5 text-[#94a3b8]">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#ec4899]" /> Strong Negative (-0.7)
          </span>
        </div>
      </div>

      {/* Top Right Controls */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <button
          onClick={handleResetCamera}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer backdrop-blur-md border transition-all"
          style={{
            background: "rgba(15, 17, 37, 0.85)",
            borderColor: "rgba(255, 255, 255, 0.12)",
            color: "#f0f0f5",
          }}
          title="Reset Camera View"
        >
          <RotateCcw className="w-3.5 h-3.5 text-[#00d4ff]" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>

      {/* Selected / Hovered HUD details card */}
      {activeHoverOrSelect && currentBadgeInfo && (
        <div
          className="absolute bottom-4 left-4 z-10 p-3.5 rounded-xl backdrop-blur-xl border shadow-2xl pointer-events-none animate-in fade-in"
          style={{
            background: "rgba(15, 17, 37, 0.94)",
            borderColor: currentBadgeInfo.color,
            minWidth: "260px",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-[#00d4ff] uppercase tracking-wider">
              Pairwise Correlation
            </span>
            <span
              className="text-[10px] font-mono font-bold px-2 py-0.5 rounded"
              style={{
                backgroundColor: `${currentBadgeInfo.color}22`,
                color: currentBadgeInfo.color,
              }}
            >
              {currentBadgeInfo.label}
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#94a3b8]">Feature A:</span>
              <span className="font-semibold text-white truncate max-w-[150px]">
                {activeHoverOrSelect.colA}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#94a3b8]">Feature B:</span>
              <span className="font-semibold text-white truncate max-w-[150px]">
                {activeHoverOrSelect.colB}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-white/10">
              <span className="text-[#94a3b8]">Pearson Coefficient (r):</span>
              <span
                className="font-mono font-bold text-sm"
                style={{ color: currentBadgeInfo.color }}
              >
                {activeHoverOrSelect.r >= 0
                  ? `+${activeHoverOrSelect.r.toFixed(3)}`
                  : activeHoverOrSelect.r.toFixed(3)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Canvas */}
      <Canvas
        camera={{ position: [6, 7, 7], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ powerPreference: "high-performance", antialias: true }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[10, 15, 10]} intensity={1.2} color="#ffffff" />
        <directionalLight position={[-8, 6, -6]} intensity={0.5} color="#00d4ff" />

        {/* Floor Grid */}
        <Grid
          position={[0, 0, 0]}
          args={[14, 14]}
          cellSize={0.5}
          cellThickness={1}
          cellColor="#1e293b"
          sectionSize={2}
          sectionThickness={1.5}
          sectionColor="#334155"
          fadeDistance={18}
        />

        <group>
          {matrix.map((cell) => {
            const i = activeColumns.indexOf(cell.colA);
            const j = activeColumns.indexOf(cell.colB);
            if (i === -1 || j === -1) return null;

            const x = i * STEP - offset;
            const z = j * STEP - offset;
            const height = Math.max(0.12, Math.abs(cell.r) * 2.5);

            const isSelected =
              selectedCell?.cell.colA === cell.colA && selectedCell?.cell.colB === cell.colB;
            const isHovered =
              hoveredCell?.colA === cell.colA && hoveredCell?.colB === cell.colB;

            return (
              <MatrixPrism
                key={`${cell.colA}__${cell.colB}`}
                cell={cell}
                x={x}
                z={z}
                height={height}
                isSelected={isSelected}
                isHovered={isHovered}
                onSelect={(c, pos) => setSelectedCell({ cell: c, pos })}
                onHover={setHoveredCell}
                onUnhover={() => setHoveredCell(null)}
              />
            );
          })}

          {/* Row and Column Header Labels in 3D */}
          {activeColumns.map((col, idx) => {
            const coord = idx * STEP - offset;
            return (
              <Fragment key={`label-${col}`}>
                {/* X axis labels */}
                <group position={[coord, 0.05, offset + 0.8]}>
                  <Text
                    fontSize={0.22}
                    color="#94a3b8"
                    anchorX="center"
                    anchorY="middle"
                    rotation={[-Math.PI / 2.5, 0, 0]}
                  >
                    {col.length > 9 ? `${col.slice(0, 8)}…` : col}
                  </Text>
                </group>

                {/* Z axis labels */}
                <group position={[-offset - 0.8, 0.05, coord]}>
                  <Text
                    fontSize={0.22}
                    color="#94a3b8"
                    anchorX="right"
                    anchorY="middle"
                    rotation={[-Math.PI / 2.5, 0, 0]}
                  >
                    {col.length > 9 ? `${col.slice(0, 8)}…` : col}
                  </Text>
                </group>
              </Fragment>
            );
          })}

          {/* Drei HTML badge on top of selected prism */}
          {selectedCell && (
            <Html
              position={selectedCell.pos}
              center
              distanceFactor={9}
              style={{ pointerEvents: "none" }}
            >
              <div className="px-2.5 py-1 rounded-md bg-[#050510]/95 border border-[#00d4ff] text-white shadow-xl flex items-center gap-1.5 text-xs whitespace-nowrap backdrop-blur-md">
                <span className="font-mono font-bold text-[#00d4ff]">
                  r = {selectedCell.cell.r >= 0 ? `+${selectedCell.cell.r}` : selectedCell.cell.r}
                </span>
              </div>
            </Html>
          )}
        </group>

        <OrbitControls
          ref={controlsRef}
          makeDefault
          enableDamping={!reducedMotion}
          dampingFactor={0.05}
          minDistance={4}
          maxDistance={22}
          maxPolarAngle={Math.PI / 2.05}
        />
      </Canvas>
    </div>
  );
}
