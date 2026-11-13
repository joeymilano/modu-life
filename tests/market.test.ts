import { describe, expect, it } from 'vitest';
import { calendarYear, SHANGHAI_START } from '../src/game/calendar';
import { allOrigins, createGame, drawOrigins, nextYear, selectEvent } from '../src/game/engine';
import { heirConcierge } from '../src/game/heirConcierge';
import { heirAssets, heirStoryLead, ownsHeirAsset } from '../src/game/heirStory';
import { activeLine, decodeLife, encodeLife, startBook } from '../src/game/lifeLines';
import { LIFE_STARTS } from '../src/game/lifeStarts';
import { marketQuote, marketValue, scratchLottery, tradeMarket } from '../src/game/market';

const fresh = () => ({...createGame('ARRIVALQA','小申','wealth',drawOrigins('ARRIVALQA')),calendar:SHANGHAI_START,cash:100000,pendingYearEvent:false});

describe('1992 investment timeline',()=>{
 it('advances the calendar, reprices held shares and keeps purchases across save/load',()=>{
  const player=fresh();
  expect(calendarYear(player)).toBe(1992);
  const invested=tradeMarket(player,'sh_trade',4,'buy');
  expect(invested.cash).toBeLessThan(player.cash);
  const next=nextYear(invested).state;
  expect(calendarYear(next)).toBe(1993);
  expect(marketValue(next)).not.toEqual(marketValue(invested));
  expect(activeLine(decodeLife(encodeLife(startBook(next)))).state.market).toEqual(next.market);
  const sold=tradeMarket({...next,pendingYearEvent:false},'sh_trade',4,'sell');
  expect(sold.market.holdings.sh_trade).toBeUndefined();
  expect(sold.cash).toBeGreaterThan(next.cash);
  expect(()=>tradeMarket(sold,'sh_trade',1,'sell')).toThrow();
 });

 it('opens A shares in 1992, US exposure in 2007 and Bitcoin in 2011',()=>{
  const player=fresh();
  expect(()=>tradeMarket(player,'sh_trade',1,'buy')).not.toThrow();
  expect(()=>tradeMarket({...player,age:32},'us_index',1,'buy')).toThrow();
  expect(()=>tradeMarket({...player,age:33},'us_index',1,'buy')).not.toThrow();
  expect(()=>tradeMarket({...player,age:36},'btc',1,'buy')).toThrow();
  expect(()=>tradeMarket({...player,age:37},'btc',1,'buy')).not.toThrow();
  expect(marketQuote(player,'us_index',2008)).toBeLessThan(marketQuote(player,'us_index',2007));
 });

 it('charges lottery tickets once per year and does not reroll the same seed',()=>{
  const player=fresh();
  const bought=scratchLottery(player,3);
  expect(bought).toEqual(scratchLottery(player,3));
  expect(bought.state.cash).toBe(player.cash-6+bought.prize);
  expect(()=>scratchLottery(bought.state,1)).toThrow('今年的票');
  expect(()=>scratchLottery({...bought.state,age:19},1)).not.toThrow();
 });

 it('keeps late luxury purchases and catalog prices tied to their era',()=>{
  const start=LIFE_STARTS.find(item=>item.id==='heir')!;
  const cards=start.cards.map(id=>allOrigins().find(card=>card.id===id)!);
  const heir={...createGame(start.seed,'小申','wealth',cards),calendar:SHANGHAI_START};
  expect(selectEvent(heir,'year').title).toBe('今晚锦江饭店见');
  const player={...heir,pendingYearEvent:false};
  expect(heirStoryLead(player)?.event.location).toBe('锦江饭店');
  const list=(age:number)=>heirConcierge({...player,age})!.shopping.flatMap(offer=>offer.event.choices.map(choice=>choice.id));
  expect(list(18)).toContain('classic');
  expect(list(26)).not.toContain('lv');
  expect(list(27)).toContain('lv');
  expect(list(43)).not.toContain('cullinan');
  expect(list(44)).toContain('cullinan');
  expect(list(48)).not.toContain('revuelto');
  expect(list(49)).toContain('revuelto');
  const owner={...player,flags:[...player.flags,'heir-owned-classic']};
  expect(ownsHeirAsset(owner,'classic')).toBe(true);
  expect(heirAssets(owner)[0].price).toBeGreaterThan(heirAssets({...owner,age:30})[0].price);
 });
});
