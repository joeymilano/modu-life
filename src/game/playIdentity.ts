const STORAGE_KEY='modu-life-player-id';
let report:Promise<void>|undefined;

export function isPlayId(value:unknown):value is string {
 return typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value);
}

export function playId() {
 try {
  const saved=localStorage.getItem(STORAGE_KEY);
  if(isPlayId(saved)) return saved;
  const id=crypto.randomUUID();
  localStorage.setItem(STORAGE_KEY,id);
  return id;
 } catch { return undefined; }
}

export function recordStoryPlay() {
 const id=playId();
 if(!id) return;
 report??=fetch('/api/ranks',{
  method:'POST',headers:{'Content-Type':'application/json'},
  body:JSON.stringify({op:'played',playId:id}),
  keepalive:true,signal:AbortSignal.timeout?.(5000),
 }).then(response=>{
  if(response.status!==204) report=undefined;
 }).catch(()=>{report=undefined;});
 return report;
}
