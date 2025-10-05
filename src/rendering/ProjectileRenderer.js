import * as THREE from 'three';

export class ProjectileRenderer {
  constructor(scene) {
    this.scene = scene;
    this.projectileMeshes = new Map();
  }

  sync(projectiles) {
    // Remove stale meshes
    for (const [projectile, mesh] of this.projectileMeshes.entries()) {
      if (!projectiles.includes(projectile) || !projectile.isAlive) {
        this.scene.remove(mesh);
        this.projectileMeshes.delete(projectile);
      }
    }

    projectiles.forEach((projectile) => {
      if (!projectile.isAlive) return;
      if (!this.projectileMeshes.has(projectile)) {
        const mesh = this._createMesh(projectile);
        this.scene.add(mesh);
        this.projectileMeshes.set(projectile, mesh);
      }
      const mesh = this.projectileMeshes.get(projectile);
      mesh.position.set(projectile.position.x, projectile.position.y, 1);
      if (projectile.type === 'warrior-slash') {
        mesh.rotation.z = projectile.facingAngle ?? 0;
      }
    });
  }

  _createMesh(projectile) {
    let geometry;
    let materialColor = projectile.color ?? 0xffffff;
    switch (projectile.type) {
      case 'wizard-bomb':
        geometry = new THREE.CircleGeometry(projectile.radius, 16);
        break;
      case 'warrior-slash':
        geometry = new THREE.PlaneGeometry(projectile.width, projectile.height);
        materialColor = 0xffb347;
        break;
      default:
        geometry = new THREE.CircleGeometry(projectile.radius, 10);
    }

    if (projectile.ownerId === 2) {
      materialColor = 0xef4444;
    } else if (projectile.ownerId === 1) {
      materialColor = 0x22c55e;
    }

    const material = new THREE.MeshBasicMaterial({
      color: materialColor,
      transparent: true,
      opacity: projectile.type === 'warrior-slash' ? 0.7 : 1,
      blending: projectile.type === 'warrior-slash' ? THREE.AdditiveBlending : THREE.NormalBlending
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(projectile.position.x, projectile.position.y, 1);
    return mesh;
  }
}
