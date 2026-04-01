/**
 * Shared constants and utilities for stream drawing.
 */

import Phaser from 'phaser';

/** Pre-blended flow color: 0x55bbff at 0.45 alpha over cave bg 0x252535. */
export const FLOW_COLOR = 0x3b6990;
export const FLOW_ALPHA = 1;

/** Ribbon height as fraction of tile size. */
export const RIBBON_FRAC = 0.35;
/** Fall column width as fraction of tile size. */
export const FALL_FRAC = 0.40;

/** Trace a quadratic bezier from current pen position to (ex,ey) via control (cx,cy). */
export function bezierTo(
  g: Phaser.GameObjects.Graphics,
  sx: number, sy: number, cx: number, cy: number,
  ex: number, ey: number, steps: number,
): void {
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    g.lineTo(
      u * u * sx + 2 * u * t * cx + t * t * ex,
      u * u * sy + 2 * u * t * cy + t * t * ey,
    );
  }
}
