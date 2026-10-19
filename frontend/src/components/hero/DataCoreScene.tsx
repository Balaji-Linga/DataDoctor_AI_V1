import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Float } from '@react-three/drei';
import * as THREE from 'three';

export interface DataCoreSceneProps {
  className?: string;
  reducedMotion?: boolean;
}

/**
 * 200 Orbiting data particles uniformly distributed on a sphere surface (radius 2.5)
 * uses deterministic Fibonacci sphere distribution to avoid Math.random() in render.
 */
function OrbitingParticles({ reducedMotion }: { reducedMotion?: boolean }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const particleCount = 200;

  // Single shared geometry and material for 1 draw call, disposed on unmount
  const sphereGeo = useMemo(() => new THREE.SphereGeometry(0.02, 12, 12), []);
  const sphereMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#00d4ff',
        transparent: true,
        opacity: 0.85,
      }),
    []
  );

  useEffect(() => {
    return () => {
      sphereGeo.dispose();
      sphereMat.dispose();
    };
  }, [sphereGeo, sphereMat]);

  // Compute 200 particle positions deterministically on sphere radius ~2.5
  const particles = useMemo(() => {
    const items: Array<{ x: number; y: number; z: number; scale: number }> = [];
    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    const goldenAngle = (2 - goldenRatio) * (2 * Math.PI); // ~2.39996 rad

    for (let i = 0; i < particleCount; i++) {
      // Fibonacci sphere distribution
      const y = 1 - (i / (particleCount - 1)) * 2; // goes from 1 to -1
      const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = goldenAngle * i;

      // Deterministic radial perturbation
      const radialOffset = 2.5 + Math.sin(i * 1.7) * 0.12;
      const x = Math.cos(theta) * radiusAtY * radialOffset;
      const z = Math.sin(theta) * radiusAtY * radialOffset;
      const py = y * radialOffset;

      // Deterministic scale variation
      const scale = 0.8 + 0.45 * Math.abs(Math.sin(i * 3.14));
      items.push({ x, y: py, z, scale });
    }
    return items;
  }, [particleCount]);

  // Apply matrix transforms once on mount / update
  useEffect(() => {
    if (!meshRef.current) return;
    const dummy = new THREE.Object3D();

    particles.forEach((p, i) => {
      dummy.position.set(p.x, p.y, p.z);
      dummy.scale.set(p.scale, p.scale, p.scale);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [particles]);

  // Group rotation animation
  useFrame((_, delta) => {
    if (!reducedMotion && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.18;
      groupRef.current.rotation.x += delta * 0.06;
    }
  });

  return (
    <group ref={groupRef}>
      <instancedMesh
        ref={meshRef}
        args={[sphereGeo, sphereMat, particleCount]}
      />
    </group>
  );
}

/**
 * Central glowing Icosahedron with wireframe material, electric cyan color (#00d4ff)
 * Wrapped in Drei's Float component and slowly rotating.
 */
function CentralCore({ reducedMotion }: { reducedMotion?: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const innerMeshRef = useRef<THREE.Mesh>(null);

  const icosahedronGeo = useMemo(() => new THREE.IcosahedronGeometry(1.2, 1), []);
  const innerGeo = useMemo(() => new THREE.IcosahedronGeometry(0.75, 0), []);

  const wireframeMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#00d4ff',
        wireframe: true,
        emissive: '#00d4ff',
        emissiveIntensity: 0.65,
        transparent: true,
        opacity: 0.85,
        roughness: 0.2,
      }),
    []
  );

  const innerMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#4169E1',
        wireframe: true,
        transparent: true,
        opacity: 0.35,
      }),
    []
  );

  useEffect(() => {
    return () => {
      icosahedronGeo.dispose();
      innerGeo.dispose();
      wireframeMat.dispose();
      innerMat.dispose();
    };
  }, [icosahedronGeo, innerGeo, wireframeMat, innerMat]);

  useFrame((_, delta) => {
    if (!reducedMotion) {
      if (meshRef.current) {
        meshRef.current.rotation.x += delta * 0.12;
        meshRef.current.rotation.y += delta * 0.22;
        meshRef.current.rotation.z += delta * 0.05;
      }
      if (innerMeshRef.current) {
        innerMeshRef.current.rotation.x -= delta * 0.18;
        innerMeshRef.current.rotation.y -= delta * 0.15;
      }
    }
  });

  return (
    <Float
      speed={reducedMotion ? 0 : 1.5}
      rotationIntensity={reducedMotion ? 0 : 0.3}
      floatIntensity={reducedMotion ? 0 : 0.4}
    >
      <group>
        <mesh
          ref={meshRef}
          geometry={icosahedronGeo}
          material={wireframeMat}
        />
        <mesh
          ref={innerMeshRef}
          geometry={innerGeo}
          material={innerMat}
        />
      </group>
    </Float>
  );
}

