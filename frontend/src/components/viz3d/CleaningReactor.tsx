import React, { useState, useMemo, useRef, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text, Grid } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { Sparkles, RotateCcw, ArrowRight } from "lucide-react";
import type { DataRow, CleaningReport } from "../../types/dataset";

export interface CleaningReactorProps {
  analysis: {
    dataset: {
      row_count: number;
      columns: string[];
      preview: DataRow[];
    };
    statistics: {
      missing_cells: number;
      duplicate_rows: number;
    };
  };
  cleanResult: {
    cleaning: {
      report: CleaningReport;
      cleaned_dataset: {
        preview: DataRow[];
        columns: string[];
      };
    };
  } | null;
  reducedMotion?: boolean;
}

type ViewMode = "diff" | "before" | "after";

interface ReactorCell {
  id: string;
  rowIndex: number;
  colIndex: number;
  colName: string;
  valBefore: unknown;
  valAfter: unknown;
  status: "cleaned" | "missing" | "unchanged";
  color: string;
  emissive: string;
  height: number;
  x: number;
  z: number;
}

const MAX_ROWS = 10;
const MAX_COLS = 6;
const CELL_W = 0.75;
const CELL_D = 0.75;
const SPACING_X = 1.0;
const SPACING_Z = 1.0;

// Single 3D Reactor Grid Cell
const ReactorMeshCell = React.memo(function ReactorMeshCell({
  cell,
  isHovered,
  onHover,
  onUnhover,
}: {
  cell: ReactorCell;
  isHovered: boolean;
  onHover: (c: ReactorCell) => void;
  onUnhover: () => void;
}) {
  const posY = Math.max(cell.height / 2, 0.05);

  return (
    <group position={[cell.x, 0, cell.z]}>
      <mesh
        position={[0, posY, 0]}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(cell);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          onUnhover();
        }}
      >
        <boxGeometry args={[CELL_W, cell.height, CELL_D]} />
        <meshStandardMaterial
          color={isHovered ? "#ffffff" : cell.color}
          emissive={isHovered ? "#38bdf8" : cell.emissive}
          emissiveIntensity={isHovered ? 0.8 : 0.3}
          metalness={0.4}
          roughness={0.3}
        />
      </mesh>
    </group>
  );
});

