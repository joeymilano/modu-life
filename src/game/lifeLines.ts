import { CAST } from './content';
import { replayContactStory } from './contactStories';
import { ACTIVITY_NAMES, oldYearLetter, replayCatalogEvent, SAVE_KEY, selectEvent, validateSave } from './engine';
import { replayHeirVisit } from './heirStory';
import { heirBoardVisit } from './lifeStarts';
import { campaignLead } from './lifeCampaign';
import { firstNightLead } from './firstNight';
import { systemRedemption } from './systemStory';
import { replayLocalLead, streetLead } from './streetLeads';
import { replayCorner } from './streetCorners';
import { nightOwlLetter } from './encounters';
import { returnDate } from './dateReturns';
import { householdVisit } from './household';
import { firstDateParting } from './dates';
import { parkVisit } from './matchmaking';
import { ferryVisit } from './ferryVisit';
import { isStallSettlement, replayStall } from './stall';
import { isJobOffer, replayJobOffer } from './jobOffers';
import { openingLead } from './originStories';
import { ALL_RENTAL_CLUES, isRentalRenewal, rentalNegotiation, rentalRenewal } from './rental';
import { isWorkHandover, workHandover } from './workHandover';
import type { ActivityKind, FirstDatePicks, GameState, LifeEvent } from './types';

export const MAX_LINES = 8;
const MAX_POINTS = 24;
export const SAVE_SIZE_LIMIT = 2_000_000;

interface SceneRef {
  kind: ActivityKind | 'year' | 'owl' | 'lead' | 'match' | 'origin' | 'date' | 'rental';
  eventId: string;
  npc?: string;
  picks?: FirstDatePicks;
  evidence?: number;
}

interface ForkPoint {
  scene: SceneRef;
  title: string;
  choice: string;
  before: Omit<GameState, 'journal'>;
  journalLength: number;
}

export interface LifeLine {
  id: number;
  state: GameState;
  points: ForkPoint[];
  from?: { line: number; age: number; title: string };
  replay?: SceneRef;
}

export interface LifeBook {
  active: number;
  nextId: number;
  lines: LifeLine[];
}

export const lineName = (id: number) => id === 0 ? '原线' : '支线 ' + String(id).padStart(2, '0');

export function startBook(state: GameState): LifeBook {
  return { active: 0, nextId: 1, lines: [{ id: 0, state, points: [] }] };
}

export function activeLine(book: LifeBook) {
  return book.lines.find(line => line.id === book.active)!;
}

function updateLine(book: LifeBook, line: LifeLine): LifeBook {
  return { ...book, lines: book.lines.map(item => item.id === line.id ? line : item) };
}

export function updateLife(book: LifeBook, state: GameState): LifeBook {
  return updateLine(book, { ...activeLine(book), state });
}

export function clearReplay(book: LifeBook): LifeBook {
  return updateLine(book, { ...activeLine(book), replay: undefined });
}

