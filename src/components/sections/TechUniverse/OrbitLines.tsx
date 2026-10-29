"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function OrbitLines() {
  const ring1 = useRef<THREE.Mesh>(null);
  const ring2 = useRef<THREE.Mesh>(null);
  const ring3 = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (ring1.current) {
      ring1.current.rotation.x += delta * 0.12;
      ring1.current.rotation.y += delta * 0.08;
    }
    if (ring2.current) {
      ring2.current.rotation.y -= delta * 0.1;
      ring2.current.rotation.z += delta * 0.06;
    }
    if (ring3.current) {
      ring3.current.rotation.x -= delta * 0.07;
      ring3.current.rotation.z -= delta * 0.11;
    }
  });

  return (
    <group>
      {/* Orbit ring 1 */}
      <mesh ref={ring1} rotation={[0.4, 0.2, 0]}>
        <torusGeometry args={[2.55, 0.008, 16, 80]} />
        <meshBasicMaterial
          color="#00f0ff"
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Orbit ring 2 */}
      <mesh ref={ring2} rotation={[-0.5, 0.4, 0.3]}>
        <torusGeometry args={[2.7, 0.007, 16, 80]} />
        <meshBasicMaterial
          color="#8b5cf6"
          transparent
          opacity={0.25}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Orbit ring 3 */}
      <mesh ref={ring3} rotation={[0.8, -0.6, 0.4]}>
        <torusGeometry args={[2.9, 0.006, 16, 80]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.2}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

