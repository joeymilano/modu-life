import { rentalPhoto } from './art';
import type { EventChoice, LifeEvent } from './types';

export const RENTAL_CLUES = [
 { id: 'wall', bit: 1, label: '墙角', x: 16, y: 31,
  title: '刚刷的那一块',
  detail: '手指贴上去是凉的。墙漆边鼓了一串小泡，床头刚好挨着这面墙。',
  evidence: '要修渗水，可以写进合同。', alt: '床边刚刷过的墙漆沿着潮湿的边缘起了泡' },
 { id: 'contract', bit: 2, label: '合同', x: 78, y: 77,
  title: '月租底下还有一行',
  detail: '方姐说每月三千。你顺着那行往下看，底下还有每月三百的设备费。',
  evidence: '签约费 ¥6,000，不抵房租。设备维护费 ¥300／月。', alt: '旧木桌上的合同、黑笔和蓝牌钥匙' },
 { id: 'window', bit: 4, label: '窗外', x: 61, y: 46,
  title: '排风机刚起转',
  detail: '窗只拉开一条缝，锅铲声就进来了。方姐说隔壁要炒到十一点，楼上高一层，窗对着树。',
  evidence: '楼上还空着，可以问价。', alt: '窄巷对面正在转动的厨房排风机' },
] as const;

export const ALL_RENTAL_CLUES = RENTAL_CLUES.reduce((mask, clue) => mask | clue.bit, 0);

export function rentalNegotiation(evidence: number): LifeEvent {
 const [wall, contract, window] = RENTAL_CLUES.map(clue => Boolean(evidence & clue.bit));
 const choices: EventChoice[] = [];
 const signed = { housing: 1, setFlags: ['rental_checked'] };
 if (contract) {
  choices.push({
   id: 'amend', label: wall ? '划掉设备费，渗水也写进去' : '划掉设备费再签',
   hint: '先付 ¥4,000 · 月租 ¥3,000',
   effect: { ...signed, cash: -4000, leaseRent: 3000, skill: 5, spirit: wall ? 6 : 2, trust: 5 },
   reply: wall
    ? '方姐划掉三百块那行，把签约费改成四千。她让房东把修墙的日子写下来，自己拍了一份。夜里还是听得见排风机。'
    : '方姐把签约费改成四千，设备费那行划了两道。你付完钱才发现，房间最贵的设备其实在窗外。',
  });
 } else if (wall) {
  choices.push({
   id: 'repair', label: '先写清楚哪天修墙，再签',
   hint: '先付 ¥6,000',
   effect: { ...signed, cash: -6000, leaseRent: 3300, skill: 3, spirit: 3, trust: 3 },
   reply: '墙是周四来修，房东在日期旁边签了字。月底方姐把账单发过来，三千的房租底下，还有三百的设备费。',
  });
 }
 if (window) {
  choices.push({
   id: 'upstairs', label: '换楼上那间',
   hint: '先付 ¥5,200 · 月租 ¥3,600',
   effect: { ...signed, cash: -5200, leaseRent: 3600, health: 5, spirit: 10, trust: 3 },
   reply: '楼上钥匙拧了两下才开。你把窗拉到底，只有梧桐叶响。楼下那张合同留在了方姐包里，这间每月三千六。',
  });
 }
 choices.push({
  id: 'sign', label: '按原合同签',
  hint: contract ? '先付 ¥6,000 · 含设备费每月 ¥3,300' : '先付 ¥6,000',
  effect: { ...signed, cash: -6000, leaseRent: 3300, health: -6, spirit: -5 },
  reply: '你把签约费转了。搬进去那晚，排风机响到十一点。月底房东收三千三，说多出来那三百就在合同第二页。',
 }, {
  id: 'leave', label: '把钥匙还给方姐',
  hint: '保留现在的住处',
  effect: { setFlags: ['rental_checked'], skill: 4, spirit: 3, network: 2, trust: 3 },
  reply: '方姐把钥匙挂回那串钥匙上，问你明早有空伐。她说还有间离地铁远两站，早上去，至少能看清窗外。',
 });
 return {
  id: 'rental-xinzhuang', title: '笔先别递过去', category: 'housing', tag: '莘庄看房',
  district: 'xinzhuang', speakerId: 'fang', illustration: rentalPhoto('talk'),
  text: '房东在楼下按了两回喇叭。方姐把手机反扣，替你把合同往回拉了一点。「有哪行要改，现在讲。」',
  rentalEvidence: evidence, choices,
 };
}
