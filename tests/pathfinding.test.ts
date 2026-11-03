import { describe, expect, it } from 'vitest';
import { findPath, isWalkable } from '../src/components/pathfinding';
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
});
