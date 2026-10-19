import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface FloorGridProps {
  activeState?: string;
}

export default function FloorGrid3D({ activeState = 'idle' }: FloorGridProps) {
  const ringRef1 = useRef<THREE.Mesh>(null);
  const ringRef2 = useRef<THREE.Mesh>(null);
  const ringRef3 = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    const speedMultiplier = activeState === 'analyzing' || activeState === 'cleaning' ? 3.0 : 0.8;
    if (ringRef1.current) ringRef1.current.rotation.z += delta * 0.15 * speedMultiplier;
    if (ringRef2.current) ringRef2.current.rotation.z -= delta * 0.22 * speedMultiplier;
    if (ringRef3.current) ringRef3.current.rotation.z += delta * 0.08 * speedMultiplier;
  });

  return (
    <group position={[0, -2.2, 0]}>
      {/* Infinite floor grid */}
      <gridHelper args={[80, 80, '#00d4ff', '#0f172a']} position={[0, 0, 0]} />

      {/* Primary Circular Reactor Dais */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.2, 8.5, 64]} />
        <meshBasicMaterial color="#050a18" transparent opacity={0.85} side={THREE.DoubleSide} />
      </mesh>

      {/* Inner Concentric Gyro Rings on Dais */}
      <mesh ref={ringRef1} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[2.8, 2.85, 48]} />
        <meshBasicMaterial color="#00d4ff" transparent opacity={0.65} />
      </mesh>

      <mesh ref={ringRef2} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[4.8, 4.88, 64]} />
        <meshBasicMaterial color="#4169E1" transparent opacity={0.5} />
      </mesh>

      <mesh ref={ringRef3} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[7.2, 7.3, 64]} />
        <meshBasicMaterial color="#c9a961" transparent opacity={0.4} />
      </mesh>

      {/* Outer Tech Tick Marks */}
      {Array.from({ length: 16 }).map((_, i) => {
        const angle = (i / 16) * Math.PI * 2;
        const x = Math.cos(angle) * 7.6;
        const z = Math.sin(angle) * 7.6;
        return (
          <mesh key={i} position={[x, 0.04, z]} rotation={[0, -angle, 0]}>
            <boxGeometry args={[0.35, 0.02, 0.06]} />
            <meshBasicMaterial color="#00d4ff" />
          </mesh>
        );
      })}
    </group>
  );
}

