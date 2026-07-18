"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshDistortMaterial, Float } from "@react-three/drei";
import * as THREE from "three";

export type OrbMood = "idle" | "ripple" | "approve" | "skip" | "executing";

/**
 * Donna's presence — a polished brass sphere, like the one desk ornament in
 * a corner office nobody dares touch. It breathes, and molten ripples run
 * across the metal when she's working. 3D is ambiance, never navigation.
 * Performance: capped particle count, DPR clamp, low-power GL context.
 */

function OrbCore({ mood }: { mood: OrbMood }) {
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useRef<any>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (!mesh.current || !mat.current) return;
    // breathing pulse
    const base = 1 + Math.sin(t * 0.8) * 0.045;
    const boost =
      mood === "approve" ? 1.08 : mood === "ripple" ? 1.05 : mood === "skip" ? 0.96 : 1;
    mesh.current.scale.setScalar(base * boost);
    // tumble on two axes — the moving highlight is what sells the rotation
    mesh.current.rotation.y = t * 0.25;
    mesh.current.rotation.x = Math.sin(t * 0.3) * 0.15;
    // molten energy by mood — always visibly liquid, surging when executing
    const target =
      mood === "executing" ? 0.5 : mood === "ripple" ? 0.42 : mood === "approve" ? 0.44 : 0.32;
    mat.current.distort = THREE.MathUtils.lerp(mat.current.distort ?? 0.32, target, 0.05);
  });

  const color = mood === "skip" ? "#6d6653" : mood === "approve" ? "#e6c87f" : "#c2a25b";

  return (
    <Float speed={1.6} rotationIntensity={0.45} floatIntensity={0.9}>
      <mesh ref={mesh}>
        <icosahedronGeometry args={[1, 48]} />
        <MeshDistortMaterial
          ref={mat}
          color={color}
          emissive={"#8a4b1f"}
          emissiveIntensity={mood === "executing" ? 0.45 : 0.18}
          roughness={0.22}
          metalness={0.95}
          distort={0.32}
          speed={mood === "executing" ? 4 : 2.2}
        />
      </mesh>
    </Float>
  );
}

/** Motes of gold dust drifting in the lamplight. */
function Particles({ count = 110 }: { count?: number }) {
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
      <pointsMaterial size={0.018} color="#e6c87f" transparent opacity={0.5} sizeAttenuation />
    </points>
  );
}

/** Brass ring the sphere spins inside while executing. */
function ExecRing({ visible }: { visible: boolean }) {
  const ring = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ring.current) {
      ring.current.rotation.z = clock.getElapsedTime() * 0.8;
      const targetOpacity = visible ? 0.7 : 0;
      const m = ring.current.material as THREE.MeshBasicMaterial;
      m.opacity = THREE.MathUtils.lerp(m.opacity, targetOpacity, 0.08);
    }
  });
  return (
    <mesh ref={ring} rotation={[Math.PI / 2.3, 0, 0]}>
      <torusGeometry args={[1.5, 0.008, 8, 96]} />
      <meshBasicMaterial color="#e6c87f" transparent opacity={0} />
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
        {/* Warm key like a banker's lamp, cool green fill from the room */}
        <ambientLight intensity={0.35} color="#f5e5c0" />
        <directionalLight position={[3, 4, 5]} intensity={1.6} color="#ffe9bd" />
        <pointLight position={[-3, -2, -3]} intensity={0.5} color="#3d5c4d" />
        <OrbCore mood={mood} />
        <Particles />
        <ExecRing visible={mood === "executing"} />
      </Canvas>
    </div>
  );
}
