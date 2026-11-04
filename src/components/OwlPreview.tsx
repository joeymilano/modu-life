import { Component, Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { Bounds, OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
function PreviewAsset({url,rotationY,onLoaded}:{url:string;rotationY:number;onLoaded:()=>void}){
 const {scene}=useGLTF(url);
 const model=useMemo(()=>{const root=new THREE.Group();root.add(scene.clone(true));root.rotation.y=rotationY;const box=new THREE.Box3().setFromObject(root),size=new THREE.Vector3(),center=new THREE.Vector3();box.getSize(size);box.getCenter(center);root.traverse(o=>{if((o as THREE.Mesh).isMesh){o.castShadow=true;o.receiveShadow=true;}});return {root,center,scale:2.6/size.y};},[scene,rotationY]);
 useEffect(()=>{onLoaded();},[onLoaded]);
 return <group scale={model.scale}><group position={[-model.center.x,-model.center.y,-model.center.z]}><primitive object={model.root}/></group></group>;
}
class PreviewBoundary extends Component<{children:ReactNode},{failed:boolean}>{
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 render(){return this.state.failed?<p className="preview-error">这回没加载出来</p>:this.props.children;}
}
export function ModelPreview({slot,label,note,rotationY=0}:{slot:string;label:string;note?:string;rotationY?:number}){
 const url='/models/tripo/'+slot+'-v1.glb';
 const [loaded,setLoaded]=useState(false);
 const onLoaded=useCallback(()=>setLoaded(true),[]);
 const still=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 return <div className="owl-preview" role="img" aria-label={label} data-model-preview={slot} data-preview-ready={loaded}><PreviewBoundary><Canvas shadows camera={{position:[2,1.1,4.5],fov:38}} dpr={[1,1.5]} gl={{antialias:true,alpha:true,preserveDrawingBuffer:true}} onCreated={({gl})=>{gl.setClearColor(0x193b30,0);gl.toneMapping=THREE.ACESFilmicToneMapping;gl.toneMappingExposure=1.08;}}><ambientLight intensity={1.6}/><directionalLight position={[3,5,5]} intensity={3.1} color="#ffe9b7" castShadow/><directionalLight position={[-3,1,-3]} intensity={2} color="#b8d7c3"/><Suspense fallback={null}><Bounds fit clip observe margin={slot==='night-owl'?1.5:1.12} maxDuration={0}><PreviewAsset url={url} rotationY={rotationY} onLoaded={onLoaded}/></Bounds></Suspense><mesh rotation={[-Math.PI/2,0,0]} position={[0,-1.32,0]} receiveShadow><circleGeometry args={[2,48]}/><shadowMaterial opacity={.25}/></mesh><OrbitControls makeDefault enablePan={false} enableZoom={false} autoRotate={!still} autoRotateSpeed={.8} minPolarAngle={.6} maxPolarAngle={1.7}/></Canvas></PreviewBoundary>{note&&<span className="owl-drag-note">{note}</span>}</div>;
}
export default function OwlPreview(){
 return <ModelPreview slot="night-owl" label="夜猫子三维模型，可以拖动旋转" note="拖一拖，看谁先眨眼"/>;
}
