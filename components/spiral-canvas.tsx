"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

export type SpiralMode = 1 | 2 | 3;

/** Prominence presets. The spiral renders behind the content and glows through. */
const MODES: Record<SpiralMode, { bloom: { s: number; r: number }; bright: number }> = {
  1: { bloom: { s: 0.9, r: 0.7 }, bright: 0.62 }, // subtle accent
  2: { bloom: { s: 1.25, r: 0.82 }, bright: 0.8 }, // bold (kept off the white-clip knee so text reads)
  3: { bloom: { s: 1.6, r: 0.9 }, bright: 1.05 }, // max
};

const LENGTH = 4800;
const TOP_Y = 260; // where the top of the helix sits at scroll 0
const RADIUS = 158;
const SWAY = 245;
const COILS = 13;
const RADIAL = 12;
const TUBULAR = 1100;

const C_A = new THREE.Color("#a78bfa");
const C_B = new THREE.Color("#6366f1");
const C_C = new THREE.Color("#38bdf8");

// A flowing double-helix that descends the page (behind the content). Two strands
// at opposite phases intertwine; the group translates on scroll so you travel down it.
function buildStrand(phase: number, tubeRadius: number) {
  const N = 900;
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const ang = u * COILS * Math.PI * 2 + phase;
    const r = RADIUS * (0.7 + 0.5 * Math.sin(u * Math.PI * 2.2));
    const cx = Math.sin(u * Math.PI * 1.8) * SWAY + Math.sin(u * Math.PI * 7) * 18;
    const cz = Math.cos(u * Math.PI * 1.3) * 60;
    pts.push(new THREE.Vector3(cx + Math.cos(ang) * r, TOP_Y - u * LENGTH, cz + Math.sin(ang) * r));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const geo = new THREE.TubeGeometry(curve, TUBULAR, tubeRadius, RADIAL, false);
  return { geo, curve };
}

