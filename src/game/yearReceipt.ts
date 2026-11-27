export const YEAR_MOMENTS = ['bed','move','care','family','late','saved','ordinary','penthouse'] as const;
export type YearMoment = (typeof YEAR_MOMENTS)[number];

export interface YearReceipt {
 before: number;
 after: number;
 workIncome: number;
 tableIncome: number;
 stallIncome: number;
 empireIncome?: number;
 rent: number;
 living: number;
 familyPaid: number;
 repayment: number;
 uncovered: number;
 friendAdvance: number;
 care: number;
 body: number;
 spirit: number;
 rentKind: 'shared' | 'lease' | 'plain';
 payroll?: { previous: number; current: number; months: number };
 moment: YearMoment;
 notice: string;
}

const moments: Record<YearMoment, {title: string; line: string; alt: string}> = {
 bed: {title:'先把铺位安顿好',line:'钞票明年接着挣，今夜总归有张踏实床铺。',alt:'一个人在临时住处的下铺收拾帆布包'},
 move: {title:'纸箱再搬一回',line:'老友搭了把手垫上急用，今晚先退回合租屋缓口气。',alt:'两个人在老公房的楼梯上传递搬家纸箱'},
 care: {title:'身体亮灯先歇脚',line:'天大的单子也得往后排，今年先把元气养回来。',alt:'窗旁的病人把药袋和收据收好'},
 family: {title:'公私两本明白账',line:'家里替你兜了指定账单，自己兜里几斤几两还得看个人卡。',alt:'江边公寓的桌上分开放着房卡、账单和存折'},
 late: {title:'末班车坐成老熟客',line:'夜里跨江回家的站牌，闭着眼都数得出还有几站。',alt:'一位下班的人坐在夜班公交车窗边'},
 saved: {title:'账面总算有富余',line:'房租水电一笔笔清完，存折上头一回多出一截活钱。',alt:'旧公房的厨房里，有人把刚买的菜放到桌上'},
 penthouse: {title:'黄浦江末班船过境',line:'顶层落地窗映着对岸灯火，管家把全年账册轻轻搁在吧台。',alt:'从陆家嘴江景顶层望向入夜的外滩'},
 ordinary: {title:'一岁一笔清爽账',line:'大风大浪外头吹，拐进弄堂顺手买好明早的生煎。',alt:'傍晚的小店外，有人拎着布袋往弄堂走'},
};

export function yearMoment(moment: YearMoment) {
 return {...moments[moment], photo:moment==='penthouse'?'/art/heir-story/penthouse.webp':'/art/yearbook/'+moment+'.webp'};
}

export function receiptMoment(receipt: Pick<YearReceipt,'uncovered'|'friendAdvance'|'familyPaid'|'after'|'before'>, recovered: boolean, late: boolean, penthouse = false): YearMoment {
 if (receipt.uncovered) return 'bed';
 if (receipt.friendAdvance) return 'move';
 if (recovered) return 'care';
 if (penthouse) return 'penthouse';
 if (receipt.familyPaid) return 'family';
 if (late) return 'late';
 return receipt.after > receipt.before ? 'saved' : 'ordinary';
}

export function yearTotals(r: YearReceipt) {
 return {
  income: r.workIncome+r.tableIncome+r.stallIncome+(r.empireIncome??0)+r.friendAdvance,
  paid: r.rent+r.living+r.repayment+r.care-r.familyPaid-r.uncovered,
  delta: r.after-r.before,
 };
}

const cashKeys = ['before','after','workIncome','tableIncome','stallIncome','rent','living','familyPaid','repayment','uncovered','friendAdvance','care'] as const;
export function validYearReceipt(value: unknown): value is YearReceipt {
 if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
 const r = value as YearReceipt;
 const finite = (n: number,min: number,max: number) => typeof n==='number' && Number.isFinite(n) && n>=min && n<=max;
 if (cashKeys.some(key=>!finite(r[key],0,1e12)) || (r.empireIncome!==undefined && !finite(r.empireIncome,0,1e12)) || !finite(r.body,-100,100) || !finite(r.spirit,-100,100)) return false;
 if (!YEAR_MOMENTS.includes(r.moment) || !['shared','lease','plain'].includes(r.rentKind) || typeof r.notice!=='string' || r.notice.length>600) return false;
 if (r.payroll!==undefined && (!r.payroll || !finite(r.payroll.previous,0,1e12) || !finite(r.payroll.current,0,1e12)
  || !Number.isInteger(r.payroll.months) || !finite(r.payroll.months,0,12)
  || r.payroll.previous+r.payroll.current!==r.workIncome)) return false;
 const {income,paid,delta} = yearTotals(r);
 return Math.abs(income-paid-delta)<.001;
}

export const yearMoney = (n: number) => '¥'+Math.round(Math.abs(n)).toLocaleString('zh-CN');
export const signedYearMoney = (n: number) => (n<0?'−':n>0?'+':'')+yearMoney(n);
