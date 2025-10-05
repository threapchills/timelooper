import { SeededRandom } from '../core/SeededRandom.js';

export class LevelGenerator {
  constructor(seed = 1) {
    this.seed = seed;
  }

  generate() {
    const rng = new SeededRandom(this.seed);
    const level = {
      width: 1600,
      height: 900,
      platforms: [],
      obstacles: [],
      spawnPoints: [
        { x: 200, y: 700, playerId: 1 },
        { x: 1400, y: 700, playerId: 2 }
      ]
    };

    // Ground
    level.platforms.push({ x: 0, y: 840, width: 1600, height: 60 });

    const layers = [650, 520, 380];
    layers.forEach((y) => {
      const count = rng.int(3, 5);
      for (let i = 0; i < count; i += 1) {
        const width = rng.int(140, 280);
        const x = rng.int(80, level.width - 80 - width);
        level.platforms.push({ x, y, width, height: 32 });
      }
    });

    const obstacleCount = rng.int(5, 8);
    for (let i = 0; i < obstacleCount; i += 1) {
      const width = 48;
      const height = rng.int(160, 280);
      const x = rng.int(320, level.width - 320 - width);
      const y = 840 - height;
      level.obstacles.push({ x, y, width, height });
    }

    return level;
  }
}
