import { eventPhoto, portraitArt } from './art';
import { CAREERS, CAST, DISTRICTS, HOUSING_NAMES } from './content';
import { dateAnswer } from './dates';
import { monthlyBudget } from './engine';
import { householdPlan } from './household';
import { replayScene, type LifeLine } from './lifeLines';
import type { GameState } from './types';

type Point = LifeLine['points'][number];

function decisionKey(point: Point) {
 const { scene, before } = point;
 return JSON.stringify([
  scene.kind, scene.eventId, scene.npc, scene.picks, scene.evidence,
  before.seed, before.age, before.actions, before.rng, point.journalLength,
 ]);
}

export function lineDivergence(left: LifeLine, right: LifeLine) {
 const otherPoints = new Map(right.points.map(point => [decisionKey(point), point]));
 for (const point of left.points) {
  const other = otherPoints.get(decisionKey(point));
  if (other && other.choice !== point.choice) return { left: point, right: other };
 }
 return undefined;
}

export function describeDecision(line: LifeLine, point: Point) {
 const before = { ...point.before, journal: line.state.journal.slice(0, point.journalLength) };
 const event = replayScene(before, point.scene);
 const district = event?.district ?? before.district;
 const speaker = event?.speakerId ?? point.scene.npc;
 const art = event?.illustration ?? (speaker ? portraitArt(speaker, true, before.age) : event && eventPhoto(event, district));
 const entry = line.state.journal[point.journalLength];
 return {
  art, speaker, canReplay: Boolean(event),
  district: DISTRICTS.find(place => place.id === district)!.name,
  result: entry?.title === point.title ? entry.text : undefined,
 };
}

function relationship(state: GameState, speaker?: string) {
 const partner = CAST.find(person => person.id === state.partnerId);
 if (partner) {
  const plan = householdPlan(state);
  return '和' + partner.name + (plan==='shared'?'一起住':plan==='standing'?'每周见面':'在一起');
 }
 const person = CAST.find(person => person.id === speaker && person.role === 'romance');
 if (!person) return '单身';
 const status = dateAnswer(state, person.id);
 if (status === 'again') return '和' + person.name + '约了下次';
 if (status === 'friends') return '和' + person.name + '做朋友';
 if (status === 'left') return '和' + person.name + '道别了';
 if (status === 'waiting') return '等' + person.name + '回话';
 return '单身';
}

const money = (value: number) => '¥' + value.toLocaleString('zh-CN');

export function lineFacts(line: LifeLine, speaker?: string) {
 const { state } = line;
 const career = CAREERS.find(job => job.id === state.jobId);
 return [
  { label: '积蓄', value: money(state.cash) },
  { label: '工作', value: career?.ranks[state.jobRank] ?? career?.name ?? '待业' },
  { label: '住处', value: HOUSING_NAMES[state.housing] },
  { label: '月租', value: money(monthlyBudget(state).rent) },
  { label: '关系', value: relationship(state, speaker) },
 ];
}
