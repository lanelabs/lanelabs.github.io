import type { Game } from '../../sim/Game';
import { WaitCommand } from '../../sim/commands/WaitCommand';
import type { AlertOverlay } from '../ui/AlertOverlay';
import type { ScribePanel } from '../ui/ScribePanel';

export interface TimerState {
  chippingTimer: number;
  shapingTimer: number;
  sellTimer: number;
  waterTimer: number;
}

interface TimerContext {
  game: Game;
  alertOverlay: AlertOverlay;
  scribePanel: ScribePanel;
  keyTab: Phaser.Input.Keyboard.Key;
  keyEsc: Phaser.Input.Keyboard.Key;
  autoSave: () => void;
  redraw: () => void;
  inputCooldown: number;
}

export type TimerResult = { handled: true; inputCooldown: number } | { handled: false };

/**
 * Process chipping lock: while chipping, only ESC and Tab are allowed.
 * Returns { handled: true } if the caller should return early from update().
 */
export function processChipping(
  delta: number, timers: TimerState, ctx: TimerContext,
): TimerResult {
  if (!ctx.game.hasActiveChipping()) {
    timers.chippingTimer = 0;
    return { handled: false };
  }
  if (ctx.keyTab.isDown) {
    ctx.scribePanel.toggle();
    return { handled: true, inputCooldown: 200 };
  }
  if (ctx.keyEsc.isDown) {
    ctx.game.cancelChipping();
    timers.chippingTimer = 0;
    ctx.autoSave(); ctx.redraw();
    return { handled: true, inputCooldown: 150 };
  }
  if (timers.chippingTimer <= 0) timers.chippingTimer = 200;
  timers.chippingTimer -= delta;
  if (timers.chippingTimer <= 0) {
    ctx.game.execute(new WaitCommand());
    timers.chippingTimer = 200;
    ctx.alertOverlay.show('Chipping... ESC to cancel', '#ff8800');
    ctx.autoSave(); ctx.redraw();
  }
  return { handled: true, inputCooldown: ctx.inputCooldown };
}

/** Process shaping companion auto-tick. Never blocks input. */
export function processShaping(delta: number, timers: TimerState, ctx: TimerContext): void {
  if (ctx.game.expeditionOver || !ctx.game.hasActiveShaping()) {
    timers.shapingTimer = 0;
    return;
  }
  if (timers.shapingTimer <= 0) timers.shapingTimer = 500;
  timers.shapingTimer -= delta;
  if (timers.shapingTimer <= 0) {
    ctx.game.shapingArmed = true;
    ctx.game.execute(new WaitCommand());
    timers.shapingTimer = 500;
    ctx.autoSave(); ctx.redraw();
  }
}

/** Process water CA auto-tick. Never blocks input. */
export function processWater(delta: number, timers: TimerState, ctx: TimerContext): void {
  if (ctx.game.expeditionOver || !ctx.game.hasActiveWater()) {
    timers.waterTimer = 0;
    return;
  }
  if (timers.waterTimer <= 0) timers.waterTimer = 150;
  timers.waterTimer -= delta;
  if (timers.waterTimer <= 0) {
    ctx.game.execute(new WaitCommand());
    timers.waterTimer = 150;
    ctx.redraw();
  }
}

/** Process sell errand auto-tick. Never blocks input. */
export function processSellErrand(delta: number, timers: TimerState, ctx: TimerContext): void {
  if (ctx.game.expeditionOver || !ctx.game.hasActiveSellErrand()) {
    timers.sellTimer = 0;
    return;
  }
  if (timers.sellTimer <= 0) timers.sellTimer = 300;
  timers.sellTimer -= delta;
  if (timers.sellTimer <= 0) {
    const logBefore = ctx.game.log.length;
    ctx.game.sellTickArmed = true;
    ctx.game.execute(new WaitCommand());
    timers.sellTimer = 300;
    const entries = ctx.game.log.all();
    for (let i = logBefore; i < entries.length; i++) {
      if (entries[i].category === 'narration') {
        ctx.alertOverlay.show(entries[i].message, '#e8c170');
      } else if (entries[i].message.includes("can't find a way out")) {
        ctx.alertOverlay.show('A companion is blocked from their errand.', '#ff6666');
      }
    }
    ctx.autoSave(); ctx.redraw();
  }
}
