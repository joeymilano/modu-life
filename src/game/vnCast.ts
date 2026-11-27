/** People and places the dialogue stage can put on screen.
 * The cut-outs and empty plates are built from the story stills by scripts/build_vn_art.py. */
export interface VNPose { file: string; zoom: number }

export interface VNPerson { name: string; role: string; color: string; poses: Record<string, VNPose> }

const pose = (file: string, zoom = 1): VNPose => ({ file, zoom });

export const VN_CAST: Record<string, VNPerson> = {
 zheng: { name: '赵正', role: '仓里排夜班的领班', color: '#c0553f', poses: { default: pose('zheng-1', .88) } },
 wu: { name: '吴师傅', role: '带你上第一班的老工友', color: '#a98a5b', poses: { default: pose('wu-1', 1.45), paper: pose('wu-2', 1.45) } },
 xu: { name: '许舟', role: '自己接单跑运输的司机', color: '#c99657', poses: { default: pose('xu-1', 1.4), night: pose('xu-2', 1.34), smile: pose('xu-3', 1.5) } },
 lu: { name: '陆嘉', role: '在江边小礼堂唱歌的乐手', color: '#c47068', poses: { default: pose('lu-1', 1.45), smile: pose('lu-2', 1.34), mic: pose('lu-3', 1.32) } },
 mao: { name: '毛小毛', role: '跟你合租的人', color: '#c9a86a', poses: { default: pose('mao-1', 1.4), talk: pose('mao-2', 1.34) } },
 fei: { name: '费启', role: '隔壁场子的老板', color: '#b98a80', poses: { default: pose('fei-1', 1.38), stand: pose('fei-2', 1.45) } },
 gu: { name: '顾桥', role: '管这场演出的主理人', color: '#c59a6c', poses: { default: pose('gu-1', .74), seat: pose('gu-2', 1.18) } },
 wen: { name: '周闻', role: '修设备的工程师', color: '#86b3ab', poses: { default: pose('wen-1', 1.32), glasses: pose('wen-2', 1.1) } },
 zhouxiao: { name: '周骁', role: '你表哥', color: '#c96b5a', poses: { default: pose('zhouxiao-1', 1.22) } },
 shen: { name: '沈经理', role: '替你家做样灯的人', color: '#d3b48a', poses: { default: pose('shen-1', 1.45), read: pose('shen-2', 1.4) } },
 mother: { name: '母亲', role: '周家的儿媳妇', color: '#d9a08e', poses: { default: pose('mother-2', 1.45), folder: pose('mother-3', 1.45) } },
 father: { name: '父亲', role: '仓配公司创办人', color: '#b9c4bd', poses: { default: pose('father-1', 1.4), point: pose('father-2', 1.22) } },

 /** Heard but never drawn: they speak from off stage. */
 yu: { name: '余老师', role: '街区夜校的老师', color: '#a9c4bc', poses: { default: pose('yu-1', 1.42) } },
 sun: { name: '老孙', role: '跑末班车的司机', color: '#c9a06a', poses: {} },
 tao: { name: '陶厂长', role: '来验样的工厂采购', color: '#d6a28f', poses: {} },
 buyer: { name: '采购主任', role: '锦江饭店管进货的人', color: '#d8b98c', poses: {} },
};

/** The relationship book files 沈经理 under `boss`; the stage knows her as `shen`. */
VN_CAST.boss = VN_CAST.shen;
VN_CAST['pj-wen'] = VN_CAST.wen;
VN_CAST['pj-xu'] = VN_CAST.xu;

/** Plate ids. Each is `public/art/stages/<id>.webp`. */
export const VN_STAGES = [
 'station', 'bund', 'hall', 'hall-dark', 'club', 'hotel-porch', 'banquet', 'banquet-gu', 'skyline', 'warehouse-yard',
 'warehouse-gate', 'gatehouse', 'warehouse-inside', 'rain-dock', 'night-dock', 'workbench', 'expo', 'ticket-office',
] as const;

export const spriteArt = (who: string, poseName = 'default') => {
 const poses = VN_CAST[who]?.poses;
 return '/art/sprites/' + (poses?.[poseName] ?? poses?.default)?.file + '.webp';
};
export const stageArt = (id: string) => '/art/stages/' + id + '.webp';