export function replayScene(state: GameState, scene: SceneRef): LifeEvent | null {
  if (scene.eventId.startsWith('contact-')) return replayContactStory(state,scene.eventId);
  if (scene.eventId.startsWith('street-corner-')) return replayCorner(state,scene.eventId);
  if (scene.kind === 'lead' && scene.eventId.startsWith('street-')) return replayLocalLead(state,scene.eventId);
  if (scene.kind === 'lead') {
    const visits = [firstNightLead(state)?.event, replayHeirVisit(state,scene.eventId), heirBoardVisit(state), campaignLead(state)?.event, systemRedemption(state)];
    const event = visits.find(visit=>visit?.id===scene.eventId);
    if (event) return event;
  }
  if (scene.kind === 'business' && isStallSettlement(scene.eventId)) return replayStall(state, scene.eventId);
  if (scene.kind === 'career' && isJobOffer(scene.eventId)) return replayJobOffer(state, scene.eventId);
  if (scene.eventId.startsWith('bund-ferry-')) {
    const event = ferryVisit(state);
    return event?.id === scene.eventId ? event : null;
  }
  if (isRentalRenewal(scene.eventId)) {
    const event = rentalRenewal(state);
    return event?.id === scene.eventId ? event : null;
  }
  if (isWorkHandover(scene.eventId)) {
    const event = workHandover(state);
    return event?.id === scene.eventId ? event : null;
  }
  if (scene.kind === 'rental') {
    if (scene.evidence === undefined || state.district !== 'xinzhuang' || state.flags.includes('rental_checked')) return null;
    const event = rentalNegotiation(scene.evidence);
    return event.id === scene.eventId ? event : null;
  }
  if (scene.kind === 'date') {
    const person = CAST.find(item => item.id === scene.npc);
    const event = person && scene.picks && firstDateParting(state, person, scene.picks);
    return event?.id === scene.eventId ? event : null;
  }
  if (scene.kind === 'romance' && scene.npc) {
    const household = householdVisit(state, scene.npc);
    if (household?.id === scene.eventId) return household;
    const date = returnDate(state, scene.npc);
    if (date?.id === scene.eventId) return date;
  }
  const event = scene.kind === 'owl' ? nightOwlLetter(state) :
    scene.kind === 'lead' ? streetLead(state)?.event :
    scene.kind === 'match' ? parkVisit(state)?.event :
    scene.kind === 'origin' ? openingLead(state)?.event : selectEvent(state, scene.kind, scene.npc);
  if (event?.id === scene.eventId) return event;
  // Saved branches can point to a year's original letter after a new scene takes its place.
  if (scene.kind === 'year' && scene.eventId === `year-${state.age}`) return oldYearLetter(state) ?? null;
  if (scene.kind in ACTIVITY_NAMES) return replayCatalogEvent(state,scene.eventId,scene.kind as ActivityKind,scene.npc);
  return null;
}

export function recordDecision(book: LifeBook, state: GameState, event: LifeEvent, choiceId: string, npc?: string): LifeBook {
  const line = activeLine(book);
  const { journal, ...before } = line.state;
  const isRental = event.rentalEvidence !== undefined;
  const kind = isRental ? 'rental' : event.firstDate ? 'date' : event.tag === '开局插曲' ? 'origin' : event.id.startsWith('matchmaking-') ? 'match' : event.tag === '夜猫子来信' ? 'owl' :
    (firstNightLead(line.state)?.event.id===event.id || replayHeirVisit(line.state,event.id) || heirBoardVisit(line.state)?.id === event.id || campaignLead(line.state)?.event.id===event.id
      || systemRedemption(line.state)?.id===event.id || streetLead(line.state)?.event.id === event.id) ? 'lead' : event.category;
  const defaultEvent = replayScene(line.state, { kind, eventId: event.id });
  const scene: SceneRef = {
    kind, eventId: event.id,
    npc: isRental || event.firstDate ? event.speakerId : defaultEvent?.title === event.title && defaultEvent.text === event.text ? undefined : npc,
    ...(event.firstDate && { picks: event.firstDate }),
    ...(isRental && { evidence: event.rentalEvidence }),
  };
  const chosen = event.choices.find(choice => choice.id === choiceId);
  const points = chosen && event.choices.length > 1
    ? [...line.points, { scene, title: event.title, choice: chosen.label, before, journalLength: journal.length }].slice(-MAX_POINTS)
    : line.points;
  return updateLine(book, { ...line, state, points, replay: undefined });
}

export function forkLife(book: LifeBook, index: number): LifeBook {
  const current = activeLine(book);
  const point = current.points[index];
  if (!point) throw new Error('这处岔路已经不在记事里');
  if (book.lines.length >= MAX_LINES) throw new Error('时间线已满，先删掉一条支线');
  const state = { ...point.before, journal: current.state.journal.slice(0, point.journalLength) };
  if (!replayScene(state, point.scene)) throw new Error('这段故事已改版，换个岔路试试');
  const line: LifeLine = {
    id: book.nextId, state, points: current.points.slice(0, index), replay: point.scene,
    from: { line: current.id, age: state.age, title: point.title },
  };
  return { active: line.id, nextId: line.id + 1, lines: [...book.lines, line] };
}

export function switchLine(book: LifeBook, id: number): LifeBook {
  return book.lines.some(line => line.id === id) ? { ...book, active: id } : book;
}

export function dropLine(book: LifeBook, id: number): LifeBook {
  if (id === 0 || id === book.active) return book;
  return { ...book, lines: book.lines.filter(line => line.id !== id) };
}

