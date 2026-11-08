import { Component, Suspense, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { RoundedBox, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { DistrictId } from '../game/types';
import type { Obstacle } from './pathfinding';
import { BUND_BANK, BUND_LANDMARKS, PUDONG_LANDMARKS } from './riverLayout';
import { districtFootprints, WUKANG_FOOTPRINT } from './districtLayout';

const BOX=new THREE.BoxGeometry(1,1,1);
const paint=new Map<string,THREE.MeshStandardMaterial>();
function material(color:string,metalness=0,roughness=.8){const key=color+metalness+roughness;let m=paint.get(key);if(!m){m=new THREE.MeshStandardMaterial({color,metalness,roughness});paint.set(key,m);}return m;}
export function Block({position=[0,0,0],size=[1,1,1],color='#e5dcc5',rotation=[0,0,0],metalness=0,roughness=.8,shadow=true}:{position?:[number,number,number];size?:[number,number,number];color?:string;rotation?:[number,number,number];metalness?:number;roughness?:number;shadow?:boolean}){
 return <mesh geometry={BOX} material={material(color,metalness,roughness)} position={position} scale={size} rotation={rotation} castShadow={shadow} receiveShadow dispose={null}/>;
}
function Round({position=[0,0,0],size=[1,1,1],color='#dfd8bd',radius=.08}:{position?:[number,number,number];size?:[number,number,number];color?:string;radius?:number}){return <RoundedBox args={size} radius={radius} smoothness={2} position={position} castShadow receiveShadow><meshStandardMaterial color={color} roughness={.85}/></RoundedBox>;}
const signTextures=new Map<string,THREE.CanvasTexture>();
export function Sign({text,width=1.5,position=[0,0,0],color='#314a3b',ink='#f9edcf'}:{text:string;width?:number;position?:[number,number,number];color?:string;ink?:string}){
 const texture=useMemo(()=>{const key=text+color+ink;let t=signTextures.get(key);if(!t){const c=document.createElement('canvas');c.width=768;c.height=176;const ctx=c.getContext('2d')!;ctx.fillStyle=color;ctx.fillRect(0,0,768,176);ctx.strokeStyle=ink;ctx.lineWidth=3;ctx.strokeRect(10,10,748,156);ctx.fillStyle=ink;ctx.font='bold 68px "Songti SC", "Noto Serif CJK SC", serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,384,91);t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;signTextures.set(key,t);}return t;},[text,color,ink]);
 return <mesh position={position}><planeGeometry args={[width,width*.229]}/><meshBasicMaterial map={texture} toneMapped={false}/></mesh>;
}
function Windows({width,depth,height,floors=4,night=false,modern=false,frontOnly=false}:{width:number;depth:number;height:number;floors?:number;night?:boolean;modern?:boolean;frontOnly?:boolean}){
 const ref=useRef<THREE.InstancedMesh>(null);
 const columns=Math.max(2,Math.floor(width/.65)),sideColumns=Math.max(2,Math.floor(depth/.75));
 const data=useMemo(()=>{const a:{p:[number,number,number];r:number;s:[number,number,number]}[]=[];for(let f=0;f<floors;f++){const y=.62+(f+.1)*(height-.9)/floors;for(let c=0;c<columns;c++){const x=-width/2+(c+.5)*width/columns;for(const z of (frontOnly?[1]:[-1,1]))a.push({p:[x,y,z*(depth/2+.018)],r:0,s:[modern?width/columns*.74:.32,modern?(height-.9)/floors*.72:.46,.035]});}if(!frontOnly)for(let c=0;c<sideColumns;c++){const z=-depth/2+(c+.5)*depth/sideColumns;for(const x of [-1,1])a.push({p:[x*(width/2+.018),y,z],r:Math.PI/2,s:[modern?depth/sideColumns*.74:.31,modern?(height-.9)/floors*.72:.46,.035]});}}return a;},[width,depth,height,floors,columns,sideColumns,modern,frontOnly]);
 useEffect(()=>{if(!ref.current)return;const o=new THREE.Object3D();data.forEach((v,i)=>{o.position.set(...v.p);o.rotation.set(0,v.r,0);o.scale.set(...v.s);o.updateMatrix();ref.current!.setMatrixAt(i,o.matrix);ref.current!.setColorAt(i,new THREE.Color(night?(i%4===0?'#ffe0a0':'#3c555e'):(i%6===0?'#b7a993':modern?'#78939e':'#536a6b')));});ref.current.instanceMatrix.needsUpdate=true;if(ref.current.instanceColor)ref.current.instanceColor.needsUpdate=true;},[data,night]);
 return <instancedMesh ref={ref} args={[BOX,undefined,data.length]} dispose={null}><meshStandardMaterial metalness={modern?.35:.05} roughness={modern?.25:.8} emissive={night?'#bc8a39':'#000'} emissiveIntensity={night?.17:0}/></instancedMesh>;
}
function PitchedRoof({width,depth,color='#a8523d'}:{width:number;depth:number;color?:string}){
 const geom=useMemo(()=>{const shape=new THREE.Shape();shape.moveTo(-width/2,0);shape.lineTo(0,.64);shape.lineTo(width/2,0);shape.closePath();const g=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false});g.translate(0,0,-depth/2);return g;},[width,depth]);
 return <mesh geometry={geom} material={material(color)} castShadow receiveShadow dispose={null}/>;
}
export function House({position=[0,0,0],width=3,depth=3,height=3.5,color='#e7d9b8',night=false,shop='弄堂生煎',roof='#965f4b',wallMap}:{position?:[number,number,number];width?:number;depth?:number;height?:number;color?:string;night?:boolean;shop?:string;roof?:string;wallMap?:THREE.Texture}){
 const floors=Math.max(2,Math.round(height/.9));
 return <group position={position}>
  <mesh position={[0,height/2,0]} castShadow receiveShadow><boxGeometry args={[width,height,depth]}/><meshStandardMaterial color={color} map={wallMap} bumpMap={wallMap} bumpScale={.036} roughness={.96}/></mesh>
  <Block position={[0,.15,0]} size={[width+.13,.3,depth+.12]} color='#afa98f'/>
  <Windows width={width} height={height} depth={depth} floors={floors} night={night}/>
  {Array.from({length:Math.max(1,floors-1)},(_,i)=><Block key={i} position={[0,(i+1)*height/floors+.25,0]} size={[width+.09,.08,depth+.09]} color='#e9e0c9'/>)}
  <group position={[0,height+.03,0]}><PitchedRoof width={width+.3} depth={depth+.28} color={roof}/></group>
  <Block position={[width*.29,height+.55,-depth*.1]} size={[.27,.75,.32]} color='#bdad91'/>
  <Block position={[-.52,.55,depth/2+.035]} size={[.55,1.1,.07]} color='#314b3f'/>
  <Block position={[.6,.55,depth/2+.04]} size={[.7,.95,.08]} color='#5d7b6a'/>
  <Block position={[0,1.13,depth/2+.28]} size={[width*.95,.1,.58]} color={roof}/>
  <Sign text={shop} width={width*.88} position={[0,1.45,depth/2+.09]}/>
  <Block position={[width*.42,.05,depth*.65]} size={[.28,.12,.28]} color='#89694c'/>
  <Tree position={[width*.42,.12,depth*.65]} small/>
 </group>;
}
function Office({position=[0,0,0],width=3,depth=3,height=6,color='#a8b8af',night=false}:{position?:[number,number,number];width?:number;depth?:number;height?:number;color?:string;night?:boolean}){
 return <group position={position}><Block position={[0,height/2,0]} size={[width,height,depth]} color={color} metalness={.2} roughness={.45}/><Windows width={width} height={height-.1} depth={depth} floors={Math.round(height/.7)} modern night={night}/><Block position={[0,height+.12,0]} size={[width+.1,.25,depth+.1]} color='#e1dcc9'/><Block position={[0,.18,0]} size={[width+.4,.35,depth+.4]} color='#ded9c5'/><Block position={[0,.5,depth/2+.05]} size={[width*.45,1,.1]} color='#476760'/>{Array.from({length:3},(_,i)=><Block key={i} position={[-width*.25+i*.25,height+.45,0]} size={[.17,.45,.5]} color='#b9c3b7'/>)}</group>;
}
const crowns = [
  [-.37, 1.75, .02, .58, .39, .53], [.39, 1.89, -.18, .65, .42, .55],
  [.07, 2.07, .23, .62, .44, .55], [-.11, 2.17, -.34, .56, .39, .51],
  [.34, 1.69, .36, .48, .31, .43],
].map(([x, y, z, width, height, depth], cluster) => {
 const crown = new THREE.IcosahedronGeometry(1, 2);
 const vertices = crown.attributes.position;
 for (let i = 0; i < vertices.count; i++) {
  const vx = vertices.getX(i), vy = vertices.getY(i), vz = vertices.getZ(i);
  const swell = 1 + .095 * Math.sin(vx * 12 + cluster) * Math.cos(vz * 10 + vy * 8);
  vertices.setXYZ(i, vx * width * swell + x, vy * height * swell + y, vz * depth * swell + z);
 }
 return crown;
});
const planeTreeCrown = mergeGeometries(crowns);
crowns.forEach(crown => crown.dispose());

export function Tree({position=[0,0,0],small=false,tone=0}:{position?:[number,number,number];small?:boolean;tone?:number}){
 return <group position={position} scale={small?.51:1} rotation={[0,tone*1.2,0]}>
  <mesh position={[0,.83,0]} castShadow><cylinderGeometry args={[.059,.108,1.66,7]}/><meshStandardMaterial color='#746c5d' roughness={1}/></mesh>
  <mesh position={[.13,1.38,0]} rotation={[0,0,-.43]} castShadow><cylinderGeometry args={[.029,.062,.72,6]}/><meshStandardMaterial color='#746c5d' roughness={1}/></mesh>
  <mesh geometry={planeTreeCrown} material={material(['#4a6451','#5e6c48','#6a704c'][tone%3],0,.98)} castShadow receiveShadow dispose={null}/>
 </group>;
}
export function Bench({position=[0,0,0],rotation=0}:{position?:[number,number,number];rotation?:number}){return <group position={position} rotation={[0,rotation,0]}><Block position={[0,.38,0]} size={[1.35,.12,.45]} color='#a47f4d'/><Block position={[0,.68,-.18]} size={[1.35,.5,.09]} color='#a47f4d'/>{[-.48,.48].map(x=><Block key={x} position={[x,.18,0]} size={[.08,.4,.4]} color='#354c41'/>)}</group>;}
export function Lamp({position=[0,0,0],night=false}:{position?:[number,number,number];night?:boolean}){return <group position={position}><mesh position={[0,1.2,0]}><cylinderGeometry args={[.035,.055,2.4,6]}/><meshStandardMaterial color='#345246'/></mesh><mesh position={[0,2.46,0]}><sphereGeometry args={[.17,8,6]}/><meshStandardMaterial color='#ead9ad' emissive={night?'#ffd397':'#2d2413'} emissiveIntensity={night?1.6:0}/></mesh><Block position={[0,.1,0]} size={[.16,.2,.16]} color='#345246'/></group>;}
export function Umbrella({position=[0,0,0],color='#ca6a44'}:{position?:[number,number,number];color?:string}){return <group position={position}><mesh position={[0,1.25,0]}><cylinderGeometry args={[.025,.035,2.5,6]}/><meshStandardMaterial color='#d6c8a0'/></mesh><mesh position={[0,2.12,0]}><coneGeometry args={[1.05,.5,8]}/><meshStandardMaterial color={color} roughness={.9}/></mesh><mesh position={[0,.75,0]}><cylinderGeometry args={[.48,.48,.12,12]}/><meshStandardMaterial color='#eee2c8'/></mesh></group>;}
export function Figure({position=[0,0,0],color='#b64430',walking=false,turn=0,small=false}:{position?:[number,number,number];color?:string;walking?:boolean;turn?:number;small?:boolean}){
 const legs=useRef<THREE.Group>(null),arms=useRef<THREE.Group>(null);
 useFrame(({clock})=>{if(legs.current){const t=walking?Math.sin(clock.elapsedTime*10)*.4:0;legs.current.children.forEach((v,i)=>{v.rotation.x=i%2?t:-t;});}if(arms.current)arms.current.rotation.z=walking?Math.sin(clock.elapsedTime*10)*.045:0;});
 return <group position={position} rotation={[0,turn,0]} scale={small?.72:.9}>
  <group ref={legs}>{[-.13,.13].map(x=><group key={x} position={[x,.4,0]}><mesh position={[0,-.17,0]} castShadow><capsuleGeometry args={[.085,.25,3,6]}/><meshStandardMaterial color='#353e3b'/></mesh><Block position={[0,-.33,.035]} size={[.15,.1,.26]} color='#f1e4c9'/></group>)}</group>
  <mesh position={[0,.71,0]} castShadow><capsuleGeometry args={[.23,.34,4,8]}/><meshStandardMaterial color={color} roughness={.85}/></mesh>
  <group ref={arms}>{[-.27,.27].map(x=><mesh key={x} position={[x,.65,0]} rotation={[0,0,x>0?.18:-.18]} castShadow><capsuleGeometry args={[.075,.34,3,6]}/><meshStandardMaterial color={color}/></mesh>)}</group>
  <mesh position={[0,1.23,0]} castShadow><sphereGeometry args={[.295,12,10]}/><meshStandardMaterial color='#e7b38a' roughness={.85}/></mesh>
  <mesh position={[0,1.32,-.035]} rotation={[.12,0,0]} castShadow><sphereGeometry args={[.306,12,8,0,Math.PI*2,0,Math.PI*.57]}/><meshStandardMaterial color='#3d3028'/></mesh>
  {[-.105,.105].map(x=><mesh key={x} position={[x,1.235,.271]}><sphereGeometry args={[.023,6,4]}/><meshBasicMaterial color='#332d27'/></mesh>)}
  <mesh position={[0,1.15,.28]}><sphereGeometry args={[.017,6,4]}/><meshBasicMaterial color='#ac674b'/></mesh>
 </group>;
}
export function OrientalPearl({night=false}:{night?:boolean}){
 const legs=[0,Math.PI*2/3,Math.PI*4/3];
 return <group><mesh position={[0,.18,0]} receiveShadow><cylinderGeometry args={[1.65,1.85,.35,16]}/><meshStandardMaterial color='#c6c7b6'/></mesh>
  {legs.map((a,i)=><group key={i}><mesh position={[Math.sin(a)*.5,2.05,Math.cos(a)*.5]} rotation={[Math.cos(a)*-.2,0,Math.sin(a)*.2]} castShadow><cylinderGeometry args={[.17,.26,4.1,8]}/><meshStandardMaterial color='#bdc8bd' metalness={.3} roughness={.4}/></mesh><mesh position={[Math.sin(a)*.55,6.8,Math.cos(a)*.55]} castShadow><cylinderGeometry args={[.11,.15,5.6,8]}/><meshStandardMaterial color='#bbc5bd' metalness={.4} roughness={.35}/></mesh></group>)}
  {[[3.65,1.25],[8.65,.88],[10.55,.3]].map(([y,r],i)=><group key={i} position={[0,y,0]}><mesh castShadow><sphereGeometry args={[r,24,16]}/><meshStandardMaterial color={i===0?'#bd6370':'#bc707a'} metalness={.5} roughness={.32} emissive='#9e383d' emissiveIntensity={night?.25:0}/></mesh>{[-.45,0,.45].map((offset,j)=><mesh key={j} position={[0,offset*r,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[Math.sqrt(1-offset*offset)*r+.012,.025,4,32]}/><meshStandardMaterial color='#e9d8c3' metalness={.4} roughness={.4}/></mesh>)}</group>)}
  <mesh position={[0,11.3,0]} castShadow><cylinderGeometry args={[.025,.075,2,8]}/><meshStandardMaterial color='#b9c8c1' metalness={.5}/></mesh>
 </group>;
}
const jinmaoTiers = [
 {y:0,height:2.55,width:2.35}, {y:2.55,height:1.45,width:2.12}, {y:4,height:1.25,width:1.89},
 {y:5.25,height:1.12,width:1.66}, {y:6.37,height:.98,width:1.43}, {y:7.35,height:.86,width:1.19},
 {y:8.21,height:.76,width:.94}, {y:8.97,height:.64,width:.73},
];
function Jinmao({night}: {night: boolean}) {
 return <group name="jinmao-tower">
  <Block position={[0,.13,0]} size={[2.75,.25,2.75]} color="#929696"/>
  {jinmaoTiers.map(({y,height,width},index)=><group key={y} position={[0,y,0]}>
   <Block position={[0,height/2,0]} size={[width,height,width]} color={index%2?'#7e9597':'#96a6a6'} metalness={.28} roughness={.44}/>
   <Windows width={width} depth={width} height={Math.max(1.15,height)} floors={index===0?3:1} modern night={night}/>
   <Block position={[0,height-.06,0]} size={[width+.13,.12,width+.13]} color={night?'#cfbd93':'#c6c9c1'}/>
  </group>)}
  <mesh position={[0,9.94,0]} castShadow>
   <cylinderGeometry args={[.018,.29,1.24,8]}/>
   <meshStandardMaterial color="#c8c9bd" metalness={.35} roughness={.4} emissive="#a58556" emissiveIntensity={night?.26:0}/>
  </mesh>
 </group>;
}

function FinancialCenter({night}: {night: boolean}) {
 const geometry=useMemo(()=>{
  const facade=new THREE.Shape();
  facade.moveTo(-1.34,0);facade.lineTo(1.34,0);facade.lineTo(1.02,11.5);facade.lineTo(-1.02,11.5);facade.closePath();
  const portal=new THREE.Path();
  portal.moveTo(-.58,9.36);portal.lineTo(-.75,10.91);portal.lineTo(.75,10.91);portal.lineTo(.58,9.36);portal.closePath();
  facade.holes.push(portal);
  const shell=new THREE.ExtrudeGeometry(facade,{depth:1.46,bevelEnabled:false});
  shell.translate(0,0,-.73);
  const lines:number[]=[];
  for(const side of [-1,1]){
   for(let i=1;i<=32;i++){
    const y=i*.28, half=1.34-.32*y/11.5;
    lines.push(-half,y,side*.735,half,y,side*.735);
   }
   for(let i=-3;i<=3;i++) lines.push(i*.315,.2,side*.737,i*.27,9.05,side*.737);
   lines.push(-.58,9.36,side*.738,-.75,10.91,side*.738,-.75,10.91,side*.738,.75,10.91,side*.738,
    .75,10.91,side*.738,.58,9.36,side*.738,.58,9.36,side*.738,-.58,9.36,side*.738);
  }
  const seams=new THREE.BufferGeometry();
  seams.setAttribute('position',new THREE.Float32BufferAttribute(lines,3));
  return {shell,seams};
 },[]);
 useEffect(()=>()=>{geometry.shell.dispose();geometry.seams.dispose();},[geometry]);
 return <group name="world-financial-center">
  <mesh geometry={geometry.shell} castShadow receiveShadow>
   <meshStandardMaterial color={night?'#45606b':'#83a1ab'} metalness={.33} roughness={.34}
    emissive="#374e5c" emissiveIntensity={night?.34:0}/>
  </mesh>
  <lineSegments geometry={geometry.seams}>
   <lineBasicMaterial color={night?'#b0a68e':'#d6e1df'} transparent opacity={night?.65:.68}/>
  </lineSegments>
  <Block position={[0,.1,0]} size={[2.82,.2,1.72]} color="#8b999b"/>
 </group>;
}

function ShanghaiTower({night}: {night: boolean}) {
 const geometry=useMemo(()=>{
  const rings=42,panels=36;
  const vertices:number[]=[],colors:number[]=[],triangles:number[]=[],lines:number[]=[];
  const base=new THREE.Color('#739399'),sky=new THREE.Color('#c2d1cd');
  const panelPoint=(floor:number,panel:number,offset=1)=>{
   const level=floor/rings, angle=panel/panels*Math.PI*2, twist=level*Math.PI*2/3;
   const radius=1.32*(1-.37*level)*(1+.135*Math.cos(3*angle))*offset;
   return [radius*Math.cos(angle+twist),.08+12.88*level+.32*Math.cos(angle-.35)*level**7,
    radius*Math.sin(angle+twist)];
  };
  for(let floor=0;floor<=rings;floor++){
   for(let panel=0;panel<panels;panel++){
    vertices.push(...panelPoint(floor,panel));
    const shade=.37+.25*Math.cos(panel/panels*2*Math.PI+floor*.055)+.11*Math.cos(panel*1.9)+.18*floor/rings;
    const color=base.clone().lerp(sky,shade);
    colors.push(color.r,color.g,color.b);
    const from=floor*panels+panel, next=floor*panels+(panel+1)%panels;
    if(floor<rings) {
     triangles.push(from,from+panels,next,next,from+panels,next+panels);
     if(panel%3===0) lines.push(...panelPoint(floor,panel,1.005),...panelPoint(floor+1,panel,1.005));
    }
    if(floor%2===0) lines.push(...panelPoint(floor,panel,1.005),...panelPoint(floor,panel+1,1.005));
   }
  }
  const crown=vertices.length/3;
  vertices.push(0,12.96,0);colors.push(sky.r,sky.g,sky.b);
  for(let panel=0;panel<panels;panel++) triangles.push(crown,rings*panels+(panel+1)%panels,rings*panels+panel);
  const shell=new THREE.BufferGeometry();
  shell.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  shell.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  shell.setIndex(triangles);shell.computeVertexNormals();
  const seams=new THREE.BufferGeometry();
  seams.setAttribute('position',new THREE.Float32BufferAttribute(lines,3));
  return {shell,seams};
 },[]);
 useEffect(()=>()=>{geometry.shell.dispose();geometry.seams.dispose();},[geometry]);
 return <group name="shanghai-tower">
  <mesh geometry={geometry.shell} castShadow receiveShadow>
   <meshStandardMaterial color={night?'#7c98a7':'#ffffff'} vertexColors metalness={.25} roughness={.28}
    emissive="#405b6c" emissiveIntensity={night?.50:0}/>
  </mesh>
  <lineSegments geometry={geometry.seams}>
   <lineBasicMaterial color={night?'#b9d3db':'#e1eeee'} transparent opacity={night?.52:.57}/>
  </lineSegments>
  <Block position={[0,.11,0]} size={[2.75,.22,2.6]} color="#9faaa6"/>
 </group>;
}
function CornerBuilding({night=false}:{night?:boolean}){
 const body=useMemo(()=>{const s=new THREE.Shape();s.moveTo(-2.8,-1.9);s.lineTo(2.8,-1.9);s.lineTo(-2.8,2.1);s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:5.8,bevelEnabled:true,bevelThickness:.08,bevelSize:.06,bevelSegments:1});g.rotateX(-Math.PI/2);return g;},[]);
 const trim=useMemo(()=>{const s=new THREE.Shape();s.moveTo(-2.86,-1.96);s.lineTo(2.86,-1.96);s.lineTo(-2.86,2.16);s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:.08,bevelEnabled:false});g.rotateX(-Math.PI/2);return g;},[]);
 return <group rotation={[0,-.2,0]}><mesh geometry={body} material={material('#ad7860')} castShadow receiveShadow/><Windows width={5.4} depth={3.85} height={5.8} floors={6} night={night} frontOnly/><group position={[-2.86,0,-.1]} rotation={[0,-Math.PI/2,0]}><Windows width={3.8} depth={0} height={5.8} floors={6} night={night} frontOnly/></group>{Array.from({length:7},(_,i)=><mesh key={i} geometry={trim} material={material('#dbc2a0')} position={[0,.4+i*.9,0]} castShadow receiveShadow/>)}<Sign text='武 康 照 相 馆' width={3.4} position={[-.2,.8,1.99]}/></group>;
}

