import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import FloorGrid3D from './FloorGrid3D';
import ParticleStreams from './ParticleStreams';
import ReactorCore3D from './ReactorCore3D';
import DataMatrix3D from './DataMatrix3D';
import CameraController from './CameraController';
import type { LabChamber } from './CameraController';
import type { SelectedVoxel } from './DataMatrix3D';
import type { AnalysisResponse, CleaningResponse } from '../../types/dataset';

// 3D Analytical Chamber Modules
import DataMountain from '../viz3d/DataMountain';
import ScatterUniverse from '../viz3d/ScatterUniverse';
import CorrelationMatrix from '../viz3d/CorrelationMatrix';
import CleaningReactor from '../viz3d/CleaningReactor';

interface DataLaboratorySceneProps {
  chamber: LabChamber;
  machineState: string;
  analysis: AnalysisResponse | null;
  cleanResult: CleaningResponse | null;
  selectedVoxel: SelectedVoxel | null;
  onSelectVoxel: (v: SelectedVoxel | null) => void;
  freeLook: boolean;
}

export default function DataLaboratoryScene({
  chamber,
  machineState,
  analysis,
  cleanResult,
  selectedVoxel,
  onSelectVoxel,
  freeLook,
}: DataLaboratorySceneProps) {
  const dataset = analysis?.dataset;
  const statistics = analysis?.statistics;
  const quality = analysis?.quality_report;

  const columns = dataset?.columns || [];
  const records = dataset?.preview || [];
  const numericalSummary = statistics?.numerical_summary || {};
  const numericColumns = statistics?.numeric_columns || [];
  const outliers = quality?.issues?.filter((i) => i.type === 'outliers') || [];

  return (
    <div className="fixed inset-0 w-full h-full z-0 overflow-hidden bg-[#050510]">
      {/* Three.js Canvas for Core & Matrix */}
      {(chamber === 'core' || chamber === 'matrix') && (
        <Canvas
          camera={{ position: [0, 3.2, 7.2], fov: 46 }}
          gl={{
            antialias: true,
            powerPreference: 'high-performance',
          }}
          onPointerDown={() => {
            // Clicking empty 3D space deselects voxel
            onSelectVoxel(null);
          }}
        >
          <color attach="background" args={['#050510']} />
          <fog attach="fog" args={['#050510', 8, 30]} />

          {/* Lighting Rig */}
          <ambientLight intensity={1.2} />
          <directionalLight position={[10, 15, 10]} intensity={2.2} color="#00d4ff" />
          <pointLight position={[-8, 6, -8]} intensity={1.8} color="#4169E1" />
          <pointLight position={[0, -1, 0]} intensity={1.5} color="#c9a961" />

          {/* Floor Dais & Rotating Rings */}
          <FloorGrid3D activeState={machineState} />

          {/* Dynamic Particle Cloud */}
          <ParticleStreams machineState={machineState} />

          {/* Core Engine Chamber */}
          {chamber === 'core' && (
            <ReactorCore3D
              machineState={machineState}
              hasDataset={Boolean(analysis)}
            />
          )}

          {/* Voxel Matrix Chamber */}
          {chamber === 'matrix' && (
            <DataMatrix3D
              columns={columns}
              records={records}
              outliers={outliers}
              selectedVoxel={selectedVoxel}
              onSelectVoxel={onSelectVoxel}
            />
          )}

          {/* Camera Controller & Free-look */}
          <CameraController chamber={chamber} enableFreeLook={freeLook} />
          {freeLook && (
            <OrbitControls
              enableDamping
              dampingFactor={0.05}
              maxPolarAngle={Math.PI / 2.05}
              minDistance={3}
              maxDistance={25}
            />
          )}
        </Canvas>
      )}

      {/* Analytical Visual Chamber 3: Data Mountain */}
      {chamber === 'mountain' && (
        <div className="absolute inset-0 pt-16 pb-20 px-4 sm:px-8 flex items-center justify-center">
          <div className="w-full h-full max-w-7xl max-h-[85vh]">
            <DataMountain
              columns={columns}
              records={records}
              numericalSummary={numericalSummary}
            />
          </div>
        </div>
      )}

      {/* Analytical Visual Chamber 4: 3D Scatter Universe */}
      {chamber === 'scatter' && (
        <div className="absolute inset-0 pt-16 pb-20 px-4 sm:px-8 flex items-center justify-center">
          <div className="w-full h-full max-w-7xl max-h-[85vh]">
            <ScatterUniverse
              columns={columns}
              records={records}
              numericalSummary={numericalSummary}
            />
          </div>
        </div>
      )}

      {/* Analytical Visual Chamber 5: Correlation Matrix */}
      {chamber === 'correlation' && (
        <div className="absolute inset-0 pt-16 pb-20 px-4 sm:px-8 flex items-center justify-center">
          <div className="w-full h-full max-w-7xl max-h-[85vh]">
            <CorrelationMatrix
              columns={columns}
              records={records}
              numericColumns={numericColumns}
            />
          </div>
        </div>
      )}

      {/* Analytical Visual Chamber 6: Remediation Reactor */}
      {chamber === 'cleaning' && (
        <div className="absolute inset-0 pt-16 pb-20 px-4 sm:px-8 flex items-center justify-center">
          <div className="w-full h-full max-w-7xl max-h-[85vh]">
            {cleanResult && analysis ? (
              <CleaningReactor
                analysis={analysis}
                cleanResult={cleanResult}
              />
            ) : (
              <div className="w-full h-96 rounded-2xl flex flex-col items-center justify-center border border-white/10 bg-[#050a18]/90 p-8 text-center">
                <span className="text-sm font-mono text-[#00d4ff] uppercase tracking-wider mb-2">
                  [ REMEDIATION PROTOCOL ARMED ]
                </span>
                <p className="text-xs font-mono text-[#6b7280] max-w-md">
                  Select your imputation strategy in the Remediation Console on the right and click [ENGAGE PROTOCOL] to fire the reactor.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
