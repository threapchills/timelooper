export class PlayerRenderer {
  constructor(scene, assetLoader) {
    this.scene = scene;
    this.assetLoader = assetLoader;
    this.sprites = new Map();
  }

  createSpriteFor(player) {
    if (!this.sprites.has(player)) {
      const textures = this._resolveTextures(player);
      const material = textures.idle
        ? new THREE.SpriteMaterial({ map: textures.idle, transparent: true })
        : new THREE.SpriteMaterial({ color: 0xffffff, transparent: true });
      material.color = new THREE.Color(player.tint);
      material.opacity = player.isGhost ? 0.75 : 1;
      const sprite = new THREE.Sprite(material);
      sprite.position.set(player.position.x, player.position.y, 0);
      sprite.scale.set(76, 104, 1);
      sprite.renderOrder = player.isGhost ? -1 : 1;
      this.scene.add(sprite);
      this.sprites.set(player, { sprite, textures, material });
    }
  }

  update(player) {
    this.createSpriteFor(player);
    const entry = this.sprites.get(player);
    if (!entry) return;
    const { sprite, textures, material } = entry;
    sprite.position.set(player.position.x, player.position.y, 0);
    sprite.scale.x = Math.abs(sprite.scale.x) * player.facingDirection;
    if (player.shootTimer > 0 && textures.shoot) {
      material.map = textures.shoot;
    } else if (textures.idle) {
      material.map = textures.idle;
    }
    material.color.setHex(player.tint);
    material.opacity = player.isGhost ? 0.7 : 1;
  }

  remove(player) {
    const entry = this.sprites.get(player);
    if (!entry) return;
    this.scene.remove(entry.sprite);
    this.sprites.delete(player);
  }

  _resolveTextures(player) {
    const prefix = `player${player.playerId}-${player.character}`;
    return {
      idle: this.assetLoader.get(`${prefix}-idle`) ?? this.assetLoader.get(`${player.character}-idle`),
      shoot: this.assetLoader.get(`${prefix}-shoot`) ?? this.assetLoader.get(`${player.character}-shoot`)
    };
  }
}