function h01(n: number): number {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

function makeUniforms() {
  return {
    uTime: { value: 0 },
    uHead: { value: 0 },
    uBright: { value: 1 },
    cA: { value: C_A.clone() },
    cB: { value: C_B.clone() },
    cC: { value: C_C.clone() },
  };
}

const VERT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vN;
  varying vec3 vView;
  void main() {
    vUv = uv;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vN = normalize(mat3(modelMatrix) * normal);
    vView = normalize(cameraPosition - wp.xyz);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

// Flowing-energy: gradient along the tube + streaming pulses + a fresnel rim + a
// comet around the scroll head. HDR (values > 1) so bloom lights it up.
const FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uHead;
  uniform float uBright;
  uniform vec3 cA, cB, cC;
  varying vec2 vUv;
  varying vec3 vN;
  varying vec3 vView;
  vec3 grad(float t){ return t < 0.52 ? mix(cA, cB, t/0.52) : mix(cB, cC, (t-0.52)/0.48); }
  void main(){
    float t = vUv.x;
    vec3 base = grad(t);
    float f = fract(t * 7.0 - uTime * 0.22);
    float pulse = smoothstep(0.0, 0.12, f) * smoothstep(0.55, 0.12, f);
    float head = smoothstep(0.06, 0.0, abs(t - uHead));
    float fres = pow(1.0 - max(dot(normalize(vN), normalize(vView)), 0.0), 2.0);
    // Lower peaks (less blown-out white) so it stays a rich coloured glow text can sit over.
    float bright = (0.6 + 2.2 * pulse + 1.15 * fres + 2.6 * head) * uBright;
    gl_FragColor = vec4(base * bright, 0.84);
  }
`;

function Strands({ scrollRef, bright }: { scrollRef: { current: number }; bright: number }) {
  const group = useRef<THREE.Group>(null);
  const headA = useRef<THREE.Mesh>(null);
  const headB = useRef<THREE.Mesh>(null);
  const matA = useRef<THREE.ShaderMaterial>(null);
  const matB = useRef<THREE.ShaderMaterial>(null);

  const a = useMemo(() => buildStrand(0, 3.2), []);
  const b = useMemo(() => buildStrand(Math.PI, 3.2), []);
  const uniA = useMemo(() => makeUniforms(), []);
  const uniB = useMemo(() => makeUniforms(), []);
  const scratch = useMemo(() => new THREE.Vector3(), []);

  const particles = useMemo(() => {
    const COUNT = 1700;
    const pos = new Float32Array(COUNT * 3);
    const col = new Float32Array(COUNT * 3);
    const tmp = new THREE.Color();
    const v = new THREE.Vector3();
    for (let i = 0; i < COUNT; i++) {
      const t = h01(i * 1.73);
      a.curve.getPointAt(t, v);
      pos[i * 3] = v.x + (h01(i * 2.31) - 0.5) * 120;
      pos[i * 3 + 1] = v.y + (h01(i * 3.19) - 0.5) * 80;
      pos[i * 3 + 2] = v.z + (h01(i * 4.07) - 0.5) * 120;
      tmp.copy(t < 0.5 ? C_A : C_B).lerp(C_C, t);
      col[i * 3] = tmp.r * 1.8;
      col[i * 3 + 1] = tmp.g * 1.8;
      col[i * 3 + 2] = tmp.b * 1.8;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return g;
  }, [a.curve]);

  useFrame((state) => {
    const p = scrollRef.current;
    const tt = state.clock.elapsedTime;
    const g = group.current;
    if (g) {
      g.position.y = Math.pow(p, 1.35) * LENGTH; // travel down it as you scroll
      const s = 1 + 0.18 * Math.sin(p * Math.PI * 6);
      g.scale.x = s;
      g.scale.z = s;
      g.position.x = Math.sin(tt * 0.22) * 16;
    }
    for (const m of [matA.current, matB.current]) {
      if (!m) continue;
      m.uniforms.uTime.value = tt;
      m.uniforms.uHead.value = p;
      m.uniforms.uBright.value = bright;
    }
    const clamp = Math.min(Math.max(p, 0.001), 0.999);
    if (headA.current) headA.current.position.copy(a.curve.getPointAt(clamp, scratch));
    if (headB.current) headB.current.position.copy(b.curve.getPointAt(clamp, scratch));
  });

  return (
    <group ref={group}>
      <mesh geometry={a.geo}>
        <shaderMaterial ref={matA} uniforms={uniA} vertexShader={VERT} fragmentShader={FRAG} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh geometry={b.geo}>
        <shaderMaterial ref={matB} uniforms={uniB} vertexShader={VERT} fragmentShader={FRAG} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <points geometry={particles}>
        <pointsMaterial size={2.6} sizeAttenuation vertexColors toneMapped={false} transparent opacity={0.85} blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>
      <mesh ref={headA}>
        <sphereGeometry args={[9, 24, 24]} />
        <meshBasicMaterial color={[5, 4.5, 7]} toneMapped={false} />
      </mesh>
      <mesh ref={headB}>
        <sphereGeometry args={[7, 24, 24]} />
        <meshBasicMaterial color={[2.5, 5.5, 7]} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Bloom({ strength, radius, threshold }: { strength: number; radius: number; threshold: number }) {
  const { gl, scene, camera, size } = useThree();
  const composer = useMemo(() => {
    const c = new EffectComposer(gl);
    c.addPass(new RenderPass(scene, camera));
    c.addPass(new UnrealBloomPass(new THREE.Vector2(size.width, size.height), strength, radius, threshold));
    c.addPass(new OutputPass());
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, scene, camera, strength, radius]);
  useEffect(() => composer.setSize(size.width, size.height), [composer, size]);
  // Free the composer's render targets when it is replaced / unmounted.
  useEffect(() => {
    return () => {
      for (const pass of composer.passes) {
        (pass as { dispose?: () => void }).dispose?.();
      }
      composer.dispose();
    };
  }, [composer]);
  useFrame(() => composer.render(), 1);
  return null;
}

export default function SpiralCanvas({ mode = 2 }: { mode?: SpiralMode }) {
  const scrollRef = useRef(0);
  const cfg = MODES[mode];

  useEffect(() => {
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      scrollRef.current = max > 0 ? window.scrollY / max : 0;
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <Canvas
      camera={{ position: [0, 0, 540], fov: 56 }}
      dpr={[1, 1.6]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      style={{ width: "100%", height: "100%" }}
    >
      <color attach="background" args={["#08080d"]} />
      <Strands scrollRef={scrollRef} bright={cfg.bright} />
      <Bloom strength={cfg.bloom.s} radius={cfg.bloom.r} threshold={0.0} />
    </Canvas>
  );
}
