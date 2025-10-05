import { Entity } from './Entity.js';

const CHARACTER_STATS = {
  warrior: {
    speed: 160,
    maxHealth: 150,
    jetpackFuel: 6,
    jetpackThrust: 420,
    jetpackRegen: 1,
    projectileSpeed: 280,
    cooldown: 0.8
  },
  wizard: {
    speed: 140,
    maxHealth: 100,
    jetpackFuel: 4,
    jetpackThrust: 360,
    jetpackRegen: 0.9,
    projectileSpeed: 220,
    cooldown: 2.5
  },
  ranger: {
    speed: 220,
    maxHealth: 75,
    jetpackFuel: 8,
    jetpackThrust: 460,
    jetpackRegen: 1.1,
    projectileSpeed: 400,
    cooldown: 1.2
  }
};

export class Player extends Entity {
  constructor({ x, y, character = 'ranger' } = {}) {
    super({ x, y, width: 48, height: 64 });
    this.character = character;
    this.stats = CHARACTER_STATS[character];
    this.health = this.stats.maxHealth;
    this.jetpackFuel = this.stats.jetpackFuel;
    this.maxJetpackFuel = this.stats.jetpackFuel;
    this.facingDirection = 1;
    this.attackCooldown = 0;
  }

  updateFacing(targetX) {
    this.facingDirection = targetX >= this.position.x ? 1 : -1;
  }

  canFire() {
    return this.attackCooldown <= 0;
  }

  tickCooldown(deltaSeconds) {
    this.attackCooldown = Math.max(0, this.attackCooldown - deltaSeconds);
  }

  triggerCooldown() {
    this.attackCooldown = this.stats.cooldown;
  }
}

export function getCharacterStats(character) {
  return CHARACTER_STATS[character];
}
