import type { Command } from './Command';
import type { Game } from '../Game';
import { Direction, type CommandResult } from '../types';
import { PositionComponent } from '../components/Position';
import { DwarfComponent } from '../components/Dwarf';
import { findMovableAt, findHoistableBlock, canDisplaceTo, hasLooseBlockOnTop, isRappelling } from '../helpers';

/**
 * Hoist: pick up a block overhead, or heave-off an already-held overhead block.
 *
 * Pickup mode (overheadEntityId === null):
 *   Places the nearest hoistable block at (dwarfX, dwarfY-1).
 *
 * Heave-off mode (overheadEntityId !== null) — always takes priority:
 *   Displaces overhead block laterally at the overhead level (dwarfY-1).
 *   Supports ledge placement: block can land on top of an adjacent solid block.
 */
export class HoistCommand implements Command {
  readonly name = 'hoist';

  constructor(private sourceDir?: Direction.Left | Direction.Right) {}

  execute(game: Game): CommandResult {
    if (isRappelling(game)) return { success: false, message: 'Cannot hoist while on a rope.' };
    const dwarf = game.getMainDwarf();
    if (!dwarf) return { success: false, message: 'No main dwarf found.' };

    const pos = dwarf.get<PositionComponent>('position')!;
    const dwarfComp = dwarf.get<DwarfComponent>('dwarf')!;

    // --- Heave-off mode: overhead block already held ---
    if (dwarfComp.overheadEntityId !== null) {
      return this.heaveOff(game, pos, dwarfComp);
    }

    // --- Pickup mode ---
    return this.pickup(game, pos, dwarfComp);
  }

  private pickup(game: Game, pos: PositionComponent, dwarfComp: DwarfComponent): CommandResult {
    // Can't hoist while carrying
    if (dwarfComp.carryingEntityId !== null) {
      return { success: false, message: 'Drop what you are carrying first.' };
    }

    // Adopt: block already sitting on dwarf's head but not linked
    const aboveBlock = findMovableAt(game, pos.x, pos.y - 1);
    if (aboveBlock) {
      if (aboveBlock.has('rubble')) {
        return { success: false, message: 'Rubble is too loose to hoist.' };
      }
      if (hasLooseBlockOnTop(game, pos.x, pos.y - 1)) {
        return { success: false, message: 'Too heavy — another block is stacked on top.' };
      }
      if (dwarfComp.tetheredEntityId !== null) {
        dwarfComp.tetheredEntityId = null;
        game.log.add('action', `${dwarfComp.name} drops the rope.`);
      }
      dwarfComp.overheadEntityId = aboveBlock.id;
      game.log.add('action', `${dwarfComp.name} grabs the block overhead.`);
      return { success: true, message: 'Adopted overhead block.' };
    }

    // Headroom check
    if (!canDisplaceTo(game, pos.x, pos.y - 1)) {
      return { success: false, message: 'No room overhead to hoist.' };
    }

    // Find hoistable block
    if (this.sourceDir) {
      // Directed pickup (from arrow-prompt resolution)
      const sx = this.sourceDir === Direction.Left ? pos.x - 1 : pos.x + 1;
      const block = findMovableAt(game, sx, pos.y);
      if (!block) return { success: false, message: 'No block there to hoist.' };
      if (hasLooseBlockOnTop(game, sx, pos.y)) {
        return { success: false, message: 'Too heavy — another block is stacked on top.' };
      }
      return this.doPickup(game, pos, dwarfComp, block);
    }

    const candidate = findHoistableBlock(game, pos.x, pos.y, dwarfComp.facingDirection);
    if (candidate === null) {
      return { success: false, message: 'No block nearby to hoist.' };
    }
    if (candidate === 'both') {
      // Caller (renderer) should have caught this and shown arrows.
      // In CLI context, just pick facing side or right.
      const side = dwarfComp.facingDirection === Direction.Left ? Direction.Left : Direction.Right;
      const sx = side === Direction.Left ? pos.x - 1 : pos.x + 1;
      const block = findMovableAt(game, sx, pos.y);
      if (!block) return { success: false, message: 'No block there to hoist.' };
      return this.doPickup(game, pos, dwarfComp, block);
    }

    return this.doPickup(game, pos, dwarfComp, candidate.block);
  }

  private doPickup(
    game: Game, pos: PositionComponent, dwarfComp: DwarfComponent,
    block: ReturnType<typeof findMovableAt>,
  ): CommandResult {
    if (!block) return { success: false, message: 'No block to hoist.' };

    // Drop tether if active
    if (dwarfComp.tetheredEntityId !== null) {
      dwarfComp.tetheredEntityId = null;
      game.log.add('action', `${dwarfComp.name} drops the rope.`);
    }

    const bp = block.get<PositionComponent>('position')!;
    bp.x = pos.x;
    bp.y = pos.y - 1;
    dwarfComp.overheadEntityId = block.id;

    game.log.add('action', `${dwarfComp.name} hoists a block overhead.`);
    return { success: true, message: 'Hoisted block overhead.' };
  }

  private heaveOff(game: Game, pos: PositionComponent, dwarfComp: DwarfComponent): CommandResult {
    const block = game.world.getEntity(dwarfComp.overheadEntityId!);
    if (!block) {
      dwarfComp.overheadEntityId = null;
      return { success: false, message: 'Overhead block vanished.' };
    }

    const overheadY = pos.y - 1;
    const facingDir = dwarfComp.facingDirection;
    const lateralDir: Direction.Left | Direction.Right =
      facingDir === Direction.Left ? Direction.Left
      : facingDir === Direction.Right ? Direction.Right
      : this.sourceDir ?? Direction.Right;
    const lateralDelta = lateralDir === Direction.Left ? -1 : 1;
    const destX = pos.x + lateralDelta;

    // Check if we can place at same overhead level
    if (canDisplaceTo(game, destX, overheadY)) {
      const bp = block.get<PositionComponent>('position')!;
      bp.x = destX;
      bp.y = overheadY;
      dwarfComp.overheadEntityId = null;
      game.log.add('action', `${dwarfComp.name} heaves the overhead block ${lateralDir}.`);
      return { success: true, message: `Heaved overhead block ${lateralDir}.` };
    }

    // Ledge placement: block lands on top of an adjacent solid neighbor
    // destX at dwarfY is solid, but destX at overheadY might be free via a different check
    // Actually, ledge means: (destX, overheadY-1) is clear and there's support at (destX, overheadY)
    // The block rests ON the thing at overheadY (which is a solid block/terrain)
    const ledgeY = overheadY - 1;
    if (canDisplaceTo(game, destX, ledgeY)) {
      const bp = block.get<PositionComponent>('position')!;
      bp.x = destX;
      bp.y = ledgeY;
      dwarfComp.overheadEntityId = null;
      game.log.add('action', `${dwarfComp.name} places the overhead block on a ledge ${lateralDir}.`);
      return { success: true, message: `Placed overhead block on ledge ${lateralDir}.` };
    }

    return { success: false, message: `No room to heave overhead block ${lateralDir}.` };
  }
}
