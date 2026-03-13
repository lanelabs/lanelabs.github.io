import type { Command } from './Command';
import type { Game } from '../Game';
import { DirectionVec, type CommandResult } from '../types';
import { PositionComponent } from '../components/Position';
import { DwarfComponent } from '../components/Dwarf';
import { SupplyCrateComponent } from '../components/SupplyCrate';
import { isRappelling } from '../helpers';

export class CollectCrateCommand implements Command {
  readonly name = 'collectCrate';

  constructor(private targetX?: number, private targetY?: number) {}

  execute(game: Game): CommandResult {
    if (isRappelling(game)) return { success: false, message: 'Cannot collect while on a rope.' };
    const dwarf = game.getMainDwarf();
    if (!dwarf) return { success: false, message: 'No main dwarf found.' };

    const dPos = dwarf.get<PositionComponent>('position')!;
    const dComp = dwarf.get<DwarfComponent>('dwarf')!;

    let tx = this.targetX;
    let ty = this.targetY;
    if (tx === undefined || ty === undefined) {
      const delta = DirectionVec[dComp.facingDirection];
      tx = dPos.x + delta.x;
      ty = dPos.y + delta.y;
    }

    // Find supply crate entity at target
    const crates = game.world.query('position', 'supplyCrate');
    const crate = crates.find((e) => {
      const p = e.get<PositionComponent>('position')!;
      return p.x === tx && p.y === ty;
    });

    if (!crate) {
      return { success: false, message: 'No supply crate there.' };
    }

    const sc = crate.get<SupplyCrateComponent>('supplyCrate')!;
    game.supplies += sc.suppliesInside;
    game.world.despawn(crate.id);

    game.log.add('action', `Collected ${sc.suppliesInside} supply from the crate.`);
    return { success: true, message: `+${sc.suppliesInside} supply.` };
  }
}
