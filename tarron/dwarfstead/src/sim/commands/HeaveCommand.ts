import type { Command } from './Command';
import type { Game } from '../Game';
import { Direction, type CommandResult } from '../types';
import { PositionComponent } from '../components/Position';
import { DwarfComponent } from '../components/Dwarf';
import { findMovableAt, hasLooseBlockOnTop, canDisplaceTo, isRappelling } from '../helpers';

/**
 * Heave: displace a block directly above or below to the side.
 * - Ctrl+Down: heave block below to lateralDir, dwarf drops into its spot.
 *   Special case: if block is on a platform, push it straight down through the platform.
 * - Ctrl+Up: heave block above to lateralDir, dwarf stays put.
 */
export class HeaveCommand implements Command {
  readonly name = 'heave';

  constructor(
    private verticalDir: Direction.Up | Direction.Down,
    private lateralDir: Direction.Left | Direction.Right,
  ) {}

  execute(game: Game): CommandResult {
    if (isRappelling(game)) return { success: false, message: 'Cannot heave while on a rope.' };
    const dwarf = game.getMainDwarf();
    if (!dwarf) return { success: false, message: 'No main dwarf found.' };

    const pos = dwarf.get<PositionComponent>('position')!;
    const dwarfComp = dwarf.get<DwarfComponent>('dwarf')!;

    const blockX = pos.x;
    const blockY = this.verticalDir === Direction.Down ? pos.y + 1 : pos.y - 1;
    const block = findMovableAt(game, blockX, blockY);
    if (!block) return { success: false, message: 'Nothing to heave there.' };

    // Reject if block has a loose block on top ("too heavy")
    if (hasLooseBlockOnTop(game, blockX, blockY)) {
      return { success: false, message: 'Too heavy — another block is stacked on top.' };
    }

    // Drop tether rope
    if (dwarfComp.tetheredEntityId !== null) {
      dwarfComp.tetheredEntityId = null;
      game.log.add('action', `${dwarfComp.name} drops the rope.`);
    }

    const blockPos = block.get<PositionComponent>('position')!;

    // --- Ctrl+Down special case: block resting on a platform → push through ---
    // The platform is at blockY+1 (supports the block from below in gravity terms).
    if (this.verticalDir === Direction.Down && game.hasPlatform({ x: blockX, y: blockY + 1 })) {
      const belowPlatformY = blockY + 1;
      if (!canDisplaceTo(game, blockX, belowPlatformY)) {
        return { success: false, message: 'No room below the platform.' };
      }
      blockPos.y = belowPlatformY;
      // Dwarf drops into block's old spot (on the platform)
      this.moveDwarf(game, pos, dwarfComp, blockX, blockY);
      game.log.add('action', `${dwarfComp.name} shoves a block through the platform.`);
      return { success: true, message: 'Shoved block through platform.' };
    }

    // --- Normal heave: displace block to lateralDir ---
    const lateralDelta = this.lateralDir === Direction.Left ? -1 : 1;
    const destX = blockX + lateralDelta;
    if (!canDisplaceTo(game, destX, blockY)) {
      return { success: false, message: `No room to heave — blocked ${this.lateralDir}.` };
    }

    blockPos.x = destX;

    if (this.verticalDir === Direction.Down) {
      // Dwarf drops into the block's old spot
      this.moveDwarf(game, pos, dwarfComp, blockX, blockY);
    }
    // Ctrl+Up: dwarf stays put

    const vLabel = this.verticalDir === Direction.Up ? 'above' : 'below';
    game.log.add('action', `${dwarfComp.name} heaves a block ${vLabel} to the ${this.lateralDir}.`);
    return { success: true, message: `Heaved block ${vLabel} ${this.lateralDir}.` };
  }

  /** Move dwarf, update trail, sync carried item. */
  private moveDwarf(
    game: Game, pos: PositionComponent, dwarfComp: DwarfComponent,
    newX: number, newY: number,
  ): void {
    const oldX = pos.x;
    const oldY = pos.y;
    pos.x = newX;
    pos.y = newY;

    game.trail.unshift({ x: oldX, y: oldY });
    if (game.trail.length > 20) game.trail.length = 20;

    if (dwarfComp.carryingEntityId !== null) {
      const carried = game.world.getEntity(dwarfComp.carryingEntityId);
      if (carried) {
        const cp = carried.get<PositionComponent>('position')!;
        cp.x = newX;
        cp.y = newY;
      } else {
        dwarfComp.carryingEntityId = null;
      }
    }
  }
}
