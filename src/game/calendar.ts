export const SHANGHAI_START = 1992;
export const LEGACY_START = 2026;
export const BUND_1992 = '/art/era/bund-1992.webp';
export const SHANGHAI_STATION_1992 = '/art/era/station-1992.webp';

export function calendarYear(state:{age:number;calendar?:number}) {
 return (state.calendar??LEGACY_START)+state.age-18;
}

const eras = [
 [1992,'浦东工地刚围起来，营业厅门口已经排起队。'],
 [1997,'亚洲金融风波。外贸的单子压了又压。'],
 [2001,'中国入世。南京西路新开了恒隆广场。'],
 [2007,'营业厅坐满了人，海外投资基金也开始出现。'],
 [2008,'外面的金融危机传了进来，交易屏一片红绿。'],
 [2010,'上海世博会开幕，黄浦江两岸都在迎客。'],
 [2011,'有人在网上讨论一种叫比特币的东西。'],
 [2015,'年中股市急转，营业厅门口又站满了人。'],
 [2020,'街上冷清了一阵，市场却一直在变。'],
 [2023,'上海车展亮相了新一代兰博基尼。'],
 [2027,'之后的上海，由你的这一局写下去。'],
] as const;

export function cityYearNote(year:number) {
 return eras.find(([at])=>at===year)?.[1];
}