export function encodeLife(book: LifeBook) {
  const line = activeLine(book);
  return {
    ...line.state,
    lifeLines: {
      version: 1, active: line.id, nextId: book.nextId,
      lines: book.lines.map(({ state, ...rest }) => rest.id === line.id ? rest : { ...rest, state }),
    },
  };
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('时间线存档读不出来');
  return value as Record<string, unknown>;
}

function integer(value: unknown, min: number, max: number) {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) {
    throw new Error('时间线存档里的数字不对');
  }
  return value;
}

function label(value: unknown, max: number) {
  if (typeof value !== 'string' || !value.length || value.length > max) throw new Error('时间线存档缺了一行');
  return value;
}

function sceneRef(value: unknown): SceneRef {
  const raw = record(value);
  const kind = label(raw.kind, 12) as SceneRef['kind'];
  if (kind !== 'year' && kind !== 'owl' && kind !== 'lead' && kind !== 'match' && kind !== 'origin' && kind !== 'date' && kind !== 'rental' && !Object.hasOwn(ACTIVITY_NAMES, kind)) throw new Error('这段故事认不出来');
  const npc = raw.npc === undefined ? undefined : label(raw.npc, 32);
  if (npc && !CAST.some(person => person.id === npc)) throw new Error('这位人物认不出来');
  const eventId = label(raw.eventId, 120);
  if (kind === 'rental') return { kind, npc: 'fang', eventId, evidence: integer(raw.evidence, 0, ALL_RENTAL_CLUES) };
  if (kind === 'date') {
    if (!CAST.some(person => person.id === npc && person.role === 'romance') || !Array.isArray(raw.picks) || raw.picks.length !== 2) throw new Error('这次约会读不出来');
    return { kind, npc, eventId, picks: [integer(raw.picks[0], 0, 2), integer(raw.picks[1], 0, 2)] };
  }
  return { kind, npc, eventId };
}

export function decodeLife(value: unknown): LifeBook {
  const { lifeLines, ...saved } = record(value);
  const state = validateSave(saved);
  if (lifeLines === undefined) return startBook(state);
  const info = record(lifeLines);
  if (info.version !== 1 || !Array.isArray(info.lines) || !info.lines.length || info.lines.length > MAX_LINES) {
    throw new Error('时间线存档读不出来');
  }
  const nextId = integer(info.nextId, 1, Number.MAX_SAFE_INTEGER);
  const active = integer(info.active, 0, nextId - 1);
  const lines: LifeLine[] = info.lines.map(item => {
    const raw = record(item);
    const id = integer(raw.id, 0, nextId - 1);
    const head = id === active ? state : validateSave(raw.state);
    if (!Array.isArray(raw.points) || raw.points.length > MAX_POINTS) throw new Error('时间线存档缺了岔路');
    const points = raw.points.map(value => {
      const point = record(value);
      const journalLength = integer(point.journalLength, 0, head.journal.length);
      const before = validateSave({ ...record(point.before), journal: [] });
      const { journal: _, ...snapshot } = before;
      return {
        before: snapshot, journalLength, scene: sceneRef(point.scene),
        title: label(point.title, 200), choice: label(point.choice, 200),
      };
    });
    const from = raw.from === undefined ? undefined : record(raw.from);
    return {
      id, state: head, points, replay: raw.replay === undefined ? undefined : sceneRef(raw.replay),
      from: from && { line: integer(from.line, 0, id - 1), age: integer(from.age, 18, 59), title: label(from.title, 200) },
    };
  });
  const ids = new Set(lines.map(line => line.id));
  if (ids.size !== lines.length || !ids.has(active) || !ids.has(0)) throw new Error('时间线存档少了一条线');
  return { active, nextId, lines };
}

export function readLife(): LifeBook | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const save = JSON.parse(raw);
    try {
      return decodeLife(save);
    } catch {
      // Older game state remains readable if an optional timeline payload is damaged.
      const { lifeLines: _, ...head } = record(save);
      return startBook(validateSave(head));
    }
  } catch {
    return null;
  }
}

export function saveLife(book: LifeBook) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(encodeLife(book)));
}
