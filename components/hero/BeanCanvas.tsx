"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * 프로시저럴 원두 (DESIGN_DIRECTION §3).
 * GLB 소싱 대신 타원체 변형 채택 — 외부 에셋 의존 없이 번들에 지오메트리 코드만 실림.
 * 품질이 기준 미달로 판정되면 스프라이트 시퀀스 대안 경로로 전환한다.
 */
const ROTATION_PERIOD_S = 14; // 1회전/14초 — 빠르면 싸 보인다
const PARALLAX_RAD = (6 * Math.PI) / 180; // 포인터 ±6°
const BASE_TILT_Z = 0.32;
/** 포스터/정지 포즈 — 센터컷이 살짝 돌아간 각도 */
const FROZEN_POSE: [number, number, number] = [-0.12, -0.55, BASE_TILT_Z];

function makeBeanGeometry(): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(1, 160, 160);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);
    // 타원체: 세로로 긴 원두 (y = 장축)
    x *= 0.68;
    y *= 1.0;
    z *= 0.56;
    // 센터컷: 앞면(z+)에 장축 방향 골 — 끝으로 갈수록 얕아진다
    if (z > 0) {
      const groove =
        Math.exp(-((x / 0.15) ** 2)) * Math.exp(-((y / 0.78) ** 2) * 0.7);
      z -= 0.4 * groove * (z / 0.56);
    }
    // 뒷면은 살짝 더 볼록하게 (원두 단면 비대칭)
    if (z < 0) z *= 1.12;
    pos.setXYZ(i, x, y, z);
  }
  geo.computeVertexNormals();
  return geo;
}

function Bean({ frozen }: { frozen: boolean }) {
  const group = useRef<THREE.Group>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const geometry = useMemo(makeBeanGeometry, []);

  useFrame((state, delta) => {
    if (frozen || !group.current) return;
    group.current.rotation.y += (delta * Math.PI * 2) / ROTATION_PERIOD_S;
    // 포인터 미세 패럴랙스 (lerp로 부드럽게)
    pointer.current.x = THREE.MathUtils.lerp(
      pointer.current.x,
      state.pointer.x * PARALLAX_RAD,
      0.05,
    );
    pointer.current.y = THREE.MathUtils.lerp(
      pointer.current.y,
      state.pointer.y * PARALLAX_RAD,
      0.05,
    );
    group.current.rotation.z = BASE_TILT_Z + pointer.current.x;
    group.current.rotation.x = -pointer.current.y;
  });

  return (
    <group ref={group} rotation={frozen ? FROZEN_POSE : [0, -0.55, BASE_TILT_Z]}>
      <mesh geometry={geometry}>
        {/* 로스팅 원두 반광 표면: roughness ~0.4 (DESIGN_DIRECTION §3) */}
        <meshStandardMaterial color="#5a3a22" roughness={0.38} metalness={0.1} />
      </mesh>
    </group>
  );
}

export default function BeanCanvas({ frozen = false }: { frozen?: boolean }) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 3.7], fov: 35 }}
      gl={{ alpha: true, antialias: true }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.3} color="#f1e7db" />
      {/* 상단 soft key light */}
      <directionalLight position={[2.5, 4, 3]} intensity={2.6} color="#fff3e2" />
      {/* 앰버 rim light (좌하단 뒤) */}
      <directionalLight position={[-3.5, -1, -2.5]} intensity={5} color="#d98e32" />
      {/* 오른쪽 미세 보조 rim */}
      <directionalLight position={[4, 0.5, -3]} intensity={1.6} color="#d98e32" />
      <Bean frozen={frozen} />
    </Canvas>
  );
}
