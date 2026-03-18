import Phaser from 'phaser';

export const SMART_MODE_COLORS: readonly number[] = [
  0, // unused
  0xff4444, // 1 Mine — red
  0x44cc44, // 2 Build — green
  0x4488ff, // 3 Command — blue
  0xff8800, // 4 Demolish — orange
];

export function drawModeIcon(
  g: Phaser.GameObjects.Graphics, mode: number,
  x: number, y: number, size: number, active: boolean,
): void {
  const u = size / 16;
  const a = active ? 1 : 0.5;
  const px = (col: number, row: number, w: number, h: number) => {
    g.fillRect(x + col * u, y + row * u, w * u, h * u);
  };

  switch (mode) {
    case 1: { // Mine — double-headed pickaxe (bent-down T)
      // -- Crossbar (rows 1-2) --
      g.fillStyle(0xCCDDEE, a);
      px(3, 1, 10, 1);       // top highlight
      g.fillStyle(0x99AABB, a);
      px(3, 2, 10, 1);       // crossbar body

      // -- Crossbar underside + hub (row 3) --
      g.fillStyle(0x778899, a);
      px(5, 3, 2, 1);        // left underside
      px(9, 3, 2, 1);        // right underside
      g.fillStyle(0x99AABB, a);
      px(7, 3, 2, 1);        // hub

      // -- Left pick (curving down, rows 3-6) --
      g.fillStyle(0x99AABB, a);
      px(3, 3, 1, 1);
      px(2, 4, 1, 1);
      px(1, 5, 1, 1);
      g.fillStyle(0x778899, a);
      px(4, 3, 1, 1);
      px(3, 4, 1, 1);
      px(2, 5, 1, 1);
      px(1, 6, 1, 1);        // tip

      // -- Right pick (mirror, rows 3-6) --
      g.fillStyle(0x99AABB, a);
      px(12, 3, 1, 1);
      px(13, 4, 1, 1);
      px(14, 5, 1, 1);
      g.fillStyle(0x778899, a);
      px(11, 3, 1, 1);
      px(12, 4, 1, 1);
      px(13, 5, 1, 1);
      px(14, 6, 1, 1);       // tip

      // -- Wooden handle (rows 4-13) --
      g.fillStyle(0xBB8833, a);
      px(7, 4, 1, 10);
      g.fillStyle(0x8B6914, a);
      px(8, 4, 1, 10);

      break;
    }

    case 2: { // Build — ladder
      // -- Rails (2px wide, full height) --
      g.fillStyle(0x3d3530, a);
      px(3, 0, 2, 16);
      px(11, 0, 2, 16);

      g.fillStyle(0x2e2825, a);
      px(4, 0, 1, 16);    // left rail shadow
      px(12, 0, 1, 16);   // right rail shadow

      // -- Rungs (3 rungs, 2px tall each) --
      g.fillStyle(0x574e47, a);
      px(5, 2, 6, 1);
      px(5, 7, 6, 1);
      px(5, 12, 6, 1);

      g.fillStyle(0x3d3530, a);
      px(5, 3, 6, 1);
      px(5, 8, 6, 1);
      px(5, 13, 6, 1);

      break;
    }

    case 3: { // Command — dwarven horn (megaphone)
      // -- Horn bell (rows 2-13, expanding right) --
      g.fillStyle(0xCC9933, a);
      px(2, 6, 2, 4);        // mouthpiece
      px(4, 5, 2, 6);        // narrow tube
      px(6, 4, 2, 8);        // widening
      px(8, 3, 2, 10);       // wider
      px(10, 2, 2, 12);      // bell
      px(12, 1, 2, 14);      // bell rim

      g.fillStyle(0xAA7722, a);
      px(12, 2, 2, 1);       // rim highlight top
      px(12, 14, 2, 1);      // rim highlight bottom
      px(6, 5, 1, 6);        // tube shadow

      // -- Rings on tube --
      g.fillStyle(0xe8c170, a);
      px(4, 7, 2, 2);        // ring 1
      px(8, 7, 2, 2);        // ring 2

      break;
    }

    case 4: { // Demolish — dynamite stick
      // Fuse (top)
      g.fillStyle(0xcccccc, a);
      px(7, 1, 2, 3);        // fuse line
      g.fillStyle(0xff4444, a);
      px(6, 0, 4, 2);        // fuse spark

      // Cylinder body
      g.fillStyle(0xcc3333, a);
      px(5, 4, 6, 9);        // main body
      g.fillStyle(0xaa2222, a);
      px(10, 4, 1, 9);       // right shadow
      g.fillStyle(0xdd4444, a);
      px(5, 4, 1, 9);        // left highlight

      // Label band
      g.fillStyle(0xe8c170, a);
      px(5, 8, 6, 2);        // band

      // Bottom cap
      g.fillStyle(0x8B6914, a);
      px(5, 13, 6, 2);       // cap

      break;
    }
  }
}

