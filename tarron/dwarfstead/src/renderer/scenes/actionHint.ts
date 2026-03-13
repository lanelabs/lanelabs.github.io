import type { Game } from '../../sim/Game';
import type { Direction } from '../../sim/types';
import { resolveAction, SmartMode } from '../smartMode';

const ACTION_LABELS: Record<string, string> = {
  dig: 'Dig block', lasso: 'Lasso block', untether: 'Untether rope',
  ladder: 'Build ladder', platform: 'Build platform',
  cement: 'Cement block', shape: 'Carve block',
  sell: 'Sell block', collect: 'Collect crate',
  chip: 'Chip block', blast: 'Shaped charge',
  dismantle_ladder: 'Dismantle ladder', dismantle_platform: 'Dismantle platform',
};

interface HintState {
  pendingHeave: { verticalDir: Direction.Up | Direction.Down } | null;
  pendingHoist: { leftAvailable: boolean; rightAvailable: boolean } | null;
  selfSelect: boolean;
}

export function getActionHintText(game: Game, mode: SmartMode, state: HintState): string {
  if (state.pendingHeave || state.pendingHoist) return 'A/D: Choose side';
  if (game.isRappelling()) return 'W: Climb  S: Descend';
  const resolved = resolveAction(game, mode, state.selfSelect);
  const text = ACTION_LABELS[resolved.label];
  return text ? `Space: ${text}` : '';
}
