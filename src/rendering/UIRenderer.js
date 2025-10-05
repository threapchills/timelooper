import { CHARACTER_STATS } from '../entities/Player.js';

export class UIRenderer {
  constructor(rootElement) {
    this.rootElement = rootElement;
    this.rootElement.innerHTML = '';

    this._buildHUD();
  }

  _buildHUD() {
    this.topBar = document.createElement('div');
    this.topBar.className = 'hud hud--top';
    this.roundLabel = document.createElement('div');
    this.roundLabel.className = 'hud__round';
    this.timerLabel = document.createElement('div');
    this.timerLabel.className = 'hud__timer';
    this.scoreLabel = document.createElement('div');
    this.scoreLabel.className = 'hud__scores';
    this.topBar.append(this.roundLabel, this.timerLabel, this.scoreLabel);
    this.rootElement.appendChild(this.topBar);

    this.bottomPanel = document.createElement('div');
    this.bottomPanel.className = 'hud hud--bottom';
    this.healthBar = this._createBar('Health');
    this.fuelBar = this._createBar('Fuel');
    this.cooldownText = document.createElement('div');
    this.cooldownText.className = 'hud__cooldown';
    this.ghostLabel = document.createElement('div');
    this.ghostLabel.className = 'hud__ghosts';
    this.bottomPanel.append(
      this.healthBar.container,
      this.fuelBar.container,
      this.cooldownText,
      this.ghostLabel
    );
    this.rootElement.appendChild(this.bottomPanel);

    this.selectionOverlay = document.createElement('div');
    this.selectionOverlay.className = 'selection-overlay hidden';
    this.rootElement.appendChild(this.selectionOverlay);

    this.countdownEl = document.createElement('div');
    this.countdownEl.className = 'countdown hidden';
    this.rootElement.appendChild(this.countdownEl);

    this.victoryOverlay = document.createElement('div');
    this.victoryOverlay.className = 'victory hidden';
    this.rootElement.appendChild(this.victoryOverlay);
  }

  _createBar(label) {
    const container = document.createElement('div');
    container.className = 'hud__bar';
    const labelEl = document.createElement('span');
    labelEl.className = 'hud__bar-label';
    labelEl.textContent = label;
    const meter = document.createElement('div');
    meter.className = 'hud__bar-meter';
    const fill = document.createElement('div');
    fill.className = 'hud__bar-fill';
    meter.appendChild(fill);
    container.append(labelEl, meter);
    return { container, fill, label: labelEl };
  }

  updateHUD({
    player,
    round,
    totalRounds,
    timerSeconds,
    activePlayer,
    scores,
    ghosts
  }) {
    this.roundLabel.textContent = `Round ${round} / ${totalRounds} — ${activePlayer}`;
    this.timerLabel.textContent = timerSeconds >= 0 ? `${timerSeconds.toFixed(0).padStart(2, '0')}s` : '--';
    this.scoreLabel.innerHTML = `
      <span class="hud__score hud__score--p1">P1 ${scores.player1}</span>
      <span class="hud__score hud__score--p2">P2 ${scores.player2}</span>
    `;

    if (!player) {
      this.healthBar.fill.style.width = '0%';
      this.healthBar.fill.dataset.value = '0';
      this.fuelBar.fill.style.width = '0%';
      this.fuelBar.fill.dataset.value = '0';
      this.cooldownText.textContent = '';
      this.ghostLabel.textContent = `Ghosts: ${ghosts}`;
      return;
    }

    const healthPct = Math.max(0, player.health / player.maxHealth);
    this.healthBar.fill.style.width = `${healthPct * 100}%`;
    this.healthBar.fill.dataset.value = `${player.health.toFixed(0)} / ${player.maxHealth}`;

    const fuelPct = Math.max(0, player.jetpackFuel / player.maxJetpackFuel);
    this.fuelBar.fill.style.width = `${fuelPct * 100}%`;
    this.fuelBar.fill.dataset.value = `${player.jetpackFuel.toFixed(1)}s`;
    this.cooldownText.textContent = `Cooldown: ${player.attackCooldown.toFixed(1)}s`;
    this.ghostLabel.textContent = `Ghosts active: ${ghosts}`;
  }

  showCharacterSelection({ playerId, available, used, onSelect }) {
    this.selectionOverlay.innerHTML = '';
    this.selectionOverlay.classList.remove('hidden');
    this.selectionOverlay.style.pointerEvents = 'auto';

    const panel = document.createElement('div');
    panel.className = 'selection-panel';
    const heading = document.createElement('h2');
    heading.textContent = `Player ${playerId} — choose your operative`;
    panel.appendChild(heading);

    const grid = document.createElement('div');
    grid.className = 'selection-grid';

    Object.entries(CHARACTER_STATS).forEach(([key, stats]) => {
      const card = document.createElement('button');
      card.className = 'selection-card';
      card.disabled = used.includes(key);
      if (!available.includes(key)) {
        card.classList.add('disabled');
        card.disabled = true;
      }
      card.innerHTML = `
        <h3>${key.toUpperCase()}</h3>
        <ul>
          <li>HP: ${stats.maxHealth}</li>
          <li>Speed: ${stats.speed}</li>
          <li>Cooldown: ${stats.cooldown.toFixed(1)}s</li>
          <li>Fuel: ${stats.jetpackFuel.toFixed(1)}s</li>
        </ul>
      `;
      if (!card.disabled) {
        card.addEventListener('click', () => {
          this.hideSelection();
          onSelect(key);
        });
      }
      grid.appendChild(card);
    });

    panel.appendChild(grid);
    this.selectionOverlay.appendChild(panel);
  }

  hideSelection() {
    this.selectionOverlay.classList.add('hidden');
    this.selectionOverlay.style.pointerEvents = 'none';
  }

  showCountdown(value) {
    this.countdownEl.classList.remove('hidden');
    this.countdownEl.textContent = value;
  }

  hideCountdown() {
    this.countdownEl.classList.add('hidden');
  }

  showVictory({ winner, scores, detail }) {
    this.victoryOverlay.innerHTML = `
      <div class="victory__panel">
        <h1>${winner}</h1>
        <p>${detail}</p>
        <div class="victory__scores">
          <span class="hud__score hud__score--p1">P1 ${scores.player1}</span>
          <span class="hud__score hud__score--p2">P2 ${scores.player2}</span>
        </div>
        <p class="victory__hint">Refresh the page to play again.</p>
      </div>
    `;
    this.victoryOverlay.classList.remove('hidden');
  }

  clearVictory() {
    this.victoryOverlay.classList.add('hidden');
  }
}
