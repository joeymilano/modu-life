import { HOUSING_NAMES } from './content';
import { createGame } from './engine';
import { LIFE_STARTS, lifeStartHousing, lifeStartYear } from './lifeStarts';
import { openingStory } from './originStories';
import type { GoalId, OriginCard, PlayerAppearance } from './types';

export function openingForecast(seed: string, cards: OriginCard[], goal: GoalId, appearance: PlayerAppearance) {
 const opening = createGame(seed, '', goal, cards, appearance);
 const profile = LIFE_STARTS.find(start => opening.origins.includes(start.cards[0]));
 const event = profile && lifeStartYear(opening);
 return {
  cash: opening.cash,
  housing: lifeStartHousing(opening) ?? HOUSING_NAMES[opening.housing],
  story: profile && event ? { cards: profile.cards.slice(0,2), teaser: profile.line, event } : openingStory(opening.origins),
 };
}
