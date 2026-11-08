export const BUND_BANK = {
 westEnd: -15.55,
 westQuay: 9.65,
 eastQuay: 17.45,
 eastEnd: 25.85,
 length: 24.3,
} as const;

export const BUND_LANDMARKS = [
 {id:'peace-hotel', x:3.7, z:-6.7, width:3.4, depth:6.2, height:4.4},
 {id:'customs-house', x:3.7, z:6.0, width:3.4, depth:6.0, height:4.05},
] as const;

export const PUDONG_LANDMARKS = [
 {id:'oriental-pearl', height:12.2, width:3.2, depth:3.2,
  east:[19.75,-7.6], local:[2.6,-5.8], eastTurn:0, localTurn:0},
 {id:'jinmao', height:10.5, width:2.75, depth:2.75,
  east:[22.9,-2.2], local:[-1.2,-8.5], eastTurn:0, localTurn:0},
 {id:'financial-center', height:11.5, width:3.0, depth:2.3,
  east:[22.8,2], local:[8.2,-3.9], eastTurn:-.48, localTurn:.32},
 {id:'shanghai-tower', height:13.2, width:2.8, depth:2.8,
  east:[21.8,8.1], local:[6,-7], eastTurn:.25, localTurn:0},
] as const;

export const BUND_LABEL_OFFSETS: Partial<Record<string,readonly [number,number]>> = {
 'bund-river':[-16,15],
 'bund-photo':[6,-6],
 'bund-ferry':[21,14],
 'bund-date':[-7,-12],
 'night-owl':[16,12],
};
