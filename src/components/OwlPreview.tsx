import { Component, Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { Bounds, OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { PlayerAppearance } from '../game/types';
import { playerModelSlot } from '../game/avatarPreference';
function PreviewAsset({url,rotationY,receiveShadow,onLoaded}:{
 url:string;rotationY:number;receiveShadow:boolean;onLoaded:()=>void;
}){
 const {scene}=useGLTF(url);
 const model=useMemo(()=>{
  const root=new THREE.Group();
  root.add(scene.clone(true));
  root.rotation.y=rotationY;
  const box=new THREE.Box3().setFromObject(root);
  const size=box.getSize(new THREE.Vector3());
  const center=box.getCenter(new THREE.Vector3());
  root.traverse(object=>{
   if (!(object as THREE.Mesh).isMesh) return;
   object.castShadow=true;
   object.receiveShadow=receiveShadow;
  });
  return {root,center,scale:2.6/size.y};
 },[scene,rotationY,receiveShadow]);
 useEffect(()=>{onLoaded();},[onLoaded]);
 return <group scale={model.scale}><group position={[-model.center.x,-model.center.y,-model.center.z]}><primitive object={model.root}/></group></group>;
}
class PreviewBoundary extends Component<{children:ReactNode},{failed:boolean}>{
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 render(){return this.state.failed?<p className="preview-error">这回没加载出来</p>:this.props.children;}
}
export function ModelPreview({slot,label,note,rotationY=0,url='/models/tripo/'+slot+'-v1.glb'}:{
 slot:string; label:string; note?:string; rotationY?:number; url?:string;
}){
 const [loaded,setLoaded]=useState(false);
 const onLoaded=useCallback(()=>setLoaded(true),[]);
 const still=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const male=slot==='player-male-stunning';
 return <div className="owl-preview" role="img" aria-label={label} data-model-preview={slot} data-preview-ready={loaded}>
  <PreviewBoundary>
   <Canvas shadows camera={{position:male?[1.4,.83,4.5]:[2,1.1,4.5],fov:38}} dpr={[1,1.5]}
    gl={{antialias:true,alpha:true,preserveDrawingBuffer:true}} onCreated={({gl})=>{
     gl.setClearColor(0x193b30,0);
     gl.toneMapping=THREE.ACESFilmicToneMapping;
     gl.toneMappingExposure=1.08;
    }}>
    <ambientLight intensity={1.6}/>
    <directionalLight position={[3,5,5]} intensity={male?2.4:3.1} color={male?'#ffefdb':'#ffe9b7'} castShadow/>
    <directionalLight position={[-3,1,-3]} intensity={male?1.25:2} color={male?'#c5d3ef':'#b8d7c3'}/>
    {male&&<directionalLight position={[-3,1,4]} intensity={1.05} color="#edebf5"/>}
    <Suspense fallback={null}>
     <Bounds fit clip observe margin={slot==='night-owl'?1.5:male?1.26:1.12} maxDuration={0}>
      <PreviewAsset url={url} rotationY={rotationY} receiveShadow={!male} onLoaded={onLoaded}/>
     </Bounds>
    </Suspense>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-1.32,0]} receiveShadow>
     <circleGeometry args={[2,48]}/>
     <shadowMaterial opacity={.25}/>
    </mesh>
    <OrbitControls makeDefault enablePan={false} enableZoom={false} autoRotate={!still}
     autoRotateSpeed={.8} minPolarAngle={.6} maxPolarAngle={1.7}/>
   </Canvas>
  </PreviewBoundary>
  {note&&<span className="owl-drag-note">{note}</span>}
 </div>;
}
export function PlayerModelPreview({appearance}:{appearance:PlayerAppearance}){
 const slot=playerModelSlot(appearance);
 if (!slot) return null;
 const label=(appearance.gender==='male'?'男性':'女性')+'三维角色，可以拖动旋转';
 return appearance.gender==='male'
  ? <ModelPreview slot={slot} label={label} url="/models/rodin/player-male-stunning-v1.glb" note="拖动旋转"/>
  : <ModelPreview slot={slot} label={label} rotationY={-Math.PI/2}/>;
}
export default function OwlPreview(){
 return <ModelPreview slot="night-owl" label="夜猫子三维模型，可以拖动旋转" note="拖一拖，看谁先眨眼"/>;
}
