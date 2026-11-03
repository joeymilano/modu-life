export type Point2 = [number, number];
export interface Obstacle { x: number; z: number; width: number; depth: number }
export const WALK_BOUNDS = { minX: -14.3, maxX: 14.3, minZ: -10.8, maxZ: 10.8 };
export function isWalkable(point: Point2, obstacles: Obstacle[], padding = .32) {
  const [x,z] = point;
  if (x < WALK_BOUNDS.minX || x > WALK_BOUNDS.maxX || z < WALK_BOUNDS.minZ || z > WALK_BOUNDS.maxZ) return false;
  return !obstacles.some(o => Math.abs(x-o.x) < o.width/2+padding && Math.abs(z-o.z) < o.depth/2+padding);
}
export function findPath(start: Point2, goal: Point2, obstacles: Obstacle[]): Point2[] {
  const step=.5, nx=59, nz=45;
  const world=(x:number,z:number):Point2=>[-14.5+x*step,-11+z*step];
  const grid=(p:Point2):Point2=>[Math.max(0,Math.min(nx-1,Math.round((p[0]+14.5)/step))),Math.max(0,Math.min(nz-1,Math.round((p[1]+11)/step)))];
  const key=(x:number,z:number)=>z*nx+x;
  const nearest=(p:Point2):Point2=>{
    const [x,z]=grid(p);
    for(let radius=0;radius<12;radius++) for(let a=-radius;a<=radius;a++) for(let b=-radius;b<=radius;b++){
      if(Math.abs(a)!==radius && Math.abs(b)!==radius)continue;
      if(x+a>=0&&x+a<nx&&z+b>=0&&z+b<nz&&isWalkable(world(x+a,z+b),obstacles))return [x+a,z+b];
    }
    return [x,z];
  };
  const a=nearest(start), b=nearest(goal), first=key(...a), last=key(...b);
  const open=new Set<number>([first]), parents=new Map<number,number>(), scores=new Map<number,number>([[first,0]]);
  const h=(i:number)=>Math.hypot(i%nx-b[0],Math.floor(i/nx)-b[1]);
  let found=false;
  for(let iterations=0;open.size&&iterations<3000;iterations++){
    let current=-1, best=Infinity;
    for(const i of open){const f=(scores.get(i)??Infinity)+h(i);if(f<best){best=f;current=i;}}
    if(current===last){found=true;break;}
    open.delete(current);const x=current%nx,z=Math.floor(current/nx);
    for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
      const xx=x+dx,zz=z+dz;if(xx<0||xx>=nx||zz<0||zz>=nz)continue;
      if(!isWalkable(world(xx,zz),obstacles))continue;
      if(dx&&dz&&(!isWalkable(world(x+dx,z),obstacles)||!isWalkable(world(x,z+dz),obstacles)))continue;
      const k=key(xx,zz), cost=(scores.get(current)??0)+Math.hypot(dx,dz);
      if(cost<(scores.get(k)??Infinity)){parents.set(k,current);scores.set(k,cost);open.add(k);}
    }
  }
  if(!found)return [];
  const route:Point2[]=[];let cursor=last;
  while(cursor!==first){route.unshift(world(cursor%nx,Math.floor(cursor/nx)));const p=parents.get(cursor);if(p===undefined)break;cursor=p;}
  if(isWalkable(goal,obstacles))route.push(goal);
  return route;
}
