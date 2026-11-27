import { streetPhoto } from './art';
import type { DistrictId, GameState, LifeEvent } from './types';

export interface HustleLead {
  message: string;
  district: DistrictId;
  minAge: number;
  maxAge: number;
  event: LifeEvent;
}

export const HUSTLE_HEAT_FLAGS = [
  'hustle_heat_bund',
  'hustle_heat_anfu',
  'hustle_heat_people',
  'hustle_heat_lujia',
  'hustle_heat_zhang',
  'hustle_heat_xin',
] as const;

const HEAT_FLAGS = [
  ...HUSTLE_HEAT_FLAGS,
  'credit_taken',
  'persona_rich',
  'startup_allin',
  'laser_seller',
] as const;

export function streetHeatOf(state: GameState): { level: number; label: string } {
  const raw = HEAT_FLAGS.filter(flag => state.flags.includes(flag)).length;
  const level = Math.min(5, raw);
  const label = level >= 4 ? '全城盯梢' : level >= 2 ? '风声鹤唳' : level === 1 ? '暗流涌动' : '风平浪静';
  return { level, label };
}

export const HUSTLE_LEADS: readonly HustleLead[] = [
  {
    district: 'bund', minAge: 18, maxAge: 36,
    message: '十六铺码头有人塞来一只加急铁皮箱',
    event: {
      id: 'street-hustle-bund-fx', title: '十六铺急件过江', category: 'business', district: 'bund',
      location: '外滩 · 十六铺码头', tag: '码头急单', illustration: streetPhoto('bund'),
      objective: '停航前把铁皮箱送上驳船，拿稳现钞',
      text: '雾气漫过防汛墙，货代老陈把一只上锁铁皮箱塞进你怀里：赶在末班驳船解缆前送到浦东接货人手上，当场点八千现钞。话音未落，对家顾桥的马仔已经在栈桥口探头张望。',
      choices: [
        {
          id: 'sprint', label: '抄轮渡暗道硬闯栈桥 · 独吞急件加价',
          hint: '高风险高回报 · 惹上码头风头',
          reply: '你猫腰钻过货运跳板，在汽笛拉响前一秒把箱子抛上甲板。接货人痛快点出厚厚一沓现钞，栈桥上那双眼睛却死死记住了你的背影。',
          effect: { cash: 6000, face: 6, setFlags: ['hustle_heat_bund'] },
          check: {
            stat: 'face', threshold: 45,
            success: { cash: 6000, spirit: 4 },
            failure: { cash: -2000, health: -5 },
            successText: '你还顺口压住对方气焰，多敲下六千封口辛苦费。',
            failureText: '下跳板时脚底打滑蹭破了皮，被码头巡查罚没两千才脱身。',
          },
        },
        {
          id: 'split', label: '喊摆渡熟人掩护过江 · 五五分账',
          hint: '稳拿现钱 · 攒下码头人情',
          reply: '严可下夜班顺路替你打了掩护，铁皮箱夹在医用物资车里顺顺当当过了江。分完账，老陈竖起大拇指说你路子野又稳当。',
          effect: { cash: 4800, network: 7, skill: 3 },
        },
        {
          id: 'clean', label: '按规矩开具货运回执 · 只收明面跑腿费',
          hint: '不沾灰账 · 压低街头风头',
          reply: '你坚持填清收发货底联才肯登船。钱少赚一半，但顾桥的人过来查验时挑不出半点毛病，连旧风声也一并平息了。',
          effect: { cash: 2200, spirit: 6, removeFlags: ['hustle_heat_bund', 'hustle_heat_lujia'] },
        },
      ],
    },
  },
  {
    district: 'bund', minAge: 28, maxAge: 58,
    message: '和平饭店顶楼缺个镇得住场的主宾替身',
    event: {
      id: 'street-hustle-bund-vip', title: '和平饭店顶楼替身局', category: 'social', district: 'bund', speakerId: 'fei',
      location: '外滩 · 和平饭店露台', tag: '码头急单', illustration: streetPhoto('bund'),
      objective: '半小时酒局不露怯，摸清桌上底牌',
      text: '港方代表航班延误，费启急得满头汗，在电梯口拽住你：借你一身行头顶半小时主宾位，只要把供货商稳在席间不散场，茶水费一万起跳。',
      choices: [
        {
          id: 'bluff', label: '端起雪茄反客为主 · 当场压价三成',
          hint: '拼腔势 · 成了名声大噪',
          reply: '你慢条斯理晃着冰球，只问交货期不谈虚名。供货商摸不透你的深浅，硬着头皮先让了两步。',
          effect: { cash: 7500, face: 8, setFlags: ['hustle_heat_bund'] },
          check: {
            stat: 'face', threshold: 58,
            success: { cash: 7500, network: 6 },
            failure: { face: -6, spirit: -4 },
            successText: '散席时港商赶到，见条款压得漂亮，当场把省下的差价分了你一半。',
            failureText: '对方老油条追问离岸账户细节，你打了个哈哈勉强圆过去，后背全是冷汗。',
          },
        },
        {
          id: 'listen', label: '少说话多敬酒 · 暗记三家底价卖人情',
          reply: '你只微笑举杯绝不拍板，散局后把三家报出的底线原原本本复述给主东，稳稳落袋六千顾问费。',
          effect: { cash: 6000, skill: 5, network: 5 },
        },
        {
          id: 'decline', label: '亮明顾问身份 · 替双方改约明早正式谈',
          reply: '你不冒名顶替，大大方方把延误实情摆上台面并排好明早议程。客人们反倒高看你一眼，互留了私人名片。',
          effect: { cash: 2500, trust: 6, network: 6, removeFlags: ['hustle_heat_bund'] },
        },
      ],
    },
  },
  {
    district: 'anfu', minAge: 19, maxAge: 38,
    message: '安福路老洋房闹出一房两签，两拨人堵门了',
    event: {
      id: 'street-hustle-anfu-lease', title: '老洋房一房两签', category: 'business', district: 'anfu', speakerId: 'chen',
      location: '安福路 · 三楼露台', tag: '码头急单', illustration: streetPhoto('anfu'),
      objective: '摆平撞期的剧组与店主，盘活这间露台',
      text: '二房东卷款失联，把三楼带露台的老洋房同一周租给了广告剧组和陈恺的快闪店。灯光车堵死弄堂口，两边都在找能拍板的人。',
      choices: [
        {
          id: 'broker', label: '两头收加急协调费 · 切分日夜档期',
          hint: '吃两家茶礼 · 考验算账手腕',
          reply: '你拿粉笔在门板上划出时刻表：白天卖咖啡带客流，半夜打光拍片互不耽误。两边捏着鼻子交了协调费。',
          effect: { cash: 6500, skill: 5, setFlags: ['hustle_heat_anfu'] },
          check: {
            stat: 'skill', threshold: 48,
            success: { cash: 5500, face: 5 },
            failure: { cash: -1500, spirit: -4 },
            successText: '大房东闻讯赶来，见你把烂摊子理得井井有条，直接把下季度招租包给了你。',
            failureText: '剧组收工超时半小时吵醒楼下爷叔，你自掏一千五买水果才算平事。',
          },
        },
        {
          id: 'ally', label: '帮陈恺保住白天营业 · 让剧组买单包场饮品',
          reply: '剧组省了场地违约金，陈恺一天卖出三百杯冰美式，收工后分了你四千二辛苦钱。',
          effect: { cash: 4200, network: 7, trust: 6 },
        },
        {
          id: 'record', label: '带双方去居委备案 · 先查清产权底档',
          reply: '底档一查果然是转租黑合同。两边及时止损没再往里砸钱，合凑了一笔跑腿茶水费谢你。',
          effect: { cash: 1800, spirit: 6, skill: 4, removeFlags: ['hustle_heat_anfu'] },
        },
      ],
    },
  },
  {
    district: 'anfu', minAge: 26, maxAge: 58,
    message: '深夜画廊主墙缺画，主理人重金求你押车调货',
    event: {
      id: 'street-hustle-anfu-art', title: '午夜画廊调包救急', category: 'explore', district: 'anfu',
      location: '安福路 · 地下画廊', tag: '码头急单', illustration: streetPhoto('anfu'),
      objective: '天亮开展前把真迹完好挂上主墙',
      text: '明早十点藏家专场，主墙那幅油画却因湿度超标起了泡。画廊老板开价一万二，求你凌晨押面包车去郊区恒温仓把备用真迹悄悄换回来，绝不能走漏半点风声。',
      choices: [
        {
          id: 'rush', label: '连夜冒雾押车狂奔 · 顺带谈下独家布展抽成',
          reply: '凌晨四点半画框严丝合缝挂上主墙，门口蹲守的自媒体连车牌都没拍着。',
          effect: { cash: 7000, face: 5, setFlags: ['hustle_heat_anfu'] },
          check: {
            stat: 'health', threshold: 52,
            success: { cash: 6000, face: 4 },
            failure: { health: -7, spirit: -3 },
            successText: '藏家当场拍下画作，老板按约给你补发了六千抽成红包。',
            failureText: '熬了个通宵搬重木箱，钱是拿到了，腰酸背痛缓了整整礼拜。',
          },
        },
        {
          id: 'restore', label: '请熟识修复师驻场抢修 · 省下折腾风险',
          reply: '老师傅带热风枪忙活三小时把画布抚平，老板省了一半惊吓，痛快结你五千介绍费。',
          effect: { cash: 5000, network: 6, skill: 4 },
        },
        {
          id: 'honest', label: '建议把修复过程做成公开导览 · 化事故为噱头',
          reply: '藏家们头一回近距离看修复手艺，反倒夸画廊坦诚有腔调。你拿了顾问费，名声也干干净净。',
          effect: { cash: 2800, face: 6, spirit: 5, removeFlags: ['hustle_heat_anfu'] },
        },
      ],
    },
  },
  {
    district: 'people', minAge: 18, maxAge: 36,
    message: '大剧院开演前四十分钟，票贩子手里砸了二十张连座',
    event: {
      id: 'street-hustle-people-scalp', title: '广场尾票清仓局', category: 'business', district: 'people',
      location: '人民广场 · 大剧院台阶', tag: '码头急单', illustration: streetPhoto('people'),
      objective: '开场铃响前出清尾票，别被巡场保安堵住',
      text: '包场的企业临时爽约，老黄牛阿庆捏着二十张一楼连座票急得跳脚：三折全盘给你，只要开演前散出去，净赚归你。不远处保安的对讲机正滋滋作响。',
      choices: [
        {
          id: 'flip', label: '三折吃进 · 去相亲角和咖啡馆精准推情侣套票',
          hint: '眼光毒辣翻倍赚 · 小心巡场盯梢',
          reply: '你专挑约会没买着票的年轻男女，半小时出清大半，口袋里钞票塞得鼓鼓囊囊。',
          effect: { cash: 5500, face: 4, setFlags: ['hustle_heat_people'] },
          check: {
            stat: 'network', threshold: 42,
            success: { cash: 5000, spirit: 4 },
            failure: { cash: -1800, face: -5 },
            successText: '最后四张黄金座被赶来的外企主管原价收走，这一票赚得盆满钵满。',
            failureText: '最后两张没出手还被保安撵了两条街，折本甩卖才算脱手。',
          },
        },
        {
          id: 'group', label: '联系夜校余老师包作学员福利 · 薄利快走',
          reply: '夜校学员欢天喜地拼单接盘，你一分本钱没垫，稳赚三千六跑腿差价。',
          effect: { cash: 3600, network: 7, trust: 4 },
        },
        {
          id: 'boxoffice', label: '带阿庆走团体退改窗口 · 收笔合规手续费',
          reply: '你熟门熟路找到票务主管办妥折价寄售，虽然只落袋一千八，但往后买紧俏票都有了正经门路。',
          effect: { cash: 1800, skill: 5, spirit: 4, removeFlags: ['hustle_heat_people'] },
        },
      ],
    },
  },
  {
    district: 'people', minAge: 24, maxAge: 55,
    message: '地下街机厅被人连砸十八盘，老板悬赏五千找人镇场',
    event: {
      id: 'street-hustle-people-arcade', title: '地下城街机镇场赛', category: 'explore', district: 'people',
      location: '人民广场 · 迪美地下街', tag: '码头急单', illustration: streetPhoto('people'),
      objective: '三局两胜保住机厅招牌',
      text: '霓虹灯箱底下围了里三层外三层，外区来的踢馆高手连挑十八枚游戏币不败。机厅老板把五千块拍在机台玻璃上：谁赢下这一局，钞票连带全年免币卡直接拿走。',
      choices: [
        {
          id: 'duel', label: '投币上机硬刚三局 · 押上全部气势',
          reply: '摇杆搓得火星四溅，决胜局丝血反杀那一刻，整条地下通道爆出掀翻屋顶的喝彩！',
          effect: { cash: 5000, face: 8, setFlags: ['hustle_heat_people'] },
          check: {
            stat: 'skill', threshold: 50,
            success: { cash: 4000, spirit: 6 },
            failure: { cash: -1000, face: -4 },
            successText: '隔壁铺老板跟着加注彩头，你揣着九千现钞潇洒离场。',
            failureText: '决胜局指令串招惜败半格血，好在打得精彩，老板照发保底辛苦费。',
          },
        },
        {
          id: 'host', label: '支起挑战赛报名摊 · 替老板卖围观门票回血',
          reply: '胜负未分，你先帮老板卖出八十份汽水加观战券，抽成四千二稳稳到手。',
          effect: { cash: 4200, skill: 5, network: 5 },
        },
        {
          id: 'recruit', label: '私下请踢馆高手做周末驻场教练 · 化敌为友',
          reply: '高手正愁没地儿赚外快，当场跟机厅签下周末表演赛，老板乐呵呵封了你两千四媒人红包。',
          effect: { cash: 2400, network: 8, spirit: 4, removeFlags: ['hustle_heat_people'] },
        },
      ],
    },
  },
  {
    district: 'lujiazui', minAge: 20, maxAge: 42,
    message: '三十八楼碎纸机卡着半页对手底价，明早九点开标',
    event: {
      id: 'street-hustle-lujia-leak', title: '三十八楼碎纸机残页', category: 'career', district: 'lujiazui', speakerId: 'gao',
      location: '陆家嘴 · 云端写字楼', tag: '码头急单', illustration: streetPhoto('lujiazui'),
      objective: '开标前决定这半页商业底牌的去向',
      text: '凌晨一点去茶水间倒水，发现公用碎纸机卡死，露出的半截表格赫然是竞标死对头明早的最终底价。走廊尽头传来高原讲电话的脚步声。',
      choices: [
        {
          id: 'undercut', label: '拍下残页连夜改标书 · 精准压对方半个点中标',
          hint: '赢下巨额提成 · 行里风声变紧',
          reply: '次日开标，你们的报价刚好卡在甲方心理底线上，一举拿下大单！',
          effect: { cash: 9500, skill: 5, setFlags: ['hustle_heat_lujia'] },
          check: {
            stat: 'skill', threshold: 55,
            success: { cash: 8500, face: 7 },
            failure: { face: -6, spirit: -5 },
            successText: '成本测算滴水不漏，一万八项目奖金当月直接打进工资卡。',
            failureText: '对方起疑追查泄密源头，虽没抓到把柄，圈子里还是传开了风言风语。',
          },
        },
        {
          id: 'trade', label: '把残页拍给高原 · 换他手里一个靠谱大客户',
          reply: '高原盯着纸条沉默三秒，当场把捂了半年的外贸渠道转介绍给你，首单佣金五千六。',
          effect: { cash: 5600, network: 8, trust: 4 },
        },
        {
          id: 'shred', label: '按下反转键彻底粉碎 · 凭自家硬实力上标台',
          reply: '纸屑落进桶底，你神色坦然回工位打磨演示稿。开标后甲方专程夸你们方案最扎实，发了三千鼓励奖。',
          effect: { cash: 3000, spirit: 8, skill: 4, removeFlags: ['hustle_heat_lujia', 'credit_taken'] },
        },
      ],
    },
  },
  {
    district: 'lujiazui', minAge: 25, maxAge: 56,
    message: '地库有台没挂临牌的超跑急着连夜挪去西岸会所',
    event: {
      id: 'street-hustle-lujia-car', title: '滨江地库豪车夜挪', category: 'business', district: 'lujiazui',
      location: '陆家嘴 · B3私人地库', tag: '码头急单', illustration: streetPhoto('lujiazui'),
      objective: '避开查车高峰，安全把车和货交割到位',
      text: '大客户在楼上喝高了，把一把沉甸甸的跑车钥匙抛给你：临牌明早才下来，后备厢还有两箱陈年茅台，半夜前帮他弄到西岸私人会所，跑腿费一万整。',
      choices: [
        {
          id: 'drive', label: '自己踩油门走隧道夜闯西岸 · 挣这笔快钱',
          reply: '低沉的引擎声贴着延安东路隧道呼啸过江，赶在零点前稳稳停进会所私密车位。',
          effect: { cash: 7500, face: 7, setFlags: ['hustle_heat_lujia'] },
          check: {
            stat: 'spirit', threshold: 54,
            success: { cash: 6500, network: 5 },
            failure: { cash: -3000, spirit: -5 },
            successText: '客户酒醒大喜，顺手把会所晚宴的采购单也签给了你。',
            failureText: '出隧道口遇上例行临检，紧急叫救援拖车才混过去，倒贴三千拖车费。',
          },
        },
        {
          id: 'flatbed', label: '花两千叫全封闭板车托运 · 自己坐副驾押货',
          reply: '跑车罩上车衣走正规板车过江，茅台一瓶没晃，扣掉板车钱净落六千五，稳如泰山。',
          effect: { cash: 6500, skill: 6, spirit: 3 },
        },
        {
          id: 'valet', label: '把茅台分箱打车先送 · 跑车锁在地库等明早临牌',
          reply: '酒局没耽误喝，车也没冒无牌上路的险。客户清醒后连夸你办事拎得清，给了三千五红包。',
          effect: { cash: 3500, trust: 7, spirit: 5, removeFlags: ['hustle_heat_lujia'] },
        },
      ],
    },
  },
  {
    district: 'zhangjiang', minAge: 18, maxAge: 40,
    message: '明早路演验机，园区机房算力却被隔壁组锁死了',
    event: {
      id: 'street-hustle-zhang-gpu', title: '凌晨三点抢机房算力', category: 'career', district: 'zhangjiang', speakerId: 'pj-wen',
      location: '张江 · 地下机房', tag: '码头急单', illustration: streetPhoto('zhangjiang'),
      objective: '天亮前跑完演示数据，拿稳路演悬赏',
      text: '距离投资人进场只剩六个钟头，主集群却被人挂满私活跑得风扇狂转。项目方悬赏一万二救急，周闻拎着螺丝刀站在配电柜边等你拿主意。',
      choices: [
        {
          id: 'override', label: '用管理员热键硬切最高优先级 · 强占整排机柜',
          reply: '进度条瞬间飙红跑通！天亮时演示丝滑过关，隔壁组长黑着脸却抓不到谁动的手脚。',
          effect: { cash: 7200, skill: 6, setFlags: ['hustle_heat_zhang'] },
          check: {
            stat: 'skill', threshold: 52,
            success: { cash: 5800, face: 5 },
            failure: { cash: -1500, health: -5 },
            successText: '顺手清出两台僵尸矿机立下大功，园区额外发了五千八安全奖。',
            failureText: '机柜瞬时功率过载跳了一路小闸，连夜抢修到天亮才勉强恢复。',
          },
        },
        {
          id: 'bribe', label: '提两袋小龙虾买通夜班网管 · 借备用测试集群',
          reply: '网管边剥虾边给你开了内网测试通道，天亮前数据一分不差跑完，落袋五千四。',
          effect: { cash: 5400, network: 7, spirit: 3 },
        },
        {
          id: 'optimize', label: '和周闻连夜裁剪模型体积 · 用本地机器硬跑出来',
          reply: '砍掉冗余花架子后单机十分钟跑通，投资人当场拍板加单，不结梁子还长了真本事。',
          effect: { cash: 3800, skill: 9, health: -3, removeFlags: ['hustle_heat_zhang'] },
        },
      ],
    },
  },
  {
    district: 'zhangjiang', minAge: 26, maxAge: 55,
    message: '神秘猎头约在园区全家便利店，开价三万买样机底参',
    event: {
      id: 'street-hustle-zhang-poach', title: '便利店里的竞业暗单', category: 'career', district: 'zhangjiang',
      location: '张江 · 科苑路便利店', tag: '码头急单', illustration: streetPhoto('zhangjiang'),
      objective: '守住底线或反将一军，别栽进竞业坑里',
      text: '戴鸭舌帽的猎头把信封推过关东煮纸杯：只要随口透露下季度新样机的散热极限，三万现金咨询费不留任何转账记录。',
      choices: [
        {
          id: 'bait', label: '收下定金 · 拿上代公开废案包装成「内部报告」反套路',
          hint: '黑吃黑险招 · 心理素质要硬',
          reply: '你把早已公开的专利公报改头换面讲得神乎其神，对方如获至宝付清现钞。',
          effect: { cash: 8500, face: 6, setFlags: ['hustle_heat_zhang'] },
          check: {
            stat: 'skill', threshold: 58,
            success: { cash: 7500, spirit: 5 },
            failure: { face: -7, spirit: -5 },
            successText: '全篇引用公开论文分毫不犯忌，白赚一万六还探出了对手的研发盲区。',
            failureText: '对方回去核对发现全是公开数据，连发三条狠话拉黑了你的小号。',
          },
        },
        {
          id: 'poach', label: '不卖参数 · 反过来把猎头手里的急招高薪岗套出来',
          reply: '你滴水不漏聊了半小时行业通识，顺手拿到三家友商的薪资底牌，转手给同事做跳槽参谋赚了四千五谢礼。',
          effect: { cash: 4500, network: 7, skill: 4 },
        },
        {
          id: 'report', label: '推回信封 · 回头给研发部补上保密漏洞清单',
          reply: '主管看完清单惊出一身冷汗，当月批给你三千保密津贴，你在核心组的分量更重了。',
          effect: { cash: 3000, trust: 8, spirit: 6, removeFlags: ['hustle_heat_zhang'] },
        },
      ],
    },
  },
  {
    district: 'xinzhuang', minAge: 18, maxAge: 38,
    message: '外环封道，三车活海鲜堵在立交桥下高价求带路',
    event: {
      id: 'street-hustle-xin-fleet', title: '外环冷链夜班截胡', category: 'business', district: 'xinzhuang', speakerId: 'pj-xu',
      location: '莘庄 · 外环立交桥下', tag: '码头急单', illustration: streetPhoto('xinzhuang'),
      objective: '清晨早市开秤前把海鲜送进铜川路',
      text: '暴雨封了高速匝道，外地水产老板看着氧气泵报警急红了眼：清晨五点前谁能带三辆冷链车抄近道进铜川路水产市场，现结一万块带路费。',
      choices: [
        {
          id: 'convoy', label: '亲自跳上头车领航抄厂区老路 · 挣全额急单费',
          reply: '你凭着送货摸熟的弄堂近道连闯七个路口，四点四十准时停进水产大棚！',
          effect: { cash: 6800, face: 6, setFlags: ['hustle_heat_xin'] },
          check: {
            stat: 'health', threshold: 50,
            success: { cash: 5200, network: 5 },
            failure: { cash: -1600, health: -6 },
            successText: '整车东星斑活蹦乱跳卖上高价，老板大喜多塞五千二大红包外加两筐梭子蟹。',
            failureText: '厂区积水没过半个轮胎，你跳下水推车受了凉，扣掉修车费少赚一截。',
          },
        },
        {
          id: 'xuzhou', label: '摇人喊许舟车队分装短驳 · 稳稳对半分账',
          reply: '许舟两辆小货车钻高架辅道如履平地，天亮前顺当交割，分你五千块干干净净。',
          effect: { cash: 5000, network: 6, trust: 6 },
        },
        {
          id: 'coldroom', label: '帮水产老板联系附近冷库暂存充氧 · 收中介服务费',
          reply: '不冒雨夜闯限行的险，海鲜进了冷库保住九成鲜度，两边都念你的好。',
          effect: { cash: 2600, skill: 5, spirit: 5, removeFlags: ['hustle_heat_xin'] },
        },
      ],
    },
  },
  {
    district: 'xinzhuang', minAge: 24, maxAge: 58,
    message: '小吃街来了伙生面孔乱收摊位费，吴师傅抄起锅铲了',
    event: {
      id: 'street-hustle-xin-nightmarket', title: '夜市摊位费风波', category: 'social', district: 'xinzhuang', speakerId: 'wu',
      location: '莘庄 · 晚风小吃街', tag: '码头急单', illustration: streetPhoto('kitchen'),
      objective: '镇住生面孔，护住整条小吃街的烟火气',
      text: '三个挂假胸牌的社会人挨个摊位收八百块「油烟清洁押金」，不交就不让支桌子。吴师傅把铁锅往灶上一砸，整条街二十几个摊主全朝你这边看过来。',
      choices: [
        {
          id: 'standoff', label: '横步上前亮出地面熟人名号 · 逼他们当众退钱',
          reply: '你一句行话点破他们挂靠的皮包公司底细，领头的脸色青一阵白一阵，灰溜溜退钱走人。',
          effect: { cash: 4000, face: 9, setFlags: ['hustle_heat_xin'] },
          check: {
            stat: 'face', threshold: 48,
            success: { cash: 3500, network: 8 },
            failure: { health: -6, cash: -800 },
            successText: '整条街摊主凑出七千五联防茶水费硬塞给你，往后夜宵走到哪免单到哪。',
            failureText: '推搡间掀翻了两张塑料桌，虽然把人撵跑了，你也挂了点彩。',
          },
        },
        {
          id: 'evidence', label: '暗中拍下假收据 · 喊街道市场科当场抓现行',
          reply: '正规执法车十分钟赶到把假胸牌一锅端，管委会给见义勇为的你发了三千六联防奖金。',
          effect: { cash: 3600, skill: 6, network: 7, removeFlags: ['hustle_heat_xin'] },
        },
        {
          id: 'union', label: '牵头成立摊主互助账房 · 统一跟物业签正规摊位约',
          reply: '二道贩子彻底没了空子钻，摊主们推举你管季度公账，每月稳拿一份顾问补贴。',
          effect: { cash: 2800, network: 9, trust: 7, removeFlags: ['hustle_heat_xin'] },
        },
      ],
    },
  },
];

