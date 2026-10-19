import { useMemo } from 'react';
import { Text } from '@react-three/drei';
import type { DataRow, QualityIssue } from '../../types/dataset';
import { soundManager } from '../../audio/soundManager';

export interface SelectedVoxel {
  row: number;
  column: string;
  value: unknown;
  isMissing: boolean;
  isOutlier: boolean;
  position: [number, number, number];
}

interface DataMatrix3DProps {
  columns: string[];
  records: DataRow[];
  outliers?: QualityIssue[];
  selectedVoxel: SelectedVoxel | null;
  onSelectVoxel: (voxel: SelectedVoxel | null) => void;
}

export default function DataMatrix3D({
  columns,
  records,
  outliers = [],
  selectedVoxel,
  onSelectVoxel,
}: DataMatrix3DProps) {
  const maxRows = Math.min(records.length, 12);
  const maxCols = Math.min(columns.length, 8);

  const outlierCols = useMemo(() => {
    return new Set(outliers.map((o) => o.column).filter(Boolean));
  }, [outliers]);

  const spacingX = 0.95;
  const spacingZ = 0.95;
  const offsetX = ((maxCols - 1) * spacingX) / 2;
  const offsetZ = ((maxRows - 1) * spacingZ) / 2;

  const voxels = useMemo(() => {
    const list: SelectedVoxel[] = [];
    for (let r = 0; r < maxRows; r++) {
      const row = records[r] || {};
      for (let c = 0; c < maxCols; c++) {
        const col = columns[c];
        const val = row[col];
        const isMissing = val === null || val === undefined || val === '' || (typeof val === 'number' && isNaN(val));
        const isOutlier = outlierCols.has(col) && typeof val === 'number' && !isMissing;

        const posX = c * spacingX - offsetX;
        const posZ = r * spacingZ - offsetZ;
        const posY = isOutlier ? 0.6 : isMissing ? 0.05 : 0.25;

        list.push({
          row: r + 1,
          column: col,
          value: val,
          isMissing,
          isOutlier,
          position: [posX, posY, posZ],
        });
      }
    }
    return list;
  }, [records, columns, maxRows, maxCols, outlierCols, offsetX, offsetZ, spacingX, spacingZ]);

  if (records.length === 0 || columns.length === 0) {
    return null;
  }

  return (
    <group position={[0, -0.6, 0]}>
      {/* Column Headers in 3D */}
      {columns.slice(0, maxCols).map((col, cIdx) => (
        <group key={`head-${col}`} position={[cIdx * spacingX - offsetX, 0.05, -offsetZ - 0.7]}>
          <Text
            fontSize={0.16}
            color="#00d4ff"
            anchorX="center"
            anchorY="middle"
            rotation={[-Math.PI / 3, 0, 0]}
          >
            {col.length > 8 ? `${col.slice(0, 7)}…` : col}
          </Text>
        </group>
      ))}

      {/* Row Labels in 3D */}
      {Array.from({ length: maxRows }).map((_, rIdx) => (
        <group key={`row-${rIdx}`} position={[-offsetX - 0.7, 0.05, rIdx * spacingZ - offsetZ]}>
          <Text
            fontSize={0.15}
            color="#6b7280"
            anchorX="right"
            anchorY="middle"
            rotation={[-Math.PI / 3, 0, 0]}
          >
            {`R${rIdx + 1}`}
          </Text>
        </group>
      ))}

      {/* Voxel Blocks */}
      {voxels.map((v) => {
        const isSelected = selectedVoxel?.row === v.row && selectedVoxel?.column === v.column;
        let color = '#3b82f6';
        let emissive = '#1e3a8a';
        let height = 0.35;

        if (v.isMissing) {
          color = '#ef4444';
          emissive = '#b91c1c';
          height = 0.15;
        } else if (v.isOutlier) {
          color = '#c9a961';
          emissive = '#d97706';
          height = 0.85;
        }

        if (isSelected) {
          color = '#ffffff';
          emissive = '#00d4ff';
        }

        return (
          <group key={`vox-${v.row}-${v.column}`} position={v.position}>
            <mesh
              onClick={(e) => {
                e.stopPropagation();
                soundManager.playClick();
                onSelectVoxel(v);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                soundManager.playHover();
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={() => {
                document.body.style.cursor = 'auto';
              }}
            >
              <boxGeometry args={[0.7, height, 0.7]} />
              <meshStandardMaterial
                color={color}
                emissive={emissive}
                emissiveIntensity={isSelected ? 1.0 : v.isMissing || v.isOutlier ? 0.8 : 0.35}
                roughness={0.2}
                metalness={0.7}
              />
            </mesh>

            {/* Outlier vertical laser beacon */}
            {v.isOutlier && (
              <mesh position={[0, height / 2 + 0.6, 0]}>
                <cylinderGeometry args={[0.02, 0.02, 1.2, 8]} />
                <meshBasicMaterial color="#c9a961" />
              </mesh>
            )}

            {/* Missing value red pulsating beacon */}
            {v.isMissing && (
              <mesh position={[0, height / 2 + 0.18, 0]}>
                <sphereGeometry args={[0.07, 8, 8]} />
                <meshBasicMaterial color="#ef4444" />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}