export interface ModelSlot { url:string|null; targetHeight?:number; maxWidth?:number; maxDepth?:number; rotationY?:number }
export type ModelManifest = Record<string,ModelSlot>;
class ModelBoundary extends Component<{children:ReactNode;fallback:ReactNode},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return {failed:true};}render(){return this.state.failed?this.props.fallback:this.props.children;}}
function LoadedModel({url,height,maxWidth,maxDepth,rotationY=0,onLoaded}:{url:string;height:number;maxWidth?:number;maxDepth?:number;rotationY?:number;onLoaded?:()=>void}){const {scene}=useGLTF(url);const model=useMemo(()=>{const root=new THREE.Group();root.add(scene.clone(true));root.rotation.y=rotationY;root.traverse(o=>{if((o as THREE.Mesh).isMesh){o.castShadow=true;o.receiveShadow=true;}});const box=new THREE.Box3().setFromObject(root),size=new THREE.Vector3(),center=new THREE.Vector3();box.getSize(size);box.getCenter(center);const scale=Math.min(height/Math.max(size.y,.001),maxWidth?maxWidth/Math.max(size.x,.001):Infinity,maxDepth?maxDepth/Math.max(size.z,.001):Infinity);return {root,scale,center,minY:box.min.y};},[scene,height,maxWidth,maxDepth,rotationY]);useEffect(()=>{onLoaded?.();},[url,onLoaded]);return <group scale={model.scale}><group position={[-model.center.x,-model.minY,-model.center.z]}><primitive object={model.root}/></group></group>;}
export function ModelSlotView({slot,manifest,children,height,onLoaded}:{slot:string;manifest:ModelManifest;children:ReactNode;height:number;onLoaded?:()=>void}){const entry=manifest[slot];return entry?.url?<ModelBoundary key={entry.url} fallback={children}><Suspense fallback={children}><LoadedModel url={entry.url} onLoaded={onLoaded} height={entry.targetHeight??height} maxWidth={entry.maxWidth} maxDepth={entry.maxDepth} rotationY={entry.rotationY}/></Suspense></ModelBoundary>:children;}

