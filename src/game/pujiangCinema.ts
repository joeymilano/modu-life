import type { EpisodeScript } from './pujiangTypes';
import type { GameState } from './types';

export const CINEMA_ART = {
 gu:'/art/pujiang-cinema/gu.webp', stage:'/art/pujiang-cinema/stage.webp',
 shift:'/art/pujiang-cinema/shift.webp', dinner:'/art/pujiang-cinema/dinner.webp',
 xu:'/art/pujiang-cinema/xu.webp', workshop:'/art/pujiang-cinema/workshop.webp',
 banquet:'/art/pujiang-cinema/gu-dinner.webp', expo:'/art/pujiang-cinema/expo.webp',
} as const;
type Art = keyof typeof CINEMA_ART;
export interface CinemaBeat {
 art:Art; speaker:string; line:string; direction:string; focus:string; prop:string; observation:string;
}
const beat=(art:Art,speaker:string,line:string,direction:string,prop:string,observation:string,focus='60% 32%'):CinemaBeat=>({art,speaker,line,direction,prop,observation,focus});

// Presentation only: never stores moves or reads hidden motives from the rules layer.
export const CINEMA_BEATS: Record<string,CinemaBeat[]> = {
 'pj-arrival-18':[
  beat('stage','陆嘉','人还没走。你说，先唱哪首？','她把拨片捏在指间','纸票','观众还握着票，在等一个明确的开场时间。'),
  beat('stage','陆嘉','少一个节目，我们能不能一起补上？','她给你留出话筒的位置','节目单','二十分钟的歌已经排好，空出来的是主持和串场。','64% 30%'),
  beat('stage','陆嘉','我听你的。就在这里，还是换个地方？','最后一个和弦还没散','话筒','谁拿到话筒，谁就得把下一步向观众说清楚。','58% 26%'),
 ],
 'pj-worker-18':[
  beat('shift','吴师傅','我还能搬。先别把工牌收走。','他把布包换到另一只手','工牌','名单划掉了他的名字，货却还堆在仓门口。'),
  beat('shift','吴师傅','这两箱不是一路的，让我看看。','他盯着箱角的货号','货号单','外观相同的箱子要去不同地方；搬得快之前，得先分对。','56% 28%'),
  beat('shift','吴师傅','车还没开。你答应的事，还算不算？','他把工牌放在桌边','车钥匙','老孙还没收钥匙，最后一班的安排仍然可以谈。','58% 26%'),
 ],
 'pj-heir-18':[
  beat('dinner','周骁','货从后门进。主桌我来招呼。','他没有放下话筒','空椅子','客户都在桌边，团队却还站在门口。','79% 42%'),
  beat('dinner','沈经理','灯是亮的。可躺下怎么开？','她扶住那张空椅子','样机','沈经理带了两根不同长度的拉绳，采购主任盯着床边开关的位置。','20% 25%'),
  beat('dinner','沈经理','试单一式三份。你想怎么签？','团队还在等你的安排','项目夹','尾款、排期和负责的人，比一句接手更具体。','22% 28%'),
 ],
 'pj-system-18':[
  beat('gu','顾桥','八万。你是不是也看见了？','他的目光没有离开你','手电','灯灭了，陆嘉和观众还在。救回演出有不止一种办法。','67% 30%'),
  beat('stage','陆嘉','下一首谁报？大家在等。','她把话筒朝你转过来','话筒','顾桥已经替你宣布了安排。还留在台边的人，需要你的信号。'),
  beat('gu','顾桥','别人又看不见。你还在等什么？','他催你确认眼前的选项','钱箱','搬椅子、接电和撑住舞台的人，都还没有离开。','68% 26%'),
 ],
 'pj-system-19':[
  beat('xu','许舟','选哪边都行，别到最后才告诉我。','她把车钥匙放在地图上','路线图','三份资源要兼顾车次、人手与演示，哪一处都不能凭空多出人。'),
  beat('xu','许舟','路可以绕。你这边，谁来接货？','她朝你看了一眼手表','车钥匙','货到门口还需要人卸；改运输时，也要改接货的安排。','57% 28%'),
  beat('xu','许舟','这一单做完，后面的活怎么分？','她没有收起路线图','客户号码','对方愿意继续合作，但需要知道下次具体找谁。','60% 28%'),
 ],
 'pj-system-20':[
  beat('banquet','顾桥','样品留下就好，你辛苦了。','他仍坐在主位上','请帖','请帖和门口的名单对不上；桌上的人还不知道你做过什么。'),
  beat('banquet','顾桥','这点维修，往后再谈也来得及。','他把话题又带回规模','名片','采购负责人问过价格之后，又问了一遍机器坏了怎么办。','63% 27%'),
  beat('banquet','顾桥','单子归我接。你只管把东西做好。','他的手压在项目夹上','添来的椅子','现在客户直接问你了，是否继续经过顾桥，由你开口。','58% 30%'),
 ],
 'pj-system-21':[
  beat('workshop','周闻','先看清他改了什么。别急着上台。','他把工具箱推到你面前','临时题目','对手看过你用过的能力，熟悉的办法这次未必占优。'),
  beat('workshop','周闻','这两种办法，我都教过你。','他的铅笔停在接线处','工具箱','时间有限，稳妥做完与争取最快，都需要承担自己的代价。','61% 28%'),
  beat('workshop','周闻','他也在看那块你说的屏。','他压低了声音','评分纸','最后由客户决定继续试制的方案，台上的人得把流程讲清楚。','60% 25%'),
 ],
 'pj-system-22':[
  beat('workshop','周闻','把每个人做过的事，摆在一起看看。','他翻开那本维修册','工作记录','维修、运输和客户交接都有记录，可以逐项核对贡献。'),
  beat('xu','许舟','我想试着自己接。那张路线图，我能带走吗？','她握着自己的车钥匙','路线图','她有了另一份工作机会。接下来的运输，你也需要重新安排。'),
  beat('workshop','周闻','你说过怎么分，到账前再看一遍。','他没有替你按下确认','署名页','奖励和署名是两件要亲自落实的事，嘴上答应还不算做完。','60% 27%'),
 ],
 'pj-system-23':[
  beat('workshop','周闻','先说哪一段你不会。剩下的，咱们分。','他把纸上流程摊开','维修流程','异能整晚离线。纸上的步骤、自己的本事与伙伴仍然可用。'),
  beat('workshop','周闻','打不打这个电话，你自己决定。','他看向墙边的公用电话','值班表','今晚能来的伙伴，取决于过去怎样分工、怎样兑现承诺。','60% 30%'),
  beat('workshop','周闻','做成多少，就交多少。别再替机器保证。','天快亮了，他终于抬头','验收单','第一班工人到了，客户要看到可以实际开动的部分。','60% 25%'),
 ],
 'pj-system-24':[
  beat('expo','周闻','先把能演的摆出来，别让人白等。','台下已经有人停步','旧样品','货、机器和主持同时缺位，支援总数有限。','67% 30%'),
  beat('expo','周闻','给我一轮。你能不能把他们留下？','他重新检查连接处','连接件','样机只亮了一盏灯。有人修，就要有人把现场解释清楚。','70% 28%'),
  beat('expo','陆嘉','开场我来。后面那段，你自己讲。','她握住有线话筒','话筒','介绍真实的分工和能做到的事，比一段完美的主持词更有用。','27% 28%'),
 ],
 'pj-system-25':[
  beat('gu','顾桥','当年，我也以为把人留下就算赢了。','他终于把旧合照放下','旧合照','合照上曾经一起做事的人，如今各有去向。'),
  beat('stage','陆嘉','下一次演出，来不来都给我个准信。','她把一张纸票放到桌边','纸票','约定有大有小，每一件都要靠后来的行动兑现。'),
  beat('gu','顾桥','这次，你自己开价。','他没有再伸手指向选项','旧钥匙','保留系统、共同经营或退出竞争，都会带着过去的成果继续。','66% 26%'),
 ],
};

