import { HOUSING_NAMES } from './content';
import { createGame } from './engine';
import { lifeStartHousing, lifeStartProfile, lifeStartYear } from './lifeStarts';
import { PROLOGUES } from './pujiangPrologue';
import { openingStory } from './originStories';
import { beginPujiangLife, episodeOffer } from './pujiang';
import type { GoalId, OriginCard, PlayerAppearance } from './types';

export function openingForecast(seed: string, cards: OriginCard[], goal: GoalId, appearance: PlayerAppearance, newStory=false) {
 const opening = createGame(seed, '', goal, cards, appearance);
 const profile = lifeStartProfile(opening.origins);
 const event = profile && lifeStartYear(opening);
 if(newStory){
  const episode=episodeOffer(beginPujiangLife(opening))!;
  const prologue=PROLOGUES[episode.route];
  return {cash:opening.cash,housing:lifeStartHousing(opening)??HOUSING_NAMES[opening.housing],
   story:{cards:opening.origins,teaser:episode.goal,event:{id:episode.id,title:prologue.title,text:prologue.setup,category:'year' as const,choices:[],illustration:prologue.photo}}};
 }
 return {
  cash: opening.cash,
  housing: lifeStartHousing(opening) ?? HOUSING_NAMES[opening.housing],
  story: profile && event ? { cards: profile.cards.slice(0,2), teaser: profile.line, event } : openingStory(opening.origins),
 };
}