function BundClock({height,night}: {height:number;night:boolean}) {
 const face=useMemo(()=>{
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=192;
  const ctx=canvas.getContext('2d')!;
  ctx.translate(96,96);
  ctx.fillStyle='#343d39';
  ctx.fillRect(-96,-96,192,192);
  ctx.beginPath();ctx.arc(0,0,78,0,2*Math.PI);ctx.fillStyle='#e2dac3';ctx.fill();
  ctx.strokeStyle='#454a41';ctx.lineWidth=4;
  for(let i=0;i<12;i++){
   const a=i*Math.PI/6;
   ctx.beginPath();ctx.moveTo(63*Math.sin(a),63*Math.cos(a));ctx.lineTo(73*Math.sin(a),73*Math.cos(a));ctx.stroke();
  }
  ctx.lineWidth=7;
  ctx.beginPath();ctx.moveTo(-33,13);ctx.lineTo(0,0);ctx.lineTo(24,-47);ctx.stroke();
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  return texture;
 },[]);
 useEffect(()=>()=>face.dispose(),[face]);
 return <group position={[0,height,0]}>
  <Block position={[0,.2,0]} size={[1.96,.4,1.77]} color="#b0aea0"/>
  <Block position={[0,1.19,0]} size={[1.57,1.82,1.57]} color="#c3beb0"/>
  <Block position={[0,2.17,0]} size={[1.79,.18,1.79]} color="#b5b1a5"/>
  <Block position={[0,2.32,0]} size={[1.49,.2,1.49]} color="#8a8d83"/>
  {[0,1,2,3].map(side=><group key={side} rotation={[0,side*Math.PI/2,0]}>
   <mesh position={[0,1.55,.79]}>
    <planeGeometry args={[.91,.91]}/>
    <meshBasicMaterial map={face} color={night?'#ffdda0':'#f3eee0'}/>
   </mesh>
   {[-.52,.52].map(x=><Block key={x} position={[x,.77,.802]} size={[.16,.44,.04]} color="#5e6b69"/>)}
  </group>)}
 </group>;
}

