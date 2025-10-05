export class UIRenderer {
  constructor(rootElement) {
    this.rootElement = rootElement;
    this.rootElement.innerHTML = '';

    this.hud = document.createElement('div');
    this.hud.className = 'hud';
    this.rootElement.appendChild(this.hud);

    this.healthEl = document.createElement('div');
    this.healthEl.className = 'hud__health';
    this.hud.appendChild(this.healthEl);

    this.fuelEl = document.createElement('div');
    this.fuelEl.className = 'hud__fuel';
    this.hud.appendChild(this.fuelEl);

    this.cooldownEl = document.createElement('div');
    this.cooldownEl.className = 'hud__cooldown';
    this.hud.appendChild(this.cooldownEl);
  }

  update(player) {
    if (!player) return;
    this.healthEl.textContent = `Health: ${player.health.toFixed(0)} / ${player.stats.maxHealth}`;
    this.fuelEl.textContent = `Jetpack Fuel: ${player.jetpackFuel.toFixed(1)}s`;
    this.cooldownEl.textContent = `Attack Cooldown: ${player.attackCooldown.toFixed(2)}s`;
  }
}
