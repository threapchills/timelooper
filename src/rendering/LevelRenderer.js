import * as THREE from 'three';

export class LevelRenderer {
  constructor(scene, blockTexture) {
    this.scene = scene;
    this.blockTexture = blockTexture;
    this.meshes = [];
  }

  clear() {
    this.meshes.forEach((mesh) => this.scene.remove(mesh));
    this.meshes = [];
  }

  renderLevel(level) {
    this.clear();
    level.platforms.forEach((platform) => this._renderRect(platform, 0x4a3d2a));
    level.obstacles.forEach((obstacle) => this._renderRect(obstacle, 0x2d3748));
  }

  _renderRect(rect, fallbackColor) {
    const geometry = new THREE.PlaneGeometry(rect.width, rect.height);
    const material = this.blockTexture
      ? new THREE.MeshBasicMaterial({ map: this.blockTexture, transparent: true })
      : new THREE.MeshBasicMaterial({ color: fallbackColor });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(rect.x + rect.width / 2, rect.y + rect.height / 2, -5);
    this.scene.add(mesh);
    this.meshes.push(mesh);
  }
}
