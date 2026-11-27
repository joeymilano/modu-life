import { OPENING_EPISODES, SYSTEM_EPISODES, COMMISSIONS, PUJIANG_EPISODES } from './pujiangScript';
import type { AbilityId, EpisodeChoice, EpisodeMove, EpisodeReceipt, EpisodeRun, EpisodeScript, PujiangEnding, PujiangRoute, SystemProgress } from './pujiangTypes';
import { hashSeed, randomStep } from './seed';
import { PROLOGUES, PROLOGUE_PENDING, isDecided, prologueFlag, prologueOption, rememberedMeeting, spokenText } from './pujiangPrologue';
import type { Effect, GameState, LifeEvent, StatKey } from './types';

export const PUJIANG_CONTACTS = ['pj-gu','pj-wen','pj-xu'] as const;
export const PUJIANG_NAMES: Record<string,string> = {'pj-gu':'顾桥','pj-wen':'周闻','pj-xu':'许舟',lu:'陆嘉',mao:'毛小毛',wu:'吴师傅',boss:'沈经理',yu:'余老师'};
export const ABILITIES: {id:AbilityId;name:string;path:string;cost:number;parent?:AbilityId;description:string}[] = [
 {id:'insight',name:'识人',path:'洞察',cost:1,description:'看见当前人物没有说出口的诉求。'},
 {id:'forecast',name:'推演',path:'洞察',cost:2,parent:'insight',description:'指定一个选项，预览它的直接结果与资源变化。'},
 {id:'borrow',name:'借技',path:'专长',cost:1,description:'本幕临时满足一项专业操作要求。'},
 {id:'combine',name:'融会',path:'专长',cost:2,parent:'borrow',description:'本幕组合两种专长，打开替代操作；没有专属操作时增加1份调度。'},
 {id:'seek',name:'寻援',path:'协作',cost:1,description:'发现可争取的援助，本场调度+1、合作+1。'},
 {id:'resonate',name:'同频',path:'协作',cost:2,parent:'seek',description:'有信任30以上的伙伴时，额外安排一次协作：现场补位或协调调度。'},
];
export const isPujiang = (s:GameState) => s.storyEdition===2;
export const pujiangRoute = (s:GameState):PujiangRoute => s.origins.includes('born-system')?'system':s.origins.includes('born-heir')?'heir':s.origins.includes('born-daywork')?'worker':'arrival';
export const isPujiangSystem = (s:GameState) => isPujiang(s)&&pujiangRoute(s)==='system';
export const episodeById = (id:string) => PUJIANG_EPISODES.find(e=>e.id===id);
export const completedChapters = (s:GameState) => SYSTEM_EPISODES.filter(e=>s.seenEvents.includes(e.id)).length;
export const systemLevel = (s:GameState) => 1+Math.floor(completedChapters(s)/2);
export const abilitySlots = (s:GameState) => systemLevel(s)>=2?2:1;
export function abilityPoints(s:GameState) {
 return 1+completedChapters(s)-(s.systemProgress?.learned??[]).reduce((sum,id)=>sum+ABILITIES.find(a=>a.id===id)!.cost,0);
}
export const newSystemProgress = ():SystemProgress => ({learned:[],equipped:[],rewardCash:0});
export function beginPujiangLife(state:GameState):GameState {
 const s=structuredClone(state);s.storyEdition=2;s.calendar=1992;
 if(pujiangRoute(s)==='system')s.systemProgress=newSystemProgress();
 for(const id of PUJIANG_CONTACTS)s.relationships[id]??={attraction:10,trust:15,commitment:0,met:false,memories:[]};
 // The legacy first-night episode has its own scheduler. New openings own this slot.
 const prologue=PROLOGUES[pujiangRoute(s)];
 s.flags.push(PROLOGUE_PENDING);
 s.journal=[{age:18,title:prologue.title,text:prologue.setup,tag:'序章'}];
 return s;
}
export function episodeOffer(s:GameState):EpisodeScript|undefined {
 if(!isPujiang(s)||s.ended||s.episode)return;
 return (pujiangRoute(s)==='system'?SYSTEM_EPISODES:OPENING_EPISODES.filter(e=>e.route===pujiangRoute(s)))
  .find(e=>e.age===s.age&&!s.seenEvents.includes(e.id));
}
export function advancePrologue(state: GameState, action: string): GameState {
 if (!isPujiang(state) || !state.flags.includes(PROLOGUE_PENDING)) return state;
 // Skipping keeps whatever was already answered and lets the rest of the opening go by.
 if (action === 'skip' || action === 'finish') return { ...state, flags: state.flags.filter(flag => flag !== PROLOGUE_PENDING) };
 const route = pujiangRoute(state), found = prologueOption(route, action);
 if (!found || isDecided(state.flags, route, found.group)) return state;
 const { group, option } = found;
 const next = structuredClone(state), story = PROLOGUES[route];
 next.flags.push(prologueFlag(route, group, option.id));
 for (const key of Object.keys(next.stats) as StatKey[]) if (option.effect?.[key]) next.stats[key] = clamp(next.stats[key] + option.effect[key]!);
 const contact = next.relationships[story.personId];
 if (group === 'meet') {
  contact.met = true;
  if (option.memory) contact.memories.push(option.memory);
 }
 if (group === 'parting' && option.id === 'stay') contact.trust = Math.min(100, contact.trust + 3);
 next.journal.push({ age: next.age, title: option.label, text: spokenText(option.then), tag: group === 'meet' ? '初识' : group === 'parting' ? '赴约' : '开场' });
 return next;
}
export function learnAbility(s:GameState,id:AbilityId):GameState {
 if(!isPujiangSystem(s)||s.episode||s.ended)throw new Error('进入现场后配置锁定，离场再调整。');
 const a=ABILITIES.find(a=>a.id===id),p=s.systemProgress!;
 if(!a||p.learned.includes(id)||abilityPoints(s)<a.cost||a.parent&&(!p.learned.includes(a.parent)||systemLevel(s)<3))throw new Error('能力点或前置等级不足。');
 const next=structuredClone(s);next.systemProgress!.learned.push(id);
 if(next.systemProgress!.equipped.length<abilitySlots(s))next.systemProgress!.equipped.push(id);
 return next;
}
export function equipAbility(s:GameState,id:AbilityId):GameState {
 if(!isPujiangSystem(s)||s.episode||s.ended||!s.systemProgress?.learned.includes(id))throw new Error('现在不能调整这项能力。');
 const next=structuredClone(s),p=next.systemProgress!;
 if(p.equipped.includes(id))p.equipped=p.equipped.filter(a=>a!==id);
 else {if(p.equipped.length>=abilitySlots(s))throw new Error('先卸下一项能力，再装备新的。');p.equipped.push(id);}
 return next;
}
export function startEpisode(s:GameState,id:string):GameState {
 const script=episodeById(id);
 if(!script||!isPujiang(s)||s.ended||s.episode||s.showdown||s.seenEvents.includes(id))throw new Error('这场故事现在无法开始。');
 if(script.commission){
  if(!isPujiangSystem(s)||s.pendingYearEvent||episodeOffer(s)||s.actions<1)throw new Error('先完成年度剧情，并留一格行动。');
 }else if(episodeOffer(s)?.id!==id)throw new Error('这场故事与当前年龄不符。');
 const next=structuredClone(s);next.district=script.district;
 if(script.age===18&&!script.commission)next.flags=next.flags.filter(flag=>flag!==PROLOGUE_PENDING);
 if(script.commission)next.actions--;
 next.episode={id,moves:[],loadout:[...(s.systemProgress?.equipped??[])]};
 return next;
}

