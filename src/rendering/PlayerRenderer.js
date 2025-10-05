import * as THREE from 'three';

const SPRITE_WIDTH = 96;
const SPRITE_HEIGHT = 128;

export class PlayerRenderer {
  constructor(scene, assetLoader) {
    this.scene = scene;
    this.assetLoader = assetLoader;
    this.sprites = new Map();
  }

  createSpriteFor(player) {
    if (this.sprites.has(player)) return;

    const textures = this._resolveTextures(player);
    const material = textures.idle
      ? new THREE.SpriteMaterial({ map: textures.idle, color: 0xffffff, transparent: true })
      : new THREE.SpriteMaterial({ color: 0xffffff, transparent: true });
    material.opacity = player.isGhost ? 0.7 : 1;

    const sprite = new THREE.Sprite(material);
    sprite.scale.set(SPRITE_WIDTH, SPRITE_HEIGHT, 1);
    sprite.renderOrder = player.isGhost ? -1 : 5;

    const baseGeometry = new THREE.CircleGeometry(44, 32);
    const baseMaterial = new THREE.MeshBasicMaterial({
      color: player.tint,
      transparent: true,
      opacity: player.isGhost ? 0.25 : 0.45
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(0, -player.height / 2 - 10, -0.5);

    const group = new THREE.Group();
    group.position.set(player.position.x, player.position.y, 0);
    group.add(base);
    group.add(sprite);

    this.scene.add(group);
    this.sprites.set(player, { group, sprite, base, textures, material });
  }

  update(player) {
    this.createSpriteFor(player);
    const entry = this.sprites.get(player);
    if (!entry) return;
    const { group, sprite, base, textures, material } = entry;
    group.position.set(player.position.x, player.position.y, 0);
    sprite.scale.set(SPRITE_WIDTH * player.facingDirection, SPRITE_HEIGHT, 1);

    if (player.shootTimer > 0 && textures.shoot) {
      material.map = textures.shoot;
      material.needsUpdate = true;
    } else if (textures.idle) {
      material.map = textures.idle;
      material.needsUpdate = true;
    }

    material.opacity = player.isGhost ? 0.65 : 1;
    base.material.opacity = player.isGhost ? 0.2 : 0.5;
    base.material.color.setHex(player.tint);
  }

  remove(player) {
    const entry = this.sprites.get(player);
    if (!entry) return;
    this.scene.remove(entry.group);
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
