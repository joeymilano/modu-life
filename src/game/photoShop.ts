import type { Timeline } from './timelines';

export const PHOTO_SHOP_STILLS = ['counter', 'livestream', 'neighbors', 'script', 'address', 'group', 'id'] as const;

export function photoShopStill(shot: (typeof PHOTO_SHOP_STILLS)[number]) {
  return `/art/photo-shop/${shot}.webp`;
}

export const PHOTO_SHOP_STORY: Timeline = {
  id: 'last-photo', kind: 'life', title: '照相馆的最后一单', author: '孙阿宝',
  original: '我让她关了三回灯。视频发出去，都在问老太太是不是哭了。她眼睛是被补光灯照的。我拿两千去修镜头，修完第一单，人家说能不能也拍一条那么自然的。',
  turns: [
    {
      date: '周五 · 傍晚六点四十', place: '莘庄 · 快照店', shot: photoShopStill('counter'),
      scene: '你是孙阿宝。镜头摔了，修要两千。有人找你拍宋奶奶的店，开价四千，说就拍她关最后一次灯。宋奶奶把相纸推给你：「最后一次？明朝我在隔壁洗衣店照样开门。」房东七点来收钥匙。',
      options: [
        { move: '接单，和宋奶奶一人两千', after: '宋奶奶听完价钱，把箱子踢回桌底。「那叫伊快点，我七点还有锅汤。」', next: 1 },
        { move: '先把门打开，问街坊还有谁要拍', after: '第一个进来的人从对面看了半天。她拿着一张女儿的幼儿园入园照，说今天女儿刚拿到驾照。', next: 2 },
      ],
    },
    {
      date: '六点五十五 · 快到点了', place: '快照店 · 蓝布前', shot: photoShopStill('livestream'),
      scene: '补光灯架起来了。甲方说关灯前停三秒，实在哭不出来就低头。宋奶奶问：「低头可以。隔壁洗衣店的地址能讲伐？」甲方把你叫到门外，说那句得剪。',
      options: [
        { move: '拍，片尾另加一张搬家地址', after: '四千到账，地址留了两秒。第二天还有人来卷帘门前拍「上海最后一家」。你刚取回修好的镜头，站旁边给他们指隔壁。', next: null, shot: photoShopStill('script') },
        { move: '请她自己讲，甲方要走就先结工钱', after: '甲方付了八百就走了。你把她那段发进街坊群。隔天有个小伙去洗衣店拍证件照，最后还被她劝着把衬衫熨了。', next: null, shot: photoShopStill('address') },
      ],
    },
    {
      date: '六点五十八 · 钥匙在响', place: '快照店 · 门口', shot: photoShopStill('neighbors'),
      scene: '门口站了五个人。有人想跟老蓝布合影，有人还在找小时候的底片。房东已经在掏钥匙。宋奶奶把凳子摆正，问你是请他们都挤进来，还是先给她自己拍一张。她开了三十年店，自己的照片一直用的是结婚那张。',
      options: [
        { move: '开十秒自拍，大家往里挤一挤', after: '你跑进去的时候撞了下门框，照片里有三个人正在看你。隔壁开张后，他们轮流来加印，没人同意把你那一下裁掉。', next: null, shot: photoShopStill('group') },
        { move: '凳子留给宋奶奶，拍张蓝底的', after: '你让她嘴巴闭起来。她闭了两次都笑，第三次你直接按了。那张照片后来贴在新店价目表边上，她说省得总有人问老板在不在。', next: null, shot: photoShopStill('id') },
      ],
    },
  ],
};
