import { describe, expect, it } from 'vitest';
import { allOrigins, createGame, drawOrigins, monthlyBudget, nextYear, resolveChoice } from '../src/game/engine';
import { heirConcierge, replayConcierge } from '../src/game/heirConcierge';
import { HEIR_CATALOG, heirAssets, heirStoryLead } from '../src/game/heirStory';
import { FAMILY_PAY, LIFE_STARTS, lifeStartHousing } from '../src/game/lifeStarts';
import { activeLine, decodeLife, encodeLife, forkLife, recordDecision, replayScene, startBook } from '../src/game/lifeLines';

function existingLife() {
 const profile = LIFE_STARTS.find(start=>start.id==='heir')!;
 const hand = profile.cards.map(id=>allOrigins().find(card=>card.id===id)!);
 return {...createGame(profile.seed,'小申','free',hand), age:20, actions:0, cash:60_094_598, district:'bund' as const,
  jobId:'business', pendingYearEvent:false};
}

describe('私人礼宾',()=>{
 it('buys both cars and moves into the penthouse in an existing 0-action life',()=>{
  const old = existingLife();
  const cars = heirConcierge(old)!.shopping.find(item=>item.name==='西岸提车')!.event;
  const withCars = resolveChoice(old,cars,'cullinan-revuelto').state;
  const penthouse = heirConcierge(withCars)!.shopping.find(item=>item.name==='看江景顶层')!.event;
  const moved = resolveChoice(withCars,penthouse,'penthouse').state;
  const saved = activeLine(decodeLife(encodeLife(startBook(moved)))).state;
  expect(saved.actions).toBe(0);
  expect(saved.cash).toBe(old.cash-HEIR_CATALOG.cullinan.price-HEIR_CATALOG.revuelto.price-HEIR_CATALOG.penthouse.price);
  expect(heirAssets(saved).map(asset=>asset.id)).toEqual(['cullinan','revuelto','penthouse']);
  expect(lifeStartHousing(saved)).toBe('陆家嘴江景顶层 · 自有');
  expect(saved.flags).not.toContain(FAMILY_PAY);
  expect(monthlyBudget(saved)).toMatchObject({rent:12_000,familyPaid:0});
  expect(nextYear(saved).receipt).toMatchObject({rent:144_000,moment:'penthouse'});
  expect(heirConcierge(saved)!.tonight.find(item=>item.name==='今晚用哪辆车')!.event.choices.map(c=>c.id)).toEqual(['revuelto','cullinan']);
  expect(()=>resolveChoice(saved,cars,'cullinan-revuelto')).toThrow('现在无法办理');
 });

 it('checks cash, prevents repeat bookings, and replays the other choice on a fork',()=>{
  const old = existingLife();
  const boat = heirConcierge(old)!.tonight[0].event;
  expect(()=>resolveChoice({...old,cash:100},boat,'two-hours')).toThrow('拿不出来');
  const booked = resolveChoice(old,boat,'all-night').state;
  expect(booked.cash).toBe(old.cash-168_000);
  expect(booked.actions).toBe(0);
  expect(replayConcierge(booked,boat.id)).toBeUndefined();
  expect(()=>resolveChoice(booked,boat,'two-hours')).toThrow('现在无法办理');
  expect(heirConcierge({...booked,age:21})!.tonight[0].event.id).not.toBe(boat.id);
  const line = activeLine(forkLife(decodeLife(encodeLife(recordDecision(startBook(old),booked,boat,'all-night'))),0));
  expect(replayScene(line.state,line.replay!)).toEqual(boat);
 });

 it('opens before the west Bund story and preserves story access after retail purchases',()=>{
  const fresh = {...existingLife(),age:18,actions:3};
  const mall = heirConcierge(fresh)!.shopping.find(item=>item.name==='恒隆扫货')!.event;
  const withBags = resolveChoice(fresh,mall,'lv-hermes').state;
  expect(withBags.actions).toBe(3);
  expect(heirStoryLead(withBags)?.event.choices.map(choice=>choice.id)).toEqual(['pass']);
  const quit = resolveChoice(withBags,heirConcierge(withBags)!.pause!.event,'leave').state;
  expect(quit.jobId).toBeNull();
  expect(quit.actions).toBe(3);
  expect(heirConcierge(quit)?.pause).toBeUndefined();
  expect(heirConcierge({...fresh,pendingYearEvent:true})).toBeUndefined();
  const other = {...createGame('OTHER','小申','free',drawOrigins('OTHER')),pendingYearEvent:false};
  expect(heirConcierge(other)).toBeUndefined();
  expect(()=>resolveChoice(other,mall,'lv-hermes')).toThrow('现在无法办理');
 });
});
