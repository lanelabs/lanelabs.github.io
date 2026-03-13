import { Game } from '../sim/Game';
import type { GameConfig } from '../sim/types';
import type { SaveData } from '../sim/save';

/**
 * SimulationBridge connects the Phaser update loop to the pure-TS simulation.
 * Accumulates delta time and steps the sim at a fixed tick rate.
 */
export class SimulationBridge {
  readonly game: Game;
  private accumulator = 0;
  private msPerTick: number;

  constructor(config: GameConfig, msPerTick = 200) {
    this.game = new Game(config);
    this.msPerTick = msPerTick;
  }

  init(): void {
    this.game.init();
  }

  /** Restore a bridge from save data (skips init/terrain generation). */
  static fromSaveData(data: SaveData, msPerTick = 200): SimulationBridge {
    const bridge = Object.create(SimulationBridge.prototype) as SimulationBridge;
    Object.assign(bridge, {
      game: Game.fromSaveData(data),
      accumulator: 0,
      msPerTick,
    });
    return bridge;
  }

  /** Call from Phaser's update(). Returns number of ticks advanced. */
  update(deltaMs: number): number {
    this.accumulator += deltaMs;
    let ticks = 0;
    while (this.accumulator >= this.msPerTick) {
      this.accumulator -= this.msPerTick;
      ticks++;
    }
    return ticks;
  }
}
