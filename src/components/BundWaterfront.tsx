import { useMemo, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { Group, Texture } from 'three';
import { Block, Lamp } from './CityModels';
import { CitySurface } from './CitySurfaces';

const railingPosts = [-11.7, -10.2, -8.7, -7.2, -5.7, -4.2, -2.7, -1.2, .3, 3.5, 5, 6.5, 8, 9.5, 11, 12];

function WaterGlints({ night, reducedMotion }: { night: boolean; reducedMotion: boolean }) {
  const uniforms = useMemo(() => ({ time: { value: 0 }, afterDark: { value: 0 } }), []);
  useFrame(({ clock }) => {
    uniforms.time.value = reducedMotion ? 0 : clock.elapsedTime;
    uniforms.afterDark.value = night ? 1 : 0;
  });
  return <mesh position={[12.55, .108, 0]} rotation={[-Math.PI / 2, 0, 0]}>
    <planeGeometry args={[5.9, 24.3]} />
    <shaderMaterial uniforms={uniforms} transparent depthWrite={false} toneMapped={false}
      vertexShader={
        'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }'
      }
      fragmentShader={/* glsl */`
        uniform float time;
        uniform float afterDark;
        varying vec2 vUv;
        void main() {
          float t = time * 0.65;
          float wave = sin(vUv.x * 75.0 + vUv.y * 140.0 + t * 2.3) * 0.5 + 0.5;
          float chop = sin(vUv.x * 43.0 - vUv.y * 191.0 - t) * 0.5 + 0.5;
          float edge = smoothstep(0.0, 0.04, vUv.x) * (1.0 - smoothstep(0.55, 1.0, vUv.x));
          float stripe = vUv.y + sin(vUv.x * 25.0 + t) * 0.008;
          float lamp = exp(-abs(stripe - 0.345) * 42.0) + exp(-abs(stripe - 0.675) * 48.0);
          vec3 tint = mix(vec3(0.74, 0.86, 0.93), vec3(1.0, 0.73, 0.40), afterDark);
          float strength = mix(0.08, lamp * 0.40, afterDark) * edge * pow(wave * chop, 2.0);
          gl_FragColor = vec4(tint, strength);
        }
      `} />
  </mesh>;
}

function Ferry({ night, reducedMotion }: { night: boolean; reducedMotion: boolean }) {
  const ferry = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (!ferry.current) return;
    if (reducedMotion) {
      ferry.current.position.set(12.25, .10, 1.75);
      ferry.current.rotation.y = 0;
      return;
    }
    const phase = clock.elapsedTime * .106;
    ferry.current.position.set(12.25 + Math.sin(phase) * .19, .10 + Math.sin(clock.elapsedTime * 1.55) * .023, 1.75 + Math.sin(phase) * 6.8);
    ferry.current.rotation.y = Math.atan2(Math.sin(phase) * .21, Math.cos(phase));
  });
  return <group ref={ferry} name="huangpu-passenger-ferry" position={[12.25, .10, 1.75]}>
    <RoundedBox args={[1.35, .39, 3.3]} radius={.18} smoothness={3} position={[0, .20, 0]} castShadow>
      <meshStandardMaterial color="#43535e" roughness={.73} />
    </RoundedBox>
    <RoundedBox args={[1.36, .19, 3.16]} radius={.085} smoothness={2} position={[0, .41, 0]}>
      <meshStandardMaterial color="#e5e2d3" roughness={.56} />
    </RoundedBox>
    <Block position={[0, .59, 0]} size={[1.08, .33, 2.25]} color="#dcdcd2" />
    <Block position={[0, .84, .05]} size={[1.04, .25, 2.12]} color={night ? '#e0bd83' : '#54747f'} metalness={.15} roughness={.28} />
    <Block position={[0, 1.04, .07]} size={[1.21, .17, 2.39]} color="#d2d3cb" />
    <Block position={[0, 1.18, -.28]} size={[.22, .22, .34]} color="#4a5252" />
    {[-1, 1].map(side => <group key={side}>
      {[-1.02, -.56, 0, .56, 1.11].map(z =>
        <Block key={z} position={[side * .527, .84, z]} size={[.035, .26, .065]} color="#ddded4" shadow={false} />)}
      <Block position={[side * .68, .39, 0]} size={[.022, .055, 2.68]} color="#8f4236" shadow={false} />
      {[1.19, 1.45, -1.28].map(z => <Block key={z} position={[side * .58, .57, z]} size={[.035, .25, .035]} color="#a6aaa2" shadow={false} />)}
      <Block position={[side * .58, .7, 1.32]} size={[.032, .03, .35]} color="#c1c3ba" shadow={false} />
      <Block position={[side * .58, .7, -1.31]} size={[.032, .03, .32]} color="#c1c3ba" shadow={false} />
      <mesh position={[side * .55, .63, -.37]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[.105, .025, 6, 18]} /><meshStandardMaterial color="#a94f39" />
      </mesh>
      <mesh position={[side * .58, 1.07, .96]}>
        <sphereGeometry args={[.044, 8, 6]} />
        <meshStandardMaterial color={side === 1 ? '#648e6a' : '#bd574b'} emissive={side === 1 ? '#568463' : '#a53a27'} emissiveIntensity={night ? 2 : .15} />
      </mesh>
    </group>)}
    {night && <pointLight position={[0, .8, .85]} color="#f2ca89" intensity={2.3} distance={2.3} />}
    {!reducedMotion && [-1, 1].map(side => <group key={side}>
      {[0, 1, 2].map(i => <mesh key={i} position={[side * (.38 + i * .19), .007, -1.64 - i * .43]} rotation={[-Math.PI / 2, 0, side * (.19 + i * .06)]}>
        <planeGeometry args={[.07, .58 + i * .09]} />
        <meshBasicMaterial color="#c3d4d2" transparent opacity={.27 - i * .065} depthWrite={false} />
      </mesh>)}
    </group>)}
  </group>;
}

