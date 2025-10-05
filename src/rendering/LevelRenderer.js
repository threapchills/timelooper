import * as THREE from 'three';

export class LevelRenderer {
  constructor(scene, blockTexture) {
    this.scene = scene;
    this.blockTexture = blockTexture;
    this.meshes = [];
    this.backdrop = null;
  }

  clear() {
    if (this.backdrop) {
      if (this.backdrop.material) {
        this.backdrop.material.dispose();
      }
      if (this.backdrop.geometry) {
        this.backdrop.geometry.dispose();
      }
      this.scene.remove(this.backdrop);
      this.backdrop = null;
    }
    this.meshes.forEach((mesh) => {
      if (mesh.material?.map) {
        mesh.material.map.dispose();
      }
      if (mesh.material) {
        mesh.material.dispose();
      }
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }
      this.scene.remove(mesh);
    });
    this.meshes = [];
  }

  renderLevel(level) {
    this.clear();
    const bgGeometry = new THREE.PlaneGeometry(level.width + 400, level.height + 400);
    const bgMaterial = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
    this.backdrop = new THREE.Mesh(bgGeometry, bgMaterial);
    this.backdrop.position.set(level.width / 2, level.height / 2, -50);
    this.scene.add(this.backdrop);
    level.platforms.forEach((platform) => this._renderRect(platform, 0x4a3d2a));
    level.obstacles.forEach((obstacle) => this._renderRect(obstacle, 0x2d3748));
  }

  _renderRect(rect, fallbackColor) {
    const geometry = new THREE.PlaneGeometry(rect.width, rect.height);
    let material;
    if (this.blockTexture) {
      const tileSize = this.blockTexture.image?.width ?? 64;
      const texture = this.blockTexture.clone();
      texture.needsUpdate = true;
      texture.repeat.set(rect.width / tileSize, rect.height / tileSize);
      material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
    } else {
      material = new THREE.MeshBasicMaterial({ color: fallbackColor });
    }
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(rect.x + rect.width / 2, rect.y + rect.height / 2, -5);
    this.scene.add(mesh);
    this.meshes.push(mesh);
  }
}
