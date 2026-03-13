import type { System } from '../ecs/System';
import type { World } from '../ecs/World';
import type { GameLog } from '../log/GameLog';
import { BlockMaterial, DirectionVec } from '../types';
import { PositionComponent } from '../components/Position';
import { DwarfComponent } from '../components/Dwarf';
import { BlockTypeComponent } from '../components/BlockType';
import { MovableComponent } from '../components/Movable';
import { RubbleComponent } from '../components/Rubble';
import { ChippingComponent } from '../components/Chipping';

const CHIPPING_THRESHOLD = 100;

export class ChippingSystem implements System {
  readonly name = 'chipping';

  update(world: World, log: GameLog): void {
    for (const entity of world.query('dwarf', 'position', 'chipping')) {
      const chip = entity.get<ChippingComponent>('chipping')!;
      const dwarfComp = entity.get<DwarfComponent>('dwarf')!;
      const pos = entity.get<PositionComponent>('position')!;

      // Validate target still exists
      const target = world.getEntity(chip.targetEntityId);
      if (!target) {
        entity.remove('chipping');
        log.add('action', `${dwarfComp.name} stops chipping — the block is gone.`);
        continue;
      }

      // Validate target is still adjacent
      const delta = DirectionVec[chip.direction];
      const tp = target.get<PositionComponent>('position');
      if (!tp || tp.x !== pos.x + delta.x || tp.y !== pos.y + delta.y) {
        entity.remove('chipping');
        log.add('action', `${dwarfComp.name} stops chipping — the block moved.`);
        continue;
      }

      chip.progress++;

      if (chip.progress >= CHIPPING_THRESHOLD) {
        const tx = tp.x;
        const ty = tp.y;

        // Clear any dwarf references to the block
        for (const e of world.query('dwarf')) {
          const d = e.get<DwarfComponent>('dwarf')!;
          if (d.overheadEntityId === target.id) d.overheadEntityId = null;
          if (d.tetheredEntityId === target.id) d.tetheredEntityId = null;
          if (d.carryingEntityId === target.id) d.carryingEntityId = null;
        }

        // Despawn block
        world.despawn(target.id);

        // Remember dwarf's old position
        const oldX = pos.x;
        const oldY = pos.y;

        // Move dwarf to block's old position
        pos.x = tx;
        pos.y = ty;

        // Spawn rubble at dwarf's old position
        const rubble = world.spawn();
        rubble
          .add(new PositionComponent(oldX, oldY))
          .add(new MovableComponent(0))
          .add(new BlockTypeComponent(BlockMaterial.Rubble))
          .add(new RubbleComponent());

        entity.remove('chipping');
        log.add('action', `${dwarfComp.name} finishes chipping through the block.`);
      }
    }
  }
}
