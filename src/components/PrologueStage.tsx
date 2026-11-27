import { useMemo } from 'react';
import DialogueStage, { type StageMoodSetter } from './DialogueStage';
import { advancePrologue } from '../game/pujiang';
import { PROLOGUES, prologueStart } from '../game/pujiangPrologue';
import { allOrigins } from '../game/engine';
import type { PujiangRoute } from '../game/pujiangTypes';
import type { GameState } from '../game/types';

type Props = {
 route: PujiangRoute; game: GameState; onChange: (game: GameState) => void;
 onPause: () => void; onMood?: StageMoodSetter; audio: boolean; onAudio: () => void;
};

/** The cold open of one route, played on the dialogue stage before the first chapter. */
export default function PrologueStage({ route, game, onChange, onPause, onMood, audio, onAudio }: Props) {
 const story = PROLOGUES[route];
 // Where to resume is decided when the stage opens; later answers only add lines.
 const startAt = useMemo(() => prologueStart(route, game.flags), []); // eslint-disable-line react-hooks/exhaustive-deps
 const hand = useMemo(() => game.origins.map(id => allOrigins().find(card => card.id === id)!), [game.origins]);
 return <DialogueStage beats={story.script} startAt={startAt} playerName={game.name} hand={hand}
  label={'序章 · ' + story.routeName} variant={route === 'system' ? 'system' : 'default'}
  onChoice={(_, option) => onChange(advancePrologue(game, option))} onEnd={() => onChange(advancePrologue(game, 'finish'))}
  onPause={onPause} onMood={onMood} audio={audio} onAudio={onAudio}/>;
}
