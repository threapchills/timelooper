import { InputManager } from './InputManager.js';
import { LevelGenerator } from '../systems/LevelGenerator.js';
import { PhysicsSystem } from '../systems/PhysicsSystem.js';
import { Player, listCharacterTypes } from '../entities/Player.js';
import {
  RangerShot,
  WizardBomb,
  WarriorSlash,
  createProjectileFromRecord
} from '../entities/Projectile.js';
import { Ghost } from '../entities/Ghost.js';
import { AssetLoader } from '../rendering/AssetLoader.js';
import { LevelRenderer } from '../rendering/LevelRenderer.js';
import { PlayerRenderer } from '../rendering/PlayerRenderer.js';
import { ProjectileRenderer } from '../rendering/ProjectileRenderer.js';
import { UIRenderer } from '../rendering/UIRenderer.js';
import { ParticleSystem } from '../rendering/ParticleSystem.js';
import { RecordingSession } from './RecordingSession.js';

const FIXED_TIMESTEP = 1 / 60;
const TURN_DURATION = 60;
const TOTAL_ROUNDS = 3;
const CAMERA_WIDTH = 1600;

const PLAYER_META = {
  1: { tint: 0x45ff9a, label: 'Player 1' },
  2: { tint: 0xff4f64, label: 'Player 2' }
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export class GameManager {
  constructor({ canvas, uiRoot }) {
    this.canvas = canvas;
    this.uiRoot = uiRoot;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true });
    this.renderer.setSize(canvas.width, canvas.height);
    this.scene = new THREE.Scene();

    const aspect = canvas.width / canvas.height;
    const height = CAMERA_WIDTH / aspect;
    this.camera = new THREE.OrthographicCamera(0, CAMERA_WIDTH, height, 0, -1000, 1000);
    this.camera.position.set(CAMERA_WIDTH / 2, height / 2, 10);
    this.camera.lookAt(CAMERA_WIDTH / 2, height / 2, 0);

    this.clock = new THREE.Clock();
    this.accumulator = 0;

    this.assetLoader = new AssetLoader();
    this.levelRenderer = new LevelRenderer(this.scene, null);
    this.playerRenderer = new PlayerRenderer(this.scene, this.assetLoader);
    this.projectileRenderer = new ProjectileRenderer(this.scene);
    this.uiRenderer = new UIRenderer(uiRoot);
    this.particles = new ParticleSystem(this.scene);

    this.input = new InputManager(canvas);
    this.mouseVector = new THREE.Vector3();

    this.projectiles = [];
    this.ghosts = [];
    this.currentPlayer = null;
    this.physics = null;
    this.recordingSession = null;
    this.turnElapsed = 0;
    this.stage = 'loading';

    this.state = {
      round: 1,
      turnIndex: 0
    };
    this.selections = {
      1: [],
      2: []
    };
    this.recordings = {
      1: [],
      2: []
    };
    this.scores = {
      player1: 0,
      player2: 0
    };
    this.finalHealth = {
      1: 0,
      2: 0
    };

    this._loadAssets().then(() => {
      this._initGame();
      this._loop();
    });
  }

  async _loadAssets() {
    const characters = ['warrior', 'wizard', 'ranger'];
    const loads = [];
    characters.forEach((char) => {
      loads.push(
        this.assetLoader.loadTexture(`player1-${char}-idle`, `assets/player1${char}.png`).catch(() => null),
        this.assetLoader.loadTexture(`player1-${char}-shoot`, `assets/player1${char}shoot.png`).catch(() => null),
        this.assetLoader.loadTexture(`player2-${char}-idle`, `assets/player2${char}.png`).catch(() => null),
        this.assetLoader.loadTexture(`player2-${char}-shoot`, `assets/player2${char}shoot.png`).catch(() => null)
      );
    });
    loads.push(this.assetLoader.loadTexture('landblock', 'assets/landblock.png').catch(() => null));

    await Promise.all(loads);
    const blockTexture = this.assetLoader.get('landblock');
    if (blockTexture) {
      this.levelRenderer.blockTexture = blockTexture;
    }
  }

  _initGame() {
    const generator = new LevelGenerator(Math.floor(Math.random() * 10000));
    this.level = generator.generate();
    this.physics = new PhysicsSystem(this.level);
    this.levelRenderer.renderLevel(this.level);
    this.stage = 'selection';
    this._promptSelection();
  }

  _loop() {
    requestAnimationFrame(() => this._loop());
    const delta = this.clock.getDelta();
    this.accumulator += delta;

    while (this.accumulator >= FIXED_TIMESTEP) {
      this._step(FIXED_TIMESTEP);
      this.accumulator -= FIXED_TIMESTEP;
    }

    this.particles.update(delta);
    this._render();
  }

  _step(deltaSeconds) {
    if (this.stage !== 'playing') {
      this.uiRenderer.updateHUD({
        player: this.currentPlayer && this.currentPlayer.isAlive ? this.currentPlayer : null,
        round: this.state.round,
        totalRounds: TOTAL_ROUNDS,
        timerSeconds: TURN_DURATION - this.turnElapsed,
        activePlayer: this.currentPlayer ? PLAYER_META[this.currentPlayer.playerId].label : '—',
        scores: this.scores,
        ghosts: this.ghosts.filter((g) => g.isAlive).length
      });
      return;
    }

    this.turnElapsed += deltaSeconds;

    const inputState = this.input.getState();
    this._updateMouseWorld(inputState);

    const fired = this._handleAttack(this.currentPlayer, inputState);
    this.physics.updatePlayer(this.currentPlayer, inputState, deltaSeconds);

    if (fired) {
      this.currentPlayer.triggerCooldown();
      this.currentPlayer.triggerShootAnimation();
    }

    this.recordingSession.captureFrame({
      time: this.turnElapsed,
      input: inputState,
      player: this.currentPlayer,
      fireEvent: fired
    });

    this._updateGhosts(deltaSeconds);
    const activeActors = [this.currentPlayer, ...this.ghosts.filter((ghost) => ghost.isAlive)];
    this.physics.resolveActorCollisions(activeActors);

    this._updateProjectiles(deltaSeconds);
    this._handleProjectileCollisions();
    this._cleanupEntities();

    const timerRemaining = clamp(TURN_DURATION - this.turnElapsed, 0, TURN_DURATION);
    this.uiRenderer.updateHUD({
      player: this.currentPlayer.isAlive ? this.currentPlayer : null,
      round: this.state.round,
      totalRounds: TOTAL_ROUNDS,
      timerSeconds: timerRemaining,
      activePlayer: PLAYER_META[this.currentPlayer.playerId].label,
      scores: this.scores,
      ghosts: this.ghosts.filter((g) => g.isAlive).length
    });

    if (this.turnElapsed >= TURN_DURATION || !this.currentPlayer.isAlive) {
      this._endTurn();
    }
  }

  _updateGhosts(deltaSeconds) {
    this.ghosts.forEach((ghost) => {
      const frame = ghost.step(deltaSeconds, this.physics);
      if (!frame) return;
      const pending = ghost.collectPendingProjectiles();
      pending.forEach((record) => {
        const projectile = createProjectileFromRecord(record, ghost.playerId);
        projectile.ownerId = ghost.playerId;
        if (projectile.type === 'warrior-slash') {
          projectile.hitTargets = new Set();
        }
        this.projectiles.push(projectile);
        this._attachParticles(projectile);
      });
    });
  }

  _updateProjectiles(deltaSeconds) {
    this.projectiles.forEach((projectile) => {
      if (!projectile.isAlive) return;
      this.physics.updateProjectile(projectile, deltaSeconds);
      if (projectile.type === 'wizard-bomb' && projectile.shouldExplode) {
        this._explodeBomb(projectile);
      }
    });
  }

  _handleProjectileCollisions() {
    const actors = [this.currentPlayer, ...this.ghosts];
    this.projectiles.forEach((projectile) => {
      if (!projectile.isAlive) return;
      if (projectile.type === 'wizard-bomb') {
        const hit = actors.find((actor) => this._projectileHitsActor(projectile, actor));
        if (hit) {
          projectile.shouldExplode = true;
          projectile.isAlive = false;
          this._explodeBomb(projectile);
        }
        return;
      }

      actors.forEach((actor) => {
        if (!actor.isAlive || actor.playerId === projectile.ownerId) return;
        if (projectile.type === 'warrior-slash') {
          projectile.hitTargets = projectile.hitTargets || new Set();
          if (projectile.hitTargets.has(actor)) return;
          if (this._slashHits(projectile, actor)) {
            projectile.hitTargets.add(actor);
            this._applyDamage(actor, projectile.damage, projectile.ownerId);
          }
        } else if (this._projectileHitsActor(projectile, actor)) {
          this._applyDamage(actor, projectile.damage, projectile.ownerId);
          projectile.isAlive = false;
        }
      });
    });
  }

  _cleanupEntities() {
    this.projectiles = this.projectiles.filter((projectile) => projectile.isAlive);

    this.ghosts = this.ghosts.filter((ghost) => {
      if (!ghost.isAlive) {
        this.playerRenderer.remove(ghost);
        return false;
      }
      return true;
    });
  }

  _projectileHitsActor(projectile, actor) {
    if (!actor.isAlive) return false;
    const dx = actor.position.x - projectile.position.x;
    const dy = actor.position.y - projectile.position.y;
    const distance = Math.hypot(dx, dy);
    const radius = projectile.radius + Math.max(actor.width, actor.height) * 0.3;
    return distance <= radius;
  }

  _slashHits(projectile, actor) {
    const halfW = projectile.width / 2;
    const halfH = projectile.height / 2;
    const left = projectile.position.x - halfW;
    const right = projectile.position.x + halfW;
    const top = projectile.position.y - halfH;
    const bottom = projectile.position.y + halfH;
    const bounds = actor.bounds;
    return !(bounds.left > right || bounds.right < left || bounds.top > bottom || bounds.bottom < top);
  }

  _explodeBomb(projectile) {
    if (projectile.exploded) return;
    projectile.exploded = true;
    this.particles.spawnBurst({
      position: projectile.position,
      colors: [
        projectile.ownerId === 1 ? 0x3cffaa : 0xff6b7d,
        projectile.ownerId === 1 ? 0x60f7ff : 0xff9a62,
        projectile.ownerId === 1 ? 0xa855f7 : 0xffd166
      ],
      count: 48,
      speed: 560,
      size: 34,
      lifetime: 1.4,
      opacity: 0.95
    });
    this.particles.spawnShockwave({
      position: projectile.position,
      color: projectile.ownerId === 1 ? 0x74f5ff : 0xff8b94,
      radius: projectile.splashRadius * 1.2,
      lifetime: 0.75,
      opacity: 0.6
    });

    const actors = [this.currentPlayer, ...this.ghosts];
    actors.forEach((actor) => {
      if (!actor.isAlive || actor.playerId === projectile.ownerId) return;
      const distance = Math.hypot(actor.position.x - projectile.position.x, actor.position.y - projectile.position.y);
      if (distance <= projectile.splashRadius) {
        const ratio = clamp(distance / projectile.splashRadius, 0, 1);
        const damage = THREE.MathUtils.lerp(projectile.damage, projectile.damageOuter, ratio);
        this._applyDamage(actor, damage, projectile.ownerId);
      }
    });
  }

  _applyDamage(target, amount, sourcePlayerId) {
    const result = target.takeDamage(amount, { sourcePlayerId });
    if (result && result.killed) {
      this._registerKill(target, sourcePlayerId);
    }
  }

  _registerKill(target, killerId) {
    if (killerId) {
      const key = killerId === 1 ? 'player1' : 'player2';
      this.scores[key] += 1;
    }
    if (target?.position) {
      const burstColor = killerId === 1 ? [0x5cffc8, 0x22d3ee, 0xc084fc] : [0xff8181, 0xffb347, 0xffd5a5];
      this.particles.spawnShockwave({
        position: { ...target.position },
        color: killerId === 1 ? 0x8bffdd : 0xff9ea1,
        radius: 240,
        lifetime: 0.7,
        opacity: 0.7
      });
      this.particles.spawnBurst({
        position: { ...target.position },
        colors: burstColor,
        count: 42,
        speed: 620,
        size: 32,
        lifetime: 1.1,
        opacity: 0.9
      });
    }
    if (target === this.currentPlayer) {
      this.finalHealth[target.playerId] = 0;
    }
  }

  _handleAttack(player, input) {
    if (!player.isAlive) return false;
    if (!player.canFire() || !input.mouseDown) return false;

    const aim = this._aimDirection(player, input);
    const spawn = {
      x: player.position.x + aim.x * (player.width / 2),
      y: player.position.y + aim.y * (player.height / 2)
    };

    switch (player.character) {
      case 'ranger': {
        const stats = player.stats.shot;
        const shot = new RangerShot({
          x: spawn.x,
          y: spawn.y,
          direction: aim,
          ownerId: player.playerId,
          damage: stats.damage,
          speed: stats.speed
        });
        this.projectiles.push(shot);
        this._attachParticles(shot);
        this.particles.spawnBurst({
          position: spawn,
          colors: [0x5cffc8, 0x22d3ee, 0xc084fc],
          count: 14,
          speed: 540,
          lifetime: 0.35,
          size: 18,
          opacity: 0.85
        });
        this.recordingSession.recordProjectile({
          type: 'ranger-shot',
          position: { x: shot.position.x, y: shot.position.y },
          direction: aim,
          speed: stats.speed,
          damage: stats.damage
        });
        return true;
      }
      case 'wizard': {
        const stats = player.stats.bomb;
        const direction = this._lobDirection(aim);
        const bomb = new WizardBomb({
          x: spawn.x,
          y: spawn.y,
          direction,
          speed: stats.projectileSpeed,
          ownerId: player.playerId,
          stats
        });
        this.projectiles.push(bomb);
        this._attachParticles(bomb);
        this.particles.spawnBurst({
          position: spawn,
          colors: [0xffb347, 0xff7096, 0xffe066],
          count: 20,
          speed: 480,
          lifetime: 0.6,
          size: 26,
          opacity: 0.9
        });
        this.recordingSession.recordProjectile({
          type: 'wizard-bomb',
          position: { x: bomb.position.x, y: bomb.position.y },
          direction,
          speed: stats.projectileSpeed,
          damage: stats.damageCenter,
          damageOuter: stats.damageOuter,
          splashRadius: stats.splashRadius,
          fuse: stats.fuse,
          gravity: stats.gravity
        });
        return true;
      }
      case 'warrior': {
        const stats = player.stats;
        const slash = new WarriorSlash({
          origin: player.position,
          direction: aim,
          stats,
          ownerId: player.playerId
        });
        slash.hitTargets = new Set();
        this.projectiles.push(slash);
        this.recordingSession.recordProjectile({
          type: 'warrior-slash',
          origin: { x: player.position.x, y: player.position.y },
          direction: aim,
          damage: stats.melee.damage,
          width: stats.melee.width,
          height: stats.melee.height,
          lifetime: stats.melee.lifetime
        });
        this.particles.spawnBurst({
          position: player.position,
          color: player.playerId === 1 ? 0x5cff9b : 0xff6b6b,
          count: 18,
          speed: 260,
          size: 24,
          lifetime: 0.4
        });
        return true;
      }
      default:
        return false;
    }
  }

  _attachParticles(projectile) {
    const tint = projectile.ownerId === 1 ? 0x5cff9b : 0xff6b6b;
    this.particles.attachProjectile(projectile, {
      color: tint,
      rate:
        projectile.type === 'ranger-shot'
          ? 1 / 80
          : projectile.type === 'wizard-bomb'
            ? 1 / 28
            : 1 / 36,
      size: projectile.type === 'wizard-bomb' ? 32 : 18,
      speed: projectile.type === 'wizard-bomb' ? 360 : 220
    });
  }

  _aimDirection(player, input) {
    const dx = (input.mouseWorldX ?? player.position.x) - player.position.x;
    const dy = (input.mouseWorldY ?? player.position.y) - player.position.y;
    const length = Math.hypot(dx, dy) || 1;
    const dir = { x: dx / length, y: dy / length };
    player.updateFacing(input.mouseWorldX ?? player.position.x);
    return dir;
  }

  _lobDirection(direction) {
    const adjusted = { x: direction.x, y: direction.y - 0.25 };
    const length = Math.hypot(adjusted.x, adjusted.y) || 1;
    adjusted.x /= length;
    adjusted.y /= length;
    return adjusted;
  }

  _updateMouseWorld(inputState) {
    const rect = this.canvas.getBoundingClientRect();
    const ndcX = (inputState.mouseX / rect.width) * 2 - 1;
    const ndcY = -((inputState.mouseY / rect.height) * 2 - 1);
    this.mouseVector.set(ndcX, ndcY, 0.5);
    this.mouseVector.unproject(this.camera);
    inputState.mouseWorldX = this.mouseVector.x;
    inputState.mouseWorldY = this.mouseVector.y;
  }

  _render() {
    if (this.currentPlayer) {
      this.playerRenderer.update(this.currentPlayer);
    }
    this.ghosts.forEach((ghost) => this.playerRenderer.update(ghost));
    this.projectileRenderer.sync(this.projectiles);
    this.renderer.render(this.scene, this.camera);
  }

  _promptSelection() {
    const playerId = this._activePlayerId();
    const available = this._availableCharacters(playerId);
    const used = this.selections[playerId];
    this.uiRenderer.showCharacterSelection({
      playerId,
      available,
      used,
      onSelect: (character) => this._startCountdown(playerId, character)
    });
  }

  _startCountdown(playerId, character) {
    let count = 3;
    this.stage = 'countdown';
    this.uiRenderer.showCountdown(count);
    const interval = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        clearInterval(interval);
        this.uiRenderer.showCountdown('GO!');
        setTimeout(() => {
          this.uiRenderer.hideCountdown();
          this._beginTurn(playerId, character);
        }, 450);
      } else {
        this.uiRenderer.showCountdown(count);
      }
    }, 650);
  }

  _beginTurn(playerId, character) {
    const roundIndex = this.state.round - 1;
    this.selections[playerId][roundIndex] = character;
    const spawn = this.level.spawnPoints.find((point) => point.playerId === playerId) ?? {
      x: playerId === 1 ? 200 : CAMERA_WIDTH - 200,
      y: 680
    };

    this.currentPlayer = new Player({
      x: spawn.x,
      y: spawn.y,
      character,
      playerId,
      tint: PLAYER_META[playerId].tint
    });
    this.playerRenderer.createSpriteFor(this.currentPlayer);
    this.turnElapsed = 0;
    this.recordingSession = new RecordingSession({
      playerId,
      character,
      round: this.state.round
    });

    this.projectiles = [];
    this.particles.clear();
    this._spawnGhostsForTurn(playerId);
    this.stage = 'playing';
  }

  _spawnGhostsForTurn(playerId) {
    this.ghosts.forEach((ghost) => this.playerRenderer.remove(ghost));
    this.ghosts = [];

    const shouldSpawn = (recording) => {
      if (recording.round < this.state.round) return true;
      if (recording.round === this.state.round && recording.playerId !== playerId) return true;
      return false;
    };

    const allRecordings = [...this.recordings[1], ...this.recordings[2]];
    allRecordings
      .filter(shouldSpawn)
      .forEach((recording) => {
        const tint = PLAYER_META[recording.playerId].tint;
        const ghost = new Ghost({ recording, tint });
        this.ghosts.push(ghost);
        this.playerRenderer.createSpriteFor(ghost);
      });
  }

  _endTurn() {
    if (this.stage !== 'playing') return;
    this.stage = 'transition';

    const deathFrameIndex = this.currentPlayer.isAlive
      ? null
      : Math.floor(this.turnElapsed / FIXED_TIMESTEP);
    this.finalHealth[this.currentPlayer.playerId] = Math.max(0, this.currentPlayer.health);

    const recording = this.recordingSession.finish({
      deathFrameIndex,
      totalTime: this.turnElapsed
    });
    this.recordings[this.currentPlayer.playerId].push(recording);

    this.playerRenderer.remove(this.currentPlayer);
    this.currentPlayer = null;
    this.ghosts.forEach((ghost) => this.playerRenderer.remove(ghost));
    this.ghosts = [];
    this.projectiles = [];
    this.particles.clear();

    this._advanceTurn();
  }

  _advanceTurn() {
    if (this.state.turnIndex === 0) {
      this.state.turnIndex = 1;
    } else {
      this.state.turnIndex = 0;
      if (this.state.round < TOTAL_ROUNDS) {
        this.state.round += 1;
      } else {
        this._endGame();
        return;
      }
    }
    this.stage = 'selection';
    this._promptSelection();
  }

  _endGame() {
    const { player1, player2 } = this.scores;
    let winner;
    let detail = `Final score ${player1} - ${player2}`;
    if (player1 > player2) {
      winner = 'Player 1 wins the time war!';
    } else if (player2 > player1) {
      winner = 'Player 2 rewrites history!';
    } else {
      if (this.finalHealth[1] > this.finalHealth[2]) {
        winner = 'Player 1 survives the paradox!';
        detail += ' — Tiebreaker: remaining health';
      } else if (this.finalHealth[2] > this.finalHealth[1]) {
        winner = 'Player 2 survives the paradox!';
        detail += ' — Tiebreaker: remaining health';
      } else {
        winner = 'It’s a stalemate in spacetime!';
        detail += ' — Perfect tie';
      }
    }
    this.uiRenderer.showVictory({ winner, scores: this.scores, detail });
    this.stage = 'gameover';
  }

  _activePlayerId() {
    return this.state.turnIndex === 0 ? 1 : 2;
  }

  _availableCharacters(playerId) {
    const used = this.selections[playerId];
    return listCharacterTypes().filter((character) => !used.includes(character));
  }
}
