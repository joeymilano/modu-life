import { Component, useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { DISTRICTS } from '../game/content';
import type { DistrictId } from '../game/types';
import { Bench, Block, CityArchitecture, Figure, getObstacles, Lamp, Tree, Umbrella, type ModelManifest } from './CityModels';
import { findPath, isWalkable, type Point2 } from './pathfinding';

export interface PlayerAppearance { gender:'female'|'male'; looks:'everyday'|'charming'|'stunning' }
const DEFAULT_APPEARANCE:PlayerAppearance={gender:'male',looks:'everyday'};
export interface CitySceneProps {
 district:DistrictId; selectedHotspot?:string|null; onHotspot:(id:string)=>void;
 destination?:[number,number]|null; onArrive?:()=>void; night?:boolean; reducedMotion?:boolean;
 compact?:boolean; mode?:'hero'|'play'; onReady?:()=>void; appearance?:PlayerAppearance;
}
function inputBlocked(){const tag=document.activeElement?.tagName;return tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT'||!!document.querySelector('[aria-modal="true"]');}
function CameraRig({compact,hero,reducedMotion,onReady}:{compact:boolean;hero:boolean;reducedMotion:boolean;onReady?:()=>void}){
 const {camera,size}=useThree();const ready=useRef(false);
 useEffect(()=>{const c=camera as THREE.OrthographicCamera;c.zoom=Math.min(size.width/(compact?31:43),size.height/(compact?33:34));c.position.set(31,29,35);c.lookAt(0,2.4,0);c.updateProjectionMatrix();},[camera,size.width,size.height,compact]);
 useFrame(({clock})=>{if(hero&&!reducedMotion){camera.position.x=31+Math.sin(clock.elapsedTime*.08)*1.2;camera.position.z=35+Math.cos(clock.elapsedTime*.08)*1.1;camera.lookAt(0,2.4,0);}if(!ready.current){ready.current=true;onReady?.();}});
 return null;
}
function Road(){return <group>
 <Block position={[0,.025,0]} size={[29.4,.045,2.7]} color='#c7c6b6' shadow={false}/>
 <Block position={[0,.026,0]} size={[2.7,.05,22.5]} color='#c7c6b6' shadow={false}/>
 <Block position={[0,.02,-9.3]} size={[29.4,.05,1.3]} color='#d4d0b8' shadow={false}/>
 <Block position={[0,.02,9.3]} size={[29.4,.05,1.3]} color='#d4d0b8' shadow={false}/>
 {[-1.57,1.57].map(z=><Block key={z} position={[0,.04,z]} size={[29.4,.08,.22]} color='#e9e2ca' shadow={false}/>)}
 {[-1.57,1.57].map(x=><Block key={x} position={[x,.04,0]} size={[.22,.08,22.5]} color='#e9e2ca' shadow={false}/>)}
 {[-12,-9,-6,-3,3,6,9,12].map(x=><Block key={x} position={[x,.055,0]} size={[1,.01,.055]} color='#eee4c4' shadow={false}/>)}
 {[-6,-3,3,6].map(z=><Block key={z} position={[0,.056,z]} size={[.055,.01,1]} color='#eee4c4' shadow={false}/>)}
 {[-2.5,2.5].flatMap((z,j)=>Array.from({length:6},(_,i)=><Block key={`${j}-${i}`} position={[-.95+i*.38,.065,z]} size={[.2,.015,.8]} color='#f3edd7' shadow={false}/>))}
 </group>;}
function StreetFurniture({district,night}:{district:DistrictId;night:boolean}){
 const xs=district==='bund'?[-12,-9.8,9.5]:[-12,12];
 return <group>
 {xs.flatMap((x,j)=>[-7.8,-3,2.8,7.7].map((z,i)=><Tree key={`${j}-${i}`} position={[x,0,z]} tone={i+j}/>))}
 {[-10.8,-6,-2.2,2.2,6,10.8].map((x,i)=><Tree key={x} position={[x,0,9.4]} tone={i}/>)}
 {[-10,-5,5,9].map(x=><Lamp key={x} position={[x,0,1.9]} night={night}/>)}
 {[-8,-3,3,8].map((x,i)=><Bench key={x} position={[x,0,-2]} rotation={i%2?Math.PI:0}/>)}
 <Umbrella position={[-10.7,0,5.2]} color='#b54c35'/><Umbrella position={[-10.7,0,7.3]} color='#ddbf6d'/>
 {district==='anfu'&&<><Umbrella position={[1.9,0,7.4]} color='#b04c39'/><Bench position={[1.9,0,4.3]} rotation={Math.PI/2}/></>}
 {district==='people'&&<>{[-9,-3,5].map((x,i)=><Umbrella key={x} position={[x,0,-7.6]} color={['#ba614e','#ba9759','#81916a'][i]}/>)}{[-9,-6,-3].map(x=><Tree key={x} position={[x,0,-8.3]} tone={2}/>)}</>}
 {district==='zhangjiang'&&[-3,3].map(x=><group key={x}><Tree position={[x,0,4.5]} tone={2}/><Tree position={[x,0,7.2]} tone={0}/></group>)}
 </group>;
}
function Waterfront({reducedMotion}:{reducedMotion:boolean}){
 const boat=useRef<THREE.Group>(null);
 useFrame(({clock})=>{if(boat.current&&!reducedMotion){boat.current.position.z=Math.sin(clock.elapsedTime*.06)*7;boat.current.position.y=.14+Math.sin(clock.elapsedTime*1.3)*.025;}});
 return <group>
 <mesh position={[12.5,.08,0]} rotation={[-Math.PI/2,0,0]} receiveShadow><planeGeometry args={[5.7,24]}/><meshStandardMaterial color='#77a99e' metalness={.3} roughness={.3}/></mesh>
 <Block position={[9.7,.2,0]} size={[.5,.4,24]} color='#e8ddbe'/>
 {Array.from({length:15},(_,i)=><group key={i}><Block position={[9.7,.6,-11.2+i*1.6]} size={[.11,.8,.11]} color='#536b5b'/><Block position={[9.7,.85,-10.4+i*1.6]} size={[.06,.06,1.6]} color='#536b5b'/></group>)}
 {Array.from({length:12},(_,i)=><Block key={i} position={[11+(i%3)*1.2,.095,-10+i*1.7]} size={[.6,.012,.035]} color='#aad0bb' shadow={false}/>)}
 <group ref={boat} position={[12.7,.14,0]}><mesh rotation={[Math.PI/2,0,0]}><capsuleGeometry args={[.35,1.3,3,8]}/><meshStandardMaterial color='#faf0d7'/></mesh><Block position={[0,.28,0]} size={[.55,.45,1.2]} color='#b85a40'/><Block position={[0,.55,0]} size={[.62,.12,1.28]} color='#f0e3bf'/></group>
 </group>;
}
function Taxi({offset=0,color='#bdad55',reducedMotion}:{offset?:number;color?:string;reducedMotion:boolean}){
 const ref=useRef<THREE.Group>(null);
 useFrame(({clock})=>{if(ref.current&&!reducedMotion)ref.current.position.x=((clock.elapsedTime*.9+offset+13)%26)-13;});
 return <group ref={ref} position={[offset,.08,-.62]} rotation={[0,Math.PI/2,0]}>
 <RoundedBox args={[.72,.35,1.52]} radius={.09} smoothness={2} position={[0,.28,0]} castShadow><meshStandardMaterial color={color} roughness={.45}/></RoundedBox>
 <RoundedBox args={[.64,.35,.82]} radius={.07} smoothness={2} position={[0,.56,0]} castShadow><meshStandardMaterial color='#e8ddba' roughness={.45}/></RoundedBox>
 <Block position={[0,.59,.43]} size={[.51,.24,.025]} color='#54756b' roughness={.3}/>
 <Block position={[0,.59,-.43]} size={[.51,.24,.025]} color='#54756b' roughness={.3}/>
 {[-.37,.37].flatMap((x,i)=>[-.49,.49].map((z,j)=><mesh key={`${i}-${j}`} position={[x,.2,z]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.14,.14,.1,10]}/><meshStandardMaterial color='#41433a'/></mesh>))}
 <Block position={[0,.78,0]} size={[.24,.1,.22]} color='#e6d081'/>
 </group>;
}
function Pedestrian({start,color,index,reducedMotion}:{start:[number,number];color:string;index:number;reducedMotion:boolean}){
 const ref=useRef<THREE.Group>(null);
 useFrame(({clock})=>{if(ref.current&&!reducedMotion){ref.current.position.x=start[0]+Math.sin(clock.elapsedTime*.13+index)*.9;ref.current.rotation.y=Math.cos(clock.elapsedTime*.13+index)>0?Math.PI/2:-Math.PI/2;}});
 return <group ref={ref} position={[start[0],.07,start[1]]}><Figure color={color} small walking={!reducedMotion}/></group>;
}
function PlayerAvatar({appearance=DEFAULT_APPEARANCE,walking=false}:{appearance?:PlayerAppearance;walking?:boolean}){
 const legs=useRef<THREE.Group>(null),arms=useRef<THREE.Group>(null),body=useRef<THREE.Group>(null);
 const female=appearance.gender==='female',glam=appearance.looks==='stunning',smart=appearance.looks==='charming';
 const jacket=female?(glam?'#8e3542':smart?'#bc9666':'#5d806d'):(glam?'#263e3b':smart?'#3b5468':'#b54b37');
 const lower=female?(glam?'#8e3542':smart?'#344d52':'#394b57'):(glam?'#263e3b':smart?'#344653':'#415867');
 const hair=female?(glam?'#352b29':smart?'#63422f':'#44382e'):(glam?'#282a29':smart?'#3e322b':'#4a3a2d');
 const shoes=glam?'#2c302c':smart?'#624b35':'#f0e4cb';
 const skirt=female&&(smart||glam);
 const headScale:[number,number,number]=glam?[.95,1.07,.94]:smart?[.99,1.035,.95]:[1.04,1,.97];
 useFrame(({clock})=>{
  const phase=clock.elapsedTime*9,swing=walking?Math.sin(phase)*.36:0;
  legs.current?.children.forEach((leg,i)=>{leg.rotation.x=i===0?swing:-swing;});
  arms.current?.children.forEach((arm,i)=>{arm.rotation.x=i===0?-swing*.8:swing*.8;});
  if(body.current)body.current.position.y=walking?Math.abs(Math.sin(phase))*.018:0;
 });
 return <group ref={body} scale={.94} name={`player-avatar-${appearance.gender}-${appearance.looks}`}>
  <group ref={legs}>{[-.115,.115].map(x=><group key={x} position={[x,.43,0]}>
   <mesh position={[0,-.19,0]} castShadow><capsuleGeometry args={[female?.067:.08,.26,3,8]}/><meshStandardMaterial color={skirt?'#dca882':lower} roughness={.83}/></mesh>
   <Block position={[0,-.36,.045]} size={[female?.135:.16,.1,glam?.23:.27]} color={shoes} roughness={glam?.35:.8}/>
   {female&&glam&&<Block position={[0,-.37,-.04]} size={[.07,.12,.08]} color={shoes}/>}
  </group>)}</group>
  {skirt&&<mesh position={[0,glam?.53:.57,0]} castShadow><cylinderGeometry args={[.19,glam?.29:.34,glam?.63:.42,12]}/><meshStandardMaterial color={lower} roughness={glam?.45:.8}/></mesh>}
  <mesh position={[0,.8,0]} scale={[female?.91:1,1,female?.94:1]} castShadow><capsuleGeometry args={[.205,.2,4,10]}/><meshStandardMaterial color={jacket} roughness={glam?.45:.82}/></mesh>
  <mesh position={[0,1.09,0]} castShadow><cylinderGeometry args={[.073,.083,.16,8]}/><meshStandardMaterial color='#e2ae86'/></mesh>
  <Block position={[0,.91,.18]} size={[female?.17:.2,.24,.035]} color={glam&&female?jacket:'#eee1c6'} roughness={.8}/>
  {(!female||smart)&&[-1,1].map(side=><Block key={side} position={[side*.105,.93,.198]} size={[.075,.24,.035]} rotation={[0,0,side*.28]} color={glam?'#51635b':jacket} roughness={.75}/>)}
  {glam&&!female&&<Block position={[0,.9,.208]} size={[.038,.21,.025]} color='#c3a464' roughness={.4}/>}
  {female&&<mesh position={[0,.76,.196]}><torusGeometry args={[.16,.018,4,16,Math.PI]}/><meshStandardMaterial color={glam?'#c8a55c':smart?'#7b573b':'#d9c49c'} metalness={glam?.6:0} roughness={.55}/></mesh>}
  <group ref={arms}>{[-1,1].map(side=><group key={side} position={[side*(female?.24:.27),.9,0]} rotation={[0,0,side*.1]}>
   <mesh position={[0,-.13,0]} castShadow><capsuleGeometry args={[female?.065:.075,.29,3,8]}/><meshStandardMaterial color={jacket} roughness={glam?.5:.82}/></mesh>
   <mesh position={[0,-.34,.012]} castShadow><sphereGeometry args={[.071,8,6]}/><meshStandardMaterial color='#e2ae86'/></mesh>
   {glam&&side===-1&&<mesh position={[0,-.22,0]}><torusGeometry args={[.072,.016,4,12]}/><meshStandardMaterial color='#c6a667' metalness={.65} roughness={.3}/></mesh>}
  </group>)}</group>
  {female&&<group>
   <mesh position={[0,smart||glam?1.13:1.22,-.135]} scale={[1.05,smart||glam?1.43:1.06,.85]} castShadow><capsuleGeometry args={[.255,smart||glam?.2:.07,4,12]}/><meshStandardMaterial color={hair} roughness={.8}/></mesh>
   {[-1,1].map(side=><mesh key={side} position={[side*.26,smart||glam?1.14:1.23,.005]} rotation={[0,0,side*-.06]} castShadow><capsuleGeometry args={[.068,smart||glam?.38:.18,3,8]}/><meshStandardMaterial color={hair} roughness={.8}/></mesh>)}
  </group>}
  <mesh position={[0,1.34,0]} scale={headScale} castShadow><sphereGeometry args={[.285,14,12]}/><meshStandardMaterial color='#e6b28a' roughness={.85}/></mesh>
  <mesh position={[0,1.43,-.035]} rotation={[.1,0,female?-.1:0]} scale={headScale} castShadow><sphereGeometry args={[.297,14,10,0,Math.PI*2,0,Math.PI*.57]}/><meshStandardMaterial color={hair} roughness={glam?.55:.85}/></mesh>
  {female?<mesh position={[-.095,1.55,.135]} scale={[1.5,.46,.58]} rotation={[0,0,.28]} castShadow><sphereGeometry args={[.15,10,8]}/><meshStandardMaterial color={hair} roughness={.8}/></mesh>:<>
   <mesh position={[smart||glam?.04:-.04,1.6,.08]} scale={[smart||glam?1.5:1.1,glam?.38:smart?.55:.7,.72]} rotation={[0,0,smart||glam?-.19:.18]} castShadow><sphereGeometry args={[.16,10,8]}/><meshStandardMaterial color={hair} roughness={glam?.5:.8}/></mesh>
   {!smart&&!glam&&<mesh position={[-.14,1.59,-.025]} rotation={[0,0,.55]} castShadow><coneGeometry args={[.09,.2,5]}/><meshStandardMaterial color={hair}/></mesh>}
  </>}
  {[-1,1].map(side=><group key={side}>
   <mesh position={[side*.097,1.342,.268]} scale={[glam?1.25:1,glam?.72:1,.65]}><sphereGeometry args={[.022,8,6]}/><meshBasicMaterial color='#342d27'/></mesh>
   {(smart||glam)&&<Block position={[side*.099,1.399,.26]} size={[glam?.068:.056,.014,.018]} rotation={[0,0,side*(female?.12:-.08)]} color={hair}/>}
   {female&&glam&&<mesh position={[side*.278,1.27,.015]} rotation={[0,Math.PI/2,0]}><torusGeometry args={[.044,.01,4,12]}/><meshStandardMaterial color='#d0af69' metalness={.65} roughness={.35}/></mesh>}
  </group>)}
  <mesh position={[0,1.259,.275]} scale={[female||smart||glam?1.4:1,.65,.55]}><sphereGeometry args={[.018,8,6]}/><meshBasicMaterial color={female&&glam?'#a44e46':'#ad7657'}/></mesh>
  {female&&smart&&<Block position={[.32,.49,-.015]} size={[.1,.21,.21]} color='#ae7549' roughness={.8}/>}
 </group>;
}
function Player({district,destination,onArrive,walkRequest,reducedMotion,appearance}:{district:DistrictId;destination?:Point2|null;onArrive?:()=>void;walkRequest?:Point2|null;reducedMotion:boolean;appearance?:PlayerAppearance}){
 const ref=useRef<THREE.Group>(null),route=useRef<Point2[]>([]),point=useRef<Point2>([0,4.3]),keys=useRef(new Set<string>()),notify=useRef(false);
 const [walking,setWalking]=useState(false);const walkingRef=useRef(false),targetTurn=useRef(0);
 const obstacles=useMemo(()=>getObstacles(district),[district]);const callback=useRef(onArrive);callback.current=onArrive;
 useEffect(()=>{if(destination){route.current=findPath(point.current,destination,obstacles);notify.current=true;if(!route.current.length&&Math.hypot(point.current[0]-destination[0],point.current[1]-destination[1])<.8){notify.current=false;callback.current?.();}}else if(!walkRequest){route.current=[];notify.current=false;}},[destination?.[0],destination?.[1],obstacles]);
 useEffect(()=>{if(walkRequest){route.current=findPath(point.current,walkRequest,obstacles);notify.current=false;}else if(!destination){route.current=[];notify.current=false;}},[walkRequest,obstacles]);
 useEffect(()=>{const down=(e:KeyboardEvent)=>{if(inputBlocked())return;if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(e.key.toLowerCase())){keys.current.add(e.key.toLowerCase());e.preventDefault();}};const up=(e:KeyboardEvent)=>keys.current.delete(e.key.toLowerCase());const blur=()=>keys.current.clear();window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',blur);return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur);};},[]);
 useFrame((_,delta)=>{
  const step=Math.min(delta,.045)*4.7;let moved=false;
  if(!inputBlocked()){
   const k=keys.current;let dx=(k.has('d')||k.has('arrowright')?1:0)-(k.has('a')||k.has('arrowleft')?1:0),dz=(k.has('s')||k.has('arrowdown')?1:0)-(k.has('w')||k.has('arrowup')?1:0);
   if(dx||dz){route.current=[];notify.current=false;const len=Math.hypot(dx,dz);dx=dx/len*step;dz=dz/len*step;const nx=point.current[0]+dx,nz=point.current[1]+dz;if(isWalkable([nx,nz],obstacles)){point.current=[nx,nz];moved=true;targetTurn.current=Math.atan2(dx,dz);}else if(isWalkable([nx,point.current[1]],obstacles)){point.current[0]=nx;moved=true;}else if(isWalkable([point.current[0],nz],obstacles)){point.current[1]=nz;moved=true;}}
   else if(route.current.length){const p=route.current[0],x=p[0]-point.current[0],z=p[1]-point.current[1],len=Math.hypot(x,z);if(len<step){point.current=p;route.current.shift();}else{point.current=[point.current[0]+x/len*step,point.current[1]+z/len*step];targetTurn.current=Math.atan2(x,z);}moved=true;if(!route.current.length&&notify.current){notify.current=false;callback.current?.();}}
  }
  if(ref.current){ref.current.position.set(point.current[0],.075,point.current[1]);const diff=Math.atan2(Math.sin(targetTurn.current-ref.current.rotation.y),Math.cos(targetTurn.current-ref.current.rotation.y));ref.current.rotation.y+=diff*Math.min(1,delta*12);}
  if(moved!==walkingRef.current){walkingRef.current=moved;setWalking(moved);}
 });
 return <group ref={ref} position={[0,.075,4.3]}><PlayerAvatar appearance={appearance} walking={walking&&!reducedMotion}/><mesh rotation={[-Math.PI/2,0,0]} position={[0,.005,0]}><ringGeometry args={[.33,.42,32]}/><meshBasicMaterial color='#bd4b35' transparent opacity={.75}/></mesh></group>;
}
type HotspotLabelRefs = RefObject<Map<string, HTMLButtonElement>>;
function Hotspots({district,selected,labelRefs}:{district:DistrictId;selected?:string|null;labelRefs:HotspotLabelRefs}){
 const config=DISTRICTS.find(d=>d.id===district);const projected=useMemo(()=>new THREE.Vector3(),[]);
 useFrame(({camera,size})=>{
  camera.updateMatrixWorld();
  for(const h of config?.hotspots??[]){
   const button=labelRefs.current.get(h.id);if(!button)continue;
   projected.set(h.position[0],1.1,h.position[1]).project(camera);
   const x=(projected.x*.5+.5)*size.width,y=(-projected.y*.5+.5)*size.height;
   button.style.transform=`translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) translate(-50%,-50%)`;
   button.style.visibility=projected.z>=-1&&projected.z<=1&&Math.abs(projected.x)<1.12&&Math.abs(projected.y)<1.12?'visible':'hidden';
  }
 });
 return <group>{config?.hotspots.map(h=><group key={h.id} position={[h.position[0],.05,h.position[1]]}><mesh rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.35,.44,24]}/><meshBasicMaterial color={selected===h.id?'#b73e2c':'#a78548'} transparent opacity={.7}/></mesh></group>)}</group>;
}
function World({district,selectedHotspot,onHotspot,destination,onArrive,night=false,reducedMotion=false,compact=false,mode='play',onReady,labelRefs,appearance}:CitySceneProps&{labelRefs:HotspotLabelRefs}){
 const [manifest,setManifest]=useState<ModelManifest>({});const [walkRequest,setWalkRequest]=useState<Point2|null>(null);useEffect(()=>setWalkRequest(null),[district]);
 useEffect(()=>{const controller=new AbortController();fetch(new URL('models/manifest.json', document.baseURI),{signal:controller.signal}).then(r=>r.ok?r.json():null).then(j=>{if(j?.slots)setManifest(j.slots);}).catch(()=>{});return()=>controller.abort();},[]);
 const groundClick=useCallback((e:ThreeEvent<PointerEvent>)=>{if(mode==='hero'||inputBlocked())return;e.stopPropagation();setWalkRequest([e.point.x,e.point.z]);},[mode]);
 const park=district==='people';
 return <>
  <CameraRig compact={compact} hero={mode==='hero'} reducedMotion={reducedMotion} onReady={onReady}/>
  <ambientLight intensity={night?.85:1.7} color={night?'#b9c9d4':'#fff5db'}/><hemisphereLight args={[night?'#6e929f':'#e9eddb','#a49a76',night?.7:1.1]}/>
  <directionalLight position={[-10,24,12]} color={night?'#d2bd9a':'#ffe7b8'} intensity={night?1.8:3.2} castShadow shadow-mapSize={[1024,1024]} shadow-camera-left={-24} shadow-camera-right={24} shadow-camera-top={24} shadow-camera-bottom={-24} shadow-camera-near={1} shadow-camera-far={65} shadow-bias={-.0006} shadow-normalBias={.04}/>
  <directionalLight position={[14,12,-18]} color='#c7e1d2' intensity={night?.8:1.5}/>
  <group>
   <RoundedBox args={[31.5,.9,24.7]} radius={.36} smoothness={3} position={[0,-.5,0]} receiveShadow castShadow><meshStandardMaterial color={night?'#c1baa2':'#e5d9bb'} roughness={.92}/></RoundedBox>
   <RoundedBox args={[31.1,.2,24.3]} radius={.08} smoothness={3} position={[0,-.06,0]} receiveShadow><meshStandardMaterial color={park?'#aab996':'#dad6bc'} roughness={.95}/></RoundedBox>
   <Block position={[0,-.83,0]} size={[30.6,.12,23.8]} color='#b3a57f'/>
   {park&&<><RoundedBox args={[11,.06,6.9]} radius={.5} smoothness={2} position={[-6,.05,-5.8]} receiveShadow><meshStandardMaterial color='#8da47c' roughness={1}/></RoundedBox><Block position={[2,.07,-5.7]} size={[1,.06,6]} color='#e1d3a8'/></>}
   <Road/>
   {district==='bund'&&<Waterfront reducedMotion={reducedMotion}/>}
   <CityArchitecture district={district} night={night} manifest={manifest}/>
   <StreetFurniture district={district} night={night}/>
   <Taxi offset={-7} reducedMotion={reducedMotion} color='#b8aa58'/>
   {!compact&&<Taxi offset={7} reducedMotion={reducedMotion} color='#426a58'/>}
   {[{start:[-6,2.55] as Point2,color:'#395d4c'},{start:[4,-2.6] as Point2,color:'#cf9d5b'},{start:[8,2.55] as Point2,color:'#b76b52'},{start:[-8,-2.55] as Point2,color:'#667c8b'}].slice(0,compact?2:4).map((p,i)=><Pedestrian key={i} {...p} index={i} reducedMotion={reducedMotion}/>)}
   {mode==='play'&&<><Player key={district} district={district} destination={destination} onArrive={onArrive} walkRequest={walkRequest} reducedMotion={reducedMotion} appearance={appearance}/><Hotspots district={district} selected={selectedHotspot} labelRefs={labelRefs}/></>}
   <mesh rotation={[-Math.PI/2,0,0]} position={[0,.105,0]} onPointerDown={groundClick}><planeGeometry args={[31,24]}/><meshBasicMaterial transparent opacity={0} depthWrite={false}/></mesh>
  </group>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,-1.15,0]} receiveShadow><planeGeometry args={[200,200]}/><shadowMaterial opacity={.13} color='#4d5133'/></mesh>
 </>;
}
class SceneBoundary extends Component<{children:ReactNode},{error:boolean}>{state={error:false};static getDerivedStateFromError(){return {error:true};}render(){return this.state.error?<div style={{display:'grid',placeItems:'center',height:'100%',color:'#7a806d',padding:32,textAlign:'center',fontSize:13}}>3D画面暂不可用，仍可从地点列表继续人生。</div>:this.props.children;}}
export default function CityScene(props:CitySceneProps){
 const [visible,setVisible]=useState(true);const labelRefs=useRef(new Map<string,HTMLButtonElement>());
 const config=DISTRICTS.find(d=>d.id===props.district);
 useEffect(()=>{const f=()=>setVisible(!document.hidden);document.addEventListener('visibilitychange',f);return()=>document.removeEventListener('visibilitychange',f);},[]);
 return <SceneBoundary><div style={{width:'100%',height:'100%',position:'relative'}} data-avatar-gender={(props.appearance??DEFAULT_APPEARANCE).gender} data-avatar-looks={(props.appearance??DEFAULT_APPEARANCE).looks}>
  <Canvas orthographic shadows camera={{position:[31,29,35],zoom:20,near:.1,far:200}} dpr={props.compact?[1,1.3]:[1,1.7]} gl={{preserveDrawingBuffer:true,alpha:true,antialias:true,powerPreference:'high-performance'}} frameloop={visible?'always':'demand'} style={{width:'100%',height:'100%',background:'transparent',touchAction:'none'}} onCreated={({gl})=>{gl.toneMapping=THREE.ACESFilmicToneMapping;gl.toneMappingExposure=1.03;gl.shadowMap.type=THREE.PCFSoftShadowMap;gl.setClearColor(0x000000,0);}}><World {...props} labelRefs={labelRefs}/></Canvas>
  {(props.mode??'play')==='play'&&<div className='city-hotspot-overlay' style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:2,overflow:'hidden'}}>{config?.hotspots.map((h,i)=><button key={h.id} ref={node=>{if(node)labelRefs.current.set(h.id,node);else labelRefs.current.delete(h.id);}} type='button' className={`city-hotspot${props.selectedHotspot===h.id?' is-selected':''}`} data-hotspot={h.id} onPointerDown={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();props.onHotspot(h.id);}} aria-label={`前往${h.name}`} style={{position:'absolute',left:0,top:0,pointerEvents:'auto',visibility:'hidden',willChange:'transform',border:props.selectedHotspot===h.id?'1px solid #b83d2a':'1px solid #a9a993',borderRadius:3,background:props.selectedHotspot===h.id?'#b83d2a':'#fff9e9',color:props.selectedHotspot===h.id?'#fff7e2':'#354b3c',fontFamily:'inherit',fontSize:10,padding:'5px 8px',boxShadow:'0 3px 10px #253d3520',whiteSpace:'nowrap',cursor:'pointer',display:'flex',gap:6,alignItems:'center',minHeight:30}}><span style={{fontSize:8,opacity:.7}}>{String(i+1).padStart(2,'0')}</span>{h.name}<span style={{fontSize:10}}>↗</span></button>)}</div>}
 </div></SceneBoundary>;
}
