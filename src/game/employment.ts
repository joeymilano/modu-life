import { CAREERS } from './content';
import type { Employment, GameState } from './types';

const payByRank = [1, 1.22, 1.45, 1.7];
const yearsByRank = [0, 1, 4, 8];
const reviewsByRank = [0, 1, 3, 6];
export const NIGHT_WORK = 'work-night-shift';
export const LONG_COMMUTE = 'work-cross-river';
export const WORK_HANDOVER_PENDING = 'work-handover-pending';
export const WORK_HANDOVER_PROOF = 'work-handover-proof';
export const MAX_PAY_RATE = 1.2;

export function employmentOf(state: GameState): Employment {
 return state.employment ?? { sinceAge: state.age, reviews: 0, rate: 1, closedMonths: 0, earned: 0 };
}

export function monthlySalary(state: GameState): number {
 const role = CAREERS.find(career => career.id === state.jobId);
 return role ? Math.round(role.salary * payByRank[Math.floor(state.jobRank)] * employmentOf(state).rate) : 0;
}

export function moveJob(state: GameState, newJob: string | null) {
 if (state.jobId === newJob) return;
 const employment = employmentOf(state);
 if (state.jobId) {
  const months = Math.min(3, 12 - employment.closedMonths);
  employment.earned += months * monthlySalary(state);
  employment.closedMonths += months;
  if (!newJob) employment.closedMonths = Math.min(12, employment.closedMonths + 6);
 }
 state.employment = { sinceAge: state.age, reviews: 0, rate: 1, closedMonths: employment.closedMonths, earned: employment.earned };
 state.jobId = newJob;
 state.jobRank = 0;
 state.flags = state.flags.filter(flag => flag !== NIGHT_WORK && flag !== LONG_COMMUTE &&
  flag !== WORK_HANDOVER_PENDING && flag !== WORK_HANDOVER_PROOF);
 if (newJob) state.flags.push(WORK_HANDOVER_PENDING);
}

export function nextReview(state: GameState) {
 const role = CAREERS.find(career => career.id === state.jobId);
 if (!role || state.jobRank >= 3) return undefined;
 const rank = Math.floor(state.jobRank) + 1;
 return { rank, title: role.ranks[rank], years: yearsByRank[rank], reviews: reviewsByRank[rank], skill: role.thresholds[rank] };
}

export function registerReview(state: GameState): string | undefined {
 const target = nextReview(state);
 if (!target) return undefined;
 const employment = employmentOf(state);
 if (employment.reviewedAt === state.age) return undefined;
 employment.reviewedAt = state.age;
 employment.reviews++;
 state.employment = employment;
 if (state.age - employment.sinceAge < target.years || employment.reviews < target.reviews
  || state.stats.skill < target.skill) return undefined;
 state.jobRank = target.rank;
 return target.title;
}
