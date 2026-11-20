import { useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import type { PlayerAppearance } from '../game/types';
import { Block } from './CityModels';

export default function PlayerAvatar({appearance,walking=false}:{appearance:PlayerAppearance;walking?:boolean}){
 const legs=useRef<Group>(null),arms=useRef<Group>(null),body=useRef<Group>(null);
 const female=appearance.gender==='female',glam=appearance.looks==='stunning',smart=appearance.looks==='charming';
 const jacket=female?(glam?'#23483e':smart?'#914e3b':'#324653'):(glam?'#463033':smart?'#263741':'#626055');
 const lower=female?(glam?'#23483e':'#444749'):(glam?'#25292c':smart?'#364552':'#46586a');
 const hair=female?(glam?'#352b29':smart?'#63422f':'#44382e'):(glam?'#282a29':smart?'#3e322b':'#4a3a2d');
 const shoes=glam?'#2c302c':smart?'#624b35':'#f0e4cb';
 const skirt=female&&glam;
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
  {!skirt&&<RoundedBox args={[.38,.16,.25]} radius={.052} smoothness={2} position={[0,.48,0]} castShadow>
   <meshStandardMaterial color={lower} roughness={.85}/>
  </RoundedBox>}
  {female?<mesh position={[0,.8,0]} scale={[.91,1,.94]} castShadow>
   <capsuleGeometry args={[.205,.2,4,10]}/><meshStandardMaterial color={jacket} roughness={.82}/>
  </mesh>:<RoundedBox args={[.48,.49,.37]} radius={.07} smoothness={2} position={[0,.772,0]} castShadow>
   <meshStandardMaterial color={jacket} roughness={.82}/>
  </RoundedBox>}
  <mesh position={[0,1.09,0]} castShadow><cylinderGeometry args={[.073,.083,.16,8]}/><meshStandardMaterial color='#e2ae86'/></mesh>
  <Block position={[0,.91,.18]} size={[female?.17:.2,.24,.035]} color={female?(glam?jacket:'#eee1c6'):glam?'#e9dcc5':smart?'#bfa783':'#293137'} roughness={.8}/>
  {(!female||smart)&&[-1,1].map(side=><Block key={side} position={[side*.105,.93,.198]} size={[.075,.24,.035]} rotation={[0,0,side*.28]} color={jacket} roughness={.75}/>)}
  {!female&&glam&&[-1,1].map(side=><Block key={side} position={[side*.07,.85,.208]} size={[.012,.24,.018]} color='#827166'/>)}
  {!female&&smart&&[.8,.89,.98].map(y=><mesh key={y} position={[0,y,.209]}><sphereGeometry args={[.013,6,4]}/><meshStandardMaterial color='#534334'/></mesh>)}
  {!female&&!smart&&!glam&&<>
   <Block position={[0,.83,.211]} size={[.052,.38,.027]} rotation={[0,0,-.58]} color='#332b26'/>
   <Block position={[-.25,.54,.02]} size={[.19,.22,.27]} color='#554532' roughness={.9}/>
  </>}
  {female&&<mesh position={[0,.76,.196]}><torusGeometry args={[.16,.018,4,16,Math.PI]}/><meshStandardMaterial color={glam?'#c8a55c':smart?'#7b573b':'#d9c49c'} metalness={glam?.6:0} roughness={.55}/></mesh>}
  <group ref={arms}>{[-1,1].map(side=><group key={side} position={[side*(female?.24:.27),.9,0]} rotation={[0,0,side*.1]}>
   <mesh position={[0,-.13,0]} castShadow><capsuleGeometry args={[female?.065:.075,.29,3,8]}/><meshStandardMaterial color={jacket} roughness={glam?.5:.82}/></mesh>
   <mesh position={[0,-.34,.012]} castShadow><sphereGeometry args={[.071,8,6]}/><meshStandardMaterial color='#e2ae86'/></mesh>
   {glam&&side===-1&&<mesh position={[0,-.22,0]}><torusGeometry args={[.072,.016,4,12]}/><meshStandardMaterial color='#c6a667' metalness={.65} roughness={.3}/></mesh>}
  </group>)}</group>
  <group position={[0,female?.28:.31,0]} scale={female?.79:.76}>
  {female&&<group>
   <mesh position={[0,smart||glam?1.13:1.22,-.135]} scale={[1.05,smart||glam?1.43:1.06,.85]} castShadow><capsuleGeometry args={[.255,smart||glam?.2:.07,4,12]}/><meshStandardMaterial color={hair} roughness={.8}/></mesh>
   {[-1,1].map(side=><mesh key={side} position={[side*.26,smart||glam?1.14:1.23,.005]} rotation={[0,0,side*-.06]} castShadow><capsuleGeometry args={[.068,smart||glam?.38:.18,3,8]}/><meshStandardMaterial color={hair} roughness={.8}/></mesh>)}
  </group>}
  <mesh position={[0,1.34,0]} scale={headScale} castShadow><sphereGeometry args={[.285,14,12]}/><meshStandardMaterial color='#e6b28a' roughness={.85}/></mesh>
  <mesh position={[0,female?1.43:1.403,female?-.035:-.021]} rotation={[female?.1:.05,0,female?-.1:0]} scale={headScale} castShadow><sphereGeometry args={[.303,16,12,0,Math.PI*2,0,Math.PI*(female?.57:.514)]}/><meshStandardMaterial color={hair} roughness={.84}/></mesh>
  {female?<mesh position={[-.095,1.55,.135]} scale={[1.5,.46,.58]} rotation={[0,0,.28]} castShadow><sphereGeometry args={[.15,10,8]}/><meshStandardMaterial color={hair} roughness={.8}/></mesh>:<>
   <mesh position={[smart||glam?.04:-.04,1.6,.08]} scale={[smart||glam?1.46:1.08,glam?.43:smart?.6:.33,.72]} rotation={[0,0,smart||glam?-.19:.18]} castShadow><sphereGeometry args={[.16,10,8]}/><meshStandardMaterial color={hair} roughness={glam?.5:.8}/></mesh>
   {smart&&<mesh position={[-.105,1.57,.097]} scale={[1,.54,.76]} castShadow><sphereGeometry args={[.13,8,6]}/><meshStandardMaterial color={hair} roughness={.8}/></mesh>}
  </>}
  {[-1,1].map(side=><group key={side}>
   {!female&&<mesh position={[side*.269,1.305,.012]} scale={[.75,1.35,.76]} castShadow><sphereGeometry args={[.052,9,7]}/><meshStandardMaterial color='#d5a07e' roughness={.9}/></mesh>}
   <mesh position={[side*.097,1.342,.268]} scale={[glam?1.25:1,glam?.72:1,.65]}><sphereGeometry args={[.022,8,6]}/><meshBasicMaterial color='#342d27'/></mesh>
   {(smart||glam)&&<Block position={[side*.099,1.399,.26]} size={[glam?.068:.056,.014,.018]} rotation={[0,0,side*(female?.12:-.08)]} color={hair}/>}
   {female&&glam&&<mesh position={[side*.278,1.27,.015]} rotation={[0,Math.PI/2,0]}><torusGeometry args={[.044,.01,4,12]}/><meshStandardMaterial color='#d0af69' metalness={.65} roughness={.35}/></mesh>}
  </group>)}
  <mesh position={[0,1.259,.275]} scale={[female||smart||glam?1.4:1,.65,.55]}><sphereGeometry args={[.018,8,6]}/><meshBasicMaterial color={female&&glam?'#a44e46':'#ad7657'}/></mesh>
  </group>
  {female&&!glam&&<Block position={[.29,.53,-.045]} size={[.12,.32,.26]} color='#bcb39b' roughness={.9}/>}
 </group>;
}
