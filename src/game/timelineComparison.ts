import { CITY_TIMELINES, timelineShot, walk, type Move, type Ticket, type Timeline } from './timelines';

export interface StoryReceiptSide {
 path: string;
 choice: string;
 ending: string;
 after: string;
 shot?: string;
}

export interface StoryComparison {
 date: string;
 place: string;
 scene: string;
 left: StoryReceiptSide;
 right: StoryReceiptSide;
}

function scenarioKey(timeline: Timeline) {
 return JSON.stringify([timeline.id, timeline.kind, timeline.title, timeline.author, timeline.original,
  timeline.turns.map(turn => [turn.date, turn.place, turn.scene, turn.options.map(option => [option.move, option.after, option.next])])]);
}

function receiptSide(timeline: Timeline, route: Move[], steps: ReturnType<typeof walk>['steps'], fork: number): StoryReceiptSide {
 const last = steps[steps.length - 1];
 return {
  path: route.map(move => 'ABC'[move.pick]).join('·'),
  choice: steps[fork].option.move,
  ending: last.option.move,
  after: last.option.after,
  shot: last.option.shot ?? timelineShot(timeline, timeline.turns.indexOf(last.turn)),
 };
}

export function storyComparisons(ticket: Ticket, entries: Ticket[]) {
 const { timeline, route = [] } = ticket;
 const key = scenarioKey(timeline);
 const published = CITY_TIMELINES.find(story => story.id === timeline.id);
 const illustrated = published && scenarioKey(published) === key ? published : timeline;
 const current = walk(illustrated, route);
 if (current.next !== null) return [];
 const seen = new Set<string>();
 return entries.flatMap(entry => {
  if (!entry.route?.length || entry.timeline.id !== timeline.id || scenarioKey(entry.timeline) !== key) return [];
  const other = entry.route;
  const routeKey = JSON.stringify(other);
  if (seen.has(routeKey)) return [];
  const fork = route.findIndex((move, i) => move.pick !== other[i]?.pick || move.note !== other[i]?.note);
  if (fork < 0) return [];
  const replay = walk(illustrated, other);
  if (replay.next !== null) return [];
  seen.add(routeKey);
  const { date, place, scene } = current.steps[fork].turn;
  const left = receiptSide(illustrated, route, current.steps, fork);
  const right = receiptSide(illustrated, other, replay.steps, fork);
  const comparison: StoryComparison = { date, place, scene, left, right };
  return [{ routeKey, comparison, label: right.path + ' · ' + (other.at(-1)?.pick === 2 ? right.after.slice(0, 18) : right.ending) }];
 });
}