function BundHeritage({kind,width,depth,height,night,stone,copper}: {
 kind:'peace-hotel'|'customs-house';width:number;depth:number;height:number;night:boolean;
 stone?:THREE.Texture;copper?:THREE.Texture;
}) {
 const hotel=kind==='peace-hotel';
 const trim=hotel?'#b4a89b':'#c8c0ad';
 const columns=hotel?[-2.66,-1.97,-1.28,0,1.28,1.97,2.66]:[-2.54,-1.71,-.86,0,.86,1.71,2.54];
 return <group name={kind} rotation={[0,Math.PI/2,0]}>
  <mesh position={[0,height/2,0]} castShadow receiveShadow>
   <boxGeometry args={[width,height,depth]}/>
   <meshStandardMaterial color={stone?'#d6d0c0':'#aca79b'} map={stone} bumpMap={stone} bumpScale={.043} roughness={.91}/>
  </mesh>
  <Windows width={width} depth={depth} height={height} floors={hotel?5:4} night={night}/>
  {[.26,1.14,height-.45,height-.08].map((y,i)=><Block key={y} position={[0,y,0]}
   size={[width+.19,.11+i*.023,depth+.18]} color={trim}/>)}
  {[-1,1].map(side=><group key={side} rotation={[0,side===1?0:Math.PI,0]}>
   {columns.map(x=><Block key={x} position={[x,height*.48,depth/2+.038]} size={[.16,height*.73,.108]} color={trim}/>)}
   <Block position={[0,.53,depth/2+.09]} size={[.75,.91,.15]} color={night?'#b39968':'#526661'}/>
   {[-1.41,1.41].map(x=><Block key={x} position={[x,.58,depth/2+.077]}
    size={[.47,.76,.08]} color={night?'#967e55':'#596b68'}/>)}
  </group>)}
  {hotel?<group position={[.98,height,0]}>
   <Block position={[0,.28,0]} size={[2.73,.56,2.58]} color="#a6998b"/>
   <mesh position={[0,1.37,0]} rotation={[0,Math.PI/4,0]} castShadow receiveShadow>
    <coneGeometry args={[1.83,1.7,4]}/>
    <meshStandardMaterial color="#6a8972" map={copper} bumpMap={copper} bumpScale={.027}
     metalness={.16} roughness={.75} emissive="#285144" emissiveIntensity={night?.12:0}/>
   </mesh>
   <Block position={[0,2.25,0]} size={[.11,.28,.11]} color="#66766a"/>
  </group>:<BundClock height={height} night={night}/>}
 </group>;
}

