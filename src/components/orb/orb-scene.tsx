"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshDistortMaterial, Float } from "@react-three/drei";
import * as THREE from "three";

export type OrbMood = "idle" | "ripple" | "approve" | "skip" | "executing";

/**
 * The orb — Donna's living presence. Distorted sphere with fresnel-ish
 * rim glow and soft particles. 3D is ambiance, never navigation.
 * Performance: capped particle count, DPR clamp, demand frameloop
 * handled by parent visibility.
 */

function OrbCore({ mood }: { mood: OrbMood }) {
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useRef<any>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (!mesh.current || !mat.current) return;
    // breathing pulse
    const base = 1 + Math.sin(t * 0.8) * 0.03;
    const boost =
      mood === "approve" ? 1.08 : mood === "ripple" ? 1.05 : mood === "skip" ? 0.96 : 1;
    mesh.current.scale.setScalar(base * boost);
    mesh.current.rotation.y = t * 0.12;
    // distortion energy by mood
    const target =
      mood === "executing" ? 0.55 : mood === "ripple" ? 0.48 : mood === "approve" ? 0.5 : 0.35;
    mat.current.distort = THREE.MathUtils.lerp(mat.current.distort ?? 0.35, target, 0.05);
  });

  const color = mood === "approve" ? "#8f7bff" : mood === "skip" ? "#9aa0b0" : "#7c6aea";

  return (
    <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.4}>
      <mesh ref={mesh}>
        <icosahedronGeometry args={[1, 48]} />
        <MeshDistortMaterial
          ref={mat}
          color={color}
          emissive={"#3ec6c0"}
          emissiveIntensity={mood === "executing" ? 0.5 : 0.25}
          roughness={0.15}
          metalness={0.4}
          distort={0.35}
          speed={mood === "executing" ? 4 : 1.6}
        />
      </mesh>
    </Float>
  );
}

function Particles({ count = 120 }: { count?: number }) {
  const points = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 1.6 + Math.random() * 1.2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, [count]);

  useFrame(({ clock }) => {
    if (points.current) points.current.rotation.y = clock.getElapsedTime() * 0.03;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.02} color="#7c6aea" transparent opacity={0.45} sizeAttenuation />
    </points>
  );
}

/** Ring the orb orbits while executing. */
function ExecRing({ visible }: { visible: boolean }) {
  const ring = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ring.current) {
      ring.current.rotation.z = clock.getElapsedTime() * 0.8;
      const targetOpacity = visible ? 0.6 : 0;
      const m = ring.current.material as THREE.MeshBasicMaterial;
      m.opacity = THREE.MathUtils.lerp(m.opacity, targetOpacity, 0.08);
    }
  });
  return (
    <mesh ref={ring} rotation={[Math.PI / 2.3, 0, 0]}>
      <torusGeometry args={[1.5, 0.008, 8, 96]} />
      <meshBasicMaterial color="#3ec6c0" transparent opacity={0} />
    </mesh>
  );
}

export default function OrbScene({
  mood = "idle",
  size = 280,
}: {
  mood?: OrbMood;
  size?: number;
}) {
  return (
    <div style={{ width: size, height: size }} aria-hidden>
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 0, 3.4], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 4, 5]} intensity={1.1} />
        <pointLight position={[-3, -2, -3]} intensity={0.4} color="#3ec6c0" />
        <OrbCore mood={mood} />
        <Particles />
        <ExecRing visible={mood === "executing"} />
      </Canvas>
    </div>
  );
}