/** The clock ran out: the other side spoke first. */
export const STALL = '__stall';
const STALL_CHOICE: EpisodeChoice = { id: STALL, label: '慢了半拍，被抢了话', hint: '', reply: '话到嘴边慢了半拍，场子里的风向直接被他截走了。' };
const clamp = (n: number) => Math.max(0, Math.min(100, n));
/** Names for what earlier moves left behind, shown when a stronger option is still shut. */
const FOOTPRINTS: Record<string, string> = {
 'arrival-room': '隔壁的备用场地', 'worker-shuttle': '短驳安排', 'worker-swap': '隔壁班的换班承诺', 'heir-stub': '退样存根',
 'heir-tested': '亲手试过拉绳', 'heir-paid': '团队尾款已付', 'small-batch': '先做过一批小样', 'system-contract-team': '共同接单的记录',
 'credited': '当众署过名', 'ally-xu': '许舟信你，且没被强留', 'heir-listened': '记下了客户的三个问题', 'user-test': '客户的真实使用反馈',
 'real-test': '让许舟按真实流程操作过', 'night-assigned': '今晚分工已定', 'xu-free': '把路线还给了许舟',
};
const METERS: Record<string, string> = { score: '气势', team: '人心', budget: '底牌', skill: '本事' };
function requirement(c: EpisodeChoice) {
 if (c.need) return c.need;
 return (c.requires ?? '').split('|').map(term => {
  const [kind, key, n] = term.split(':');
  if (kind === 'score' || kind === 'team') return `${METERS[kind]}达到 ${key}`;
  if (kind === 'skill') return `本事达到 ${key}`;
  if (kind === 'ability') return '先在本幕使用' + ABILITIES.find(a => a.id === key)!.name;
  if (kind === 'trust') return (PUJIANG_NAMES[key] ?? key) + `信任达到 ${n}`;
  return '还需要：' + (FOOTPRINTS[key] ?? key);
 }).join('，或');
}
export const gambleChance = (s: GameState, c: EpisodeChoice) => c.gamble ? Math.round(Math.max(25, Math.min(90, 50 + s.stats[c.gamble.stat] - c.gamble.need))) : undefined;
/** The dice for a gamble come from the save's seed, so the same move always lands the same way. */
export function rollLuck(s: GameState, script: EpisodeScript, stage: number, id: string): 'hit' | 'miss' | undefined {
 const choice = script.scenes[stage]?.choices.find(c => c.id === id);
 if (!choice?.gamble) return undefined;
 const [roll] = randomStep(hashSeed(`${s.seed}:${script.id}:${stage}:${id}`));
 return roll * 100 < gambleChance(s, choice)! ? 'hit' : 'miss';
}
function gainText(c: EpisodeChoice) {
 const parts: string[] = [];
 if (c.score) parts.push(`气势 ${c.score > 0 ? '+' : ''}${c.score}`);
 if (c.team) parts.push(`人心 ${c.team > 0 ? '+' : ''}${c.team}`);
 if (c.budget) parts.push(`底牌 ${c.budget > 0 ? '+' : ''}${c.budget}`);
 if (c.cash) parts.push(`${c.cash > 0 ? '+' : '−'}¥${Math.abs(c.cash).toLocaleString('zh-CN')}`);
 if (c.relation) parts.push(`${PUJIANG_NAMES[c.relation[0]] ?? c.relation[0]}信任 ${c.relation[1] > 0 ? '+' : ''}${c.relation[1]}`);
 return parts.join(' · ');
}
interface Frame {stage:number;score:number;team:number;budget:number;cash:number;flags:string[];used:{id:AbilityId;stage:number;target?:string}[];relations:[string,number][];recent:string[];}
function initialFrame(script:EpisodeScript,s:GameState):Frame {
 const prepared=script.age===18&&!script.commission&&s.flags.includes('pj-prologue-'+script.route+'-prepare');
 const priorWin=script.id==='pj-system-24'&&s.flags.includes('pj-system-23-win');
 return {stage:0,score:0,team:0,budget:script.budget+(prepared||priorWin?1:0),cash:0,flags:[],used:[],relations:[],recent:[]};
}
function has(f:Frame,s:GameState,flag:string){return f.flags.includes(flag)||s.flags.includes('pj-'+flag);}
function used(f:Frame,id:string){return f.used.some(a=>a.id===id&&a.stage===f.stage);}
function condition(term:string,f:Frame,s:GameState):boolean {
 if(term.includes('|'))return term.split('|').some(t=>condition(t,f,s));
 const [kind,key,n]=term.split(':');
 if(kind==='score'||kind==='team')return f[kind]>=Number(key);
 if(kind==='skill')return s.stats.skill>=Number(key);
 if(kind==='trust')return (s.relationships[key]?.trust??15)+f.relations.filter(([id])=>id===key).reduce((a,[,v])=>a+v,0)>=Number(n);
 if(kind==='ability')return used(f,key);
 if(term==='ally-xu')return condition('trust:pj-xu:35',f,s)&&!has(f,s,'xu-left');
 return has(f,s,term);
}
function unavailable(c:EpisodeChoice,f:Frame,s:GameState):string|undefined {
 if(c.cash&&s.cash+f.cash+c.cash<0)return '现金不够';
 if(c.budget&&f.budget+c.budget<0)return '底牌不够';
 if(c.skill&&s.stats.skill<c.skill&&!(c.ability&&used(f,c.ability)))return `本事需${c.skill}，或本幕使用借技`;
 if(c.ability&&!c.skill&&!used(f,c.ability))return '先在本幕使用'+ABILITIES.find(a=>a.id===c.ability)!.name;
 if(c.requires&&!condition(c.requires,f,s))return requirement(c);
}
/** A stall or a missed gamble replaces what the option would have done. */
function played(script:EpisodeScript,move:EpisodeMove,raw:EpisodeChoice|undefined,strict:boolean):EpisodeChoice|undefined {
 if(move.id===STALL)return script.scenes.length?STALL_CHOICE:undefined;
 if(!raw?.gamble)return raw;
 if(move.luck===undefined){if(strict)throw new Error('这一步要先掷骰。');return raw;}
 if(move.luck==='hit')return raw;
 return {...raw,tag:'赌',score:0,team:0,budget:(raw.budget??0)-1,cash:0,relation:undefined,flags:[...(raw.flags??[]),raw.id+'-missed'],
  reply:'你押了一把，没押中。',react:raw.gamble.miss??[]};
}
function change(f:Frame,c:EpisodeChoice){
 f.score+=c.score??0;f.team+=c.team??0;f.budget+=c.budget??0;f.cash+=c.cash??0;
 f.flags.push(...c.flags??[]);if(c.relation)f.relations.push(c.relation);f.recent.push(c.reply);f.stage++;
}
function contextualChoice(s:GameState,script:EpisodeScript,c:EpisodeChoice):EpisodeChoice {
 if(script.id!=='pj-system-21'||c.id!=='habit')return c;
 const exposed=(s.episode?.loadout??s.systemProgress?.equipped??[]).some(id=>s.flags.includes('pj-shown-'+id));
 if(exposed||!(s.episode?.loadout??s.systemProgress?.equipped??[]).length)return c;
 return {...c,tag:'奇',label:'使用未向顾桥展示过的配置',hint:'对手没见过这套配置',score:3,flags:['countered'],react:[{t:'nar',text:'顾桥照着旧习惯抢先解释，你却用另一套办法完成了演示。他第一次没能替你说出下一步。'}]};
}
function moveFrame(s:GameState,script:EpisodeScript,run:EpisodeRun,strict=true):Frame {
 const f=initialFrame(script,s);
 for(const move of run.moves){
  const scene=script.scenes[f.stage];
  if(!scene)throw new Error('这场故事已经结算。');
  if(move.kind==='choice'){
   const c=played(script,move,scene.choices.find(c=>c.id===move.id)&&contextualChoice(s,script,scene.choices.find(c=>c.id===move.id)!),strict);
   if(!c||strict&&unavailable(c,f,s))throw new Error('这个剧情选择当前不可用。');
   change(f,c);
  }else{
   const id=move.id as AbilityId;
   if(!run.loadout.includes(id)||script.offline||f.used.some(a=>a.id===id)||!ABILITIES.some(a=>a.id===id))throw new Error('这项能力本场不可用。');
   if(id==='resonate'&&strict&&!['pj-xu','pj-wen','lu','mao'].some(n=>condition('trust:'+n+':30',f,s)))throw new Error('需要一位信任达到30的伙伴。');
   if(id==='forecast'&&!scene.choices.some(c=>c.id===move.target))throw new Error('先指定要推演的一个选择。');
   if(id==='resonate'&&!['team','dispatch'].includes(move.target??''))throw new Error('先安排伙伴的协同行动。');
   f.used.push({id,stage:f.stage,target:move.target});
   if(id==='seek'){f.budget++;f.team++;f.recent.push('寻援：'+scene.support+' 底牌 +1，人心 +1。');}
   if(id==='resonate'){
    if(move.target==='dispatch'){f.team++;f.budget++;f.recent.push('同频：伙伴去协调下一轮人手，人心 +1、底牌 +1。');}
    else {f.team+=2;f.recent.push('同频：伙伴留在现场补位，替你多完成一轮，人心 +2。');}
   }
   if(id==='combine'&&!scene.choices.some(c=>c.ability==='combine')){f.budget++;f.recent.push('融会：把两项操作合到一轮，省下 1 张底牌。');}
  }
 }
 return f;
}
/** A choice as the player meets it: the script's option plus what the rules make of it right now. */
export type EpisodeViewChoice = EpisodeChoice & { disabled?: string; gain?: string; chance?: number; preview?: string };
export function episodeView(s:GameState,run:EpisodeRun=s.episode!){
 if(!run)throw new Error('没有正在进行的故事。');
 const script=episodeById(run.id)!;
 const f=moveFrame(s,script,run,!run.receipt),scene=script.scenes[f.stage];
 const abilityOptions=run.loadout.map(id=>({id,name:ABILITIES.find(a=>a.id===id)!.name,reason:
  run.receipt?'本场已结束':script.offline?'本章异能离线':f.used.some(a=>a.id===id)?'本场已使用':
  id==='resonate'&&!['pj-xu','pj-wen','lu','mao'].some(n=>condition('trust:'+n+':30',f,s))?'需要伙伴信任30':undefined}));
 return {script,...f,scene,abilities:abilityOptions,secret:scene&&used(f,'insight')?scene.secret:undefined,
  choices:scene?.choices.map(raw=>{const c=contextualChoice(s,script,raw);
   const forecast=f.used.some(a=>a.id==='forecast'&&a.stage===f.stage&&a.target===c.id);
   return {...c,disabled:unavailable(c,f,s),chance:gambleChance(s,c),gain:gainText(c),
    preview:forecast?`${c.reply}（${gainText(c)||'不动声色'}）`:undefined};})??[]};
}
export function playEpisode(s:GameState,move:EpisodeMove):EpisodeRun {
 if(!s.episode||s.episode.receipt||s.seenEvents.includes(s.episode.id))throw new Error('这场已经结算，不能重复领奖。');
 if(!['choice','ability'].includes(move.kind))throw new Error('无法识别这次操作。');
 const script=episodeById(s.episode.id)!,stage=s.episode.moves.filter(item=>item.kind==='choice').length;
 // A gamble is settled here, once, and written into the move; nobody else gets to roll.
 const luck=move.kind==='choice'?move.luck??rollLuck(s,script,stage,move.id):undefined;
 const settled:EpisodeMove=luck?{...move,luck}:move;
 const run={...s.episode,moves:[...s.episode.moves,settled]};moveFrame(s,script,run);return run;
}
export function episodeSettlement(s:GameState,run:EpisodeRun):{receipt:EpisodeReceipt;relations:[string,number][];flags:string[]}|undefined {
 const script=episodeById(run.id)!,f=moveFrame(s,script,run);
 if(f.stage!==script.scenes.length)return;
 const last=script.scenes.at(-1)!.choices.find(c=>c.id===run.moves.at(-1)!.id)??STALL_CHOICE;
 const stalled=last.id===STALL;
 const isFinal=script.id==='pj-system-25';
 const wins=SYSTEM_EPISODES.filter(e=>s.flags.includes(e.id+'-win')).length;
 const fulfilled=has(f,s,'promises-settled');
 const trusted=['pj-xu','pj-wen'].some(n=>condition('trust:'+n+':35',f,s));
 const finalSuccess=last.ending==='together'?fulfilled&&trusted&&wins>=3:last.ending==='independent'?fulfilled&&wins>=3:fulfilled&&(wins>=1||trusted);
 const strong=f.score>=4||f.team>=4;
 const finishing=!stalled&&(last.winningFinish||script.scenes.at(-1)!.choices.indexOf(last)<2);
 const verdict=isFinal?(finalSuccess?'win':wins>=2?'partial':'loss'):strong&&finishing?'win':(f.score+f.team>=3?'partial':'loss');
 const shared=last.id==='share';
 const maxCash=isPujiangSystem(s)?Math.max(0,3_000_000-(s.systemProgress?.rewardCash??0)):script.reward;
 const award=Math.min(maxCash,Math.round(script.reward*(verdict==='win'?1:verdict==='partial'?.45:.1)*(last.rewardScale??(shared?.5:1))));
 const flags=[...f.flags.map(v=>'pj-'+v),...f.used.map(a=>'pj-shown-'+a.id),script.id+'-'+verdict];
 if(last.ending)flags.push('pj-ending-'+last.ending);
 const effect:Effect={cash:f.cash+award,skill:verdict==='win'?4:2,network:f.team>=4?5:2,spirit:verdict==='loss'?-2:3,setFlags:flags};
 if(script.age===18&&!script.commission){
  if(f.flags.includes('opening-proof'))effect.setFlags!.push('opening-proof');
  if(f.flags.includes('opening-allies'))effect.setFlags!.push('opening-allies');
  if(script.route==='heir'&&!f.flags.includes('heir-blind-order'))effect.setFlags!.push(f.flags.includes('heir-hosted-new-table')?'heir-hosted-new-table':'heir-hosted-direct');
  if(script.route==='worker'&&verdict==='win')effect.removeFlags=['daywork-due','daywork-remainder'];
 }
 const totals=new Map<string,number>();for(const [id,n] of f.relations)totals.set(id,(totals.get(id)??0)+n);
 const relationships=[...totals].map(([id,n])=>(PUJIANG_NAMES[id]??id)+'信任 '+(n>=0?'+':'')+n);
 const title={win:'场面拿下了',partial:'保住半壁场子',loss:'这局栽了，牌桌还在'}[verdict];
 let echo='';
 if(script.id==='pj-system-18')echo=condition('trust:pj-xu:30',f,s)?'许舟信任已达30，下一单可以请她绕路补位。':'许舟还在观望；下一单可以用实际分工或寻援争取她的帮助。';
 if(script.id==='pj-system-19')echo=has(f,s,'system-contract-team')?'共同接单的记录，会打开下一场饭局的团队入场与联合试演。':'下一场仍可凭项目成果入席，团队引荐则需要另外争取许舟的信任。';
 if(script.id==='pj-system-22')echo=has(f,s,'xu-left')?'许舟已退出合作，下一晚无法请她回场；纸上流程与范围协商仍可使用。':condition('trust:pj-xu:35',f,s)?'许舟愿意回来帮一轮。下一晚不能使用异能，这份援助可以兑现。':'许舟尚未答应夜间回场；提前练本事，或按纸上流程完成交付。';
 if(script.id==='pj-system-23')echo=verdict==='win'?'这次留下的维修流程会为下一场展销增加1份调度。':'下一场仍有3份基础调度，可以重新分配援助。';
 const blindOrder=last.id==='sign-sample';
 if(blindOrder)echo='沈经理收好蓝色底联，答应明年开春陪你去三楼回访。';
 const receipt:EpisodeReceipt={verdict,title:blindOrder?'十盏，成交':title,text:blindOrder?last.reply:last.reply+'\n\n'+script[verdict],cash:award,effect,relationships,next:blindOrder?echo:[echo,script.next].filter(Boolean).join(' '),...(last.ending?{ending:last.ending}:{})};
 return {receipt,relations:[...totals],flags};
}
export function leaveEpisode(s:GameState):GameState {
 if(!s.episode?.receipt)throw new Error('先完成这场故事，或保存后回到首页。');
 const next=structuredClone(s);delete next.episode;return next;
}
export const pujiangEnding = (s:GameState):PujiangEnding|undefined => (['independent','together','leave'] as const).find(e=>s.flags.includes('pj-ending-'+e));
export const ENDING_NAMES = {independent:'独立掌舵',together:'合伙共营',leave:'带人退出'};
export function episodeCarry(s:GameState,script:EpisodeScript):string[] {
 if(script.commission)return [];
 const lines:string[]=[];
 const meeting=script.age===19?rememberedMeeting(s.flags,script.route):undefined;
 if(meeting?.nextYear)lines.push(meeting.nextYear);
 if(script.age===19&&s.flags.includes('pj-system-share'))lines.push('许舟还记得你分出的第一笔奖金。这次她把备用路线也带来了。');
 if(script.age===20&&s.flags.includes('pj-system-contract-team'))lines.push('上一单留下的共同订单还在。许舟可以带客户一起进门，团队也有了联合试演的依据。');
 if(script.age===20&&s.flags.includes('pj-exclusive'))lines.push('当年被排除在外的那一次，许舟记得。她现在要先听具体安排。');
 if(script.age===22&&s.flags.includes('pj-wen-knows'))lines.push('第一晚抄下的任务还在周闻手里。这一次，他终于能把奖励上的字和大家做过的事放在一起核对。');
 if(script.age>=21&&s.flags.includes('pj-overpromise'))lines.push('周闻提醒你，上次答应得太满，今天先说清做不到的部分。');
 if(script.age===21){const known=ABILITIES.filter(a=>s.flags.includes('pj-shown-'+a.id)).map(a=>a.name);if(known.length)lines.push('顾桥已经见过：'+known.join('、')+'。换一套未展示的配置，可以让他的预测落空。');}
 if(script.age>=23&&s.flags.includes('pj-xu-left'))lines.push('许舟没有答应回来。强留她的那句话，让今天少了一条熟人的路。');
 else if(script.age===23&&(s.relationships['pj-xu']?.trust??15)>=35)lines.push('许舟愿意回来帮一轮。今晚没有异能，这个电话仍然打得通。');
 if(script.age===24&&s.flags.includes('pj-system-23-win'))lines.push('周闻带来没有异能那晚的维修流程，替现场省出1份调度。本章共4份支援。');
 if(script.age===25&&s.flags.includes('pj-system-24-win'))lines.push('展销会上留下的成果已经有客户作证。最后一单，顾桥不能再替你决定如何分工、怎样署名。');
 return lines.slice(-2);
}
export const AFTER_YEARS=[26,28,34,38,41,49,57];
export function pujiangYear(s:GameState):LifeEvent|undefined {
 if(!isPujiang(s))return;
 const route=pujiangRoute(s);
 if(route!=='system'&&s.age===19){
  const memory=rememberedMeeting(s.flags,route)?.nextYear??'';
  const success=s.flags.includes('pj-'+route+'-18-win'),team=s.flags.includes('opening-allies');
  if(route==='heir'&&s.flags.includes('pj-heir-blind-order'))return {
   id:'pj-return-heir',title:'三楼那十盏灯',category:'year',tag:'开篇回访',speakerId:'boss',
   illustration:OPENING_EPISODES.find(e=>e.route==='heir')!.photo,
   text:memory+'早上七点，沈经理拿着蓝色底联来接你。十间客房，九盏灯好用。三一七的拉绳被床头柜挡住了。采购主任把整层楼的订单扣在手里，等你开口。',
   choices:[
    {id:'keep',label:'进三一七，和木工一起挪灯座',hint:'本事 +5 · 沈经理信任 +10',reply:'你坐到床上试了一次，又请客房阿姨躺下试一次。主任签了整层楼，木工留了家里的电话，答应赶工时来搭把手。',effect:{skill:5,trust:10,setFlags:['pj-opening-kept']}},
    {id:'change',label:'亮出家底，自费重做十只底座',hint:'花 ¥12,000 · 人脉 +6',reply:'主任这才知道你是谁。他拨通另一家饭店的电话，把话筒递给你。木工收起工具，等厂里发新底座。',effect:{cash:-12000,network:6,trust:3,setFlags:['pj-opening-changed']}},
   ]};
  const followup={
   arrival:{
    npc:'lu',title:'上回留下的那张节目单',
    text:success?'上回留到散场的姐妹俩又来买票了。陆嘉把下周五的节目单拍在你手里：开场那一格，还空着。':'陆嘉在新节目单上留了十分钟。「上回你赶得急，我也急。这回周五开场，你来得及伐？」',
    keep:'把周五留出来，跟陆嘉排一次开场',kept:'周五你提前一刻钟到。陆嘉弹了四小节前奏，等你吸完那口气，才落下最后一个音。那十分钟，刚刚好。',
    change:'把开场让给新来的乐手，陪他对词',changed:'你把话筒调低半截。新人一开口，声音有点抖。陆嘉用同一个和弦，多陪了他一遍。',
   },
   worker:{
    npc:'wu',title:'换班的日子到了',
    text:success?'吴师傅把新班表拍在门房桌上。上回一起卸货的人各签了一格，只剩周四夜班。他那天，得带老伴去复诊。':'吴师傅在门房等你。「上回那车开走，咱俩话也没说完。周四我得陪老伴去医院。这一班，你替不替？」',
    keep:'签下周四的夜班，让吴师傅去医院',kept:'周四点名，领班一眼认出你的字。天快亮时吴师傅回来了，病历塞在口袋里，手里两个茶叶蛋还温着。',
    change:'说明周四走不开，当面找人换一班',changed:'你们在门房等到换班的人亲口点头。吴师傅这才收好班表，回去跟老伴说几点出门。',
   },
   heir:{
    npc:'boss',title:'酒桌之后，客户来了',
    text:success?'饭店采购主任这回直接把电话打到你这儿。沈经理在听筒边记下时间，回头问你：「周二送样，谁跟车？」':'上回那桌饭没谈成整单。采购主任倒还记得那只旧箱子。沈经理约了周二再送一次样，就差一个跟车的人。',
    keep:'周二亲自跟车，当着客户的面把灯点亮',kept:'你把灯放到床边，照着客人的姿势试了一遍。主任没说话，在签收联上盖了章。',
    change:'把样品逐件点清，请沈经理带队交接',changed:'你把仓库号码留给主任。周二，沈经理从饭店打来电话：「签收了。箱扣，也好好的。」',
   },
  }[route];
  return {id:'pj-return-'+route,title:followup.title,category:'year',tag:'开篇回访',speakerId:followup.npc,
   illustration:OPENING_EPISODES.find(e=>e.route===route)!.photo,text:[memory,followup.text].filter(Boolean).join('\n\n'),choices:[
    {id:'keep',label:followup.keep,reply:followup.kept,hint:team?'伙伴继续出力 · 人脉+6，信任+12':success?'已有成果 · 本事+5，信任+10':'重建合作 · 本事+3，信任+6',effect:{skill:success?5:3,network:team?6:0,trust:team?12:success?10:6,setFlags:['pj-opening-kept']}},
    {id:'change',label:followup.change,reply:followup.changed,effect:{network:6,trust:3,setFlags:['pj-opening-changed']}},
   ]};
 }
 if(route!=='system'||!AFTER_YEARS.includes(s.age))return;
 const ending=pujiangEnding(s)??'independent';
 const titles:Record<number,string>={26:'下一张自己的名片',28:'老客户带来一个新人',34:'这一回，让别人试试',38:'另一张桌上的朋友',41:'生意之外的一个晚上',49:'你教过的人回来了',57:'把下一次交给他们'};
 const context={independent:'你的公司挂上了自己的牌子。系统还在，只是如今它按你实际交出的东西结算。来的人，走的人，都由你签字。',together:'许舟有了自己的车队，周闻带出了三个徒弟。每到月底，几张桌子拼在一起，先问分工，再碰杯。',leave:'系统再没亮过。你照常上班、见朋友。那八年学会的东西，一样都没带走。'}[ending];
 const consequence=s.flags.includes('pj-system-25-win')?'当年答应过的事，大半兑现了。老朋友见面，不用先把旧账翻出来。':'有些旧账还没清。他们愿意来，也记得你接下来怎么做。';
 return {id:'pj-after-'+s.age,title:titles[s.age],text:context+consequence,category:'year',tag:'浦江后日谈',speakerId:'pj-wen',illustration:'/art/era/stage-1992.webp',choices:[
  {id:'work',label:ending==='leave'?'做一件自己愿意做的事':'接下眼前的小项目，给新人留一个位置',reply:'你把能做的排好，剩下的交给新人。这一回，没人替别人领功。',effect:{skill:5,network:4,trust:6}},
  {id:'people',label:'把这一晚留给老朋友',reply:'许舟带来一张旧照片，周闻一眼认出当年那只工具箱。你们讲到打烊，约好下回别再隔这么久。',effect:{spirit:8,trust:10}},
 ]};
}
export function pujiangEpilogue(s:GameState){
 if(!isPujiangSystem(s)||!pujiangEnding(s))return;
 const ending=pujiangEnding(s)!;
 const text={independent:'六十岁生日，新主理人请你看第一场演示。名片上是他自己的名字。你把旧工具箱放下，坐到观众中间。',together:'六十岁那天，许舟、周闻各带了一位年轻人来。桌上多了几把椅子，没有固定的主位。陆嘉问谁先开场，你让新人自己选。',leave:'六十岁生日，你又走到江边。眼前没有任务，陆嘉已经替你留了一张票。演出开始前，你把电话放回口袋，安心听完第一首歌。'}[ending];
 return {title:ENDING_NAMES[ending],text:text+(s.flags.includes('pj-system-25-win')?'当年做过的决定，都在今天的人和事里。':'有些人没有再来，但你仍在把答应过的事慢慢做完。')};
}

