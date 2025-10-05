import * as THREE from 'three';

export class AssetLoader {
  constructor() {
    this.textures = new Map();
  }

  async loadTexture(name, url) {
    return new Promise((resolve, reject) => {
      const loader = new THREE.TextureLoader();
      loader.load(
        url,
        (texture) => {
          texture.minFilter = THREE.NearestFilter;
          texture.magFilter = THREE.NearestFilter;
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          this.textures.set(name, texture);
          resolve(texture);
        },
        undefined,
        reject
      );
    });
  }

  get(name) {
    return this.textures.get(name);
  }
}
