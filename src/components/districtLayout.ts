import type { DistrictId } from '../game/types';
import type { Obstacle } from './pathfinding';

export const WUKANG_FOOTPRINT = {x:5,z:6,width:5.8,depth:4.2};
export const PEOPLE_MUSEUM = {x:6.3,z:-6.7,width:6.45,depth:5.0};
export const PEOPLE_POND = {x:-6.3,z:-5.6,width:4.7,depth:3.0};
export const RESEARCH_BUILDINGS = [
 {id:'west-lab',x:-6.4,z:-6.8,width:6.7,depth:4.4,height:5.2,color:'#91a9ad'},
 {id:'east-lab',x:3.8,z:-6.8,width:7.2,depth:4.3,height:4.25,color:'#789da3'},
 {id:'training',x:-7.95,z:6.7,width:5.8,depth:4.1,height:3.65,color:'#a5b4af'},
] as const;
export const CAMPUS_POND = {x:7.9,z:5.75,width:4.6,depth:2.65};
export const XIN_STATION = {x:-9.1,z:-6.6,width:6.7,depth:4.9};
export const XIN_RESIDENCES = [
 {id:'west-block',x:-1.4,z:-6.7,width:3.55,depth:3.8,height:6.05,color:'#cbb9a0'},
 {id:'middle-block',x:3.4,z:-6.7,width:3.8,depth:3.9,height:7.0,color:'#b9ad92'},
 {id:'east-block',x:8.2,z:-6.9,width:3.5,depth:3.7,height:5.85,color:'#d2bf9e'},
] as const;
export const XIN_STALLS = [
 {x:4.6,z:6.25,width:2.35,depth:1.65,sign:'吴记生煎',canopy:'#9a513d'},
 {x:7.6,z:6.45,width:2.35,depth:1.65,sign:'葱油拌面',canopy:'#6c7059'},
 {x:10.6,z:6.7,width:2.25,depth:1.65,sign:'豆浆油条',canopy:'#a78452'},
] as const;

const fixedFootprints: Partial<Record<DistrictId,readonly Obstacle[]>> = {
 anfu: [WUKANG_FOOTPRINT],
 people: [PEOPLE_MUSEUM,PEOPLE_POND],
 zhangjiang: [...RESEARCH_BUILDINGS,CAMPUS_POND],
 xinzhuang: [XIN_STATION,...XIN_RESIDENCES,...XIN_STALLS],
};

export function districtFootprints(district: DistrictId): Obstacle[] {
 return (fixedFootprints[district] ?? []).map(({x,z,width,depth})=>({x,z,width:width+.22,depth:depth+.25}));
}