/** Validate only the new edition. Missing fields continue to mean the legacy story. */
export function validatePujiang(s:GameState):void {
 if(s.storyEdition===undefined){if(s.episode!==undefined||s.systemProgress!==undefined)throw new Error('剧情版本与档案不符。');return;}
 if(s.storyEdition!==2)throw new Error('剧情版本无法识别。');
 const ids=ABILITIES.map(a=>a.id);
 const abilityList=(x:unknown,max:number):x is AbilityId[]=>Array.isArray(x)&&x.length<=max&&new Set(x).size===x.length&&x.every(a=>ids.includes(a));
 if(isPujiangSystem(s)){
  const p=s.systemProgress;
  if(!p||!abilityList(p.learned,6)||!abilityList(p.equipped,abilitySlots(s))||p.equipped.some(a=>!p.learned.includes(a))||!Number.isInteger(p.rewardCash)||p.rewardCash<0||p.rewardCash>3e6||abilityPoints(s)<0)throw new Error('系统成长记录不完整。');
  if(ABILITIES.some(a=>p.learned.includes(a.id)&&a.parent&&(!p.learned.includes(a.parent)||systemLevel(s)<3)))throw new Error('能力前置条件不符。');
  const completed=SYSTEM_EPISODES.filter(e=>s.seenEvents.includes(e.id));
  if(completed.some((e,i)=>e!==SYSTEM_EPISODES[i]||e.age>s.age))throw new Error('章节进度不连续。');
 }else if(s.systemProgress!==undefined)throw new Error('该出身没有系统成长记录。');
 if(s.episode===undefined)return;
 const r=s.episode,script=r&&episodeById(r.id);
 if(!script||script.route!==pujiangRoute(s)||!script.commission&&script.age!==s.age||s.ended||s.showdown||!Array.isArray(r.moves)||r.moves.length>script.scenes.length+2||!abilityList(r.loadout,2)||r.loadout.some(a=>!s.systemProgress?.equipped.includes(a))||r.loadout.length!==(s.systemProgress?.equipped.length??0)||r.moves.some(m=>!m||!['choice','ability'].includes(m.kind)||typeof m.id!=='string'||(m.luck!==undefined&&!['hit','miss'].includes(m.luck))))throw new Error('现场进度不完整。');
 const f=moveFrame(s,script,r,!r.receipt);
 if(r.receipt){
  const v=r.receipt;
  if(f.stage!==script.scenes.length||!s.seenEvents.includes(r.id)||!['win','partial','loss'].includes(v.verdict)||!Number.isInteger(v.cash)||v.cash<0||v.cash>3e6||!v.effect||typeof v.effect!=='object'||!Number.isFinite(v.effect.cash)||[v.title,v.text,v.next].some(t=>typeof t!=='string'||t.length>5000)||!Array.isArray(v.relationships)||v.relationships.length>10||v.relationships.some(t=>typeof t!=='string'||t.length>200)||v.ending!==undefined&&!['independent','together','leave'].includes(v.ending))throw new Error('剧情结算记录损坏。');
 }else if(f.stage>=script.scenes.length||s.seenEvents.includes(r.id))throw new Error('剧情结算与进度不符。');
}