export default function CleaningReactor({
  analysis,
  cleanResult,
  reducedMotion = false,
}: CleaningReactorProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("diff");
  const [hoveredCell, setHoveredCell] = useState<ReactorCell | null>(null);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  // Fallbacks if data missing
  const report = cleanResult?.cleaning?.report;
  const beforePreview = useMemo(() => analysis?.dataset?.preview || [], [analysis]);
  const afterPreview = useMemo(() => cleanResult?.cleaning?.cleaned_dataset?.preview || [], [cleanResult]);
  const columns = useMemo(() => {
    const cols = cleanResult?.cleaning?.cleaned_dataset?.columns || analysis?.dataset?.columns || [];
    return cols.slice(0, MAX_COLS);
  }, [cleanResult, analysis]);

  // Compute cell states for 3D visualization
  const { cells, colsMetadata, rowsMetadata } = useMemo(() => {
    if (columns.length === 0 || beforePreview.length === 0) {
      return { cells: [], colsMetadata: [], rowsMetadata: [] };
    }

    const rowCount = Math.min(
      Math.max(beforePreview.length, afterPreview.length),
      MAX_ROWS
    );
    const colCount = columns.length;

    const offsetX = ((colCount - 1) * SPACING_X) / 2;
    const offsetZ = ((rowCount - 1) * SPACING_Z) / 2;

    const colsMeta = columns.map((col, cIdx) => ({
      name: col,
      x: cIdx * SPACING_X - offsetX,
    }));

    const rowsMeta = Array.from({ length: rowCount }, (_, rIdx) => ({
      label: `R${rIdx + 1}`,
      z: rIdx * SPACING_Z - offsetZ,
    }));

    const resultCells: ReactorCell[] = [];

    for (let r = 0; r < rowCount; r++) {
      const z = r * SPACING_Z - offsetZ;
      const rowB = beforePreview[r] || {};
      const rowA = afterPreview[r] || {};

      for (let c = 0; c < colCount; c++) {
        const x = c * SPACING_X - offsetX;
        const col = columns[c];

        const valBefore = rowB[col];
        const valAfter = rowA[col];

        const isMissingBefore =
          valBefore === null || valBefore === undefined || valBefore === "" || (typeof valBefore === "number" && isNaN(valBefore));
        const isMissingAfter =
          valAfter === null || valAfter === undefined || valAfter === "" || (typeof valAfter === "number" && isNaN(valAfter));

        let status: "cleaned" | "missing" | "unchanged";
        let color: string;
        let emissive: string;
        let height: number;

        if (viewMode === "diff") {
          if (isMissingBefore && !isMissingAfter) {
            status = "cleaned";
            color = "#22c55e"; // Cleaned / Imputed
            emissive = "#14532d";
            height = 0.6;
          } else if (isMissingAfter) {
            status = "missing";
            color = "#ef4444"; // Still missing
            emissive = "#7f1d1d";
            height = 0.2;
          } else if (valBefore !== valAfter) {
            status = "cleaned";
            color = "#22c55e";
            emissive = "#14532d";
            height = 0.6;
          } else {
            status = "unchanged";
            color = "#334155";
            emissive = "#0f172a";
            height = 0.25;
          }
        } else if (viewMode === "before") {
          if (isMissingBefore) {
            status = "missing";
            color = "#ef4444";
            emissive = "#7f1d1d";
            height = 0.2;
          } else {
            status = "unchanged";
            color = "#4169E1";
            emissive = "#1e3a8a";
            height = 0.45;
          }
        } else {
          // viewMode === "after"
          if (isMissingAfter) {
            status = "missing";
            color = "#ef4444";
            emissive = "#7f1d1d";
            height = 0.2;
          } else if (isMissingBefore || valBefore !== valAfter) {
            status = "cleaned";
            color = "#22c55e";
            emissive = "#14532d";
            height = 0.5;
          } else {
            status = "unchanged";
            color = "#4169E1";
            emissive = "#1e3a8a";
            height = 0.45;
          }
        }

        resultCells.push({
          id: `cell-${r}-${c}`,
          rowIndex: r + 1,
          colIndex: c,
          colName: col,
          valBefore,
          valAfter,
          status,
          color,
          emissive,
          height,
          x,
          z,
        });
      }
    }

    return { cells: resultCells, colsMetadata: colsMeta, rowsMetadata: rowsMeta };
  }, [columns, beforePreview, afterPreview, viewMode]);

  const handleResetCamera = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  }, []);

  // Empty state if cleaning hasn't been performed yet
  if (!cleanResult || !report) {
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
            background: "rgba(34, 197, 94, 0.15)",
            border: "1px solid rgba(34, 197, 94, 0.3)",
          }}
        >
          <Sparkles className="w-7 h-7 text-[#22c55e]" />
        </div>
        <h3 className="text-lg font-semibold text-[#f0f0f5] mb-2">Cleaning Reactor Idle</h3>
        <p className="text-sm text-[#6b7280] max-w-md">
          Execute dataset cleaning in the Analysis Panel above to activate 3D before-and-after cell diffing and remediation telemetry.
        </p>
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-[540px] rounded-2xl overflow-hidden border select-none"
      style={{
        background: "radial-gradient(ellipse at 50% 30%, #081426 0%, #050510 100%)",
        borderColor: "rgba(255, 255, 255, 0.08)",
      }}
    >
      {/* Top Header & Metrics Deltas */}
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
            <Sparkles className="w-3.5 h-3.5 text-[#22c55e]" />
            <span className="font-semibold uppercase tracking-wider text-[11px] text-[#22c55e]">
              Cleaning Reactor
            </span>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center p-0.5 rounded-lg backdrop-blur-md border border-white/10 bg-[#0f1125]/85 text-xs">
            <button
              onClick={() => setViewMode("diff")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                viewMode === "diff"
                  ? "bg-[#22c55e] text-black font-semibold"
                  : "text-[#94a3b8] hover:text-white"
              }`}
            >
              Diff Matrix
            </button>
            <button
              onClick={() => setViewMode("before")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                viewMode === "before"
                  ? "bg-[#4169E1] text-white font-semibold"
                  : "text-[#94a3b8] hover:text-white"
              }`}
            >
              Before
            </button>
            <button
              onClick={() => setViewMode("after")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                viewMode === "after"
                  ? "bg-[#22c55e] text-black font-semibold"
                  : "text-[#94a3b8] hover:text-white"
              }`}
            >
              After
            </button>
          </div>

          {/* Metric Deltas */}
          <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-lg backdrop-blur-md border border-white/10 bg-[#0f1125]/80 text-[11px]">
            <span className="flex items-center gap-1.5 text-[#94a3b8]">
              Rows:{" "}
              <strong className="text-white font-mono">{report.rows_before}</strong>
              <ArrowRight className="w-3 h-3 text-[#6b7280]" />
              <strong className="text-[#22c55e] font-mono">{report.rows_after}</strong>
              {report.rows_removed > 0 && (
                <span className="text-xs text-[#ef4444]">(-{report.rows_removed})</span>
              )}
            </span>
            <span className="text-[#6b7280]">|</span>
            <span className="flex items-center gap-1.5 text-[#94a3b8]">
              Missing Cells:{" "}
              <strong className="text-[#ef4444] font-mono">{report.missing_cells_before}</strong>
              <ArrowRight className="w-3 h-3 text-[#6b7280]" />
              <strong className="text-[#22c55e] font-mono">{report.missing_cells_after}</strong>
            </span>
            <span className="text-[#6b7280]">|</span>
            <span className="flex items-center gap-1.5 text-[#94a3b8]">
              Duplicates:{" "}
              <strong className="text-[#f59e0b] font-mono">{report.duplicate_rows_before}</strong>
              <ArrowRight className="w-3 h-3 text-[#6b7280]" />
              <strong className="text-[#22c55e] font-mono">{report.duplicate_rows_after}</strong>
            </span>
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

      {/* Hovered Cell Detail Overlay */}
      {hoveredCell && (
        <div
          className="absolute bottom-4 left-4 z-20 p-3.5 rounded-xl backdrop-blur-xl border shadow-2xl pointer-events-none animate-in fade-in"
          style={{
            background: "rgba(15, 17, 37, 0.94)",
            borderColor: hoveredCell.status === "cleaned"
              ? "rgba(34, 197, 94, 0.7)"
              : hoveredCell.status === "missing"
              ? "rgba(239, 68, 68, 0.7)"
              : "rgba(148, 163, 184, 0.3)",
            minWidth: "260px",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#00d4ff] uppercase tracking-wider truncate max-w-[140px]">
              {hoveredCell.colName}
            </span>
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded font-semibold"
              style={{
                backgroundColor:
                  hoveredCell.status === "cleaned"
                    ? "rgba(34, 197, 94, 0.2)"
                    : hoveredCell.status === "missing"
                    ? "rgba(239, 68, 68, 0.2)"
                    : "rgba(148, 163, 184, 0.15)",
                color:
                  hoveredCell.status === "cleaned"
                    ? "#22c55e"
                    : hoveredCell.status === "missing"
                    ? "#ef4444"
                    : "#94a3b8",
              }}
            >
              Row #{hoveredCell.rowIndex} • {hoveredCell.status.toUpperCase()}
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#94a3b8]">Before:</span>
              <span className="font-mono text-white truncate max-w-[150px]">
                {hoveredCell.valBefore !== null && hoveredCell.valBefore !== undefined
                  ? String(hoveredCell.valBefore)
                  : "⟨null / missing⟩"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#94a3b8]">After:</span>
              <span className="font-mono text-[#22c55e] font-semibold truncate max-w-[150px]">
                {hoveredCell.valAfter !== null && hoveredCell.valAfter !== undefined
                  ? String(hoveredCell.valAfter)
                  : "⟨null / missing⟩"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 right-4 z-10 pointer-events-none hidden sm:flex items-center gap-3 text-[11px] text-[#94a3b8] bg-[#0f1125]/80 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-md">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#22c55e]" /> Cleaned / Imputed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#ef4444]" /> Missing
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#334155]" /> Unchanged
        </span>
      </div>

      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [5, 6, 8], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ powerPreference: "high-performance", antialias: true }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[10, 15, 8]} intensity={1.2} color="#ffffff" />
        <directionalLight position={[-10, 6, -6]} intensity={0.5} color="#22c55e" />

        {/* Floor Grid */}
        <Grid
          position={[0, 0, 0]}
          args={[14, 16]}
          cellSize={0.5}
          cellThickness={1}
          cellColor="#1e293b"
          sectionSize={2}
          sectionThickness={1.5}
          sectionColor="#334155"
          fadeDistance={18}
        />

        <group>
          {cells.map((cell) => (
            <ReactorMeshCell
              key={cell.id}
              cell={cell}
              isHovered={hoveredCell?.id === cell.id}
              onHover={setHoveredCell}
              onUnhover={() => setHoveredCell(null)}
            />
          ))}

          {/* Column labels */}
          {colsMetadata.map((col) => (
            <group
              key={col.name}
              position={[col.x, 0.05, (MAX_ROWS * SPACING_Z) / 2 + 0.5]}
            >
              <Text
                fontSize={0.22}
                color="#94a3b8"
                anchorX="center"
                anchorY="middle"
                rotation={[-Math.PI / 2.5, 0, 0]}
              >
                {col.name.length > 9 ? `${col.name.slice(0, 8)}…` : col.name}
              </Text>
            </group>
          ))}

          {/* Row labels */}
          {rowsMetadata.map((row) => (
            <group
              key={row.label}
              position={[-(MAX_COLS * SPACING_X) / 2 - 0.7, 0.05, row.z]}
            >
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
