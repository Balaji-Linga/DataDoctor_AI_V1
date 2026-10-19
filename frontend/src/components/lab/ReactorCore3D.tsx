import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

interface ReactorCoreProps {
  machineState: string;
  hasDataset: boolean;
}

export default function ReactorCore3D({ machineState, hasDataset }: ReactorCoreProps) {
  const outerRingRef = useRef<THREE.Group>(null);
  const midRingRef = useRef<THREE.Group>(null);
  const innerRingRef = useRef<THREE.Group>(null);
  const coreMeshRef = useRef<THREE.Mesh>(null);
  const scanPlaneRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    const isAccelerated = machineState === 'analyzing' || machineState === 'cleaning';
    const rate = isAccelerated ? 3.0 : 0.8;

    if (outerRingRef.current) {
      outerRingRef.current.rotation.x += delta * 0.4 * rate;
      outerRingRef.current.rotation.y += delta * 0.3 * rate;
    }
    if (midRingRef.current) {
      midRingRef.current.rotation.y -= delta * 0.5 * rate;
      midRingRef.current.rotation.z += delta * 0.35 * rate;
    }
    if (innerRingRef.current) {
      innerRingRef.current.rotation.z += delta * 0.7 * rate;
      innerRingRef.current.rotation.x -= delta * 0.4 * rate;
    }
    if (coreMeshRef.current) {
      coreMeshRef.current.rotation.y += delta * 0.6 * rate;
      // Pulse scale
      const pulse = 1.0 + Math.sin(time * 3 * rate) * 0.05;
      coreMeshRef.current.scale.set(pulse, pulse, pulse);
    }

    // Laser scan sweep animation
    if (scanPlaneRef.current) {
      if (machineState === 'analyzing') {
        scanPlaneRef.current.position.y = Math.sin(time * 4) * 1.5;
        scanPlaneRef.current.visible = true;
      } else {
        scanPlaneRef.current.visible = false;
      }
    }
  });

  const coreColor = machineState === 'cleaning'
    ? '#22c55e'
    : machineState === 'analyzing'
    ? '#c9a961'
    : hasDataset
    ? '#00d4ff'
    : '#4169E1';

  return (
    <group position={[0, 0.4, 0]}>
      {/* Central Floating Polyhedral Core */}
      <Float speed={1.8} rotationIntensity={0.3} floatIntensity={0.4}>
        <mesh ref={coreMeshRef}>
          <octahedronGeometry args={[0.9, 2]} />
          <meshStandardMaterial
            color={coreColor}
            emissive={coreColor}
            emissiveIntensity={0.7}
            wireframe
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>

        {/* Inner solid energy crystal */}
        <mesh scale={[0.45, 0.45, 0.45]}>
          <icosahedronGeometry args={[1, 0]} />
          <meshBasicMaterial color="#ffffff" wireframe={false} />
        </mesh>
      </Float>

      {/* Outer Gyro Gimbal Ring 1 */}
      <group ref={outerRingRef}>
        <mesh>
          <torusGeometry args={[2.0, 0.025, 16, 64]} />
          <meshStandardMaterial
            color="#00d4ff"
            emissive="#00d4ff"
            emissiveIntensity={0.5}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
      </group>

      {/* Mid Gyro Gimbal Ring 2 */}
      <group ref={midRingRef}>
        <mesh>
          <torusGeometry args={[1.65, 0.022, 16, 64]} />
          <meshStandardMaterial
            color="#4169E1"
            emissive="#4169E1"
            emissiveIntensity={0.4}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
      </group>

      {/* Inner Gyro Gimbal Ring 3 */}
      <group ref={innerRingRef}>
        <mesh>
          <torusGeometry args={[1.3, 0.02, 16, 64]} />
          <meshStandardMaterial
            color="#c9a961"
            emissive="#c9a961"
            emissiveIntensity={0.4}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
      </group>

      {/* Laser Scan Plane during analysis */}
      <mesh ref={scanPlaneRef} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.2, 3.2]} />
        <meshBasicMaterial
          color="#00d4ff"
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Vertical Reactor Energy Beam */}
      <mesh position={[0, -1.0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 2.2, 16]} />
        <meshBasicMaterial color={coreColor} transparent opacity={0.45} />
      </mesh>
    </group>
  );
}

