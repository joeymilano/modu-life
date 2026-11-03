import { Component, Suspense, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { RoundedBox, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { DistrictId } from '../game/types';
import type { Obstacle } from './pathfinding';

const BOX=new THREE.BoxGeometry(1,1,1);
const paint=new Map<string,THREE.MeshStandardMaterial>();
function material(color:string,metalness=0,roughness=.8){const key=color+metalness+roughness;let m=paint.get(key);if(!m){m=new THREE.MeshStandardMaterial({color,metalness,roughness});paint.set(key,m);}return m;}
export function Block({position=[0,0,0],size=[1,1,1],color='#e5dcc5',rotation=[0,0,0],metalness=0,roughness=.8,shadow=true}:{position?:[number,number,number];size?:[number,number,number];color?:string;rotation?:[number,number,number];metalness?:number;roughness?:number;shadow?:boolean}){
 return <mesh geometry={BOX} material={material(color,metalness,roughness)} position={position} scale={size} rotation={rotation} castShadow={shadow} receiveShadow dispose={null}/>;
}
function Round({position=[0,0,0],size=[1,1,1],color='#dfd8bd',radius=.08}:{position?:[number,number,number];size?:[number,number,number];color?:string;radius?:number}){return <RoundedBox args={size} radius={radius} smoothness={2} position={position} castShadow receiveShadow><meshStandardMaterial color={color} roughness={.85}/></RoundedBox>;}
const signTextures=new Map<string,THREE.CanvasTexture>();
function Sign({text,width=1.5,position=[0,0,0],color='#314a3b',ink='#f9edcf'}:{text:string;width?:number;position?:[number,number,number];color?:string;ink?:string}){
 const texture=useMemo(()=>{const key=text+color+ink;let t=signTextures.get(key);if(!t){const c=document.createElement('canvas');c.width=768;c.height=176;const ctx=c.getContext('2d')!;ctx.fillStyle=color;ctx.fillRect(0,0,768,176);ctx.strokeStyle=ink;ctx.lineWidth=3;ctx.strokeRect(10,10,748,156);ctx.fillStyle=ink;ctx.font='bold 68px "Songti SC", "Noto Serif CJK SC", serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,384,91);t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;signTextures.set(key,t);}return t;},[text,color,ink]);
 return <mesh position={position}><planeGeometry args={[width,width*.229]}/><meshBasicMaterial map={texture} toneMapped={false}/></mesh>;
}
function Windows({width,depth,height,floors=4,night=false,modern=false,frontOnly=false}:{width:number;depth:number;height:number;floors?:number;night?:boolean;modern?:boolean;frontOnly?:boolean}){
 const ref=useRef<THREE.InstancedMesh>(null);
 const columns=Math.max(2,Math.floor(width/.65)),sideColumns=Math.max(2,Math.floor(depth/.75));
 const data=useMemo(()=>{const a:{p:[number,number,number];r:number;s:[number,number,number]}[]=[];for(let f=0;f<floors;f++){const y=.62+(f+.1)*(height-.9)/floors;for(let c=0;c<columns;c++){const x=-width/2+(c+.5)*width/columns;for(const z of (frontOnly?[1]:[-1,1]))a.push({p:[x,y,z*(depth/2+.018)],r:0,s:[modern?width/columns*.74:.32,modern?(height-.9)/floors*.72:.46,.035]});}if(!frontOnly)for(let c=0;c<sideColumns;c++){const z=-depth/2+(c+.5)*depth/sideColumns;for(const x of [-1,1])a.push({p:[x*(width/2+.018),y,z],r:Math.PI/2,s:[modern?depth/sideColumns*.74:.31,modern?(height-.9)/floors*.72:.46,.035]});}}return a;},[width,depth,height,floors,columns,sideColumns,modern,frontOnly]);
 useEffect(()=>{if(!ref.current)return;const o=new THREE.Object3D();data.forEach((v,i)=>{o.position.set(...v.p);o.rotation.set(0,v.r,0);o.scale.set(...v.s);o.updateMatrix();ref.current!.setMatrixAt(i,o.matrix);ref.current!.setColorAt(i,new THREE.Color(night?(i%4===0?'#f2cd78':'#44635e'):(i%6===0?'#ceb98a':modern?'#87aaa5':'#4f6860')));});ref.current.instanceMatrix.needsUpdate=true;if(ref.current.instanceColor)ref.current.instanceColor.needsUpdate=true;},[data,night]);
 return <instancedMesh ref={ref} args={[BOX,undefined,data.length]} dispose={null}><meshStandardMaterial metalness={modern?.35:.05} roughness={modern?.25:.8} emissive={night?'#bc8a39':'#000'} emissiveIntensity={night?.12:0}/></instancedMesh>;
}
function PitchedRoof({width,depth,color='#a8523d'}:{width:number;depth:number;color?:string}){
 const geom=useMemo(()=>{const shape=new THREE.Shape();shape.moveTo(-width/2,0);shape.lineTo(0,.64);shape.lineTo(width/2,0);shape.closePath();const g=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false});g.translate(0,0,-depth/2);return g;},[width,depth]);
 return <mesh geometry={geom} material={material(color)} castShadow receiveShadow dispose={null}/>;
}
export function House({position=[0,0,0],width=3,depth=3,height=3.5,color='#e7d9b8',night=false,shop='弄堂生煎',roof='#a95642'}:{position?:[number,number,number];width?:number;depth?:number;height?:number;color?:string;night?:boolean;shop?:string;roof?:string}){
 const floors=Math.max(2,Math.round(height/.9));
 return <group position={position}>
  <Block position={[0,height/2,0]} size={[width,height,depth]} color={color}/>
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
export function Tree({position=[0,0,0],small=false,tone=0}:{position?:[number,number,number];small?:boolean;tone?:number}){
 const size=small?.55:1;
 return <group position={position} scale={size}><mesh position={[0,.7,0]} castShadow><cylinderGeometry args={[.07,.12,1.4,6]}/><meshStandardMaterial color='#827056'/></mesh><mesh position={[0,1.7,0]} scale={[1.03,.78,.9]} castShadow receiveShadow><icosahedronGeometry args={[.88,1]}/><meshStandardMaterial color={tone%3===0?'#476c4a':tone%3===1?'#6a8250':'#8e975e'} roughness={.94}/></mesh><mesh position={[.45,1.65,-.18]} scale={[.65,.62,.75]} castShadow><icosahedronGeometry args={[.65,0]}/><meshStandardMaterial color={tone%2?'#71884e':'#526f45'}/></mesh></group>;
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
export function Jinmao({night=false}:{night?:boolean}){return <group>{Array.from({length:9},(_,i)=>{const w=2.4-i*.19,h=1.05;return <group key={i} position={[0,i*.96,0]}><Block position={[0,h/2,0]} size={[w,h,w]} color={i%2?'#b8c3b8':'#9fada7'} metalness={.3} roughness={.4}/><Windows width={w} depth={w} height={h} floors={1} modern night={night}/><Block position={[0,h,0]} size={[w+.15,.12,w+.15]} color='#dddcc9'/></group>})}<mesh position={[0,9.7,0]}><cylinderGeometry args={[.025,.16,1.7,8]}/><meshStandardMaterial color='#c9cbbd'/></mesh></group>;}
export function FinancialCenter({night=false}:{night?:boolean}){return <group><Block position={[0,4.65,0]} size={[2.4,9.3,1.55]} color='#7c9e9a' metalness={.4} roughness={.3}/><Windows width={2.4} depth={1.55} height={9.3} floors={13} modern night={night}/><Block position={[-.9,10.1,0]} size={[.6,1.7,1.55]} color='#98b6ad' metalness={.4}/><Block position={[.9,10.1,0]} size={[.6,1.7,1.55]} color='#98b6ad' metalness={.4}/><Block position={[0,11.05,0]} size={[2.4,.55,1.55]} color='#b9c9bd' metalness={.4}/></group>;}
export function ShanghaiTower({night=false}:{night?:boolean}){return <group>{Array.from({length:18},(_,i)=>{const r=1.25-i*.029;return <group key={i} position={[0,i*.69+.36,0]} rotation={[0,i*.065,0]}><mesh castShadow receiveShadow><cylinderGeometry args={[r-.028,r,.71,8]}/><meshStandardMaterial color={i%2?'#99b6aa':'#b4c9b9'} metalness={.4} roughness={.28}/></mesh><mesh position={[0,.34,0]}><cylinderGeometry args={[r+.02,r+.02,.04,8]}/><meshStandardMaterial color={night?'#d8c486':'#d4ded0'}/></mesh></group>})}<mesh position={[0,12.7,0]}><cylinderGeometry args={[.22,.72,.65,8]}/><meshStandardMaterial color='#bbcdb9'/></mesh></group>;}
function CornerBuilding({night=false}:{night?:boolean}){
 const body=useMemo(()=>{const s=new THREE.Shape();s.moveTo(-2.8,-1.9);s.lineTo(2.8,-1.9);s.lineTo(-2.8,2.1);s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:5.8,bevelEnabled:true,bevelThickness:.08,bevelSize:.06,bevelSegments:1});g.rotateX(-Math.PI/2);return g;},[]);
 const trim=useMemo(()=>{const s=new THREE.Shape();s.moveTo(-2.86,-1.96);s.lineTo(2.86,-1.96);s.lineTo(-2.86,2.16);s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:.08,bevelEnabled:false});g.rotateX(-Math.PI/2);return g;},[]);
 return <group rotation={[0,-.2,0]}><mesh geometry={body} material={material('#ad7860')} castShadow receiveShadow/><Windows width={5.4} depth={3.85} height={5.8} floors={6} night={night} frontOnly/><group position={[-2.86,0,-.1]} rotation={[0,-Math.PI/2,0]}><Windows width={3.8} depth={0} height={5.8} floors={6} night={night} frontOnly/></group>{Array.from({length:7},(_,i)=><mesh key={i} geometry={trim} material={material('#dbc2a0')} position={[0,.4+i*.9,0]} castShadow receiveShadow/>)}<Sign text='武 康 照 相 馆' width={3.4} position={[-.2,.8,1.99]}/></group>;
}

export interface ModelSlot { url:string|null; targetHeight?:number; maxWidth?:number; maxDepth?:number }
export type ModelManifest = Record<string,ModelSlot>;
class ModelBoundary extends Component<{children:ReactNode;fallback:ReactNode},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return {failed:true};}render(){return this.state.failed?this.props.fallback:this.props.children;}}
function LoadedModel({url,height,maxWidth,maxDepth}:{url:string;height:number;maxWidth?:number;maxDepth?:number}){const {scene}=useGLTF(url);const model=useMemo(()=>{const root=scene.clone(true);root.traverse(o=>{if((o as THREE.Mesh).isMesh){o.castShadow=true;o.receiveShadow=true;}});const box=new THREE.Box3().setFromObject(root),size=new THREE.Vector3(),center=new THREE.Vector3();box.getSize(size);box.getCenter(center);const scale=Math.min(height/Math.max(size.y,.001),maxWidth?maxWidth/Math.max(size.x,.001):Infinity,maxDepth?maxDepth/Math.max(size.z,.001):Infinity);return {root,scale,center,minY:box.min.y};},[scene,height,maxWidth,maxDepth]);return <group scale={model.scale}><primitive object={model.root} position={[-model.center.x,-model.minY,-model.center.z]}/></group>;}
export function ModelSlotView({slot,manifest,children,height}:{slot:string;manifest:ModelManifest;children:ReactNode;height:number}){const entry=manifest[slot];return entry?.url?<ModelBoundary key={entry.url} fallback={children}><Suspense fallback={children}><LoadedModel url={entry.url} height={entry.targetHeight??height} maxWidth={entry.maxWidth} maxDepth={entry.maxDepth}/></Suspense></ModelBoundary>:children;}

