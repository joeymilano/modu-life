import { farewellPhoto } from './art';
import type { GameState, LifeEvent } from './types';

const tag = '最后一站';

const closingScenes: { opening: string; event: LifeEvent; echoes: [flag: string, line: string][] }[] = [
 {
  opening: 'first-night-keys',
  echoes: [
   ['night-fronted-bill', '工具箱里还有半块冰箱贴。他用指甲刮了刮上面的胶，问你那张借条当年是不是也贴在这块下面。'],
   ['night-shared-later', '他把两把钥匙递过来，说这回还是你先挑。'],
  ],
  event: {
   id: 'last-day-keys', title: '两把旧钥匙', category: 'year', tag, district: 'xinzhuang', speakerId: 'mao',
   illustration: farewellPhoto('mao'),
   text: '莘庄那栋楼要换一批门锁。毛小毛从工具箱底翻出两把钥匙，拿到楼梯上才想起来，哪把开大间，哪把开小间，他已经分不清了。',
   choices: [
    { id: 'try', label: '上去试试，没准还能开', reply: '左边那把转了半圈。里头的人问找谁，你和毛小毛赶紧说走错了。下楼时他还攥着钥匙，硌得手心发白。', effect: { trust: 9, spirit: 5 } },
    { id: 'return', label: '把钥匙还了，陪他把纸箱搬下去', reply: '收钥匙的人找不到对应的锁，写了张条放进抽屉。纸箱搬到一楼，毛小毛摸摸口袋，说头一回下楼不用惦记钥匙。', effect: { network: 7, trust: 6 } },
    { id: 'keep', label: '留一把，别在我的钥匙圈上', reply: '你手里的钥匙圈早换成了门卡。毛小毛找来一段细铁丝，把那把旧钥匙绕在你的卡套上。', effect: { spirit: 10, trust: 3 } },
   ],
  },
 },
 {
  opening: 'first-night-till',
  echoes: [['night-took-rota', '纸里还夹了一张你签过的班表。他指着最后一栏，说那时候你每次都比班表写的晚走十分钟。']],
  event: {
   id: 'last-day-receipt', title: '最后一张手写账单', category: 'year', tag, district: 'anfu', speakerId: 'he',
   illustration: farewellPhoto('he'),
   text: '面馆明天换新收银机。何亮把压在抽屉底下的纸账本拿出来，翻到一页卷边的旧账。「当年那六十八，到底是哪桌？」他说完，自己先把眼镜摘了。',
   choices: [
    { id: 'count', label: '找找那几张小票，最后再对一回', reply: '找了半天只找到一张盖着油印的旧小票。何亮把今天的账单递过来，让你看明天日期该在哪里改。', effect: { skill: 8, trust: 5 } },
    { id: 'eat', label: '今天先把面吃了，再问他周末来不来', reply: '他给你俩各下了一碗。吃到一半他说周末可以来，不过你不许再穿第一天那双白鞋。', effect: { trust: 9, spirit: 5 } },
    { id: 'paper', label: '把账本收好，给他拍张站在柜台后面的照片', reply: '何亮站在柜台后面把围裙拉平。你拍完，他问能不能重拍，刚才那张没把算过四十年账的抽屉拍进去。', effect: { spirit: 9, network: 4 } },
   ],
  },
 },
 {
  opening: 'first-night-box',
  echoes: [
   ['night-recorded-song', '她把手机音量开大。录音里先响起剥橘子皮的声音，过了几秒，才听见那晚的吉他。'],
   ['night-heard-last-song', '船上一阵风。她哼起那晚最后一首，唱到弹错的那段，还是停了一拍。'],
  ],
  event: {
   id: 'last-day-orange', title: '这次箱底没漏', category: 'year', tag, district: 'bund', speakerId: 'lu',
   illustration: farewellPhoto('lu'),
   text: '陆嘉在轮渡上给你占了个靠外的位子。袋里两只橘子，一只有疤，一只光溜溜。船过江到一半，她才把袋口打开。「这次你先挑。」',
   choices: [
    { id: 'scar', label: '拿有疤的，另一只留给她', reply: '你掰开那只，有一瓣格外酸。陆嘉看你皱了脸，把自己那只也剥开了。后来两只橘子还是混在一个袋里吃完的。', effect: { trust: 8, spirit: 7 } },
    { id: 'ride', label: '这趟到站别下，坐回来再剥', reply: '你们跟着船又过了一次江。第二回靠岸，她去问船员能不能再补两张票。', effect: { spirit: 11, health: 3 } },
    { id: 'carry', label: '先把橘子收好，下船请她吃夜宵', reply: '那家店早没了。你们沿江又找了一家，她看见桌上有白纸，顺手把橘子倒出来一人分了一个。', effect: { cash: -52, trust: 7, network: 5 } },
   ],
  },
 },
];

export function lastDayEvent(state: GameState): LifeEvent | undefined {
 if (state.age !== 59) return undefined;
 const scene = closingScenes.find(({opening, event}) =>
  state.seenEvents.includes(opening) && !state.seenEvents.includes(event.id));
 if (!scene) return undefined;
 const echo = scene.echoes.find(([flag]) => state.flags.includes(flag));
 return echo ? { ...scene.event, text: scene.event.text + ' ' + echo[1] } : scene.event;
}

export function lastDayMemory(state: GameState) {
 return state.journal.slice().reverse().find(entry => entry.tag === tag);
}
