import { hashSeed, randomStep } from './seed';
import type { Effect, GameState } from './types';

export const CITY_RATES = { N: 46, R: 30, S: 18, SS: 5, SSS: 1 } as const;
export type CityRarity = keyof typeof CITY_RATES;
export const CITY_TIERS = Object.keys(CITY_RATES) as CityRarity[];
export const CITY_PITY = 10;
export type CityDrawSize = 1 | 5;

type CityCard = {
  id: string;
  name: string;
  rarity: CityRarity;
  image: string;
  effect: Pick<Effect, 'health' | 'spirit' | 'skill' | 'network' | 'face' | 'cash'>;
};

export const CITY_CARDS: readonly CityCard[] = [
  { id: 'ferry-ticket', name: '摆渡船票', rarity: 'N', image: 'street-cards/bund-ferry', effect: { spirit: 3 } },
  { id: 'breakfast', name: '一客生煎', rarity: 'N', image: 'stall/sheng', effect: { health: 4 } },
  { id: 'alley-paper', name: '长椅上的晚报', rarity: 'N', image: 'street-cards/xin-rest', effect: { face: 3 } },
  { id: 'used-book', name: '有批注的旧书', rarity: 'R', image: 'street-cards/anfu-book', effect: { skill: 6 } },
  { id: 'table-place', name: '邻里饭桌的空位', rarity: 'R', image: 'long-table/table-inside', effect: { network: 6 } },
  { id: 'work-envelope', name: '晚班工钱信封', rarity: 'R', image: 'work/payroll', effect: { cash: 800 } },
  { id: 'night-class', name: '夜校旁听证', rarity: 'S', image: 'street-cards/zhang-class', effect: { skill: 9, network: 3 } },
  { id: 'park-tea', name: '树荫里的半日假', rarity: 'S', image: 'street-cards/zhang-lawn', effect: { health: 8, spirit: 6 } },
  { id: 'studio-commission', name: '三楼工作室的外快', rarity: 'S', image: 'street-cards/anfu-studio', effect: { cash: 2400, face: 4 } },
  { id: 'exchange-referral', name: '柜台里递出的名片', rarity: 'SS', image: 'work/start-finance', effect: { network: 12, face: 8 } },
  { id: 'lab-key', name: '研发楼的备用钥匙', rarity: 'SS', image: 'street-cards/zhang-code', effect: { skill: 12, cash: 2500 } },
  { id: 'stage-invite', name: '小剧场的前排座', rarity: 'SS', image: 'era/stage-1992', effect: { spirit: 14, face: 8 } },
  { id: 'wharf-contract', name: '浦东码头的第一单', rarity: 'SSS', image: 'era/lujiazui-1992', effect: { cash: 10000, network: 12 } },
  { id: 'bund-negative', name: '外滩留存的底片', rarity: 'SSS', image: 'street-cards/bund-photo-1992', effect: { spirit: 14, face: 16 } },
  { id: 'golden-stall', name: '卖到收摊的灶台', rarity: 'SSS', image: 'street-cards/xin-street', effect: { skill: 15, cash: 6500 } },
];

const cardsByTier = CITY_TIERS.map(tier => CITY_CARDS.filter(card => card.rarity === tier));
const highTiers = CITY_TIERS.slice(-2);

// One welcome ticket, then one per year carried over through the last playable year.
export function cityTicketAllowance(age: number) {
  return Math.min(age, 59) - 17;
}

export function cityTickets(game: Pick<GameState, 'age' | 'cityDraws'>) {
  return cityTicketAllowance(game.age) - (game.cityDraws ?? 0);
}

function rollTier(roll: number, guaranteed: boolean): CityRarity {
  const tiers = guaranteed ? highTiers : CITY_TIERS;
  let threshold = roll * tiers.reduce((total, tier) => total + CITY_RATES[tier], 0);
  return tiers.find(tier => (threshold -= CITY_RATES[tier]) < 0) ?? 'SSS';
}

export function cityDrawHistory(seed: string, count: number) {
  // Existing saves rebuild their collection from this sequence. Keep v1 odds and ordering stable.
  let rng = hashSeed(seed + ':city-cards:v1');
  let misses = 0;
  const cards: CityCard[] = [];
  for (let index = 0; index < count; index++) {
    const [tierRoll, next] = randomStep(rng);
    const [cardRoll, after] = randomStep(next);
    rng = after;
    const tier = rollTier(tierRoll, misses === CITY_PITY - 1);
    const pool = cardsByTier[CITY_TIERS.indexOf(tier)];
    cards.push(pool[Math.floor(cardRoll * pool.length)]);
    misses = highTiers.includes(tier) ? 0 : misses + 1;
  }
  return { cards, misses };
}
