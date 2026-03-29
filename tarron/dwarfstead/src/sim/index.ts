// ECS
export { Entity, resetEntityIds } from './ecs/Entity';
export type { Component } from './ecs/Component';
export { World } from './ecs/World';
export type { System } from './ecs/System';

// Types
export {
  Direction,
  DirectionVec,
  BlockMaterial,
  CreatureType,
} from './types';
export type { Vec2, GameConfig, CommandResult, HiddenRoom } from './types';

// RNG
export { SeededRNG } from './rng';

// Log
export { GameLog } from './log/GameLog';
export type { LogEntry, LogCategory } from './log/GameLog';

// Components
export { PositionComponent } from './components/Position';
export { DwarfComponent } from './components/Dwarf';
export { HealthComponent } from './components/Health';
export { BlockTypeComponent } from './components/BlockType';
export { MovableComponent } from './components/Movable';
export { ClimbableComponent } from './components/Climbable';
export { CreatureComponent } from './components/Creature';
export { CompanionTaskComponent } from './components/CompanionTask';
export { SupplyCrateComponent } from './components/SupplyCrate';
export { RopeComponent } from './components/Rope';

// Terrain
export { TerrainGenerator } from './terrain/TerrainGenerator';
export { BLOCK_INFO } from './terrain/BlockTypes';

// Commands
export type { Command } from './commands/Command';
export { MoveCommand } from './commands/MoveCommand';
export { DigCommand } from './commands/DigCommand';
export { PushCommand } from './commands/PushCommand';
export { ShoveCommand } from './commands/ShoveCommand';
export { CarryCommand } from './commands/CarryCommand';
export { DropCommand } from './commands/DropCommand';
export { BuildLadderCommand } from './commands/BuildLadderCommand';
export { AttackCommand } from './commands/AttackCommand';
export { DispatchCommand } from './commands/DispatchCommand';
export { ReturnCommand } from './commands/ReturnCommand';
export { WaitCommand } from './commands/WaitCommand';
export { TetherCommand } from './commands/TetherCommand';
export { HoistCommand } from './commands/HoistCommand';
export { CementCommand } from './commands/CementCommand';
export { SellBlockCommand } from './commands/SellBlockCommand';
export { CollectCrateCommand } from './commands/CollectCrateCommand';

// Systems
export { GravitySystem } from './systems/GravitySystem';
export { MovementSystem } from './systems/MovementSystem';
export { CompanionSystem } from './systems/CompanionSystem';
export { CreatureSystem } from './systems/CreatureSystem';

// Game
export { Game } from './Game';
