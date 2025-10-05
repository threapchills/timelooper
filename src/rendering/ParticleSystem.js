class Particle {
  constructor(scene, { position, velocity, color, lifetime, size, z = 2, opacity = 1 }) {
    this.scene = scene;
    this.position = { ...position };
    this.velocity = { ...velocity };
    this.lifetime = lifetime;
    this.age = 0;
    this.size = size;
    this.material = new THREE.SpriteMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    this.sprite = new THREE.Sprite(this.material);
    this.sprite.scale.set(size, size, 1);
    this.sprite.position.set(position.x, position.y, z);
    this.scene.add(this.sprite);
  }

  update(deltaSeconds) {
    this.age += deltaSeconds;
    const t = this.age / this.lifetime;
    this.position.x += this.velocity.x * deltaSeconds;
    this.position.y += this.velocity.y * deltaSeconds;
    this.velocity.x *= 0.92;
    this.velocity.y *= 0.92;
    this.sprite.position.set(this.position.x, this.position.y, this.sprite.position.z);
    this.material.opacity = Math.max(0, 1 - t);
    this.sprite.scale.setScalar(this.size * (1 - t * 0.5));
    if (this.age >= this.lifetime) {
      this.dispose();
      return false;
    }
    return true;
  }

  dispose() {
    if (this.sprite) {
      this.scene.remove(this.sprite);
      this.sprite = null;
    }
    if (this.material) {
      this.material.dispose();
      this.material = null;
    }
  }
}

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this.trails = new Map();
  }

  spawnBurst({ position, color, count = 20, speed = 320, lifetime = 0.8, size = 22 }) {
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const magnitude = Math.random() * speed;
      const velocity = {
        x: Math.cos(angle) * magnitude,
        y: Math.sin(angle) * magnitude
      };
      this._spawnParticle({ position, velocity, color, lifetime: lifetime * (0.6 + Math.random() * 0.6), size });
    }
  }

  attachProjectile(projectile, { color, rate = 1 / 60, speed = 220, size = 16 } = {}) {
    this.trails.set(projectile, {
      projectile,
      color,
      rate,
      speed,
      size,
      accumulator: 0
    });
  }

  update(deltaSeconds) {
    this.particles = this.particles.filter((particle) => particle.update(deltaSeconds));

    for (const [projectile, trail] of this.trails) {
      if (!projectile.isAlive) {
        this.trails.delete(projectile);
        continue;
      }
      trail.accumulator += deltaSeconds;
      while (trail.accumulator >= trail.rate) {
        trail.accumulator -= trail.rate;
        const angle = Math.random() * Math.PI * 2;
        const magnitude = Math.random() * trail.speed * 0.4;
        const velocity = {
          x: Math.cos(angle) * magnitude,
          y: Math.sin(angle) * magnitude - Math.random() * 40
        };
        this._spawnParticle({
          position: projectile.position,
          velocity,
          color: trail.color,
          lifetime: 0.5 + Math.random() * 0.4,
          size: trail.size * (0.4 + Math.random() * 0.6)
        });
      }
    }
  }

  clear() {
    this.particles.forEach((particle) => particle.dispose());
    this.particles = [];
    this.trails.clear();
  }

  _spawnParticle({ position, velocity, color, lifetime, size }) {
    const particle = new Particle(this.scene, {
      position,
      velocity,
      color,
      lifetime,
      size
    });
    this.particles.push(particle);
  }
}
