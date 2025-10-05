import { Entity } from './Entity.js';

export const CHARACTER_STATS = {
  warrior: {
    speed: 210,
    acceleration: 760,
    maxHealth: 150,
    jetpackFuel: 6,
    jetpackThrust: 520,
    jetpackRegen: 1,
    cooldown: 0.8,
    melee: {
      damage: 50,
      width: 90,
      height: 70,
      lifetime: 0.18
    }
  },
  wizard: {
    speed: 180,
    acceleration: 620,
    maxHealth: 100,
    jetpackFuel: 4,
    jetpackThrust: 440,
    jetpackRegen: 0.8,
    cooldown: 2.5,
    bomb: {
      damageCenter: 50,
      damageOuter: 25,
      splashRadius: 120,
      fuse: 2.5,
      gravity: 520,
      projectileSpeed: 420
    }
  },
  ranger: {
    speed: 260,
    acceleration: 820,
    maxHealth: 75,
    jetpackFuel: 8,
    jetpackThrust: 560,
    jetpackRegen: 1.2,
    cooldown: 1.1,
    shot: {
      damage: 40,
      speed: 720,
      maxDistance: 900,
      radius: 10
    }
  }
};

export class Player extends Entity {
  constructor({ x, y, character = 'ranger', playerId = 1, tint = 0x00ff7f, isGhost = false } = {}) {
    super({ x, y, width: 68, height: 96 });
    this.character = character;
    this.playerId = playerId;
    this.tint = tint;
    this.stats = CHARACTER_STATS[character];
    this.health = this.stats.maxHealth;
    this.maxHealth = this.stats.maxHealth;
    this.jetpackFuel = this.stats.jetpackFuel;
    this.maxJetpackFuel = this.stats.jetpackFuel;
    this.facingDirection = 1;
    this.attackCooldown = 0;
    this.isGhost = isGhost;
    this.invulnerableTime = 0;
    this.damageSources = new Map();
    this.shootTimer = 0;
    this.isGrounded = false;
  }

  updateFacing(targetX) {
    if (Number.isFinite(targetX)) {
      this.facingDirection = targetX >= this.position.x ? 1 : -1;
    }
  }

  canFire() {
    return this.attackCooldown <= 0;
  }

  tickCooldown(deltaSeconds) {
    this.attackCooldown = Math.max(0, this.attackCooldown - deltaSeconds);
    if (this.invulnerableTime > 0) {
      this.invulnerableTime = Math.max(0, this.invulnerableTime - deltaSeconds);
    }
    if (this.shootTimer > 0) {
      this.shootTimer = Math.max(0, this.shootTimer - deltaSeconds);
    }
  }

  triggerCooldown() {
    this.attackCooldown = this.stats.cooldown;
  }

  resetForTurn({ x, y }) {
    this.position.x = x;
    this.position.y = y;
    this.velocity.x = 0;
    this.velocity.y = 0;
    this.health = this.maxHealth;
    this.jetpackFuel = this.maxJetpackFuel;
    this.attackCooldown = 0;
    this.isAlive = true;
    this.invulnerableTime = 0;
    this.damageSources.clear();
    this.isGrounded = false;
  }

  takeDamage(amount, { sourcePlayerId = null, sourceId = null } = {}) {
    if (!this.isAlive || amount <= 0) return false;
    this.health -= amount;
    if (sourceId !== null) {
      this.damageSources.set(sourceId, (this.damageSources.get(sourceId) || 0) + amount);
    }
    if (this.health <= 0) {
      this.health = 0;
      this.isAlive = false;
      return { killed: true, killerId: sourcePlayerId };
    }
    return { killed: false };
  }

  triggerShootAnimation(duration = 0.32) {
    this.shootTimer = duration;
  }
}

export function getCharacterStats(character) {
  return CHARACTER_STATS[character];
}

export function listCharacterTypes() {
  return Object.keys(CHARACTER_STATS);
}
