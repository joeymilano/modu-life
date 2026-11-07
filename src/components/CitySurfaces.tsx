import { useEffect, useMemo, useState } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

const surfaces = ['asphalt', 'paving', 'limestone', 'river'] as const;
export type CityTextures = Partial<Record<(typeof surfaces)[number], THREE.Texture>>;

export function useCityTextures(): CityTextures {
  const [textures, setTextures] = useState<CityTextures>({});
  const gl = useThree(state => state.gl);
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    let active = true;
    const loaded: THREE.Texture[] = [];
    for (const name of surfaces) {
      loader.load(`/art/city-materials/${name}.webp`, texture => {
        if (!active) { texture.dispose(); return; }
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = texture.wrapT = THREE.MirroredRepeatWrapping;
        texture.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
        loaded.push(texture);
        setTextures(current => ({ ...current, [name]: texture }));
      }, undefined, () => { /* A flat material keeps the street playable offline. */ });
    }
    return () => { active = false; loaded.forEach(texture => texture.dispose()); };
  }, [gl]);
  return textures;
}

export function CitySurface({ position, size: [width, depth], map, color, tile, roughness = .9, relief = 0, metalness = 0 }: {
  position: [number, number, number];
  size: [number, number];
  map?: THREE.Texture;
  color: string;
  tile: number;
  roughness?: number;
  relief?: number;
  metalness?: number;
}) {
  const geometry = useMemo(() => {
    const plane = new THREE.PlaneGeometry(width, depth);
    const uv = plane.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * width / tile, uv.getY(i) * depth / tile);
    return plane;
  }, [width, depth, tile]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
    <primitive object={geometry} attach="geometry" />
    <meshStandardMaterial color={color} map={map} bumpMap={relief ? map : undefined} bumpScale={relief} roughness={roughness} metalness={metalness} />
  </mesh>;
}
