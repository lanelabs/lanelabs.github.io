import type { Command } from './Command';
import type { Game } from '../Game';
import { BlockMaterial, type CommandResult } from '../types';
import { PositionComponent } from '../components/Position';
import { DwarfComponent } from '../components/Dwarf';
import { ClimbableComponent } from '../components/Climbable';
import { isRappelling } from '../helpers';

/** Build a ladder at the dwarf's current position (Ctrl+Space). */
export class BuildLadderAtFeetCommand implements Command {
  readonly name = 'build_ladder_at_feet';

  execute(game: Game): CommandResult {
    if (isRappelling(game)) return { success: false, message: 'Cannot build while on a rope.' };
    const dwarf = game.getMainDwarf();
    if (!dwarf) return { success: false, message: 'No main dwarf found.' };

    const pos = dwarf.get<PositionComponent>('position')!;
    const dwarfComp = dwarf.get<DwarfComponent>('dwarf')!;

    if (game.hasLadder({ x: pos.x, y: pos.y })) {
      return { success: false, message: 'Already a ladder here.' };
    }

    // Platform at feet → replace with ladder for free (platform supplies material)
    const platforms = game.world.query('position', 'climbable').filter((e) => {
      const p = e.get<PositionComponent>('position')!;
      const c = e.get<ClimbableComponent>('climbable')!;
      return p.x === pos.x && p.y === pos.y && c.type === 'platform';
    });
    if (platforms.length === 0) {
      if (game.supplies < 1) {
        return { success: false, message: `Not enough supplies. Need 1, have ${game.supplies}.` };
      }
      game.supplies -= 1;
    } else {
      for (const e of platforms) game.world.despawn(e.id);
    }

    // Determine anchor direction based on existing ladder context
    const hasLadderAbove = game.hasLadder({ x: pos.x, y: pos.y - 1 });
    const hasLadderBelow = game.hasLadder({ x: pos.x, y: pos.y + 1 });
    const solidBelow = pos.y + 1 < game.terrain.height && game.getBlock({ x: pos.x, y: pos.y + 1 }) !== BlockMaterial.Air;
    let anchorEnd: 'top' | 'bottom' | null = null;
    if (hasLadderAbove) anchorEnd = 'top';
    else if (hasLadderBelow || solidBelow) anchorEnd = 'bottom';

    const ladder = game.world.spawn();
    ladder
      .add(new PositionComponent(pos.x, pos.y))
      .add(new ClimbableComponent('ladder', anchorEnd));
    if (anchorEnd) game.unifyLadderColumn(pos.x, pos.y, anchorEnd);

    if (platforms.length > 0) {
      game.log.add('action', `${dwarfComp.name} converts the platform into a ladder.`);
      return { success: true, message: 'Platform converted to ladder.' };
    }
    game.log.add('action', `${dwarfComp.name} extends the ladder underfoot.`);
    return { success: true, message: 'Built ladder at feet.' };
  }
}
