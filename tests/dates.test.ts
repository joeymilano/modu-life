import { describe, expect, it } from 'vitest';
import { CAST } from '../src/game/content';
import { finishDate, romanceQuestions } from '../src/game/dates';

describe('date scenes', () => {
 const cast = CAST.filter(person => person.role === 'romance');

 it('gives each date its own three beats and a meaningful parting choice', () => {
  const middleScenes = new Set<string>();
  for (const person of cast) {
   const scenes = romanceQuestions(person, []);
   expect(scenes).toHaveLength(3);
   middleScenes.add(scenes[1].text);
   const [date, friend, leave] = scenes[2].answers;
   const romantic = finishDate(person, date, 6, 28);
   expect(romantic.effect.cash).toBe(-28);
   expect(romantic.effect.commitment).toBeGreaterThan(0);
   expect(finishDate(person, date, 2, 0).text).not.toBe(romantic.text);
   expect(finishDate(person, friend, 4, 0).effect).toMatchObject({ trust: 12, network: 4 });
   expect(finishDate(person, leave, 4, 0).text).toBe(leave.reply);
  }
  expect(middleScenes.size).toBe(8);
 });

 it('lets Lu Jia and He Liang remember specific events from the first night', () => {
  const lu = cast.find(person => person.id === 'lu')!;
  const he = cast.find(person => person.id === 'he')!;
  expect(romanceQuestions(lu, ['night-saved-box'])[0].text).toContain('有疤的橘子');
  expect(romanceQuestions(he, ['night-offer'])[0].text).toContain('蓝围裙');
  expect(romanceQuestions(lu, ['night-offer'])[0].text).toBe(romanceQuestions(lu, [])[0].text);
 });
});
