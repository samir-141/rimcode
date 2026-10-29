"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { technologies } from "@/data/technologies";

export function TechGlobe() {
  const globeMeshRef = useRef<THREE.Mesh>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const materialRef = useRef<THREE.LineBasicMaterial>(null);

  // Compute connection lines between adjacent technology nodes (distance < 2.5)
  const linePositions = useMemo(() => {
    const points: number[] = [];
    for (let i = 0; i < technologies.length; i++) {
      for (let j = i + 1; j < technologies.length; j++) {
        const p1 = new THREE.Vector3(...technologies[i].position);
        const p2 = new THREE.Vector3(...technologies[j].position);
        if (p1.distanceTo(p2) < 2.5) {
          points.push(p1.x, p1.y, p1.z);
          points.push(p2.x, p2.y, p2.z);
        }
      }
    }
    return new Float32Array(points);
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (materialRef.current) {
      // Subtle rhythmic data pulse along connection lines
      materialRef.current.opacity = 0.22 + Math.sin(t * 2.5) * 0.1;
    }
  });

  return (
    <group>
      {/* Central dark core globe with subtle cyber wireframe */}
      <mesh ref={globeMeshRef}>
        <sphereGeometry args={[1.7, 32, 32]} />
        <meshStandardMaterial
          color="#060c1c"
          roughness={0.7}
          metalness={0.3}
          wireframe
          transparent
          opacity={0.16}
        />
      </mesh>

      {/* Internal ambient glowing shell */}
      <mesh>
        <sphereGeometry args={[1.66, 24, 24]} />
        <meshBasicMaterial
          color="#020617"
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Dynamic pulsating connection lines between nodes */}
      {linePositions.length > 0 && (
        <lineSegments ref={linesRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[linePositions, 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial
            ref={materialRef}
            color="#00f0ff"
            transparent
            opacity={0.25}
            blending={THREE.AdditiveBlending}
          />
        </lineSegments>
      )}
    </group>
  );
}
