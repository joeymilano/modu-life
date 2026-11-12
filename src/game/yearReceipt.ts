export const YEAR_MOMENTS = ['bed','move','care','family','late','saved','ordinary','penthouse'] as const;
export type YearMoment = (typeof YEAR_MOMENTS)[number];

export interface YearReceipt {
 before: number;
 after: number;
 workIncome: number;
 tableIncome: number;
 stallIncome: number;
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
 bed: {title:'先找个地方落脚',line:'工钱还得挣，今晚先有张床。',alt:'一个人在临时住处的下铺收拾帆布包'},
 move: {title:'纸箱还得再搬一趟',line:'朋友垫了一笔，今晚先搬回合租房。',alt:'两个人在老公房的楼梯上传递搬家纸箱'},
 care: {title:'先歇几天再说',line:'这一年的活收了尾，腾点时间给自己。',alt:'窗旁的病人把药袋和收据收好'},
 family: {title:'两本账分开记',line:'家里代付了一部分。手上有多少，还是查自己的卡。',alt:'江边公寓的桌上分开放着房卡、账单和存折'},
 late: {title:'坐最后一班回家',line:'晚上回来的路，你已经走熟了。',alt:'一位下班的人坐在夜班公交车窗边'},
 saved: {title:'这回手上宽一点',line:'账都付了，卡里还多留了一点。',alt:'旧公房的厨房里，有人把刚买的菜放到桌上'},
 penthouse: {title:'最后一班船过去了',line:'窗边那盏灯还亮着，物业把今年的账送了上来。',alt:'从陆家嘴江景顶层望向入夜的外滩'},
 ordinary: {title:'把今年的账结了',line:'回家那段路，顺便去买明天的早饭。',alt:'傍晚的小店外，有人拎着布袋往弄堂走'},
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
  income: r.workIncome+r.tableIncome+r.stallIncome+r.friendAdvance,
  paid: r.rent+r.living+r.repayment+r.care-r.familyPaid-r.uncovered,
  delta: r.after-r.before,
 };
}

const cashKeys = ['before','after','workIncome','tableIncome','stallIncome','rent','living','familyPaid','repayment','uncovered','friendAdvance','care'] as const;
export function validYearReceipt(value: unknown): value is YearReceipt {
 if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
 const r = value as YearReceipt;
 const finite = (n: number,min: number,max: number) => typeof n==='number' && Number.isFinite(n) && n>=min && n<=max;
 if (cashKeys.some(key=>!finite(r[key],0,1e12)) || !finite(r.body,-100,100) || !finite(r.spirit,-100,100)) return false;
 if (!YEAR_MOMENTS.includes(r.moment) || !['shared','lease','plain'].includes(r.rentKind) || typeof r.notice!=='string' || r.notice.length>600) return false;
 if (r.payroll!==undefined && (!r.payroll || !finite(r.payroll.previous,0,1e12) || !finite(r.payroll.current,0,1e12)
  || !Number.isInteger(r.payroll.months) || !finite(r.payroll.months,0,12)
  || r.payroll.previous+r.payroll.current!==r.workIncome)) return false;
 const {income,paid,delta} = yearTotals(r);
 return Math.abs(income-paid-delta)<.001;
}

export const yearMoney = (n: number) => '¥'+Math.round(Math.abs(n)).toLocaleString('zh-CN');
export const signedYearMoney = (n: number) => (n<0?'−':n>0?'+':'')+yearMoney(n);
