import { getCharacterStats } from '../entities/Player.js';

export class PlayerRenderer {
  constructor(scene, assetLoader) {
    this.scene = scene;
    this.assetLoader = assetLoader;
    this.sprites = new Map();
  }

  createSpriteFor(player) {
    const key = `${player.character}-sprite`;
    if (!this.sprites.has(player)) {
      const texture = this.assetLoader.get(`${player.character}-idle`);
      const material = texture
        ? new THREE.SpriteMaterial({ map: texture, transparent: true })
        : new THREE.SpriteMaterial({ color: 0xffffff });
      const sprite = new THREE.Sprite(material);
      const stats = getCharacterStats(player.character);
      sprite.scale.set(72, 96, 1);
      sprite.position.set(player.position.x, player.position.y, 0);
      this.scene.add(sprite);
      this.sprites.set(player, { sprite, key });
    }
  }

  update(player) {
    this.createSpriteFor(player);
    const entry = this.sprites.get(player);
    if (!entry) return;
    const { sprite } = entry;
    sprite.position.set(player.position.x, player.position.y, 0);
    sprite.scale.x = Math.abs(sprite.scale.x) * player.facingDirection;
  }

  remove(player) {
    const entry = this.sprites.get(player);
    if (!entry) return;
    this.scene.remove(entry.sprite);
    this.sprites.delete(player);
  }
}