export interface BuildingSpec {x:number;z:number;width:number;depth:number;height:number;kind:'house'|'office';color?:string;shop?:string;roof?:string}
const HOUSE_POS=[-8,-4,4,8];
export function getBuildings(district:DistrictId):BuildingSpec[]{
 if(district==='bund')return [...[-8,-4].map((x,i)=>({x,z:-5.8,width:3.1,depth:3.2,height:4.4+i*.5,kind:'house' as const,shop:['沪上邮局','和平书店'][i]})),...HOUSE_POS.map((x,i)=>({x,z:5.5,width:3.1,depth:3.2,height:3.4+(i%2)*.6,kind:'house' as const,shop:['弄堂生煎','梧桐花店','好好咖啡','老街照相'][i]}))];
 if(district==='anfu')return [...HOUSE_POS.map((x,i)=>({x,z:-5.9,width:3.1,depth:3.8,height:3.6+(i%3)*.55,kind:'house' as const,color:['#dcc9a8','#b99777','#d8c7a9','#e2d1b0'][i],shop:['面包与早晨','小小书店','弄里咖啡','今天花店'][i]})),...[-8,-4].map((x,i)=>({x,z:5.7,width:3.1,depth:3.4,height:3.5,kind:'house' as const,shop:['沪上理发','只此旧物'][i]}))];
 if(district==='people')return [...HOUSE_POS.map((x,i)=>({x,z:6,width:3.1,depth:3.5,height:3.5+i%2,kind:'house' as const,shop:['人民茶馆','简历复印','一碗馄饨','人民书店'][i]})),{x:7,z:-6,width:4.2,depth:3.4,height:4.8,kind:'office',color:'#b9bba4'}];
 if(district==='lujiazui')return [...[-8,-4,4,8].map((x,i)=>({x,z:6,width:3.15,depth:3.4,height:[5,6.5,4.7,5.9][i],kind:'office' as const,color:['#b1b9a5','#8fa8a0','#c6c2a7','#acbdb1'][i]})),{x:-7,z:-5.5,width:4,depth:4,height:7.4,kind:'office'}];
 if(district==='zhangjiang')return [...HOUSE_POS.map((x,i)=>({x,z:-6,width:3.3,depth:3.7,height:[4.4,5.6,4.8,4.2][i],kind:'office' as const,color:['#aac4b4','#d8d4b8','#9fb6ab','#b8c6b6'][i]})),...[-8,7].map(x=>({x,z:6,width:4.1,depth:3.7,height:3.3,kind:'office' as const,color:'#d1cfb6'}))];
 return [...HOUSE_POS.map((x,i)=>({x,z:-6,width:3.2,depth:3.6,height:[5.5,6.5,5.8,5][i],kind:'house' as const,color:['#d2c9aa','#c6b99a','#d9c6a4','#cbb799'][i],roof:'#716d56',shop:['小区东门','邻里服务','望月公寓','青年公寓'][i]})),...HOUSE_POS.map((x,i)=>({x,z:6,width:3.1,depth:3.5,height:2.5+i%2*.4,kind:'house' as const,shop:['邻里菜场','房屋租售','早点铺','修修补补'][i]}))];
}
export function getObstacles(district:DistrictId):Obstacle[]{const a:Obstacle[]=getBuildings(district).map(b=>({x:b.x,z:b.z,width:b.width+.22,depth:b.depth+.25}));if(district==='bund'||district==='lujiazui'){a.push({x:2.6,z:-5.8,width:2.8,depth:2.8},{x:6,z:-7,width:2.4,depth:2.4},{x:8.2,z:-3.9,width:2.1,depth:2.1},{x:-1.2,z:-8.5,width:2.4,depth:2.4});if(district==='bund')a.push({x:13,z:0,width:5.2,depth:25});}if(district==='anfu')a.push({x:5,z:6,width:5.8,depth:4.2});if(district==='people')a.push({x:-6,z:-5,width:5.8,depth:3.6});return a;}
export function CityArchitecture({district,night,manifest}:{district:DistrictId;night:boolean;manifest:ModelManifest}){const buildings=getBuildings(district);return <group>
 {buildings.map((b,i)=>{const building=b.kind==='house'?<House width={b.width} depth={b.depth} height={b.height} color={b.color} roof={b.roof} shop={b.shop} night={night}/>:<Office width={b.width} depth={b.depth} height={b.height} color={b.color} night={night}/>;const slot=district==='bund'&&i===0?'bund-facade':district==='zhangjiang'&&i===1?'zhangjiang-campus':district==='xinzhuang'&&i===0?'residential-block':null;return <group key={i} position={[b.x,0,b.z]}>{slot?<ModelSlotView slot={slot} manifest={manifest} height={b.height}>{building}</ModelSlotView>:building}</group>;})}
 {(district==='bund'||district==='lujiazui')&&<><group position={[2.6,0,-5.8]}><ModelSlotView slot='oriental-pearl' manifest={manifest} height={12.2}><OrientalPearl night={night}/></ModelSlotView></group><group position={[6,0,-7]}><ModelSlotView slot='shanghai-tower' manifest={manifest} height={13.2}><ShanghaiTower night={night}/></ModelSlotView></group><group position={[8.2,0,-3.9]} rotation={[0,.72,0]}><ModelSlotView slot='financial-center' manifest={manifest} height={11.5}><FinancialCenter night={night}/></ModelSlotView></group><group position={[-1.2,0,-8.5]}><ModelSlotView slot='jinmao' manifest={manifest} height={10.5}><Jinmao night={night}/></ModelSlotView></group></>}
 {district==='anfu'&&<group position={[5,0,6]}><ModelSlotView slot='wukang-corner' manifest={manifest} height={6.5}><CornerBuilding night={night}/></ModelSlotView></group>}
 {district==='people'&&<><mesh position={[-6,.025,-5]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[2.1,32]}/><meshStandardMaterial color='#80a99b' metalness={.22} roughness={.2}/></mesh><group position={[-6,0,-5]}><mesh position={[0,.42,0]}><cylinderGeometry args={[.55,.72,.8,12]}/><meshStandardMaterial color='#c7cab0'/></mesh><mesh position={[0,.88,0]}><sphereGeometry args={[.27,12,8]}/><meshStandardMaterial color='#e9dfba'/></mesh></group><group position={[3,0,-5.8]}><mesh position={[0,2.2,0]}><coneGeometry args={[1.8,.9,6]}/><meshStandardMaterial color='#687965'/></mesh>{[0,1,2,3,4,5].map(i=><Block key={i} position={[Math.sin(i*Math.PI/3)*1.4,1,Math.cos(i*Math.PI/3)*1.4]} size={[.12,2,.12]} color='#d6c39a'/>)}</group></>}
 {district==='zhangjiang'&&<group position={[0,0,5.8]}><Round position={[0,.12,0]} size={[7,.24,3.9]} color='#d5d6be' radius={.12}/><mesh position={[0,2,0]} rotation={[Math.PI/2,0,0]} castShadow><torusGeometry args={[1.4,.12,6,32]}/><meshStandardMaterial color='#c27045' metalness={.2}/></mesh><Sign text='把问题留在这里' width={2.5} position={[0,.8,1.9]} color='#8f613c'/></group>}
 </group>;}