export interface ToolbarLabel {
  setPosition(x: number, y: number): void;
  setColor(color: string): void;
}

export function drawToolbar(
  g: Phaser.GameObjects.Graphics,
  screenW: number, currentMode: number,
  labels: ToolbarLabel[],
  topOffset = 0,
): void {
  g.clear();

  const iconArea = 24;
  const digitW = 6;
  const digitGap = 3;
  const topRowW = digitW + digitGap + iconArea;
  const boxW = topRowW + 8;
  const boxH = 40;
  const pad = 6;
  const gap = 6;
  const modeCount = SMART_MODE_COLORS.length - 1;
  const totalW = modeCount * boxW + (modeCount - 1) * gap + pad * 2;
  const startX = Math.floor((screenW - totalW) / 2) + pad;
  const startY = 8 + topOffset;

  g.fillStyle(0x1a1a2e, 0.85);
  g.fillRoundedRect(startX - pad - 2, startY - pad, totalW + 4, boxH + pad * 2, 4);

  for (let i = 0; i < modeCount; i++) {
    const mode = i + 1;
    const x = startX + i * (boxW + gap);
    const y = startY;
    const active = currentMode === mode;
    const color = SMART_MODE_COLORS[mode];

    if (active) {
      g.fillStyle(color, 0.25);
      g.fillRoundedRect(x - 1, y - 1, boxW + 2, boxH + 2, 3);
      g.lineStyle(2, color, 0.9);
      g.strokeRoundedRect(x - 1, y - 1, boxW + 2, boxH + 2, 3);
    } else {
      g.fillStyle(0x2a2a3e, 0.7);
      g.fillRoundedRect(x, y, boxW, boxH, 2);
    }

    const rowX = x + (boxW - topRowW) / 2;
    drawPixelDigit(g, mode, rowX + 1, y + Math.round((iconArea - 7.5) / 2) + 2, active ? color : 0x666678);
    drawModeIcon(g, mode, rowX + digitW + digitGap, y + 2, iconArea, active);

    const label = labels[i];
    label.setPosition(x + boxW / 2, y + iconArea + 4);
    const hexColor = '#' + (active ? color : 0x666678).toString(16).padStart(6, '0');
    label.setColor(hexColor);
  }
}

export function drawPixelDigit(
  g: Phaser.GameObjects.Graphics,
  digit: number, cx: number, y: number, color: number,
): void {
  const u = Math.max(1, Math.round(1.5));
  const sx = cx - u;
  g.fillStyle(color, 0.9);

  const patterns: Record<number, number[][]> = {
    1: [[0,1,0],[1,1,0],[0,1,0],[0,1,0],[1,1,1]],
    2: [[1,1,1],[0,0,1],[1,1,1],[1,0,0],[1,1,1]],
    3: [[1,1,1],[0,0,1],[1,1,1],[0,0,1],[1,1,1]],
    4: [[1,0,1],[1,0,1],[1,1,1],[0,0,1],[0,0,1]],
    5: [[1,1,1],[1,0,0],[1,1,1],[0,0,1],[1,1,1]],
  };
  const p = patterns[digit];
  if (!p) return;
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 3; col++) {
      if (p[row][col]) {
        g.fillRect(sx + col * u, y + row * u, u, u);
      }
    }
  }
}
