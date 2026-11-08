import { HOUSING_NAMES } from './content';
import { createGame } from './engine';
import { lifeStartHousing, lifeStartProfile, lifeStartYear } from './lifeStarts';
import { openingStory } from './originStories';
import type { GoalId, OriginCard, PlayerAppearance } from './types';

export function openingForecast(seed: string, cards: OriginCard[], goal: GoalId, appearance: PlayerAppearance) {
 const opening = createGame(seed, '', goal, cards, appearance);
 const profile = lifeStartProfile(opening.origins);
 const event = profile && lifeStartYear(opening);
 return {
  cash: opening.cash,
  housing: lifeStartHousing(opening) ?? HOUSING_NAMES[opening.housing],
  story: profile && event ? { cards: profile.cards.slice(0,2), teaser: profile.line, event } : openingStory(opening.origins),
 };
}
