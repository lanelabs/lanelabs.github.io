import { BlockMaterial, Direction, CreatureType } from './types';
import type { Vec2 } from './types';
import type { TerrainGrid } from './terrain/TerrainGenerator';
import type { World } from './ecs/World';
import { PositionComponent } from './components/Position';
import { DwarfComponent } from './components/Dwarf';
import { HealthComponent } from './components/Health';
import { CreatureComponent } from './components/Creature';
import { CompanionTaskComponent } from './components/CompanionTask';
import { OxygenComponent } from './components/Oxygen';
import type { SeededRNG } from './rng';

const DWARF_NAMES = ['Urist', 'Bomrek', 'Kadol', 'Olin', 'Doren', 'Rimtar', 'Zuglar', 'Melbil', 'Tosid', 'Ingiz'];

/** Find the first air→solid transition for spawn Y at a given X column. */
export function findSpawnY(terrain: TerrainGrid, spawnX: number): number {
  for (let y = 0; y < terrain.height; y++) {
    if (terrain.blocks[y][spawnX] !== BlockMaterial.Air) return y - 1;
  }
  return 0;
}

/** Spawn the main dwarf and return the spawn position. */
export function spawnMainDwarf(world: World, spawnX: number, spawnY: number): void {
  const mainDwarf = world.spawn();
  const mainDwarfComp = new DwarfComponent(DWARF_NAMES[0], 'miner', true);
  mainDwarfComp.facingDirection = Direction.Down;
  mainDwarf
    .add(new PositionComponent(spawnX, spawnY))
    .add(mainDwarfComp)
    .add(new HealthComponent(10, 10))
    .add(new OxygenComponent(10));
}

/** Spawn companion dwarves around the main dwarf. */
export function spawnCompanions(
  world: World, spawnX: number, spawnY: number,
  count: number, trail: Vec2[],
): void {
  for (let i = 0; i < count; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const dist = Math.floor(i / 2) + 1;
    const cx = spawnX + side * dist;
    const name = DWARF_NAMES[(i + 1) % DWARF_NAMES.length];
    const companion = world.spawn();
    companion
      .add(new PositionComponent(cx, spawnY))
      .add(new DwarfComponent(name, i === 0 ? 'porter' : 'miner', false))
      .add(new HealthComponent(8, 8))
      .add(new OxygenComponent(10))
      .add(new CompanionTaskComponent('idle'));
    trail.push({ x: cx, y: spawnY });
  }
}

/** Spawn creatures inside lair rooms. */
export function spawnCreatures(world: World, terrain: TerrainGrid, rng: SeededRNG): void {
  for (const room of terrain.rooms) {
    if (room.type === 'lair') {
      const cx = room.x + Math.floor(room.width / 2);
      const cy = room.y + Math.floor(room.height / 2);
      const isBeetle = rng.next() > 0.4;
      const creature = world.spawn();
      creature
        .add(new PositionComponent(cx, cy))
        .add(new CreatureComponent(
          isBeetle ? 'Cave Beetle' : 'Rock Crab',
          isBeetle ? CreatureType.CaveBeetle : CreatureType.RockCrab,
          isBeetle ? 6 : 10,
          isBeetle ? 6 : 10,
          isBeetle ? 1 : 2,
        ))
        .add(new HealthComponent(isBeetle ? 6 : 10, isBeetle ? 6 : 10));
    }
  }
}
