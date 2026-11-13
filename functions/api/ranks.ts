import type { D1Database, PagesFunction, Request as CloudRequest, Response as CloudResponse } from '@cloudflare/workers-types';
import type { CampaignRoute } from '../../src/game/campaignScript';
import {
 isRankWeek, priorWeek, RANK_ATTEMPTS, rankWeek, weeklyShowdown,
 type RankBoard, type RankedPlayer, type RankRow,
} from '../../src/game/ranked';
import { playShowdown, showdownView, SHOWDOWN_ROUTES, validateShowdown } from '../../src/game/showdowns';

declare const Response: typeof CloudResponse;

interface Env { RANK_DB: D1Database }
interface RunRow { id:string; attempt:number; state:string; round:number; last_request:string|null }
const cookieName = 'modu_rank';
const hex = (bytes:Uint8Array) => Array.from(bytes,value=>value.toString(16).padStart(2,'0')).join('');
const digest = async (secret:string) => hex(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(secret))));
const headers = {'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const reply = (data:unknown,status=200,extra?:Record<string,string>) => Response.json(data,{status,headers:{...headers,...extra}});
const error = (message:string,status=400) => reply({error:message},status);

async function playerFor(db:D1Database,request:CloudRequest) {
 const token=request.headers.get('cookie')?.split(';').map(item=>item.trim())
  .find(item=>item.startsWith(cookieName+'='))?.slice(cookieName.length+1);
 if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
 return db.prepare('SELECT id, nickname FROM rank_players WHERE token_hash = ?').bind(await digest(token)).first<RankedPlayer>();
}

async function join(db:D1Database,nickname:unknown,secure:boolean) {
 const name=typeof nickname==='string'?nickname.trim().normalize('NFC'):'';
 if (!/^[\p{Script=Han}a-zA-Z0-9_]{2,12}$/u.test(name)) return error('昵称用 2–12 个汉字、字母、数字或下划线。');
 const token=hex(crypto.getRandomValues(new Uint8Array(32)));
 const id='SH-'+hex(crypto.getRandomValues(new Uint8Array(6))).toUpperCase();
 await db.prepare('INSERT INTO rank_players (id,nickname,token_hash) VALUES (?,?,?)').bind(id,name,await digest(token)).run();
 const cookie=cookieName+'='+token+'; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000'+(secure?'; Secure':'');
 return reply({id,nickname:name},201,{'Set-Cookie':cookie});
}

const ranked = `
 WITH best AS (
   SELECT player_id, MAX(score) AS score FROM rank_runs
   WHERE week = ? AND route = ? AND score IS NOT NULL GROUP BY player_id
 ), places AS (
   SELECT player_id, score, RANK() OVER (ORDER BY score DESC) AS position FROM best
 )
 SELECT p.id, p.nickname, places.score, places.position FROM places
 JOIN rank_players p ON p.id = places.player_id`;
const latest = (db:D1Database,id:string,week:string,route:CampaignRoute) => db.prepare(
 'SELECT id, attempt, state, round, last_request FROM rank_runs WHERE player_id = ? AND week = ? AND route = ? ORDER BY attempt DESC LIMIT 1',
).bind(id,week,route);
const present = (row:RunRow) => ({id:row.id,attempt:row.attempt,game:validateShowdown(JSON.parse(row.state))});

async function getBoard(db:D1Database,week:string,current:string,route:CampaignRoute,player:RankedPlayer|null) {
 const top=db.prepare(ranked+' ORDER BY score DESC, p.id LIMIT 50').bind(week,route);
 const [rows,mine,run] = await Promise.all([
  top.all<RankRow>(),
  player?db.prepare(ranked+' WHERE p.id = ?').bind(week,route,player.id).first<RankRow>():null,
  player&&week===current?latest(db,player.id,week,route).first<RunRow>():null,
 ]);
 const board:RankBoard={week,current,previous:priorWeek(current),player,mine,rows:rows.results,
  latest:run?present(run):null,challenge:weeklyShowdown(week,route)};
 return reply(board);
}

async function startRun(db:D1Database,player:RankedPlayer,week:string,route:CampaignRoute,after:unknown) {
 if (after!==null&&(typeof after!=='string'||!/^[a-f0-9-]{36}$/.test(after))) return error('请刷新排位再开一局。');
 const first=JSON.stringify(weeklyShowdown(week,route));
 // Matching the last known run makes a retried start resume the same attempt.
 await db.prepare(`
  INSERT OR IGNORE INTO rank_runs (id, player_id, week, route, attempt, state)
  SELECT ?, ?, ?, ?, COALESCE(MAX(attempt),0)+1, ? FROM rank_runs
  WHERE player_id = ? AND week = ? AND route = ?
  HAVING COUNT(*) < ? AND COUNT(*) = COUNT(score)
   AND ((COUNT(*) = 0 AND ? IS NULL) OR (COUNT(*) > 0 AND
    ? = (SELECT id FROM rank_runs WHERE player_id = ? AND week = ? AND route = ? ORDER BY attempt DESC LIMIT 1)))
 `).bind(crypto.randomUUID(),player.id,week,route,first,player.id,week,route,RANK_ATTEMPTS,after,after,player.id,week,route).run();
 const row=await latest(db,player.id,week,route).first<RunRow>();
 if (!row) return error('这场还没开，请刷新排位。',409);
 if (row.round===3&&row.id===after) return error('本周的三次机会已用完。',409);
 return reply(present(row));
}

async function moveRun(db:D1Database,player:RankedPlayer,week:string,route:CampaignRoute,body:Record<string,unknown>) {
 const {id,step,move,requestId}=body;
 if (typeof id!=='string'||!/^[a-f0-9-]{36}$/.test(id)||typeof step!=='number'||!Number.isInteger(step)||step<0||step>2||
     typeof requestId!=='string'||!/^[a-f0-9-]{36}$/.test(requestId)||typeof move!=='string') return error('这一步读不出来。');
 const owned = db.prepare('SELECT id, attempt, state, round, last_request FROM rank_runs WHERE id = ? AND player_id = ? AND week = ? AND route = ?')
  .bind(id,player.id,week,route);
 const row=await owned.first<RunRow>();
 if (!row) return error('找不到这局排位。',404);
 if (row.last_request===requestId || row.round>step) return reply(present(row));
 if (row.round!==step) return error('进度变了，请重新载入。',409);
 let game;
 try{game=playShowdown(present(row).game,move);}
 catch{return error('这一步现在走不了。',422);}
 const score=showdownView(game).score??null;
 await db.prepare('UPDATE rank_runs SET state = ?, round = ?, score = ?, last_request = ? WHERE id = ? AND player_id = ? AND round = ?')
  .bind(JSON.stringify(game),step+1,score,requestId,id,player.id,step).run();
 const confirmed=await owned.first<RunRow>();
 return confirmed?reply(present(confirmed)):error('找不到这局排位。',404);
}

export const onRequest:PagesFunction<Env> = async ({request,env}) => {
 try {
  const url=new URL(request.url);
  const db=env.RANK_DB;
  if (!db) return error('排位暂时连不上。',503);
  const current=rankWeek();
  if (request.method==='GET') {
   const route=url.searchParams.get('route') as CampaignRoute;
   const week=url.searchParams.get('week')??current;
   if (!SHOWDOWN_ROUTES.includes(route)||!isRankWeek(week)||week>current) return error('找不到这一期。',404);
   return await getBoard(db,week,current,route,await playerFor(db,request));
  }
  if (request.method!=='POST') return error('这项操作不支持。',405);
  if (request.headers.get('origin')!==url.origin||!request.headers.get('content-type')?.startsWith('application/json')) {
   return error('请从游戏内打开排位。',403);
  }
  const raw=await request.text();
  if (raw.length>2048) return error('这项操作太长了。',413);
  const body=JSON.parse(raw) as Record<string,unknown>|null;
  if (!body||typeof body!=='object'||Array.isArray(body)) return error('这项操作读不出来。');
  const player=await playerFor(db,request);
  if (body.op==='join') return player?reply(player):await join(db,body.nickname,url.protocol==='https:');
  if (!player) return error('先取个昵称参赛。',401);
  const route=body.route as CampaignRoute;
  if (!SHOWDOWN_ROUTES.includes(route)||body.week!==current) return error('这期已结束，去看本周的新题。',409);
  if (body.op==='start') return await startRun(db,player,current,route,body.after);
  if (body.op==='move') return await moveRun(db,player,current,route,body);
  return error('这项操作读不出来。');
 }catch(cause){
  if (cause instanceof SyntaxError) return error('这项操作读不出来。');
  console.error('rank service error',cause);
  return error('排位暂时连不上，稍后再试。',503);
 }
};