/**
 * GridHelper at y=-2 with 20x20 subdivisions and dark colors (#111133, #0a0a22)
 */
function GroundGrid() {
  const gridHelper = useMemo(() => {
    const grid = new THREE.GridHelper(20, 20, 0x111133, 0x0a0a22);
    // Subtle opacity for modern ethereal look
    if (Array.isArray(grid.material)) {
      grid.material.forEach((mat) => {
        mat.transparent = true;
        mat.opacity = 0.4;
      });
    } else {
      grid.material.transparent = true;
      grid.material.opacity = 0.4;
    }
    return grid;
  }, []);

  useEffect(() => {
    return () => {
      gridHelper.dispose();
    };
  }, [gridHelper]);

  return <primitive object={gridHelper} position={[0, -2, 0]} />;
}

/**
 * Scene container handling mouse parallax:
 * tracks pointer position via useThree().pointer and tilts the entire scene group
 * slightly toward pointer (lerp factor 0.05).
 */
function ParallaxScene({ reducedMotion }: { reducedMotion?: boolean }) {
  const sceneGroupRef = useRef<THREE.Group>(null);
  const { pointer } = useThree();

  useFrame(() => {
    if (!sceneGroupRef.current) return;

    if (reducedMotion) {
      sceneGroupRef.current.rotation.x = 0;
      sceneGroupRef.current.rotation.y = 0;
      return;
    }

    // Pointer ranges from [-1, 1]. Tilt slightly toward mouse pointer.
    const targetRotX = -pointer.y * 0.18;
    const targetRotY = pointer.x * 0.22;

    sceneGroupRef.current.rotation.x = THREE.MathUtils.lerp(
      sceneGroupRef.current.rotation.x,
      targetRotX,
      0.05
    );
    sceneGroupRef.current.rotation.y = THREE.MathUtils.lerp(
      sceneGroupRef.current.rotation.y,
      targetRotY,
      0.05
    );
  });

  return (
    <group ref={sceneGroupRef}>
      <CentralCore reducedMotion={reducedMotion} />
      <OrbitingParticles reducedMotion={reducedMotion} />
    </group>
  );
}

export default function DataCoreScene({
  className = '',
  reducedMotion = false,
}: DataCoreSceneProps) {
  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        style={{ background: 'transparent' }}
      >
        {/* Subtle ambient light + electric cyan point light */}
        <ambientLight intensity={0.3} />
        <pointLight position={[5, 5, 5]} color="#00d4ff" intensity={1.5} />
        <pointLight position={[-5, -4, -3]} color="#4169E1" intensity={0.7} />

        {/* OrbitControls: zoom/pan disabled, slow auto-rotate with damping */}
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate={!reducedMotion}
          autoRotateSpeed={0.3}
          dampingFactor={0.05}
        />

        {/* Mouse parallax scene group with Central Core and Orbiting Particles */}
        <ParallaxScene reducedMotion={reducedMotion} />

        {/* Dark ground grid helper */}
        <GroundGrid />
      </Canvas>
    </div>
  );
}
