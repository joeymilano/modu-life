import { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Bounds, OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
function Owl(){
 const {scene}=useGLTF('/models/tripo/night-owl-v1.glb');
 const model=useMemo(()=>{const root=scene.clone(true);const box=new THREE.Box3().setFromObject(root),size=new THREE.Vector3(),center=new THREE.Vector3();box.getSize(size);box.getCenter(center);root.traverse(o=>{if((o as THREE.Mesh).isMesh){o.castShadow=true;o.receiveShadow=true;}});return {root,center,scale:2.6/size.y};},[scene]);
 return <group scale={model.scale}><primitive object={model.root} position={[-model.center.x,-model.center.y,-model.center.z]}/></group>;
}
export default function OwlPreview(){
 const still=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 return <div className="owl-preview" role="img" aria-label="夜猫子三维模型，可以拖动旋转" data-model-preview="night-owl"><Canvas shadows camera={{position:[2,1.1,4.5],fov:38}} dpr={[1,1.5]} gl={{antialias:true,alpha:true,preserveDrawingBuffer:true}} onCreated={({gl})=>{gl.setClearColor(0x193b30,0);gl.toneMapping=THREE.ACESFilmicToneMapping;gl.toneMappingExposure=1.08;}}><ambientLight intensity={1.6}/><directionalLight position={[3,5,5]} intensity={3.1} color="#ffe9b7" castShadow/><directionalLight position={[-3,1,-3]} intensity={2} color="#b8d7c3"/><Suspense fallback={null}><Bounds fit clip observe margin={1.5} maxDuration={0}><Owl/></Bounds></Suspense><mesh rotation={[-Math.PI/2,0,0]} position={[0,-1.32,0]} receiveShadow><circleGeometry args={[2,48]}/><shadowMaterial opacity={.25}/></mesh><OrbitControls makeDefault enablePan={false} enableZoom={false} autoRotate={!still} autoRotateSpeed={.8} minPolarAngle={.6} maxPolarAngle={1.7}/></Canvas><span className="owl-drag-note">拖一拖，看谁先眨眼。</span></div>;
}