export default function BundWaterfront({ river, night, reducedMotion }: { river?: Texture; night: boolean; reducedMotion: boolean }) {
  useFrame(({ clock }) => { if (river) river.offset.set(reducedMotion ? 0 : clock.elapsedTime * .008, 0); });
  return <group>
    <CitySurface position={[12.55, .099, 0]} size={[5.9, 24.3]} map={river} tile={6.7} color={night ? '#71899a' : '#a6b7ba'} roughness={night ? .40 : .52} relief={.045} metalness={.24} />
    <WaterGlints night={night} reducedMotion={reducedMotion} />
    <Block position={[9.65, .14, 0]} size={[.4, .32, 24.3]} color="#b6b6aa" />
    <Block position={[9.65, .31, 0]} size={[.49, .11, 24.3]} color="#c6c7b9" />
    {railingPosts.map((z, index) => <group key={z}>
      <Block position={[9.64, .68, z]} size={[.086, .68, .086]} color="#46575b" />
      {index < railingPosts.length - 1 && z !== .3 && [.65, .98].map(y => <Block key={y} position={[9.64, y, (z + railingPosts[index + 1]) / 2]} size={[.065, .045, railingPosts[index + 1] - z]} color="#506267" shadow={false} />)}
    </group>)}
    <group position={[10.02, 0, 1.9]} name="bund-ferry-landing">
      <Block position={[0, .14, 0]} size={[1.9, .28, 2.85]} color="#8e9899" />
      <Block position={[.25, .30, 0]} size={[1.45, .065, 2.60]} color="#bdc3bf" />
      <Block position={[.91, .34, 0]} size={[.08, .042, 2.70]} color="#cbb374" shadow={false} />
      {[-1.38, 1.38].map(z => <group key={z}>
        {[-.83, .05, .85].map(x => <Block key={x} position={[x, .58, z]} size={[.069, .58, .07]} color="#475e61" />)}
        <Block position={[.01, .88, z]} size={[1.77, .055, .060]} color="#5f7777" />
      </group>)}
      <Block position={[-.5, .75, -.87]} size={[.32, .8, .33]} color="#49565a" />
      <Block position={[-.5, 1.18, -.87]} size={[.39, .11, .36]} color="#9eaaab" />
      <mesh position={[-.48, 1.247, -.87]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[.16, .17]} /><meshBasicMaterial color="#8ec9b7" />
      </mesh>
    </group>
    {[-4.2, 3.7].map(z => <group key={z} position={[9.18, 0, z]}>
      <Lamp night={night} />
      {night && <pointLight position={[.2, 2.39, 0]} color="#ecca92" intensity={14} distance={7} />}
    </group>)}
    <Ferry night={night} reducedMotion={reducedMotion} />
  </group>;
}
