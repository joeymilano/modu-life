import { expect, it } from 'vitest';
import { createGame, drawOrigins, resolveChoice } from '../src/game/engine';
import { ferryVisit } from '../src/game/ferryVisit';
import { activeLine, decodeLife, encodeLife, forkLife, recordDecision, replayScene, startBook } from '../src/game/lifeLines';

it('remembers both ways to spend the last ferry and replays the choice after a save', () => {
 const state = { ...createGame('LASTFERRY', '小申', 'free', drawOrigins('LASTFERRY')), pendingYearEvent: false };
 const opening = ferryVisit(state)!;
 const boarded = resolveChoice(state, opening, 'board', 'yan').state;
 expect(boarded.cash).toBe(state.cash - 4);
 expect(boarded.actions).toBe(state.actions - 1);
 expect(ferryVisit(boarded)?.illustration).toBe('/art/night-ferry/cabin.webp');

 const book = recordDecision(startBook(state), boarded, opening, 'board', 'yan');
 const branch = activeLine(decodeLife(encodeLife(forkLife(book, 0))));
 const replay = replayScene(branch.state, branch.replay!)!;
 expect(replay.id).toBe(opening.id);
 const stayed = resolveChoice(branch.state, replay, 'stay', 'yan').state;
 expect(stayed.cash).toBe(state.cash);
 expect(ferryVisit(stayed)?.illustration).toBe('/art/night-ferry/booth.webp');
 expect(ferryVisit({ ...stayed, district: 'anfu' })).toBeNull();
 const followup = ferryVisit(stayed)!;
 expect(ferryVisit(resolveChoice(stayed, followup, 'share', 'yan').state)).toBeNull();
});
