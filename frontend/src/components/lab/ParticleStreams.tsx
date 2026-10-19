import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ParticleStreamsProps {
  machineState: string;
}

export default function ParticleStreams({ machineState }: ParticleStreamsProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 350;

  // Generate deterministic particle cloud without Math.random in render
  const [positions, initialAngles, radii, speeds] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const angles = new Float32Array(count);
    const rads = new Float32Array(count);
    const spds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 8;
      const radius = 1.8 + (i % 30) * 0.22;
      const y = ((i % 50) - 25) * 0.15;

      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = Math.sin(angle) * radius;

      angles[i] = angle;
      rads[i] = radius;
      spds[i] = 0.2 + (i % 5) * 0.15;
    }

    return [pos, angles, rads, spds];
  }, [count]);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const time = state.clock.getElapsedTime();

    const isSpooling = machineState === 'analyzing' || machineState === 'cleaning';
    const speedMult = isSpooling ? 3.5 : 1.0;

    for (let i = 0; i < count; i++) {
      const curAngle = initialAngles[i] + time * speeds[i] * speedMult;
      let r = radii[i];
      let y = positions[i * 3 + 1];

      if (machineState === 'analyzing') {
        // Vortex suction effect: spiral inward and cycle back out
        r = 0.5 + ((radii[i] + time * 2) % 6.0);
        y += Math.sin(time * 3 + i) * 0.05;
      } else {
        // Gentle ambient floating
        y += Math.sin(time + i * 0.5) * delta * 0.2;
      }

      posAttr.setXYZ(i, Math.cos(curAngle) * r, y, Math.sin(curAngle) * r);
    }
    posAttr.needsUpdate = true;
  });

  const particleColor = machineState === 'cleaning'
    ? '#22c55e'
    : machineState === 'analyzing'
    ? '#c9a961'
    : '#00d4ff';

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.065}
        color={particleColor}
        transparent
        opacity={0.75}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
