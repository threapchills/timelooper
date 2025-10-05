import { Entity } from './Entity.js';

export class Projectile extends Entity {
  constructor({
    x,
    y,
    radius = 8,
    velocity = { x: 0, y: 0 },
    lifetime = 3,
    ownerId,
    damage = 0,
    type = 'generic'
  }) {
    super({ x, y, width: radius * 2, height: radius * 2 });
    this.velocity = { ...velocity };
    this.lifetime = lifetime;
    this.age = 0;
    this.ownerId = ownerId;
    this.radius = radius;
    this.damage = damage;
    this.type = type;
    this.maxDistance = Infinity;
    this.startPosition = { x, y };
    this.color = 0xffffff;
  }

  update(deltaSeconds) {
    if (!this.isAlive) return;
    this.age += deltaSeconds;
    this.position.x += this.velocity.x * deltaSeconds;
    this.position.y += this.velocity.y * deltaSeconds;
    if (this.age >= this.lifetime) {
      this.isAlive = false;
    }
    const traveled = Math.hypot(
      this.position.x - this.startPosition.x,
      this.position.y - this.startPosition.y
    );
    if (traveled > this.maxDistance) {
      this.isAlive = false;
    }
  }
}

export class RangerShot extends Projectile {
  constructor({ x, y, direction, ownerId, damage = 40, speed = 720 }) {
    super({
      x,
      y,
      radius: 10,
      velocity: { x: direction.x * speed, y: direction.y * speed },
      lifetime: 2.2,
      ownerId,
      damage,
      type: 'ranger-shot'
    });
    this.maxDistance = 900;
    this.color = 0x55ff99;
  }
}

export class WarriorSlash extends Projectile {
  constructor({ origin, direction, stats, ownerId }) {
    const width = stats.melee.width;
    const height = stats.melee.height;
    const offsetX = direction.x * (width / 2 + 16);
    const offsetY = direction.y * (height / 2);
    super({
      x: origin.x + offsetX,
      y: origin.y + offsetY,
      radius: Math.max(width, height) / 2,
      velocity: { x: 0, y: 0 },
      lifetime: stats.melee.lifetime,
      ownerId,
      damage: stats.melee.damage,
      type: 'warrior-slash'
    });
    this.width = width;
    this.height = height;
    this.color = 0xffa64d;
    this.facingAngle = Math.atan2(direction.y, direction.x);
  }
}

export class WizardBomb extends Projectile {
  constructor({ x, y, direction, speed, ownerId, stats }) {
    super({
      x,
      y,
      radius: 16,
      velocity: { x: direction.x * speed, y: direction.y * speed },
      lifetime: stats.fuse,
      ownerId,
      damage: stats.damageCenter,
      type: 'wizard-bomb'
    });
    this.gravity = stats.gravity;
    this.fuse = stats.fuse;
    this.splashRadius = stats.splashRadius;
    this.damageOuter = stats.damageOuter;
    this.color = 0xff5577;
  }

  update(deltaSeconds) {
    if (!this.isAlive) return;
    this.age += deltaSeconds;
    this.velocity.y += this.gravity * deltaSeconds;
    this.position.x += this.velocity.x * deltaSeconds;
    this.position.y += this.velocity.y * deltaSeconds;
    if (this.age >= this.fuse) {
      this.isAlive = false;
      this.shouldExplode = true;
    }
  }
}

export function createProjectileFromRecord(record, ownerId) {
  switch (record.type) {
    case 'ranger-shot':
      return new RangerShot({
        x: record.position.x,
        y: record.position.y,
        direction: record.direction,
        ownerId,
        damage: record.damage,
        speed: record.speed
      });
    case 'wizard-bomb':
      return new WizardBomb({
        x: record.position.x,
        y: record.position.y,
        direction: record.direction,
        speed: record.speed,
        ownerId,
        stats: {
          damageCenter: record.damage,
          damageOuter: record.damageOuter,
          splashRadius: record.splashRadius,
          fuse: record.fuse,
          gravity: record.gravity
        }
      });
    case 'warrior-slash':
      return new WarriorSlash({
        origin: record.origin,
        direction: record.direction,
        stats: {
          melee: {
            damage: record.damage,
            width: record.width,
            height: record.height,
            lifetime: record.lifetime
          }
        },
        ownerId
      });
    default:
      return new Projectile({ x: record.position.x, y: record.position.y, ownerId });
  }
}
