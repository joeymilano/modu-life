import { calendarYear } from './calendar';
import { hashSeed } from './seed';
import type { GameState } from './types';

interface Listing {
 name:string;
 market:string;
 lot:string;
 quotes:readonly (readonly [number,number])[];
}
export const LISTINGS = {
 sh_trade:{name:'海城商贸',market:'沪市 A 股',lot:'100 股',quotes:[
  [1992,760],[1993,1450],[1994,585],[1997,1240],[2001,1960],[2005,980],[2007,5400],[2008,1760],[2014,3600],[2015,5500],[2016,3500],[2020,4400],[2025,5840],[2034,7020],
 ]},
 sh_transport:{name:'申江运输',market:'沪市 A 股',lot:'100 股',quotes:[
  [1992,410],[1994,720],[1997,1050],[1998,610],[2001,1480],[2007,3980],[2008,1210],[2011,2140],[2015,3520],[2019,2680],[2022,3950],[2025,3290],[2034,4720],
 ]},
 us_index:{name:'美国大盘组合',market:'美股 · QDII',lot:'1 份',quotes:[
  [2007,1000],[2008,620],[2011,920],[2015,1460],[2018,1690],[2020,2260],[2021,2910],[2022,2360],[2025,3660],[2034,5130],
 ]},
 us_tech:{name:'美国科技组合',market:'美股 · QDII',lot:'1 份',quotes:[
  [2007,1000],[2008,590],[2010,1090],[2014,1860],[2018,3080],[2020,5130],[2021,6650],[2022,4300],[2025,8350],[2034,11650],
 ]},
 btc:{name:'比特币',market:'数字资产',lot:'0.01 BTC',quotes:[
  [2011,1],[2012,1],[2013,48],[2014,22],[2016,61],[2017,880],[2018,260],[2020,1780],[2021,3320],[2022,1190],[2025,6410],[2034,7750],
 ]},
} satisfies Record<string,Listing>;
export type ListingId = keyof typeof LISTINGS;
export const LISTING_IDS = Object.keys(LISTINGS) as ListingId[];
const MAX_LOTS = 1_000_000;
const MAX_CASH = 1e12;

interface Position { lots:number; cost:number }
export interface MarketAccount {
 holdings:Partial<Record<ListingId,Position>>;
 lottery?: {year:number;count:number;prize:number};
}

function prices(id:ListingId,year:number) {
 const ticks:Listing['quotes']=LISTINGS[id].quotes;
 const next=ticks.findIndex(([at])=>at>=year);
 if (next===0) return ticks[0][1];
 if (next<0) return ticks[ticks.length-1][1];
 const [a,x]=ticks[next-1], [b,y]=ticks[next];
 return x+(y-x)*(year-a)/(b-a);
}

export function marketQuote(state:Pick<GameState,'seed'>,id:ListingId,year:number) {
 const drift=(hashSeed(state.seed+'-market-'+id+'-'+year)%201-100)/1000;
 const future=year>2034 ? Math.pow(1.02,year-2034) : 1;
 return Math.max(1,Math.round(prices(id,year)*(1+drift)*future));
}

export const openYear = (id:ListingId) => LISTINGS[id].quotes[0][0];

export function marketValue(state:GameState) {
 return LISTING_IDS.reduce((sum,id)=>sum+(state.market?.holdings[id]?.lots??0)*marketQuote(state,id,calendarYear(state)),0);
}

export function tradeValue(state:GameState,id:ListingId,lots:number,side:'buy'|'sell') {
 const gross=marketQuote(state,id,calendarYear(state))*lots;
 const fee=Math.min(gross,Math.max(1,Math.ceil(gross*.005)));
 return side==='buy'?gross+fee:gross-fee;
}

