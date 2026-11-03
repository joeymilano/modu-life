import { describe, expect, it } from 'vitest';
import { CAREERS, CAST, ORIGIN_POOLS } from '../src/game/content';
import { EVENTS } from '../src/game/events';
import { createGame, drawOrigins, ending, eligibleEvent, monthlyBudget, nextYear, resolveChoice, selectEvent, validateSave } from '../src/game/engine';
import type { ActivityKind, GameState, LifeEvent } from '../src/game/types';
function freeChoice(s:GameState,e:LifeEvent){return e.choices.find(c=>(c.effect.cash||0)>=0)||e.choices.find(c=>(c.effect.cash||0)>=-s.cash)!;}
function annual(s:GameState){if(!s.pendingYearEvent)return s;const e=selectEvent(s,'year');return resolveChoice(s,e,freeChoice(s,e).id).state;}
function run(seed:string,job:string):GameState{let s=createGame(seed,'测试玩家','free',drawOrigins(seed));s.jobId=job;for(let year=18;year<60;year++){s=annual(s);for(const kind of ['rest','learn','social'] as ActivityKind[]){const e=selectEvent(s,kind);s=resolveChoice(s,e,freeChoice(s,e).id).state;}s=nextYear(s).state;validateSave(s);}return s;}

describe('人生规则',()=>{
 it('同一手牌可复现，五个槽位各有一张',()=>{expect(drawOrigins('SHANGHAI')).toEqual(drawOrigins('SHANGHAI'));expect(new Set(drawOrigins('SHANGHAI').map(c=>c.slot)).size).toBe(5);});
 it('富二代遇到冻结副卡时，可用现金确实受限',()=>{const cards=drawOrigins('FROZEN');cards[0]=ORIGIN_POOLS['出身'].find(c=>c.id==='born-rich')!;cards[1]=ORIGIN_POOLS['家底'].find(c=>c.id==='fund-frozen')!;const s=createGame('FROZEN','小申','wealth',cards);expect(s.cash).toBeLessThanOrEqual(24000);expect(s.flags).toContain('family_rich');});
 it('家庭副卡故事仅对相关出身开放',()=>{const s=createGame('GATE','小申','free',drawOrigins('GATE'));s.flags=[];const e=EVENTS.find(e=>e.id==='family_card-0')!;expect(eligibleEvent(e,s,'career')).toBe(false);s.flags=['family_rich'];expect(eligibleEvent(e,s,'career')).toBe(true);});
 it('三个不同出身都能从18岁走到60岁，并保留完整账本',()=>{for(const [seed,job]of [['A','tech'],['B','public'],['C','business']]){const s=run(seed,job);expect(s.age).toBe(60);expect(s.ended).toBe(true);expect(s.journal.filter(j=>j.tag==='账本')).toHaveLength(42);expect(ending(s).title.length).toBeGreaterThan(0);}});
 it('年度事件不消耗三格行动，普通事件只扣一格',()=>{let s=createGame('C','申申','free',drawOrigins('C'));s=annual(s);expect(s.actions).toBe(3);const e=selectEvent(s,'rest');s=resolveChoice(s,e,freeChoice(s,e).id).state;expect(s.actions).toBe(2);});
 it('没钱也有恢复路线，不提前删除人生',()=>{let s=annual(createGame('D','小申','wealth',drawOrigins('D')));s.cash=0;s.jobId=null;const r=nextYear(s);expect(r.state.age).toBe(19);expect(r.state.ended).toBe(false);expect(r.state.cash).toBe(6000);expect(r.state.rescues).toBe(1);});
 it('一次选择不能重复消费最后一格时间',()=>{let s=annual(createGame('E','小申','love',drawOrigins('E')));s.actions=1;const e=selectEvent(s,'rest');s=resolveChoice(s,e,freeChoice(s,e).id).state;expect(()=>resolveChoice(s,e,freeChoice(s,e).id)).toThrow();});
 it('晋升依据阈值，初级不会错误跳过一级',()=>{let s=annual(createGame('F','小申','craft',drawOrigins('F')));s.jobId='tech';s.jobRank=0;s.stats.skill=28;const e:LifeEvent={id:'test-career',title:'工作',text:'工作',category:'career',choices:[{id:'ok',label:'继续',reply:'继续',effect:{}}]};s=resolveChoice(s,e,'ok').state;expect(s.jobRank).toBe(0);s.stats.skill=70;s=resolveChoice(s,e,'ok').state;expect(s.jobRank).toBe(2);});
 it('选择未见人物的事件不会给其他人错误增加信任',()=>{let s=annual(createGame('G','小申','love',drawOrigins('G')));const e:LifeEvent={id:'test-trust',title:'约会',text:'聊聊',category:'romance',choices:[{id:'yes',label:'听',reply:'听完了',effect:{trust:12,attraction:8}}]};const before=s.relationships.xia.trust;s=resolveChoice(s,e,'yes','xia').state;expect(s.relationships.xia.trust).toBe(before+12);expect(s.relationships.ning.met).toBe(false);});
 it('导入档案拒绝非法年龄、未知职业和非有限金额',()=>{const s=createGame('H','小申','free',drawOrigins('H'));expect(()=>validateSave({...s,age:999})).toThrow();expect(()=>validateSave({...s,jobId:'injected'})).toThrow();expect(()=>validateSave({...s,cash:NaN})).toThrow();expect(validateSave(s)).toEqual(s);});
 it('工作压力和关系疏于维护确实有代价',()=>{let s=annual(createGame('I','小申','love',drawOrigins('I')));s.jobId='finance';s.stats.health=80;s.stats.spirit=80;s.partnerId='xia';s.relationships.xia.trust=80;const r=nextYear(s).state;expect(r.stats.spirit).toBeLessThan(75);expect(r.relationships.xia.trust).toBe(76);});
 it('固定预算不受可视化和漫游影响',()=>{const s=createGame('J','小申','wealth',drawOrigins('J'));s.jobId='service';expect(monthlyBudget(s)).toEqual(monthlyBudget({...s,district:'anfu'}));});
});

describe('内容资料可运行',()=>{
 it('开局40张、24名人物、8位恋爱对象、8条职业',()=>{expect(Object.values(ORIGIN_POOLS).flat()).toHaveLength(40);expect(CAST).toHaveLength(24);expect(CAST.filter(c=>c.role==='romance')).toHaveLength(8);expect(CAREERS).toHaveLength(8);});
 it('事件id唯一，每个事件都有一个无现金支出选项',()=>{expect(new Set(EVENTS.map(e=>e.id)).size).toBe(EVENTS.length);for(const e of EVENTS){expect(e.choices.length,e.id).toBe(3);expect(e.choices.some(c=>(c.effect.cash||0)>=0),e.id).toBe(true);if(e.speakerId)expect(CAST.some(c=>c.id===e.speakerId),e.id).toBe(true);for(const c of e.choices){if(c.effect.job)expect([...CAREERS.map(c=>c.id),'unemployed']).toContain(c.effect.job);}}});
 it('42个年度都有确定的来信',()=>{for(let age=18;age<60;age++)expect(EVENTS.some(e=>e.category==='year'&&e.minAge===age&&e.maxAge===age)).toBe(true);});
});

