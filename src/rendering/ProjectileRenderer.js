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
        const geometry = new THREE.CircleGeometry(projectile.radius, 12);
        const material = new THREE.MeshBasicMaterial({ color: 0xffda66 });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(projectile.position.x, projectile.position.y, 1);
        this.scene.add(mesh);
        this.projectileMeshes.set(projectile, mesh);
      }
      const mesh = this.projectileMeshes.get(projectile);
      mesh.position.set(projectile.position.x, projectile.position.y, 1);
    });
  }
}
