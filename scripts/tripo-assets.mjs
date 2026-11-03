/** Development-time Tripo v3 generation. Credentials never enter the browser build. */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
for (const file of ['.env.local','.env']) if (existsSync(file)) process.loadEnvFile(file);
const key=process.env.TRIPO_API_KEY;
const api='https://openapi.tripo3d.ai/v3';
const plan={
 'oriental-pearl':{prompt:'A single isolated accurate miniature of Shanghai Oriental Pearl Tower, three angled concrete support legs, large lower pink-red observation sphere, slender vertical shafts, smaller upper sphere and long needle spire. Recognizable real architectural silhouette, refined miniature city game prop, warm cream concrete, dusty rose metallic spheres, jade glass bands, physically plausible materials. Upright Y-up, ground at base, no surrounding city, no labels, no people, no ground diorama.'},
 'wukang-corner':{prompt:'A single isolated miniature Shanghai Wukang Mansion corner building, iconic narrow triangular wedge footprint, curved ship-bow corner, seven storeys with warm red-brown brick and cream stone horizontal bands, French Renaissance details, rows of deep dark green windows, street-floor arches. Premium detailed miniature city game prop, tidy realistic materials, all four sides complete, no surrounding street, no people, no text, no giant base.'}
};
const [command='help',slot,taskArg]=process.argv.slice(2);
const stateDir=resolve('outputs/tripo/tasks');mkdirSync(stateDir,{recursive:true});
function jobPath(id){if(!Object.hasOwn(plan,id))throw new Error('Unknown model slot. Choose oriental-pearl or wukang-corner.');return resolve(stateDir,id+'.json');}
async function request(path,body){
 const r=await fetch(api+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(45000)});
 const j=await r.json();if(!r.ok||j.code!==0)throw new Error(`Tripo request failed (${r.status}, code ${j.code??'unknown'}): ${String(j.message||j.msg||'See Tripo console').slice(0,160)}`);return j.data;
}
if(command==='help'){console.log('TRIPO_API_KEY in .env.local or environment. Commands: balance | create <slot> | status <slot> [task_id] | fetch <slot> [task_id]. create submits one billable generation; other commands never create tasks. Model recipes: '+Object.keys(plan).join(', '));process.exit(0);}
if(!key){console.error('TRIPO_API_KEY is not configured. Put it in the ignored .env.local file or environment; do not put it in source or chat. No API request was made.');process.exit(2);}
try{
 if(command==='balance'){const d=await request('/account/balance');console.log(JSON.stringify({balance:d.balance,frozen:d.frozen}));}
 else if(command==='create'){
  const path=jobPath(slot);if(existsSync(path))throw new Error('This slot already has a local task record. Use status/fetch; review or archive it before creating another paid task.');
  const input={...plan[slot],model:'P2-20260801',face_limit:20000,texture:true,pbr:true,texture_quality:'standard'};
  // Do not retry this POST on an ambiguous network failure: check the provider console first.
  const d=await request('/generation/text-to-model',input);if(!d.task_id)throw new Error('The response did not contain a task_id. Inspect provider tasks before retrying.');
  writeFileSync(path,JSON.stringify({slot,task_id:d.task_id,input,created_at:new Date().toISOString()},null,2));console.log(JSON.stringify({slot,task_id:d.task_id,status:'submitted'}));
 }else if(command==='status'||command==='fetch'){
  const path=jobPath(slot);const job=existsSync(path)?JSON.parse(readFileSync(path,'utf8')):{slot,task_id:taskArg};const id=taskArg||job.task_id;
  if(!id||!/^[a-zA-Z0-9_-]+$/.test(id))throw new Error('No valid task ID.');
  const d=await request('/tasks/'+encodeURIComponent(id));job.task_id=id;job.status=d.status;job.progress=d.progress;job.credits_consumed=d.credits_consumed;
  writeFileSync(path,JSON.stringify(job,null,2));
  if(command==='fetch'){
   if(d.status!=='success')throw new Error('Task is not successful. Check status later; do not submit a duplicate.');
   const url=d.output?.model_url;if(!url||new URL(url).protocol!=='https:')throw new Error('No HTTPS GLB result.');
   const r=await fetch(url,{signal:AbortSignal.timeout(90000)});if(!r.ok)throw new Error('Model download failed. Re-run fetch, not create.');
   const bytes=Buffer.from(await r.arrayBuffer());if(bytes.length>20*1024*1024)throw new Error('Model exceeds 20 MiB; optimize before publishing.');
   if(bytes.toString('ascii',0,4)!=='glTF')throw new Error('The downloaded file is not GLB.');
   const gltf=JSON.parse(bytes.toString('utf8',20,20+bytes.readUInt32LE(12)).trim());
   if((gltf.buffers??[]).some(b=>b.uri)||(gltf.images??[]).some(i=>i.uri&&!i.uri.startsWith('data:')))throw new Error('Model has external dependencies. Re-export a self-contained GLB.');
   if(gltf.extensionsRequired?.length)throw new Error('Model requires additional runtime extensions. Review it before importing.');
   const file=`public/models/tripo/${slot}-v1.glb`;mkdirSync(resolve('public/models/tripo'),{recursive:true});writeFileSync(resolve(file),bytes);
   job.file=file;job.sha256=createHash('sha256').update(bytes).digest('hex');job.bytes=bytes.length;writeFileSync(path,JSON.stringify(job,null,2));
   const manifest=JSON.parse(readFileSync('public/models/manifest.json','utf8'));manifest.slots[slot].url='/models/tripo/'+slot+'-v1.glb';writeFileSync('public/models/manifest.json',JSON.stringify(manifest,null,2)+'\n');
   console.log(JSON.stringify({slot,status:'downloaded',file,bytes:bytes.length,sha256:job.sha256,review_required:true}));
  }else console.log(JSON.stringify({slot,task_id:id,status:d.status,progress:d.progress,credits_consumed:d.credits_consumed}));
 }else throw new Error('Unknown command. Run without arguments for help.');
}catch(e){console.error(e.message);process.exitCode=1;}
