export class Entity {
  constructor({ x = 0, y = 0, width = 50, height = 50 } = {}) {
    this.position = { x, y };
    this.velocity = { x: 0, y: 0 };
    this.width = width;
    this.height = height;
    this.isAlive = true;
  }

  get bounds() {
    return {
      left: this.position.x - this.width / 2,
      right: this.position.x + this.width / 2,
      top: this.position.y - this.height / 2,
      bottom: this.position.y + this.height / 2
    };
  }
}
