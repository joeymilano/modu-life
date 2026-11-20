export function newSeed(): string {
 const values = new Uint32Array(1);
 if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(values);
 else values[0] = Date.now();
 return values[0].toString(36).toUpperCase().padStart(6, '0').slice(0, 7);
}
export function hashSeed(seed:string):number {let h=2166136261;for(const c of seed){h=Math.imul(h^c.charCodeAt(0),16777619);}return h>>>0 || 42;}
export function randomStep(rng:number):[number,number] {let x=rng||42;x^=x<<13;x^=x>>>17;x^=x<<5;return [(x>>>0)/4294967296,x>>>0];}