export function districtHustle(state: GameState): HustleLead | undefined {
  if (state.pendingYearEvent || state.ended || state.actions <= 0) return undefined;
  return HUSTLE_LEADS.find(
    item => item.district === state.district
      && state.age >= item.minAge
      && state.age <= item.maxAge
      && !state.seenEvents.includes(item.event.id),
  );
}


export function heatInterceptEvent(state: GameState): LifeEvent | undefined {
  const activeHustleHeat = HUSTLE_HEAT_FLAGS.filter(flag => state.flags.includes(flag));
  if (activeHustleHeat.length < 2 || state.age < 19 || state.ended) return undefined;
  const id = `heat-intercept-${state.age}`;
  if (state.seenEvents.includes(id)) return undefined;

  const fine = state.age >= 35 ? 18_000 : 6_500;
  const scenarios = [
    {
      title: '外滩联合稽查夜敲门',
      location: '外滩 · 后弄堂口',
      text: '两辆闪着红蓝警示灯的黑色轿车悄无声息堵住了弄堂口。前阵子你连做几票大动静急单，街面上的风声终究传进了稽查组耳朵里，今晚账册和出入回执必须给个交代。',
    },
    {
      title: '十六铺对家带人堵栈桥',
      location: '十六铺 · 夜雾防汛墙',
      text: '江风夹着雨星子刮脸，之前被你截过胡的对家马仔把巷口一字排开。领头的慢悠悠弹掉烟灰：在上海滩吃独食是要还的，今晚要么破财消灾，要么看谁牌面更硬。',
    },
    {
      title: '跨区专案协查约谈',
      location: '人民广场 · 协查接待室',
      text: '一纸加急核查通知单摆在桌面，台灯白光晃眼。你手头那几笔灰线进项被重点圈了出来，对面合上文件夹，等你开口表态。',
    },
  ];
  const pick = scenarios[state.age % scenarios.length];

  return {
    id,
    title: pick.title,
    category: 'year',
    district: state.district,
    location: pick.location,
    tag: '风头追缉',
    illustration: streetPhoto(state.district),
    objective: '化解街头风头追缉，保住手头本钱与底盘',
    text: pick.text,
    choices: [
      {
        id: 'settle',
        label: `掏钱走合规补缴与律师打点 · ¥${fine.toLocaleString('zh-CN')}`,
        hint: '破财免灾 · 一口气抹平两桩街头风头',
        reply: '律师连夜补齐交割凭证并缴清罚金，门口的警示灯终于熄了。虽然肉疼，但底子干干净净保住了。',
        effect: {
          cash: -fine,
          spirit: 4,
          removeFlags: activeHustleHeat.slice(0, 2),
        },
      },
      {
        id: 'stand',
        label: '搬出沪上熟人牌面当场周旋硬扛',
        hint: '不花现钱 · 考验腔势硬实力',
        reply: '你面不改色报出几个行内老叔伯的名号，把来龙去脉滴水不漏圆了过去。',
        effect: { face: 2 },
        check: {
          stat: 'face',
          threshold: 54,
          success: { face: 5, spirit: 5, removeFlags: activeHustleHeat.slice(0, 1) },
          failure: { spirit: -9, face: -6, health: -5 },
          successText: '对面摸不清你的深浅，收起单子客客气气撤了哨，风头也散了一半。',
          failureText: '对方根本不买账，折腾到天亮才放人，心力交瘁不说，场面也折了。',
        },
      },
      {
        id: 'laylow',
        label: '壮士断腕关停灰线渠道 · 彻底避风头',
        hint: '零花费 · 清空全部急单风头但折损腔势',
        reply: '你当场销毁旧线联络簿，主动退让半步。街面上嘲笑你认怂的人不少，但夜里总算能踏踏实实睡个整觉了。',
        effect: {
          face: -5,
          spirit: -2,
          health: 3,
          removeFlags: [...HUSTLE_HEAT_FLAGS],
        },
      },
    ],
  };
}
