import type { GameState, LifeEvent } from './types';
export function nightOwlLetter(game:GameState):LifeEvent {
 const first=!game.flags.includes('owl_met');
 return {
  id:first?'night-owl-first':'routine-night-owl',category:'rest',tag:'夜猫子来信',
  title:first?'今朝收工了伐':'猫头鹰已读不回',
  text:first?'邮筒上蹲着两只猫头鹰，一只看你，另一只假装没看见。下面压着张纸，写着\n“今朝做不完，明朝公司也不会倒闭。”\n\n你笑出声，才想起来晚饭还没吃。':'你又来找它们。还是那两副表情，底下多了张新纸条，写着\n“上次讲要早点困觉，侬做到了伐？”',
  choices:[
   {id:'sit',label:'手机静音，江边坐十分钟',effect:{health:8,spirit:11,setFlags:['owl_met']},reply:'本来只想坐十分钟，后来坐到江上的船都换了一班。消息没少，你没那么烦了。'},
   {id:'reply',label:'给那个一直没回的人回个消息',effect:{network:6,spirit:7,setFlags:['owl_met']},reply:'你发了句“刚忙完，吃饭了伐”。对面说其实也刚想起来吃饭。两个人约了碗面。'},
   {id:'letter',label:'写张纸条，留给下一个加班的人',effect:{spirit:8,network:5,setFlags:['owl_met','owl_letter']},reply:'你写了末班车走了还能打车，想想太贵，又划掉，换成夜宵公交。'}
  ]
 };
}
