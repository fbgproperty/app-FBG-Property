import React, { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { DEPTS, HERMES, Dept } from './roster';

type Sel = { name: string; role: string; route: string };

const layout = (center: [number, number], count: number): [number, number, number][] => {
  const [cx, cz] = center; const cols = 5, gap = 1.05;
  return Array.from({ length: count }, (_, i) => {
    const r = Math.floor(i / cols), c = i % cols;
    return [cx + (c - (cols - 1) / 2) * gap, 0, cz + (r - 0.5) * 1.25];
  });
};

const Avatar: React.FC<{ pos: [number, number, number]; color: string; name: string; role: string; route: string; phase: number; working: boolean; onSelect: (s: Sel) => void }>
  = ({ pos, color, name, role, route, phase, working, onSelect }) => {
  const g = useRef<THREE.Group>(null);
  const [hover, setHover] = useState(false);
  useFrame((state) => {
    if (!g.current) return;
    const t = state.clock.elapsedTime;
    g.current.position.y = working ? Math.abs(Math.sin(t * 2 + phase)) * 0.08 : 0;
    g.current.rotation.y = Math.sin(t * 0.5 + phase) * 0.25;
  });
  return (
    <group position={pos}>
      <group
        ref={g}
        onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHover(false); document.body.style.cursor = 'auto'; }}
        onClick={(e) => { e.stopPropagation(); onSelect({ name, role, route }); }}
      >
        <mesh position={[0, 0.32, 0]} castShadow>
          <cylinderGeometry args={[0.2, 0.26, 0.5, 12]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={hover ? 0.5 : 0.12} />
        </mesh>
        <mesh position={[0, 0.72, 0]} castShadow>
          <sphereGeometry args={[0.17, 16, 16]} />
          <meshStandardMaterial color={'#f8e6d4'} />
        </mesh>
        {working && <mesh position={[0, 1.0, 0]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color={'#22c55e'} emissive={'#22c55e'} emissiveIntensity={1.2} />
        </mesh>}
      </group>
      {hover && (
        <Html center distanceFactor={11} position={[0, 1.35, 0]} zIndexRange={[40, 0]}>
          <div style={{ background: '#0f172a', color: '#fff', padding: '4px 9px', borderRadius: 9, fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap', boxShadow: '0 4px 14px rgba(0,0,0,.3)' }}>
            {name}<span style={{ opacity: .6, fontWeight: 600 }}> · {role}</span>
          </div>
        </Html>
      )}
    </group>
  );
};

const Desk: React.FC<{ pos: [number, number, number]; color: string }> = ({ pos, color }) => (
  <mesh position={[pos[0], 0.12, pos[2] + 0.55]} castShadow receiveShadow>
    <boxGeometry args={[0.7, 0.24, 0.45]} />
    <meshStandardMaterial color={color} opacity={0.55} transparent />
  </mesh>
);

const Zone: React.FC<{ d: Dept; onSelect: (s: Sel) => void }> = ({ d, onSelect }) => (
  <mesh position={[d.center[0], 0.02, d.center[1]]} rotation={[-Math.PI / 2, 0, 0]}
    onClick={(e) => { e.stopPropagation(); onSelect({ name: d.label, role: 'Mở phòng ' + d.label, route: d.route }); }}>
    <planeGeometry args={[6, 4]} />
    <meshStandardMaterial color={d.zone} opacity={0.13} transparent />
  </mesh>
);

const Hermes: React.FC<{ onSelect: (s: Sel) => void }> = ({ onSelect }) => {
  const ring = useRef<THREE.Mesh>(null);
  const [hover, setHover] = useState(false);
  useFrame((s) => { if (ring.current) ring.current.rotation.z = s.clock.elapsedTime * 0.8; });
  return (
    <group position={[0, 0, 0]}
      onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHover(false); document.body.style.cursor = 'auto'; }}
      onClick={(e) => { e.stopPropagation(); onSelect({ name: HERMES.n, role: HERMES.r, route: HERMES.route }); }}>
      <mesh position={[0, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.34, 0.7, 16]} />
        <meshStandardMaterial color={HERMES.color} emissive={HERMES.color} emissiveIntensity={hover ? 0.7 : 0.35} />
      </mesh>
      <mesh position={[0, 1.0, 0]} castShadow>
        <sphereGeometry args={[0.23, 20, 20]} />
        <meshStandardMaterial color={'#f8e6d4'} />
      </mesh>
      <mesh ref={ring} position={[0, 1.0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.45, 0.03, 8, 40]} />
        <meshStandardMaterial color={HERMES.color} emissive={HERMES.color} emissiveIntensity={1} />
      </mesh>
      <Html center distanceFactor={12} position={[0, 1.55, 0]} zIndexRange={[30, 0]}>
        <div style={{ background: HERMES.color, color: '#fff', padding: '3px 12px', borderRadius: 999, fontSize: 12, fontWeight: 900, whiteSpace: 'nowrap', boxShadow: '0 4px 14px rgba(124,58,237,.5)' }}>☤ HERMES</div>
      </Html>
    </group>
  );
};

const DeptLabel: React.FC<{ d: Dept }> = ({ d }) => (
  <Html center distanceFactor={14} position={[d.center[0], 0.05, d.center[1] + 2.4]} zIndexRange={[20, 0]}>
    <div style={{ background: '#fff', color: d.color, padding: '3px 10px', borderRadius: 8, fontSize: 12, fontWeight: 900, whiteSpace: 'nowrap', border: `1px solid ${d.color}33`, boxShadow: '0 2px 8px rgba(0,0,0,.08)' }}>{d.label} · 10 AI</div>
  </Html>
);

const Scene: React.FC<{ onSelect: (s: Sel) => void }> = ({ onSelect }) => {
  const positions = useMemo(() => DEPTS.map(d => layout(d.center, d.agents.length)), []);
  return (
    <>
      <ambientLight intensity={0.75} />
      <directionalLight position={[6, 10, 6]} intensity={1.1} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-6, 6, -4]} intensity={0.4} color={'#a5b4fc'} />
      {/* sàn */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -1]} receiveShadow>
        <planeGeometry args={[26, 22]} />
        <meshStandardMaterial color={'#eef2f7'} />
      </mesh>
      <ContactShadows position={[0, 0.01, -1]} opacity={0.32} scale={24} blur={2.4} far={6} />
      {DEPTS.map((d, di) => (
        <group key={d.key}>
          <Zone d={d} onSelect={onSelect} />
          <DeptLabel d={d} />
          {d.agents.map((a, i) => (
            <group key={a.n + i}>
              <Desk pos={positions[di][i]} color={d.color} />
              <Avatar pos={positions[di][i]} color={d.color} name={a.n} role={a.r} route={d.route}
                phase={(di * 10 + i) * 1.7} working={i % 4 !== 0} onSelect={onSelect} />
            </group>
          ))}
        </group>
      ))}
      <Hermes onSelect={onSelect} />
      <OrbitControls makeDefault enablePan={false} target={[0, 0.5, -1]}
        minDistance={9} maxDistance={22} minPolarAngle={0.35} maxPolarAngle={Math.PI / 2.35}
        autoRotate autoRotateSpeed={0.35} />
    </>
  );
};

const Office3D: React.FC<{ onSelect: (s: Sel) => void }> = ({ onSelect }) => (
  <Canvas shadows dpr={[1, 1.8]} camera={{ position: [10, 9, 12], fov: 36 }} style={{ background: 'transparent' }}>
    <Scene onSelect={onSelect} />
  </Canvas>
);

export default Office3D;
