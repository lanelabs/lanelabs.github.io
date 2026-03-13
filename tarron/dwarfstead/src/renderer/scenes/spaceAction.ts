import type { Game } from '../../sim/Game';
import { Direction } from '../../sim/types';
import { DwarfComponent } from '../../sim/components/Dwarf';
import { MoveCommand } from '../../sim/commands/MoveCommand';
import { resolveAction, SmartMode } from '../smartMode';
import type { ResolvedAction } from '../smartMode';
import type { CommandResult } from '../../sim/types';

export interface SpaceResult {
  result: CommandResult;
  resolved: ResolvedAction;
}

export function handleSpaceAction(
  game: Game, mode: SmartMode, selfSelect: boolean,
): SpaceResult {
  const mainDwarf = game.getMainDwarf();
  const resolved = resolveAction(game, mode, selfSelect);
  const result = game.execute(resolved.command);

  if (!result.success && result.message) {
    game.log.add('action', result.message);
  }

  // Build mode auto-move
  if (mode === SmartMode.Build && mainDwarf && !selfSelect) {
    const dComp = mainDwarf.get<DwarfComponent>('dwarf')!;
    const facing = dComp.facingDirection;
    const isDism = resolved.label === 'dismantle_ladder' || resolved.label === 'dismantle_platform';
    if (result.success) {
      if ((resolved.label === 'ladder' || resolved.label === 'platform') && facing !== Direction.Down) {
        game.execute(new MoveCommand(facing));
      } else if (isDism) {
        // Only auto-move for horizontal dismantles (step away from gap).
        // Vertical dismantles are on ladder columns where retraction handles positioning.
        const isHorizontal = facing === Direction.Left || facing === Direction.Right;
        if (isHorizontal) {
          const opp = { [Direction.Left]: Direction.Right, [Direction.Right]: Direction.Left,
                        [Direction.Up]: Direction.Down, [Direction.Down]: Direction.Up };
          game.execute(new MoveCommand(opp[facing]));
          dComp.facingDirection = facing;
        }
      }
    }
  }

  return { result, resolved };
}