const skylineModels = {'oriental-pearl':OrientalPearl,jinmao:Jinmao,'financial-center':FinancialCenter,'shanghai-tower':ShanghaiTower};

export interface BuildingSpec {x:number;z:number;width:number;depth:number;height:number;kind:'house'|'office';color?:string;shop?:string;roof?:string}
export function getBuildings(district:DistrictId):BuildingSpec[]{
 if(district==='bund')return [
  {x:-9.7,z:-6.5,width:3.55,depth:3.6,height:3.5,kind:'house',shop:'沪上邮局',roof:'#77635a'},
  {x:-5.3,z:-6.5,width:3.4,depth:3.7,height:4.25,kind:'house',shop:'和平书店',roof:'#8b5c4d'},
  {x:-9.25,z:5.8,width:3.5,depth:3.2,height:3.0,kind:'house',shop:'弄堂生煎',roof:'#8a6359'},
  {x:-4.9,z:5.8,width:3.5,depth:3.4,height:3.6,kind:'house',shop:'老街照相',roof:'#6d6b5a'},
 ];
 if(district==='anfu')return [
  {x:-9.4,z:-6.3,width:3.8,depth:3.85,height:3.7,kind:'house',color:'#e9d3b8',shop:'今天花店',roof:'#746052'},
  {x:-4.8,z:-6.15,width:4.05,depth:4.16,height:4.35,kind:'house',color:'#d8b199',shop:'小小书店',roof:'#665b53'},
  {x:1.25,z:-6.45,width:4.2,depth:4.0,height:3.6,kind:'house',color:'#e6c9ac',shop:'面包出炉',roof:'#8c6b5a'},
  {x:7.4,z:-6.5,width:4.3,depth:3.9,height:4.6,kind:'house',color:'#d7bc9e',shop:'沪上理发',roof:'#6c675a'},
  {x:-9.5,z:7.1,width:3.5,depth:3.5,height:3.25,kind:'house',color:'#e4c6aa',shop:'不急咖啡',roof:'#936151'},
 ];
 if(district==='people')return [
  {x:-10.15,z:7.7,width:3.55,depth:3.0,height:2.55,kind:'house',shop:'人民茶馆',roof:'#7b6656'},
  {x:10.8,z:6.9,width:3.35,depth:3.2,height:2.85,kind:'house',shop:'一碗馄饨',roof:'#786754'},
 ];
 if(district==='lujiazui')return [...[-8,-4,4,8].map((x,i)=>({x,z:6,width:3.15,depth:3.4,height:[5,6.5,4.7,5.9][i],kind:'office' as const,color:['#b1b9a5','#8fa8a0','#c6c2a7','#acbdb1'][i]})),{x:-7,z:-5.5,width:4,depth:4,height:7.4,kind:'office'}];
 if(district==='zhangjiang')return [];
 return [
  {x:-8.4,z:6.8,width:3.85,depth:3.5,height:2.6,kind:'house',color:'#bdb296',shop:'邻里菜场',roof:'#696c58'},
  {x:-3.85,z:7.15,width:3.4,depth:3.25,height:2.35,kind:'house',color:'#c4b89d',shop:'修修补补',roof:'#736254'},
 ];
}
export function getObstacles(district:DistrictId):Obstacle[] {
 const footprints:Obstacle[]=getBuildings(district).map(b=>({x:b.x,z:b.z,width:b.width+.22,depth:b.depth+.25}));
 footprints.push(...districtFootprints(district));
 if(district==='bund') {
  footprints.push(...BUND_LANDMARKS.map(b=>({x:b.x,z:b.z,width:b.width+.22,depth:b.depth+.25})));
  const width=BUND_BANK.eastEnd-BUND_BANK.westQuay;
  footprints.push({x:BUND_BANK.westQuay+width/2,z:0,width,depth:BUND_BANK.length+1},
   {x:-2.6,z:9,width:1.65,depth:1.7});
 }
 if(district==='lujiazui') {
  footprints.push(...PUDONG_LANDMARKS.map(tower=>({
   x:tower.local[0],z:tower.local[1],width:tower.width,depth:tower.depth,
  })));
 }
 return footprints;
}

