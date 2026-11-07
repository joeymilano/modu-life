import { FIRST_NIGHT_FLAG } from '../src/game/firstNight';
import { streetLead } from '../src/game/streetLeads';
import { describe, expect, it } from 'vitest';
import { createGame, drawOrigins, nextYear, resolveChoice, selectEvent } from '../src/game/engine';
import { activeLine, decodeLife, encodeLife, forkLife, recordDecision, replayScene, startBook, switchLine, updateLife } from '../src/game/lifeLines';

describe('my life branches', () => {
  const opening = () => createGame('TWIN', '小申', 'free', drawOrigins('TWIN'));

  it('replays the original decision state while the old line keeps living', () => {
    const before = opening();
    const event = selectEvent(before, 'year');
    const choice = event.choices[0];
    const original = resolveChoice(before, event, choice.id).state;
    const yearLater = nextYear(original).state;
    const root = updateLife(recordDecision(startBook(before), original, event, choice.id), yearLater);
    const branches = forkLife(root, 0);
    expect(activeLine(branches).state).toEqual(before);
    expect(replayScene(before, activeLine(branches).replay!)).toEqual(event);

    const other = event.choices[1];
    const altered = resolveChoice(before, event, other.id).state;
    const played = recordDecision(branches, altered, event, other.id);
    expect(activeLine(played).replay).toBeUndefined();
    expect(activeLine(played).points[0].choice).toBe(other.label);
    expect(activeLine(switchLine(played, 0)).state).toEqual(yearLater);
    expect(activeLine(switchLine(played, 1)).state.journal.at(-1)?.text).not.toBe(original.journal.at(-1)?.text);
  });

  it('round trips both lines and an unplayed checkpoint through the save file', () => {
    const before = opening();
    const event = selectEvent(before, 'year');
    const choice = event.choices[0].id;
    const result = resolveChoice(before, event, choice).state;
    const book = forkLife(recordDecision(startBook(before), result, event, choice), 0);
    expect(decodeLife(JSON.parse(JSON.stringify(encodeLife(book))))).toEqual(book);
    expect(decodeLife(before)).toEqual(startBook(before));
  });

  it('turns the opening messages into different playable scenes and yearly consequences', () => {
    const before = opening();
    const event = selectEvent(before, 'year');
    const room = resolveChoice(before, event, '1').state;
    const shift = resolveChoice(before, event, '2').state;
    const ferry = resolveChoice(before, event, '3').state;
    expect([room, shift, ferry].map(state => streetLead(state)?.event.district)).toEqual(['xinzhuang', 'anfu', 'bund']);
    expect(selectEvent(nextYear(shift).state, 'year').id).toBe('first-night-missed');
    const lead = streetLead(shift)!.event;
    const worked = resolveChoice(shift, lead, '1').state;
    expect(streetLead(worked)).toBeNull();
    const next = nextYear(worked).state;
    const followup = selectEvent(next, 'year');
    expect(resolveChoice(next, followup, '1').state.jobId).toBe('service');
    expect(replayScene(shift, activeLine(forkLife(recordDecision(startBook(shift), worked, lead, '1'), 0)).replay!)).toEqual(lead);

    const legacy = { ...before, flags: before.flags.filter(flag => flag !== FIRST_NIGHT_FLAG) };
    expect(selectEvent(legacy, 'year').id).toBe('year-18');
  });

});
