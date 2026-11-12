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
   text:'开门前五分钟，门口多了一列人。费启卖了另一套票，座号和你那一版一模一样。他说可以把人领去他那儿，条件是你把之后的订位群也给他。',
   moves:[
    {id:'check',label:'拿出自己那套票根，叫平台退掉重号',reply:'最前面的客人一比时间就认出来了。重号全退，费启得当场发退款码。你把原票根收好，下次赞助要看。',effect:{face:9,skill:4},prep:'proof',requires:['proof','bid']},
    {id:'merge',label:'让最早那桌帮忙，把两列人都请进来',reply:'他们拿着小板凳先坐到了侧面。费启还在门口问能带走几个，先进去的人已经叫他关门了。',effect:{network:9,spirit:4},prep:'people'},
    {id:'move',label:'借隔壁一扇门，按你们的票开',reply:'费启守着门口的那排灯。隔壁第一首歌响起来时，你把自己那一联票留在了柜台。',effect:{spirit:7,face:4}},
   ],
  },
  38:{
   title:'买家提前来看你们散场',objective:'先弄清是谁承诺清空这间店',district:'anfu',photo:streetPhoto('bookshop'),
   text:'费启拿了一笔订金，跟买家说你们月底全走。买家提前来量门头，刚把尺子拉到招牌底下，店员问你要不要让他量完。',
   moves:[
    {id:'papers',label:'请买家坐下，先看那页签字',reply:'买家放下尺子。他认得自己那半页签名，另一半上从来没出现过你的名字。你把两份转让文本都留了下来。',effect:{skill:7,face:7},prep:'proof',requires:['proof','bid']},
    {id:'chairs',label:'把还要留下的人叫进来',reply:'最后进来的是平时只管拉灯的人。买家听他讲完，第一次问这一晚是不是还能照常开。',effect:{network:10},prep:'people'},
    {id:'leave',label:'照原约开店，把尺子还给他',reply:'你把挂钩扶正，开门铃响起来。买家在外面站了一会儿，收起了自己的尺子。',effect:{spirit:9}},
   ],
  },
 },
 worker:{
  26:{
   title:'班车改到凌晨四点',objective:'保住原班的出发时间',district:'xinzhuang',photo:workPhoto('shift'),
   text:'赵正说这周提前发车。四点到不了的人，名单直接换他那组。吴师傅把旧线路发给你，六点二十出发，往返一趟没超一分钟。',
   moves:[
    {id:'receipt',label:'把调度时刻和加班费当场对一遍',reply:'主管算出四点发车多出一趟空跑，当场划掉新表。你从门房领走打印出来的签收联。',effect:{skill:8,face:5},prep:'proof',requires:['proof','bid']},
    {id:'crew',label:'让司机和工友按旧表签一次',reply:'赵正数了一遍人，来的比表上还多。司机说，今早我开六点二十，谁跟我走先上车。',effect:{network:10},prep:'people'},
    {id:'keep',label:'今天自己去，留个到仓时间',reply:'你坐第一趟地铁到了新仓。门房请你补签，你让他先把几点到写上。',effect:{spirit:8}},
   ],
  },
  38:{
   title:'谁替夜班签了字',objective:'把司机和装卸班的钱结清',district:'xinzhuang',photo:workPhoto('payroll'),
   text:'搬仓之后还有几笔夜班钱没结。赵正拿了一张汇总，说司机已经同意合并发。司机把自己的那一联翻给你看，签名的位置是空的。',
   moves:[
    {id:'papers',label:'照签字的工时一笔笔补',reply:'财务从夜班最后一车开始查。赵正改口说能补发，你收好复核页，下次车到门口还有凭据。',effect:{skill:8,face:8},prep:'proof',requires:['proof','bid']},
    {id:'drivers',label:'让每个人自己领一张确认单',reply:'没人替别人按手印。第三个司机签好后问，能不能连下一季的班也这么排。',effect:{network:11},prep:'people'},
    {id:'keep',label:'先领走自己的那份，留收款时间',reply:'款到了。吴师傅没有问你领了多少，只把班组明天的开门时间抄给你。',effect:{spirit:8}},
   ],
  },
 },
 heir:{
  26:{
   title:'香槟送到，尾款没到',objective:'当着赞助方拿回这一季的款',district:'lujiazui',photo:heirStoryPhoto('boardroom'),
   text:'周骁让两家赞助方都以为自己买的是独家。他带来的香槟已经在冰里，执行团队那笔尾款却还没到。财务把两份转账单翻到相同的签字栏，问你先见谁。',
   moves:[
    {id:'papers',label:'请两家赞助方一起看原件',reply:'第一家认出有重复条款，让财务直接走原单。周骁送来的那瓶没开。你把两份原件留着，下一季还能用。',effect:{face:10,skill:6},prep:'proof',requires:['proof','bid']},
    {id:'advance',label:'先垫 ¥80,000 给团队，自己约赞助方',reply:'灯光师先收到了到账提醒。他叫来另一组的人，周骁在门外等的时候，里面已经有人替你约好了赞助方。',effect:{cash:-80000,network:13},prep:'people'},
    {id:'split',label:'把两张价单退回去，各办各的',reply:'财务把有问题的两份先收回。你选了自己的日期，周骁问能不能往前排，你没给他挪。',effect:{spirit:9,face:5}},
   ],
  },
  38:{
   title:'门口有人把你的展厅挂牌了',objective:'在转让前拆掉周骁塞进去的那一页',district:'bund',photo:heirStoryPhoto('club'),
   text:'周骁把几个项目打包挂牌。投标方拿来的简介里，你的活动排期排在第一页，签字栏却只有他。你走进会客厅时，他们正在问钥匙几时交。',
   moves:[
    {id:'papers',label:'把排期、付款和经营权分成三份',reply:'他们把挂牌撤了。会客厅经理把两份底稿交给你，后面的人来谈价也得先看这两张。',effect:{skill:8,face:8},prep:'proof',requires:['proof','bid']},
    {id:'people',label:'让执行团队当面说手上的合同',reply:'第一位站起来的人原来是周骁请来的。她把自己的真合同报了一遍，经理跟着给在场的人换了座。',effect:{network:12,face:4},prep:'people'},
    {id:'clear',label:'把他自己的项目留给他，其他的全退',reply:'周骁从文件里抽走一叠。你让经理把自己那晚的排期留在正中间，他看了一会才把钥匙放下。',effect:{spirit:10}},
   ],
  },
 },
 system:{
  26:{
   title:'一张派单出了两个价格',objective:'保住收款人和真正的交付时间',district:'anfu',photo:systemPhoto('phone'),
   text:'顾桥转来同一份任务，标着双倍。他说地址不用变，收货那边已经安排好了。你手机里的原单还没关闭，写的却是另一个收款人。',
   moves:[
    {id:'trace',label:'用原权限调出两份发单时间',reply:'顾桥那份晚了七分钟。后台退回重复单，把真正的派单存根交给你。',effect:{skill:8,face:8},prep:'proof',requires:['proof','bid']},
    {id:'handoff',label:'把真正的收款人和送货人叫到同一桌',reply:'两个人把手机号写在同一张纸上。顾桥的新单再响起来时，两边都没点开。',effect:{network:11},prep:'people'},
    {id:'decline',label:'退出这单，给原客户留个电话',reply:'手机安静下来。过了一会儿，原来的客户在楼下问你还接不接晚班。',effect:{spirit:9}},
   ],
  },
  38:{
   title:'顾桥拿着一张失效的钥匙',objective:'确认旧入口关闭后谁还能收单',district:'zhangjiang',photo:systemPhoto('roof'),
   text:'顾桥说旧入口马上停用，自己手上还有一把钥匙。研发楼的打印机刚吐出一条更新记录，上面没写那把钥匙已经换过几任。',
   moves:[
    {id:'restore',label:'用自己的旧凭证试一次恢复',reply:'恢复日志先亮起来。工程师把生成的备份交给你，顾桥在边上把自己的钥匙收了起来。',effect:{skill:10,face:5},prep:'proof',requires:['proof','bid']},
    {id:'call',label:'问还在交付的人愿不愿意换入口',reply:'你把几个号码一个一个拨过去。最后那位问，下周三照旧吗。你说照旧，地址我发你。',effect:{network:12},prep:'people'},
    {id:'offline',label:'先把纸上的联系单装进口袋',reply:'顾桥把手机往桌上一搁。你没等它亮，先抄下了楼下老板的号码。',effect:{spirit:10}},
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
