import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';

export type LabChamber =
  | 'core'
  | 'matrix'
  | 'mountain'
  | 'scatter'
  | 'correlation'
  | 'cleaning';

interface CameraControllerProps {
  chamber: LabChamber;
  enableFreeLook?: boolean;
}

const CHAMBER_PRESETS: Record<
  LabChamber,
  { pos: [number, number, number]; target: [number, number, number]; fov: number }
> = {
  core: { pos: [0, 3.2, 7.2], target: [0, 0.4, 0], fov: 46 },
  matrix: { pos: [0, 7.5, 6.2], target: [0, -0.5, 0], fov: 44 },
  mountain: { pos: [6.8, 6.5, 7.2], target: [0, 0, 0], fov: 45 },
  scatter: { pos: [7.5, 5.8, 8.2], target: [0, 0, 0], fov: 48 },
  correlation: { pos: [0, 8.5, 5.0], target: [0, 0, 0], fov: 42 },
  cleaning: { pos: [0, 6.0, 6.8], target: [0, 0, 0], fov: 44 },
};

export default function CameraController({
  chamber,
  enableFreeLook = false,
}: CameraControllerProps) {
  const { camera } = useThree();
  const currentTarget = useRef(new THREE.Vector3(0, 0.4, 0));

  useEffect(() => {
    if (enableFreeLook) return;

    const preset = CHAMBER_PRESETS[chamber] || CHAMBER_PRESETS.core;
    const targetVec = new THREE.Vector3(...preset.target);

    // Animate camera position
    gsap.to(camera.position, {
      x: preset.pos[0],
      y: preset.pos[1],
      z: preset.pos[2],
      duration: 1.2,
      ease: 'power3.inOut',
    });

    // Animate camera lookAt target
    gsap.to(currentTarget.current, {
      x: targetVec.x,
      y: targetVec.y,
      z: targetVec.z,
      duration: 1.2,
      ease: 'power3.inOut',
    });

    if ('fov' in camera && typeof (camera as THREE.PerspectiveCamera).fov === 'number') {
      const pCam = camera as THREE.PerspectiveCamera;
      gsap.to(pCam, {
        fov: preset.fov,
        duration: 1.2,
        ease: 'power3.inOut',
        onUpdate: () => pCam.updateProjectionMatrix(),
      });
    }
  }, [chamber, camera, enableFreeLook]);

  useFrame(() => {
    if (!enableFreeLook) {
      camera.lookAt(currentTarget.current);
    }
  });

  return null;
}