export function cinemaBeat(script:EpisodeScript,stage=0):CinemaBeat {
 const acts=CINEMA_BEATS[script.id];
 if(acts)return acts[Math.min(Math.max(0,stage),acts.length-1)];
 const art:Art=script.district==='bund'?'stage':script.district==='xinzhuang'?'xu':script.district==='lujiazui'?'banquet':'workshop';
 return beat(art,'街区委托',stage?'答应过的事，要有人做完。':'先问清楚，再一起想办法。','上海的一次普通碰面','手边的安排',script.goal);
}

export const CINEMA_CONTACTS:Record<string,{art:Art;focus:string}>={
 'pj-gu':{art:'gu',focus:'67% 27%'},'pj-wen':{art:'workshop',focus:'60% 26%'},'pj-xu':{art:'xu',focus:'57% 25%'},
};

export function cinemaRelationships(game:GameState,script:EpisodeScript,changes:[string,number][]=[]) {
 const ids=script.route==='worker'?['wu']:script.route==='heir'?['boss']:script.route==='arrival'?['lu','mao']:['pj-xu','pj-wen','lu'];
 return ids.map(id=>{
  const delta=changes.filter(([person])=>person===id).reduce((n,[,change])=>n+change,0);
  const trust=game.relationships[id]?.trust??15;
  return {id,delta,trust:Math.max(0,Math.min(100,trust+delta))};
 });
}
