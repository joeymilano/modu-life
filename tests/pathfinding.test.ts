import { describe, expect, it } from 'vitest';
import { findPath, isWalkable } from '../src/components/pathfinding';
import { getObstacles } from '../src/components/CityModels';
import { BUND_BANK, PUDONG_LANDMARKS } from '../src/components/riverLayout';
import { DISTRICTS } from '../src/game/content';
import { CAMPUS_POND, PEOPLE_MUSEUM, PEOPLE_POND, WUKANG_FOOTPRINT, XIN_STATION, XIN_STALLS } from '../src/components/districtLayout';
describe('city walking',()=>{
  it('walks around a building without cutting through its footprint',()=>{
    const obstacles=[{x:0,z:0,width:3,depth:4}];
    const route=findPath([-5,0],[5,0],obstacles);
    expect(route.length).toBeGreaterThan(10);
    expect(route.every(p=>isWalkable(p,obstacles))).toBe(true);
    expect(route.at(-1)).toEqual([5,0]);
  });
  it('uses the nearest safe point when a destination is inside a building',()=>{
    const obstacles=[{x:3,z:0,width:3,depth:3}];
    const route=findPath([0,0],[3,0],obstacles);
    expect(route.length).toBeGreaterThan(0);
    expect(route.every(p=>isWalkable(p,obstacles))).toBe(true);
  });
  it('keeps movement inside the island',()=>{
    expect(isWalkable([20,0],[])).toBe(false);
    expect(isWalkable([0,-20],[])).toBe(false);
  });
  it('leaves the ferry and the other waterfront places reachable from the west bank',()=>{
    const obstacles=getObstacles('bund');
    for (const place of DISTRICTS.find(district=>district.id==='bund')!.hotspots) {
      const route=findPath([0,4.3],place.position,obstacles);
      expect(route.at(-1),place.id).toEqual(place.position);
      expect(route.every(point=>point[0]<BUND_BANK.westQuay)).toBe(true);
    }
    expect(isWalkable([BUND_BANK.westQuay+.1,1.9],obstacles)).toBe(false);
    expect(PUDONG_LANDMARKS.every(tower=>tower.east[0]-tower.width/2>BUND_BANK.eastQuay)).toBe(true);
  });
  it('leaves the Lujiazui hotspots reachable around the towers',()=>{
    const obstacles=getObstacles('lujiazui');
    for (const place of DISTRICTS.find(district=>district.id==='lujiazui')!.hotspots) {
      expect(findPath([0,4.3],place.position,obstacles).at(-1),place.id).toEqual(place.position);
    }
  });
  it.each([
    ['anfu', [WUKANG_FOOTPRINT]],
    ['people', [PEOPLE_MUSEUM, PEOPLE_POND]],
    ['zhangjiang', [CAMPUS_POND]],
    ['xinzhuang', [XIN_STATION, ...XIN_STALLS]],
  ] as const)('leaves every %s hotspot reachable around the new landmarks', (district, landmarks) => {
    const obstacles = getObstacles(district);
    for (const place of DISTRICTS.find(area => area.id === district)!.hotspots) {
      const route = findPath([0,4.3], place.position, obstacles);
      expect(route.at(-1), place.id).toEqual(place.position);
      expect(route.every(point => isWalkable(point, obstacles)), place.id).toBe(true);
    }
    for (const {x,z} of landmarks) {
      expect(isWalkable([x,z], obstacles)).toBe(false);
    }
  });
});
