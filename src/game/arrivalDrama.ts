import { dramaPhoto, OPENING_ALLIES, OPENING_PROOF, withOpeningRecord } from './openingStakes';
import type { GameState, LifeEvent } from './types';

const docket = 'night-opening-docket';
const witnesses = 'night-opening-witnesses';

const threads: Record<string,{label:string;hint:string;reply:string;note:string;go:string;message:string}> = {
 mao:{
  label:'回毛小毛 · 去拿签字单',
  hint:'费启在莘庄截房东。他拿的那份把你们划掉了。',
  reply:'三号楼。手上有签字单，楼下那扇门得我替你挡一会儿。',
  note:'签字那页压在钥匙底下。九点前房东还在。',
  go:'去莘庄拿签字单',
  message:'赶在费启之前见房东',
 },
 he:{
  label:'回何亮 · 把订金小票给我',
  hint:'费启拿两张一样的小票，说你们订场的款没付。',
  reply:'从安福路的前门进。小票我留着，他正在等我把抽屉打开。',
  note:'两张取餐号一样。真有两笔账，他就不会急着拿走其中一张。',
  go:'去安福路对小票',
  message:'去面馆查订金小票',
 },
 lu:{
  label:'回陆嘉 · 我去轮渡口接人',
  hint:'费启在群里说今晚没乐队。我们人和东西都在码头。',
  reply:'我在最后一班船那儿。蓝胶带的箱子先帮我捡起来，里面有签过字的演出单。',
  note:'箱子底下有个旧打包带，渡口就剩一班船。',
  go:'去轮渡口接乐队',
  message:'到轮渡口接陆嘉',
 },
};

export function arrivalDramaThread(sender: string) {
 return threads[sender];
}

export function arrivalDrama(event: LifeEvent): LifeEvent {
 return {
  ...event,title:'车还没出站，场子被抢了',objective:'今晚开演前，拿回试场',
  text:'南站闸机刚开，费启发来你们的试场海报。主办那一栏，换成了他。「十点我开门。你要来，我给你留张票。」',
  choices:event.choices.map(choice=>{
   const {label,hint,reply} = threads[choice.senderId!];
   return {...choice,label,hint,reply};
  }),
 };
}

const leads: Record<string,{text:string;replies:readonly [string,string,string];records:readonly [string,string,string]}> = {
 'first-night-keys':{
  text:'莘庄看房约在三号楼。房东还管着外滩那间试场，他把签字单抽出来，说费启愿意包下整晚。毛小毛按住纸角，把外滩后门的钥匙先藏进袖口。',
  replies:[
   '你签了楼上的合租。毛小毛把外滩那把钥匙塞给你，顺手叫上了本来就说好来看演出的邻居。',
   '拍到签名和时间，房东才把纸抽走。你把照片发给毛小毛，他把原件折好，从楼梯间跟了上来。',
   '锁匠修好大门。你俩问在楼里住的人要不要下楼看首演，有两家说先帮你们把桌子搬进去。',
  ],records:[witnesses,docket,witnesses],
 },
 'first-night-till':{
  text:'费启说垫过两笔宵夜钱，拿两张小票要何亮退你们的试场订金。何亮的抽屉还开着。两份面明明只出过一趟，他问你能不能先把钱对上。',
  replies:[
   '你一桌一桌对完。送餐的小姑娘没走远，回头答应到场讲她送过几趟。何亮把三百二塞进你手里。',
   '何亮先把二百二结给你。送餐的姑娘愿意跟你去现场，说那晚到底哪一桌点了面，她记得。',
   '两张都是同一个取餐号，第二张写着补打。何亮把真小票和二百六一起递来。「他要哪份，你让他自己挑。」',
  ],records:[witnesses,witnesses,docket],
 },
 'first-night-box':{
  text:'最后一班船就要开。陆嘉那只箱子底裂了，橘子滚了一地。下面压着签过字的演出单。费启刚在群里发了句，乐队过不了江，我替你们开。',
  replies:[
   '船没赶上，单子也湿了。陆嘉把人都叫齐，转给你一百，让你跟她一起坐车去现场。',
   '签名那页没找到。陆嘉接过你重新买的橘子，直接把同台的乐手叫过来。她说，我在，他们就得承认我们到了。',
   '你把箱底兜住。船一离岸，陆嘉就拍了完整签字页，转给你六十。「让费启把音响先开着。」',
  ],records:[witnesses,witnesses,docket],
 },
};

export function arrivalDramaVisit(event: LifeEvent): LifeEvent {
 const script = leads[event.id];
 if (!script) return event;
 return {
  ...event,objective:'在十点前把筹码带到试场',text:script.text,
  choices:event.choices.map((choice,index)=>({...choice,reply:script.replies[index],effect:{
   ...choice.effect,setFlags:[...(choice.effect.setFlags??[]),script.records[index]],
  }})),
 };
}

const stageId = 'first-night-stage';

export function arrivalDramaFinale(state: GameState, ally: string) {
 if (state.seenEvents.includes(stageId)) return;
 const proof = state.flags.includes(docket);
 const people = state.flags.includes(witnesses);
 const event: LifeEvent = {
  id:stageId,title:'话筒还没关',objective:'保住今晚这场演出',
  district:'bund',speakerId:'fei',category:'social',tag:'首演',illustration:dramaPhoto('stage'),
  text:'费启的手搭在话筒开关上。「台下都是我叫来的人。你想说什么？」门口有人探头问，十点这一场还开伐。',
  choices:[
   ...(proof?[{id:'proof',label:'拿原件上台，先要回 ¥600',
    reply:'你让场地方把两份单子投上去。原件一亮，经理把六百转回给你，把话筒从费启手底下抽了出来。',
    hint:'退回预约款 ¥600 · 留下首演原件',effect:withOpeningRecord({cash:600,skill:6,face:8},OPENING_PROOF)}]:[]),
   ...(people?[{id:'people',label:'让'+ally+'带大家进场，现场改名单',
    reply:ally+'先带进来一排人。第一首响起来，原本围着费启的人也开始找座位。经理问下个周五还要不要把门留给你。',
    hint:'拿到下次排期 · 留下到场的人',effect:withOpeningRecord({network:10,spirit:6},OPENING_ALLIES)}]:[]),
   {id:'walk',label:'换个门口开，今晚照演',
    reply:'你把半开的门推回去。'+ally+'从隔壁借来插线板，第一排的人搬着凳子跟了过来。外面两张海报，两边只有一边响。',
    effect:{spirit:9,network:3}},
  ],
 };
 return {message:'去外滩抢回首演',event};
}