export function tradeMarket(state:GameState,id:ListingId,lots:number,side:'buy'|'sell') {
 if (state.ended||state.pendingYearEvent||state.showdown) throw new Error('处理完眼前这件事再交易。');
 if (!LISTING_IDS.includes(id)||calendarYear(state)<openYear(id)||!Number.isInteger(lots)||lots<=0||lots>MAX_LOTS||(side!=='buy'&&side!=='sell')) {
  throw new Error('这笔交易现在办不了。');
 }
 const market=state.market??{holdings:{}};
 const position=market.holdings[id]??{lots:0,cost:0};
 const value=tradeValue(state,id,lots,side);
 if (side==='buy'&&(value>state.cash||position.lots+lots>MAX_LOTS)) throw new Error('可用余额或持仓额度不足。');
 if (side==='sell'&&(lots>position.lots||state.cash+value>MAX_CASH)) throw new Error('可卖份额或现金额度不足。');
 const remaining=side==='buy'?position.lots+lots:position.lots-lots;
 const holdings={...market.holdings};
 if (remaining) holdings[id]={lots:remaining,cost:side==='buy'?position.cost+value:Math.round(position.cost*remaining/position.lots)};
 else delete holdings[id];
 return {
  ...state,cash:state.cash+(side==='buy'?-value:value),market:{...market,holdings},
  journal:[...state.journal,{age:state.age,title:(side==='buy'?'买入':'卖出')+' · '+LISTINGS[id].name,
   text:lots+' 手 · ¥'+value.toLocaleString('zh-CN'),tag:'交易所'}].slice(-1000),
 };
}

export function lotteryPrice(year:number){return year<2000?2:5;}

export function scratchLottery(state:GameState,count:number) {
 if (state.ended||state.pendingYearEvent||state.showdown) throw new Error('处理完眼前这件事再买票。');
 const year=calendarYear(state);
 if (state.market?.lottery?.year===year) throw new Error('今年的票已经刮过了。');
 const unit=lotteryPrice(year);
 if (!Number.isInteger(count)||count<1||count>3||state.cash<count*unit) throw new Error('这笔票钱付不了。');
 let prize=0;
 for(let index=0;index<count;index++){
  const draw=hashSeed(state.seed+'-scratch-'+year+'-'+index)%10000;
  prize+=draw===0?unit*5000:draw<20?unit*50:draw<230?unit*5:draw<2600?unit:0;
 }
 const next={...state,cash:Math.min(MAX_CASH,state.cash-count*unit+prize),
  market:{holdings:state.market?.holdings??{},lottery:{year,count,prize}},
  journal:[...state.journal,{age:state.age,title:'刮了 '+count+' 张彩票',
   text:prize?'兑回 ¥'+prize.toLocaleString('zh-CN'):'票刮完了，一张都没中。',tag:'彩票'}].slice(-1000),
 };
 return {state:next,prize};
}

export function validateMarket(value:unknown,year:number):MarketAccount {
 if (!value||typeof value!=='object'||Array.isArray(value)) throw new Error('资产账本读不出来。');
 const {holdings,lottery}=value as MarketAccount;
 if (!holdings||typeof holdings!=='object'||Array.isArray(holdings)) throw new Error('持仓读不出来。');
 const safe:MarketAccount={holdings:{}};
 for(const [id,position] of Object.entries(holdings)){
  if(!LISTING_IDS.includes(id as ListingId)||year<openYear(id as ListingId)||!position||
     !Number.isInteger(position.lots)||position.lots<1||position.lots>MAX_LOTS||
     !Number.isSafeInteger(position.cost)||position.cost<0||position.cost>MAX_CASH) throw new Error('持仓数值不对。');
  safe.holdings[id as ListingId]={lots:position.lots,cost:position.cost};
 }
 if(lottery!==undefined){
  if(!lottery||!Number.isInteger(lottery.year)||lottery.year<1992||lottery.year>year||
     !Number.isInteger(lottery.count)||lottery.count<1||lottery.count>3||
     !Number.isSafeInteger(lottery.prize)||lottery.prize<0||lottery.prize>75_000) throw new Error('彩票记录读不出来。');
  safe.lottery={...lottery};
 }
 return safe;
}