export function CityArchitecture({district,night,manifest,wallMap,laneBrick,bundStone,bundCopper,onLoaded}: {
 district:DistrictId;night:boolean;manifest:ModelManifest;wallMap?:THREE.Texture;
 laneBrick?:THREE.Texture;bundStone?:THREE.Texture;bundCopper?:THREE.Texture;onLoaded?:(slot:string)=>void;
}) {
 const buildings=getBuildings(district);
 return <group>
  {buildings.map(b=>{
   const building=b.kind==='house'
    ? <House width={b.width} depth={b.depth} height={b.height} color={b.color} roof={b.roof} shop={b.shop} night={night} wallMap={district==='anfu'?laneBrick??wallMap:wallMap}/>
    : <Office width={b.width} depth={b.depth} height={b.height} color={b.color} night={night}/>;
   return <group key={b.x+':'+b.z} position={[b.x,0,b.z]}>{building}</group>;
  })}
  {district==='bund'&&BUND_LANDMARKS.map(b=>{
   const facade=<BundHeritage kind={b.id} width={b.depth} depth={b.width} height={b.height}
    night={night} stone={bundStone??wallMap} copper={bundCopper}/>;
   return <group key={b.id} position={[b.x,0,b.z]}>
    {b.id==='customs-house'?<ModelSlotView slot="bund-facade" manifest={manifest} height={b.height+2.3}>{facade}</ModelSlotView>:facade}
   </group>;
  })}
  {(district==='bund'||district==='lujiazui')&&PUDONG_LANDMARKS.map(tower=>{
   const east=district==='bund';
   const [x,z]=east?tower.east:tower.local;
   const Tower=skylineModels[tower.id];
   return <group key={tower.id} position={[x,0,z]} rotation={[0,east?tower.eastTurn:tower.localTurn,0]}>
    <ModelSlotView slot={tower.id} manifest={manifest} height={tower.height} onLoaded={()=>onLoaded?.(tower.id)}>
     <Tower night={night}/>
    </ModelSlotView>
   </group>;
  })}
 {district==='anfu'&&<group position={[WUKANG_FOOTPRINT.x,0,WUKANG_FOOTPRINT.z]}><ModelSlotView slot='wukang-corner' manifest={manifest} height={6.5} onLoaded={()=>onLoaded?.('wukang-corner')}><CornerBuilding night={night}/></ModelSlotView></group>}

 </group>;}


export function NightOwlPostbox({manifest,onOpen,onLoaded}:{manifest:ModelManifest;onOpen?:()=>void;onLoaded?:()=>void}){
 if(!manifest['night-owl']?.url)return null;
 return <group name="night-owl-postbox" position={[-2.6,0,9]} onPointerDown={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();onOpen?.();}}>
  <Block position={[0,.09,0]} size={[1.55,.18,1.3]} color="#d4c3a1"/>
  <Round position={[0,.61,0]} size={[1.1,.92,.88]} color="#294e3d" radius={.08}/>
  <Block position={[0,.79,.45]} size={[.65,.08,.025]} color="#d5b273"/>
  <Sign text="今朝收工了伐" width={.88} position={[0,.45,.46]} color="#294e3d" ink="#e7c98d"/>
  <group position={[0,1.09,0]} rotation={[0,.25,0]}><ModelSlotView slot="night-owl" manifest={manifest} height={2.25} onLoaded={onLoaded}><group/></ModelSlotView></group>
 </group>;
}
