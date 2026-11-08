import { useEffect, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { DistrictId } from '../game/types';
import { Bench, Block, Lamp, ModelSlotView, Sign, Tree, Umbrella, type ModelManifest } from './CityModels';
import { CitySurface, type CityTextures } from './CitySurfaces';
import { CAMPUS_POND, PEOPLE_MUSEUM, PEOPLE_POND, RESEARCH_BUILDINGS, XIN_RESIDENCES, XIN_STALLS, XIN_STATION } from './districtLayout';

type Vector = [number,number,number];
type Detail = {position:Vector;size:Vector;color:string};

function Details({parts}: {parts:Detail[]}) {
 const ref=useRef<THREE.InstancedMesh>(null);
 useEffect(()=>{
  const mesh=ref.current;
  if(!mesh)return;
  const object=new THREE.Object3D();
  const tint=new THREE.Color();
  parts.forEach(({position,size,color},index)=>{
   object.position.set(...position);object.scale.set(...size);object.updateMatrix();
   mesh.setMatrixAt(index,object.matrix);mesh.setColorAt(index,tint.set(color));
  });
  mesh.instanceMatrix.needsUpdate=true;
  if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
  mesh.computeBoundingSphere();
 },[parts]);
 return <instancedMesh ref={ref} args={[undefined,undefined,parts.length]} receiveShadow>
  <boxGeometry/>
  <meshStandardMaterial roughness={.73}/>
 </instancedMesh>;
}

function Bike({position,turn=0}: {position:Vector;turn?:number}) {
 return <group position={position} rotation={[0,turn,0]}>
  {[-.41,.41].map(x=><mesh key={x} position={[x,.26,0]} castShadow>
   <torusGeometry args={[.235,.028,5,16]}/><meshStandardMaterial color="#3a4140" roughness={.85}/>
  </mesh>)}
  <Block position={[0,.38,0]} size={[.51,.04,.037]} rotation={[0,0,.25]} color="#677a69"/>
  <Block position={[-.18,.43,0]} size={[.045,.43,.035]} rotation={[0,0,.32]} color="#677a69"/>
  <Block position={[.32,.45,0]} size={[.035,.45,.035]} rotation={[0,0,.24]} color="#656961"/>
  <Block position={[-.17,.65,0]} size={[.19,.053,.14]} color="#4b403b"/>
  <Block position={[.32,.68,0]} size={[.07,.05,.29]} color="#4b403b"/>
 </group>;
}

function Planting({position,span,depth,tone=0}: {position:Vector;span:number;depth:number;tone?:number}) {
 const count=Math.ceil(span/.68);
 return <group position={position}>
  <Block position={[0,.055,0]} size={[span,.11,depth]} color="#979789" shadow={false}/>
  <Block position={[0,.113,0]} size={[span-.12,.018,depth-.12]} color="#686b50" shadow={false}/>
  {Array.from({length:count},(_,i)=><mesh key={i} position={[-span/2+(i+.5)*span/count,.20+(i%3)*.038,Math.sin(i*2.4)*depth*.19]}
   scale={[.34+(i%2)*.09,.16+(i%4)*.039,depth*.38]} castShadow>
   <icosahedronGeometry args={[1,1]}/><meshStandardMaterial color={['#566649','#627352','#7d8156'][(i+tone)%3]} roughness={.97}/>
  </mesh>)}
 </group>;
}

function AnfuStreet({paving,night}: {paving?:THREE.Texture;night:boolean}) {
 return <group name="anfu-plane-tree-lane">
  <CitySurface position={[-6.8,.044,3.2]} size={[10.4,2.85]} map={paving} color="#a9aaa0" tile={3.2} relief={.022}/>
  <CitySurface position={[5.6,.044,-2.55]} size={[11.6,1.65]} map={paving} color="#c2b6a0" tile={3.1} relief={.019}/>
  {[-10.7,-7.1,-3.7,1.3,7.5,11.1].map((x,i)=><Tree key={x} position={[x,0,-2.85]} tone={i}/>)}
  {[-11.1,-6.15,-2.4,10.7].map((x,i)=><Tree key={x} position={[x,0,3.5]} tone={i+1}/>)}
  {[-9.7,-5.2].map((x,i)=><group key={x} position={[x,0,3.62]}>
   <Umbrella color={i===0?'#c5ae78':'#a47361'}/>
   <Bench position={[.32,0,.73]} rotation={Math.PI}/>
   <Block position={[0,.82,0]} size={[.54,.055,.48]} color="#705b47"/>
   <Block position={[.12,.91,.08]} size={[.12,.12,.12]} color="#ded6c5"/>
  </group>)}
  <Planting position={[4.8,.039,-3.35]} span={2.8} depth={.68} tone={1}/>
  <Planting position={[10.4,.039,4.6]} span={2.4} depth={.65}/>
  <Bike position={[-2.3,.045,5.1]} turn={-.22}/>
  <Bike position={[9.5,.045,-3.1]} turn={.14}/>
  <Bench position={[2.9,0,3.08]} rotation={.6}/>
  <Lamp position={[3.6,0,3.08]} night={night}/>
  {night&&<pointLight position={[-6.8,1.65,4.2]} color="#ffd49a" intensity={5.5} distance={6.8}/>}
 </group>;
}

function Museum({night,stone}: {night:boolean;stone?:THREE.Texture}) {
 const {x,z,width,depth}=PEOPLE_MUSEUM;
 return <group name="peoples-square-museum" position={[x,0,z]}>
  <Block position={[0,.10,0]} size={[width,.20,depth]} color="#a5a69b"/>
  <mesh position={[0,1.18,-.12]} castShadow receiveShadow>
   <boxGeometry args={[width-.58,2.0,depth-.65]}/>
   <meshStandardMaterial color="#b6b7a9" map={stone} bumpMap={stone} bumpScale={.031} roughness={.9}/>
  </mesh>
  {[2.16,2.38].map((y,i)=><mesh key={y} position={[0,y,-.15]} castShadow receiveShadow>
   <cylinderGeometry args={[i===0?2.37:2.25,2.45,i===0?.31:.23,40]}/>
   <meshStandardMaterial color={i===0?'#a8a99b':'#858f81'} roughness={.83}/>
  </mesh>)}
  <mesh position={[0,2.78,-.15]} castShadow>
   <cylinderGeometry args={[1.93,2.27,.55,40]}/>
   <meshStandardMaterial color="#9b9e90" roughness={.9}/>
  </mesh>
  {[-1.45,1.45].map(x1=><mesh key={x1} position={[x1,3.06,-.16]} rotation={[0,Math.PI/2,0]} castShadow>
   <torusGeometry args={[.47,.10,7,21,Math.PI]}/><meshStandardMaterial color="#767f73" roughness={.84}/>
  </mesh>)}
  <Details parts={[-1,1].flatMap(side=>[-2.3,-1.55,-.8,0,.8,1.55,2.3].map(col=>({
   position:[col,.94,side*(depth/2-.26)],size:[.38,1.04,.06],color:night?'#baaa83':'#546861',
  })))}/>
  {[0,1,2].map(step=><Block key={step} position={[0,.065+step*.066,depth/2-.16-step*.13]}
   size={[2.45,.12,.48]} color="#aeb2a4"/>)}
  <Sign text="上 海 博 物 馆" width={2.55} position={[0,1.85,depth/2-.28]} color="#565e54" ink="#eee5c9"/>
 </group>;
}

function PeopleSquare({textures,night}: {textures:CityTextures;night:boolean}) {
 const pond=PEOPLE_POND;
 return <group name="peoples-park-square">
  <CitySurface position={[0,.043,-.3]} size={[28.7,5.2]} map={textures.paving} color="#d2cbbb" tile={5} relief={.017}/>
  <RoundedBox args={[11.7,.10,7.9]} radius={.04} smoothness={2} position={[-6.6,.058,-6.55]} receiveShadow>
   <meshStandardMaterial color="#748763" roughness={1}/>
  </RoundedBox>
  <CitySurface position={[-6.3,.122,-3.46]} size={[10.6,1.25]} map={textures.paving} color="#bdb99f" tile={3.5}/>
  <Block position={[pond.x,.145,pond.z]} size={[pond.width,.13,pond.depth]} color="#929d91" shadow={false}/>
  <CitySurface position={[pond.x,.215,pond.z]} size={[pond.width-.18,pond.depth-.18]} map={textures.river}
   color={night?'#55777a':'#83a7a2'} tile={3.9} relief={.016} roughness={.43} metalness={.21}/>
  <Block position={[pond.x,.35,pond.z]} size={[.63,.46,.63]} color="#aab2a2"/>
  <mesh position={[pond.x,.59,pond.z]}>
   <cylinderGeometry args={[.24,.48,.16,16]}/><meshStandardMaterial color="#aab2a2" roughness={.79}/>
  </mesh>
  <CitySurface position={[-6.3,.123,-8.44]} size={[10.5,.82]} map={textures.paving} color="#b4ad94" tile={3.5}/>
  <Planting position={[-6.5,.1,-10]} span={9.4} depth={1.03} tone={1}/>
  <Planting position={[-11.3,.1,-6.27]} span={1.75} depth={1.76}/>
  <Planting position={[-1.97,.1,-6.6]} span={1.45} depth={2.38} tone={1}/>
  <Planting position={[7.2,.04,5.7]} span={3.25} depth={1.05}/>
  <Planting position={[3.35,.04,7.33]} span={3.6} depth={.95} tone={2}/>
  {[-11,-8.65,-4.0,-2].map((x,i)=><Tree key={x} position={[x,0,-8.9]} tone={i}/>)}
  <Tree position={[-10.8,0,4.5]} tone={2}/>
  <Tree position={[7.7,0,5.65]} tone={1}/>
  <Tree position={[3.9,0,7.25]} tone={0}/>
  <Bench position={[-5.92,.12,-4.01]} rotation={Math.PI}/>
  <Bench position={[-8.08,.12,-7.71]}/>
  {[-10.2,-7.65,-5.3].map((x,i)=><group key={x} position={[x,0,3.45]}>
   <Umbrella color={['#87926e','#ac6f57','#b39a69'][i]}/>
   <Block position={[.18,.84,.18]} size={[.34,.05,.42]} color="#e5dec6"/>
   <Bench position={[-.18,0,.95]}/>
  </group>)}
  <group position={[3.1,0,4.65]}>
   <Block position={[0,.1,0]} size={[2.65,.18,1.9]} color="#a9a99c" shadow={false}/>
   <Block position={[0,.66,0]} size={[.85,.14,.85]} color="#a28258"/>
   <Block position={[0,.36,0]} size={[.24,.55,.24]} color="#777d6a"/>
   {[-.56,.56].map(z=><Block key={z} position={[0,.38,z]} size={[.54,.45,.32]} color="#a6a18d"/>)}
   <Umbrella position={[1.16,0,-.35]} color="#7b886d"/>
  </group>
  <Museum night={night} stone={textures['bund-stone']??textures.limestone}/>
 </group>;
}

function ResearchBuilding({width,depth,height,color,night,glass}: {
 width:number;depth:number;height:number;color:string;night:boolean;glass?:THREE.Texture;
}) {
 const parts:Detail[]=[];
 const floorCount=Math.round(height/.78);
 for (const side of [-1,1]) {
  for(let floor=1;floor<=floorCount;floor++){
   const y=.36+floor*(height-.50)/(floorCount+1);
   parts.push(
    {position:[0,y,side*(depth/2+.037)],size:[width+.06,.065,.095],color:'#c5cec9'},
    {position:[side*(width/2+.037),y,0],size:[.095,.065,depth+.06],color:'#b3c4c3'},
   );
   for(let bay=0;bay<Math.floor(width/.55);bay++){
    if((bay+floor*3)%5!==0)continue;
    parts.push({position:[-width/2+.34+bay*.55,y+.27,side*(depth/2+.024)],
     size:[.43,.37,.048],color:night?'#cfbd83':'#7f9b9b'});
   }
  }
  for(let x=-width/2+.29;x<width/2;x+=.52){
   parts.push({position:[x,height/2,side*(depth/2+.046)],size:[.063,height-.38,.119],color:'#c6cec6'});
  }
  for(let z=-depth/2+.29;z<depth/2;z+=.61){
   parts.push({position:[side*(width/2+.046),height/2,z],size:[.119,height-.38,.063],color:'#aebebd'});
  }
 }
 return <group>
  <mesh position={[0,height/2,0]} castShadow receiveShadow>
   <boxGeometry args={[width,height,depth]}/>
   <meshStandardMaterial color={color} map={glass} metalness={.24} roughness={.33}
    emissive="#47636c" emissiveIntensity={night?.2:0}/>
  </mesh>
  <Details parts={parts}/>
  <Block position={[0,.12,0]} size={[width+.34,.24,depth+.36]} color="#b1b8b1"/>
  <Block position={[0,height-.1,0]} size={[width+.16,.21,depth+.17]} color="#bdc4be"/>
  <Block position={[width*.22,height+.23,-depth*.11]} size={[width*.34,.58,depth*.44]} color="#939f99"/>
  <Block position={[0,1.1,depth/2+.35]} size={[width*.6,.14,.89]} color="#697c7d"/>
  <Block position={[0,.62,depth/2+.08]} size={[width*.25,1.12,.09]} color={night?'#d9c496':'#48656c'}/>
 </group>;
}

function Campus({textures,night,manifest,onLoaded}: {
 textures:CityTextures;night:boolean;manifest:ModelManifest;onLoaded?:(id:string)=>void;
}) {
 const pond=CAMPUS_POND;
 return <group name="zhangjiang-research-campus">
  <CitySurface position={[3.5,.042,5.85]} size={[17.1,8.45]} map={textures.paving} color="#b6c0b5" tile={4.4} relief={.018}/>
  {RESEARCH_BUILDINGS.map(building=>{
   const lab=<ResearchBuilding {...building} glass={textures['campus-glass']} night={night}/>;
   return <group key={building.id} position={[building.x,0,building.z]}>
    {building.id==='west-lab'
     ? <ModelSlotView slot="zhangjiang-campus" manifest={manifest} height={building.height} onLoaded={()=>onLoaded?.('zhangjiang-campus')}>{lab}</ModelSlotView>
     : lab}
   </group>;
  })}
  <group name="zhangjiang-skybridge" position={[-1.3,2.95,-6.65]}>
   <Block position={[0,.05,0]} size={[3.85,.24,1.56]} color="#b9c4bd"/>
   <Block position={[0,.55,0]} size={[3.85,.82,1.39]} color={night?'#8e9d85':'#709494'} metalness={.2} roughness={.34}/>
   <Block position={[0,1.05,0]} size={[3.85,.14,1.62]} color="#bec7bd"/>
   <Details parts={[-1.7,-1.23,-.76,-.29,.18,.65,1.12,1.59].map(x=>({
    position:[x,.55,.73],size:[.07,.83,.08],color:'#c8cec4',
   }))}/>
  </group>
  <Block position={[pond.x,.12,pond.z]} size={[pond.width,.17,pond.depth]} color="#8d9b94" shadow={false}/>
  <CitySurface position={[pond.x,.21,pond.z]} size={[pond.width-.24,pond.depth-.24]} map={textures.river}
   color={night?'#577889':'#86a8aa'} tile={4.1} relief={.023} roughness={.37} metalness={.24}/>
  <Block position={[6.9,.08,-2.97]} size={[6.2,.12,1.87]} color="#768968" shadow={false}/>
  <Planting position={[6.9,.14,-3.72]} span={6.2} depth={.62} tone={1}/>
  <Planting position={[8.8,.045,8.4]} span={5.05} depth={1.08}/>
  <Tree position={[10.3,0,8.5]} tone={1}/>
  <Tree position={[5.85,0,8.05]} tone={2}/>
  <Bike position={[2.65,.045,-3.66]} turn={-.22}/>
  {[4.7,7,9.34].map((x,i)=><Tree key={x} position={[x,0,-3.0]} tone={i}/>)}
  <Bench position={[8.5,0,3.85]}/>
  <Bench position={[5.4,0,4.05]} rotation={Math.PI/2}/>
  <Lamp position={[9.8,0,3.95]} night={night}/>
  <Sign text="研 发 楼" width={2.05} position={[-7.85,1.96,8.91]} color="#516a6b" ink="#e7eddf"/>
 </group>;
}

function Residence({width,depth,height,color,night,tile}: {
 width:number;depth:number;height:number;color:string;night:boolean;tile?:THREE.Texture;
}) {
 const stories=Math.floor(height/.9);
 const balconies:Detail[]=[];
 for(let floor=1;floor<stories;floor++){
  const y=.24+floor*(height-.3)/stories;
  for(const side of [-1,1]){
   balconies.push(
    {position:[side*(width/2+.032),y+.39,depth*.16],size:[.045,.47,.69],color:night&&floor%2===0?'#ccb88b':'#6c807b'},
    {position:[side*(width/2+.058),y+.12,depth*.16],size:[.125,.079,.81],color:'#9d9c88'},
   );
  }
  for(const x of [-width*.25,width*.25]){
   balconies.push(
    {position:[x,y+.36,depth/2+.036],size:[.72,.54,.046],color:night&&floor%3===0?'#e4c497':'#536767'},
    {position:[x,y+.01,depth/2+.28],size:[1.23,.13,.57],color:'#b1a894'},
    {position:[x,y+.27,depth/2+.57],size:[1.19,.43,.065],color:'#9e9d8b'},
    {position:[x+.52,y+.54,depth/2+.12],size:[.28,.21,.24],color:'#c2bfb0'},
    {position:[x,y+.36,-depth/2-.027],size:[.62,.44,.063],color:night&&floor%2===0?'#c9ae80':'#6e7771'},
   );
  }
  if(floor%2===1)balconies.push({position:[.52,y+.58,depth/2+.37],size:[.25,.34,.045],color:floor%3===0?'#a37864':'#c3d0c0'});
 }
 return <group>
  <mesh position={[0,height/2,0]} castShadow receiveShadow>
   <boxGeometry args={[width,height,depth]}/>
   <meshStandardMaterial color={color} map={tile} bumpMap={tile} bumpScale={.018} roughness={.91}/>
  </mesh>
  <Details parts={balconies}/>
  <Block position={[0,height,0]} size={[width+.17,.2,depth+.17]} color="#898b7f"/>
  <Block position={[.39,height+.26,-.4]} size={[.91,.52,1.24]} color="#a49b84"/>
  <Block position={[-.66,.56,depth/2+.08]} size={[.57,1.07,.08]} color="#54645b"/>
 </group>;
}

function Station({night}: {night:boolean}) {
 const {x,z,width,depth}=XIN_STATION;
 return <group name="xinzhuang-metro-station" position={[x,0,z]}>
  <Block position={[0,.17,0]} size={[width,.34,depth]} color="#a7aea9"/>
  <Block position={[0,1.06,-.32]} size={[width-.76,1.69,depth-1.08]} color="#9daaa9"/>
  <Block position={[0,1.02,depth/2-.77]} size={[width-.99,1.33,.085]} color={night?'#b9aa86':'#526b72'}/>
  <Details parts={[-2.5,-1.7,-.84,0,.84,1.7,2.5].map(col=>({
   position:[col,.96,depth/2-.71],size:[.10,1.76,.16],color:'#c1c7c0',
  }))}/>
  <Block position={[0,1.93,.32]} size={[width-.32,.26,depth-.31]} color="#7f9092" rotation={[-.08,0,0]}/>
  <Block position={[0,1.94,depth/2+.02]} size={[width-.3,.085,.074]} color="#a05246"/>
  <Block position={[0,2.16,-.55]} size={[width-.30,.17,depth*.48]} color="#aeb8b8"/>
  <Block position={[0,.125,depth/2-.21]} size={[width-.65,.22,.56]} color="#b6b8ae"/>
  <Sign text="莘 庄 站" width={2.56} position={[0,1.66,depth/2-.63]} color="#8c413d"/>
  <Block position={[-2.3,.58,depth/2-.29]} size={[.28,1.12,.19]} color="#963f3a"/>
 </group>;
}

function FoodStall({width,depth,sign,canopy,night}: {
 width:number;depth:number;sign:string;canopy:string;night:boolean;
}) {
 return <group>
  <Block position={[0,.39,0]} size={[width,.78,depth-.11]} color="#7d7664"/>
  <Block position={[0,.79,.08]} size={[width+.14,.16,depth]} color="#ada38d"/>
  <Details parts={[-1,1].flatMap(x=>[-1,1].map(z=>({
   position:[x*(width/2-.08),1.48,z*(depth/2-.08)],size:[.075,1.55,.075],color:'#827e6e',
  })))}/>
  <Block position={[0,2.15,0]} size={[width+.25,.13,depth+.35]} color={canopy} rotation={[-.08,0,0]}/>
  <Block position={[0,2.01,.85]} size={[width+.21,.24,.07]} color={canopy}/>
  <Sign text={sign} width={width*.72} position={[0,1.55,depth/2+.042]} color="#5d5843" ink="#f1dfb3"/>
  <mesh position={[-.31,.96,.18]}><cylinderGeometry args={[.29,.29,.18,14]}/><meshStandardMaterial color="#b8bdad" metalness={.27} roughness={.53}/></mesh>
  <mesh position={[.36,.94,.14]}><cylinderGeometry args={[.20,.19,.24,14]}/><meshStandardMaterial color="#e4d4af" roughness={.78}/></mesh>
  <mesh position={[.05,1.93,.22]}><sphereGeometry args={[.075,7,6]}/>
   <meshStandardMaterial color="#e7d2a0" emissive="#edc48a" emissiveIntensity={night?2:0}/>
  </mesh>
  {night&&<pointLight position={[0,1.8,1.02]} color="#ffc681" intensity={2.3} distance={4.5}/>}
 </group>;
}

function Xinzhuang({textures,night,manifest,onLoaded}: {
 textures:CityTextures;night:boolean;manifest:ModelManifest;onLoaded?:(id:string)=>void;
}) {
 return <group name="xinzhuang-station-and-market">
  <CitySurface position={[5.6,.047,6.5]} size={[15.1,6.4]} map={textures.paving} color="#aaa996" tile={4} relief={.024}/>
  <CitySurface position={[-8.9,.048,-2.65]} size={[9.2,2.8]} map={textures.paving} color="#b9bdac" tile={4} relief={.019}/>
  <Station night={night}/>
  {XIN_RESIDENCES.map(building=>{
   const block=<Residence {...building} night={night} tile={textures['apartment-tile']}/>;
   return <group key={building.id} position={[building.x,0,building.z]}>
    {building.id==='middle-block'
     ? <ModelSlotView slot="residential-block" manifest={manifest} height={building.height} onLoaded={()=>onLoaded?.('residential-block')}>{block}</ModelSlotView>
     : block}
   </group>;
  })}
  {XIN_STALLS.map(stall=><group key={stall.sign} position={[stall.x,0,stall.z]}><FoodStall {...stall} night={night}/></group>)}
  <Bench position={[2.4,0,4.9]} rotation={Math.PI/2}/>
  <Bike position={[-10.8,.048,-3.65]} turn={.31}/>
  <Bike position={[-9.4,.048,-3.62]} turn={.31}/>
  <Tree position={[1.8,0,6.75]} tone={2}/>
  <Tree position={[11.5,0,-5.4]} tone={0}/>
  <Planting position={[11.25,.043,-4.9]} span={1.62} depth={.89} tone={1}/>
  <Planting position={[-.9,.043,-3.85]} span={2.2} depth={.68}/>
  <Block position={[2.3,.12,7.28]} size={[.52,.24,.58]} color="#a28061"/>
  <Block position={[1.64,.095,7.45]} size={[.51,.19,.39]} color="#947956"/>
 </group>;
}

export default function DistrictLandmarks({district,textures,night,manifest,onLoaded}: {
 district:DistrictId;textures:CityTextures;night:boolean;manifest:ModelManifest;onLoaded?:(id:string)=>void;
}) {
 switch(district){
  case 'anfu':return <AnfuStreet paving={textures.paving} night={night}/>;
  case 'people':return <PeopleSquare textures={textures} night={night}/>;
  case 'zhangjiang':return <Campus textures={textures} night={night} manifest={manifest} onLoaded={onLoaded}/>;
  case 'xinzhuang':return <Xinzhuang textures={textures} night={night} manifest={manifest} onLoaded={onLoaded}/>;
  default:return null;
 }
}
