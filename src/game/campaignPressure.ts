import { streetPhoto, workPhoto } from './art';
import { heirStoryPhoto } from './heirStory';
import { systemPhoto } from './systemStory';
import type { CampaignMove, CampaignRoute } from './campaignScript';
import type { DistrictId, Effect, LifeEvent } from './types';

export const PRESSURE_YEARS = { 26:{after:23,before:28}, 38:{after:34,before:41} } as const;
type PressureAge = keyof typeof PRESSURE_YEARS;
type Move = {
 id:string; label:string; reply:string; effect:Effect;
 prep?:'proof'|'people'; requires?:readonly CampaignMove[];
};
type Pressure = {
 title:string; objective:string; text:string; district:DistrictId; photo:string; moves:readonly Move[];
};

const pressure: Record<CampaignRoute,Record<PressureAge,Pressure>> = {
 arrival:{
  26:{
   title:'同一排座位，卖了两遍',objective:'让今晚买到票的人都进得去',district:'bund',photo:streetPhoto('bund'),
   text:'开门前五分钟，门口多了一列人，手里捏着一模一样的座号。费启叼着票根从灯影里走出来：「我卖的。想要人进得去，把订位群给我——不然今晚两拨客人一起堵你家门口。」',
   moves:[
    {id:'check',label:'拿出自己那套票根，叫平台退掉重号',reply:'出票时间一对，最前面的客人先认出来：你的是三天前出的。重号全退，费启当场被客户围着要退款码。你把原票根收好——下次赞助要看。',effect:{face:9,skill:4},prep:'proof',requires:['proof','bid']},
    {id:'merge',label:'让最早那桌帮忙，把两列人都请进来',reply:'他们拿着小板凳先坐到了侧面，招呼两列人一起进。费启还在门口数能带走几个，先进去的人已经回头喊他：关门了伐？',effect:{network:9,spirit:4},prep:'people'},
    {id:'move',label:'借隔壁一扇门，按你们的票开',reply:'费启守着门口那排灯，等看你低头。隔壁第一首歌响起来时，你把自己那一联票留在了柜台——灯在他那边，人在你这边。',effect:{spirit:7,face:4}},
   ],
  },
  38:{
   title:'买家提前来看你们散场',objective:'先弄清是谁承诺清空这间店',district:'anfu',photo:streetPhoto('bookshop'),
   text:'费启收了一笔订金，向买家拍胸脯「他们月底全走，这家店我说了算」。买家提前来量门头，卷尺刚拉到招牌底下。店员攥着门框问你：让他量完伐？',
   moves:[
    {id:'papers',label:'请买家坐下，先看那页签字',reply:'买家放下尺子，翻到签字页——他认得自己那半页签名，另一半上从来没有你的名字，更没有「月底全走」四个字。他把费启的订金单推了回来，两份转让文本都留在你手里。',effect:{skill:7,face:7},prep:'proof',requires:['proof','bid']},
    {id:'chairs',label:'把还要留下的人叫进来',reply:'最后进来的是平时只管拉灯的人。买家听他讲完每一晚怎么收场，第一次问：今晚，还照常开伐？',effect:{network:10},prep:'people'},
    {id:'leave',label:'照原约开店，把尺子还给他',reply:'你把招牌下的挂钩扶正，开门铃响起来。买家在外面站了一会儿，收起了自己的尺子——量得出门头，量不出这间店是谁的。',effect:{spirit:9}},
   ],
  },
 },
 worker:{
  26:{
   title:'班车改到凌晨四点',objective:'保住原班的出发时间',district:'xinzhuang',photo:workPhoto('shift'),
   text:'赵正在群里发了新表：这周起凌晨四点发车，「四点到不了的，名单直接换我那组，别怪没提醒」。吴师傅把旧线路发给你——六点二十出发，往返一趟没超一分钟，凌晨四点，地铁都没开。',
   moves:[
    {id:'receipt',label:'把调度时刻和加班费当场对一遍',reply:'你把两版时刻和加班费并排一算：四点发车多出一趟空车，费用没人认。主管当场划掉新表，赵正的「提醒」成了群里的反面教材。你从门房领走签收联。',effect:{skill:8,face:5},prep:'proof',requires:['proof','bid']},
    {id:'crew',label:'让司机和工友按旧表签一次',reply:'赵正数了一遍到的人数——来的比表上还多。司机把钥匙插上：「今早我开六点二十，谁跟我走，先上车。」他那组的人站在原地，没动。',effect:{network:10},prep:'people'},
    {id:'keep',label:'今天自己去，留个到仓时间',reply:'你坐第一趟地铁到了新仓。门房请你补签，你让他先把「几点到」写上——时间写清楚，谁也做不了手脚。',effect:{spirit:8}},
   ],
  },
  38:{
   title:'谁替夜班签了字',objective:'把司机和装卸班的钱结清',district:'xinzhuang',photo:workPhoto('payroll'),
   text:'搬仓之后几笔夜班钱一直没结。赵正拿着一张「合并汇总」进财务室，说司机们都同意合并发。老司机把自己的那一联翻给你看——签名的位置，是空的。「同意」两个字，没人写过。',
   moves:[
    {id:'papers',label:'照签字的工时一笔笔补',reply:'财务从夜班最后一车查起，空的签名栏一栏栏露出来。赵正当场改口「能补发」，你收好复核页——车再开到门口，凭据还在。',effect:{skill:8,face:8},prep:'proof',requires:['proof','bid']},
    {id:'drivers',label:'让每个人自己领一张确认单',reply:'没人再替别人按手印。第三个司机签好后问：下一季的班，能不能也这么排？赵正的汇总表，从此没人签。',effect:{network:11},prep:'people'},
    {id:'keep',label:'先领走自己的那份，留收款时间',reply:'款到了。吴师傅没问你领了多少，只把班组明天的开门时间抄给你——他的账，从来不靠别人替他签。',effect:{spirit:8}},
   ],
  },
 },
 heir:{
  26:{
   title:'香槟送到，尾款没到',objective:'当着赞助方拿回这一季的款',district:'lujiazui',photo:heirStoryPhoto('boardroom'),
   text:'周骁让两家赞助方都以为自己买的是独家，香槟先送进了冰桶，执行团队那笔尾款却拖着没到。他把冰桶往桌上一顿：「都谈好了，就差你点个头——别不识抬举。」财务把两份转账单翻到相同的签字栏，问你先见谁。',
   moves:[
    {id:'papers',label:'请两家赞助方一起看原件',reply:'两家当面一对条款——同一档期，两份「独家」。第一家直接让财务走原单，第二家把电话打给了周骁。他送来的那瓶香槟在冰桶里躺到散场，没人开。',effect:{face:10,skill:6},prep:'proof',requires:['proof','bid']},
    {id:'advance',label:'先垫 ¥80,000 给团队，自己约赞助方',reply:'灯光师先收到到账提醒——周骁拖着的尾款，你垫上了。他叫来另一组的人，周骁在门外等通报的时候，里面已经有人替你把两家赞助方约到了同一桌。',effect:{cash:-80000,network:13},prep:'people'},
    {id:'split',label:'把两张价单退回去，各办各的',reply:'财务把有问题的两份先收回。你选了自己的日期，周骁问能不能往前排——你没给他挪。冰桶他抱走了，款项留在了你的合同里。',effect:{spirit:9,face:5}},
   ],
  },
  38:{
   title:'门口有人把你的展厅挂牌了',objective:'在转让前拆掉周骁塞进去的那一页',district:'bund',photo:heirStoryPhoto('club'),
   text:'周骁把几个项目打包挂牌，你的活动排期印在简介第一页，签字栏却只有他一个名字。你走进会客厅时，投标方正在问钥匙几时交，他答得比谁都快：「明天。这层楼，早就是我说了算。」',
   moves:[
    {id:'papers',label:'把排期、付款和经营权分成三份',reply:'三份文件一拆开，投标方看清了：排期是你的，付款是你的，经营权页上根本没有周骁的签字。「说了算」三个字，撑不起一页没签字的纸。挂牌当场撤了。',effect:{skill:8,face:8},prep:'proof',requires:['proof','bid']},
    {id:'people',label:'让执行团队当面说手上的合同',reply:'第一位站起来的人，合同上盖的竟是周骁公司的章——可他报出来的真实条款，页页写着你的名字。经理听完，给在场的人换了座：签字栏是谁的，谁坐主位。',effect:{network:12,face:4},prep:'people'},
    {id:'clear',label:'把他自己的项目留给他，其他的全退',reply:'周骁从文件里抽走属于他的那一叠——比他带来的薄得多。你让经理把自己那晚的排期留在正中央，他看了一会儿，把钥匙放下了。',effect:{spirit:10}},
   ],
  },
 },
 system:{
  26:{
   title:'一张派单出了两个价格',objective:'保住收款人和真正的交付时间',district:'anfu',photo:systemPhoto('phone'),
   text:'顾桥转来同一份任务，标价翻倍：「地址不用变，收货我安排好了——你只管把原单关掉。」你手机里的原单还亮着，收款人写的是另一个名字。双倍的价钱，买的是你自己关掉自己的单。',
   moves:[
    {id:'trace',label:'用原权限调出两份发单时间',reply:'发单时间调出来：顾桥那份晚了七分钟。后台退回重复单，把真正的派单存根交给你——他翻的倍，翻在别人的单子上。',effect:{skill:8,face:8},prep:'proof',requires:['proof','bid']},
    {id:'handoff',label:'把真正的收款人和送货人叫到同一桌',reply:'两个人把手机号写在同一张纸上，各执一联。顾桥的新单再响起来时，两边都没点开——没人陪他演双倍的那出戏。',effect:{network:11},prep:'people'},
    {id:'decline',label:'退出这单，给原客户留个电话',reply:'手机安静下来。过了一会儿，原来的客户在楼下问你还接不接晚班——真单认人，不认翻倍的价。',effect:{spirit:9}},
   ],
  },
  38:{
   title:'顾桥拿着一张失效的钥匙',objective:'确认旧入口关闭后谁还能收单',district:'zhangjiang',photo:systemPhoto('roof'),
   text:'顾桥把一枚转接钥匙拍在桌上：「旧入口马上停用，就我手上还有一把。想要明天还有单，现在谈个价。」研发楼的打印机刚吐出一条更新记录——上面写着，那把钥匙早就换过几任了。他不知道。',
   moves:[
    {id:'restore',label:'用自己的旧凭证试一次恢复',reply:'恢复日志先亮起来，更新记录一行行滚过：钥匙已换三任，他手里那把，上一任就注销了。工程师把生成的备份交给你，顾桥在边上把那枚「钥匙」收回了口袋。',effect:{skill:10,face:5},prep:'proof',requires:['proof','bid']},
    {id:'call',label:'问还在交付的人愿不愿意换入口',reply:'你把几个号码一个一个拨过去，没人提那把钥匙。最后那位问：下周三照旧伐？你说照旧，地址我发你——入口会停，人不会。',effect:{network:12},prep:'people'},
    {id:'offline',label:'先把纸上的联系单装进口袋',reply:'顾桥把手机往桌上一搁，等你的报价。你没等它亮，先抄下了楼下老板的号码——纸上的电话，比他那枚钥匙活得长。',effect:{spirit:10}},
   ],
  },
 },
};

export function campaignPressure(route:CampaignRoute,age:PressureAge,prior:CampaignMove,prepFlag:(kind:'proof'|'people')=>string):LifeEvent {
 const beat=pressure[route][age];
 return {
  id:`campaign-pressure-${route}-${age}`,title:beat.title,objective:beat.objective,text:beat.text,
  district:beat.district,illustration:beat.photo,category:'year',tag:'对手反击',
  choices:beat.moves.filter(move=>!move.requires||move.requires.includes(prior)).map(move=>({
   id:move.id,label:move.label,reply:move.reply,
   effect:{...move.effect,...(move.prep&&{setFlags:[prepFlag(move.prep)]})},
   ...(move.prep&&{hint:move.prep==='proof'?'下一幕可亮出原件':'下一幕可请人作证'}),
  })),
 };
}
