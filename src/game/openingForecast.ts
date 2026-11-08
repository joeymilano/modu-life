import { HOUSING_NAMES } from './content';
import { createGame } from './engine';
import { openingStory } from './originStories';
import type { GoalId, OriginCard, PlayerAppearance } from './types';

export function openingForecast(seed: string, cards: OriginCard[], goal: GoalId, appearance: PlayerAppearance) {
 const opening = createGame(seed, '', goal, cards, appearance);
 return {
  cash: opening.cash,
  housing: HOUSING_NAMES[opening.housing],
  story: openingStory(opening.origins),
 };
}
