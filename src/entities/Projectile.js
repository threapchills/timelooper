import { Entity } from './Entity.js';

export class Projectile extends Entity {
  constructor({ x, y, velocity, lifetime = 2, speed = 400, radius = 8, ownerId = 0 }) {
    super({ x, y, width: radius * 2, height: radius * 2 });
    this.velocity = { ...velocity };
    this.lifetime = lifetime;
    this.remainingLife = lifetime;
    this.speed = speed;
    this.ownerId = ownerId;
    this.radius = radius;
    this.damage = 20;
  }

  update(deltaSeconds) {
    this.position.x += this.velocity.x * deltaSeconds;
    this.position.y += this.velocity.y * deltaSeconds;
    this.remainingLife -= deltaSeconds;
    if (this.remainingLife <= 0) {
      this.isAlive = false;
    }
  }
}
