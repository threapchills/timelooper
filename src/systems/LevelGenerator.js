import { SeededRandom } from '../core/SeededRandom.js';

export class LevelGenerator {
  constructor(seed = 1) {
    this.seed = seed;
  }

  generate() {
    const rng = new SeededRandom(this.seed);
    const level = {
      width: 2200,
      height: 1200,
      platforms: [],
      obstacles: [],
      spawnPoints: [
        { x: 320, y: 920, playerId: 1 },
        { x: 1880, y: 920, playerId: 2 }
      ]
    };

    const groundY = level.height - 80;
    level.platforms.push({ x: 0, y: groundY, width: level.width, height: 80 });

    const margin = 140;
    const bandConfigs = [
      { y: groundY - 160, widthRange: [260, 340], gapRange: [90, 160] },
      { y: groundY - 320, widthRange: [220, 300], gapRange: [120, 200] },
      { y: groundY - 520, widthRange: [180, 260], gapRange: [140, 220] },
      { y: groundY - 720, widthRange: [160, 220], gapRange: [160, 240] }
    ];

    bandConfigs.forEach((band) => {
      let cursor = margin + rng.int(0, 60);
      while (cursor < level.width - margin) {
        const remaining = level.width - margin - cursor;
        if (remaining <= 0) break;
        let platformWidth = rng.int(band.widthRange[0], band.widthRange[1]);
        platformWidth = Math.min(platformWidth, remaining);
        if (platformWidth < band.widthRange[0] * 0.5) {
          if (remaining < band.widthRange[0] * 0.5) {
            break;
          }
          platformWidth = remaining;
        }
        level.platforms.push({ x: cursor, y: band.y, width: platformWidth, height: 40 });
        cursor += platformWidth + rng.int(band.gapRange[0], band.gapRange[1]);
      }
    });

    // Floating sniper nests
    const highY = groundY - 900;
    for (let i = 0; i < 3; i += 1) {
      const width = rng.int(180, 240);
      const x = rng.int(margin, level.width - margin - width);
      level.platforms.push({ x, y: highY + rng.int(-30, 30), width, height: 36 });
    }

    const obstacleCount = 8;
    for (let i = 0; i < obstacleCount; i += 1) {
      const width = rng.int(52, 72);
      const height = rng.int(220, 420);
      const x = rng.int(margin, level.width - margin - width);
      const y = groundY - height;
      level.obstacles.push({ x, y, width, height });
    }

    // Anchor pillars near spawn zones for immediate cover
    level.obstacles.push(
      { x: margin, y: groundY - 300, width: 70, height: 300 },
      { x: level.width - margin - 70, y: groundY - 300, width: 70, height: 300 }
    );

    return level;
  }
}
