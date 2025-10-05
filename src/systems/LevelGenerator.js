import { SeededRandom } from '../core/SeededRandom.js';

export class LevelGenerator {
  constructor(seed = 1) {
    this.seed = seed;
  }

  generate() {
    const rng = new SeededRandom(this.seed);
    const level = {
      width: 1500,
      height: 960,
      platforms: [],
      obstacles: [],
      spawnPoints: [
        { x: 240, y: 820, playerId: 1 },
        { x: 1260, y: 820, playerId: 2 }
      ]
    };

    const groundHeight = 72;
    const groundY = level.height - groundHeight;
    level.platforms.push({ x: 0, y: groundY, width: level.width, height: groundHeight });

    const plateauHeight = 56;
    const plateauY = groundY - 200;
    const plateauWidth = 320;
    level.platforms.push(
      { x: 180, y: plateauY, width: plateauWidth, height: plateauHeight },
      { x: level.width - plateauWidth - 180, y: plateauY, width: plateauWidth, height: plateauHeight }
    );

    const midBridgeWidth = 360;
    const midBridgeY = groundY - 360;
    level.platforms.push({ x: (level.width - midBridgeWidth) / 2, y: midBridgeY, width: midBridgeWidth, height: 48 });

    const topPerchWidth = 220;
    const topPerchY = midBridgeY - 200;
    const perchOffset = 140;
    level.platforms.push(
      { x: perchOffset, y: topPerchY, width: topPerchWidth, height: 40 },
      { x: level.width - topPerchWidth - perchOffset, y: topPerchY, width: topPerchWidth, height: 40 }
    );

    const floatingPadsY = plateauY - 150;
    const padCount = 3;
    const padGap = 180;
    const padWidths = Array.from({ length: padCount }, () => 160 + rng.int(-20, 20));
    const padsTotalWidth = padWidths.reduce((sum, width) => sum + width, 0) + padGap * (padCount - 1);
    let padCursor = (level.width - padsTotalWidth) / 2;
    padWidths.forEach((padWidth) => {
      level.platforms.push({ x: padCursor, y: floatingPadsY + rng.int(-10, 10), width: padWidth, height: 36 });
      padCursor += padWidth + padGap;
    });

    const coverHeight = 200;
    const coverWidth = 64;
    level.obstacles.push(
      { x: 260, y: groundY - coverHeight, width: coverWidth, height: coverHeight },
      { x: level.width - 260 - coverWidth, y: groundY - coverHeight, width: coverWidth, height: coverHeight }
    );

    const centerPillarHeight = 260;
    const centerPillarWidth = 84;
    level.obstacles.push({
      x: (level.width - centerPillarWidth) / 2,
      y: groundY - centerPillarHeight,
      width: centerPillarWidth,
      height: centerPillarHeight
    });

    const upperCoverHeight = 120;
    const upperCoverWidth = 70;
    level.obstacles.push(
      { x: 460, y: plateauY - upperCoverHeight, width: upperCoverWidth, height: upperCoverHeight },
      { x: level.width - 460 - upperCoverWidth, y: plateauY - upperCoverHeight, width: upperCoverWidth, height: upperCoverHeight }
    );

    return level;
  }
}
