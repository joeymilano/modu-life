export function newSeed(): string {
 const values = new Uint32Array(1);
 if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(values);
 else values[0] = Date.now();
 return values[0].toString(36).toUpperCase().padStart(6, '0').slice(0, 7);
}
