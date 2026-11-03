import type { CSSProperties } from 'react';
export type IconName = 'dice'|'heart'|'case'|'coffee'|'book'|'home'|'people'|'arrow'|'sound'|'mute'|'sun'|'moon'|'map'|'spark'|'close'|'share'|'save'|'download'|'leaf'|'clock'|'play'|'check'|'chevron'|'bolt'|'menu'|'eye';
const paths:Record<IconName,React.ReactNode>={
dice:<><rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="8" cy="8" r=".7"/><circle cx="16" cy="8" r=".7"/><circle cx="12" cy="12" r=".7"/><circle cx="8" cy="16" r=".7"/><circle cx="16" cy="16" r=".7"/></>,
heart:<path d="M20 5.5a5 5 0 0 0-8 1 5 5 0 0 0-8-1c-3.3 3.7.4 8 8 14 7.6-6 11.3-10.3 8-14Z"/>,
case:<><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V4h8v3M3 12c6 4 12 4 18 0M10 12h4v4h-4z"/></>,
coffee:<><path d="M5 8h12v8a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4zM17 9h2a3 3 0 0 1 0 6h-2M8 3v2M13 2v3"/></>,
book:<><path d="M12 5v16M3 4c4-1 6 0 9 2 3-2 5-3 9-2v15c-4-1-6 0-9 2-3-2-5-3-9-2z"/></>,
home:<><path d="m3 11 9-8 9 8M5 10v11h14V10M9 21v-7h6v7"/></>,
people:<><circle cx="9" cy="7" r="3"/><path d="M2 21v-3a7 7 0 0 1 14 0v3M17 4a3 3 0 0 1 0 6M18 14a5 5 0 0 1 4 5v2"/></>,
arrow:<path d="M4 12h16m-6-6 6 6-6 6"/>,
sound:<><path d="m11 4-5 4H2v8h4l5 4zM15 8a6 6 0 0 1 0 8M18 4a11 11 0 0 1 0 16"/></>,
mute:<><path d="m11 4-5 4H2v8h4l5 4zM16 9l6 6M22 9l-6 6"/></>,
sun:<><circle cx="12" cy="12" r="4"/><path d="M12 1v2M12 21v2M1 12h2M21 12h2M4 4l2 2M18 18l2 2M4 20l2-2M18 6l2-2"/></>,
moon:<path d="M20 15A9 9 0 0 1 9 4 9 9 0 1 0 20 15Z"/>,
map:<><path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2zM9 3v16M15 5v16"/></>,
spark:<><path d="m12 2 2.8 7.2L22 12l-7.2 2.8L12 22l-2.8-7.2L2 12l7.2-2.8z"/></>,
close:<path d="m6 6 12 12M18 6 6 18"/>,
share:<><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m9 10 6-3M9 14l6 3"/></>,
save:<><path d="M4 3h13l4 4v14H3V3zM7 3v6h10V3M7 21v-8h10v8"/></>,
download:<><path d="M12 2v14m-5-5 5 5 5-5M3 17v5h18v-5"/></>,
leaf:<><path d="M20 3c-1 8-1 16-9 16a7 7 0 0 1-7-7C4 4 12 5 20 3ZM3 22 16 9"/></>,
clock:<><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/></>,
play:<path d="m8 4 12 8-12 8z"/>,
check:<path d="m4 12 5 5L20 6"/>,
chevron:<path d="m9 5 7 7-7 7"/>,
bolt:<path d="m13 2-9 12h7l-1 8 10-13h-7z"/>,
menu:<path d="M3 6h18M3 12h18M3 18h18"/>,
eye:<><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>
};
export default function Icon({name,size=20,style,className}:{name:IconName;size?:number;style?:CSSProperties;className?:string}){return <svg className={className} style={style} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;}

