import { InputManager } from './InputManager.js';
import { LevelGenerator } from '../systems/LevelGenerator.js';
import { PhysicsSystem } from '../systems/PhysicsSystem.js';
import { Player } from '../entities/Player.js';
import { Projectile } from '../entities/Projectile.js';
import { AssetLoader } from '../rendering/AssetLoader.js';
import { LevelRenderer } from '../rendering/LevelRenderer.js';
import { PlayerRenderer } from '../rendering/PlayerRenderer.js';
import { ProjectileRenderer } from '../rendering/ProjectileRenderer.js';
import { UIRenderer } from '../rendering/UIRenderer.js';

const FIXED_TIMESTEP = 1 / 60;

export class GameManager {
  constructor({ canvas, uiRoot }) {
    this.canvas = canvas;
    this.uiRoot = uiRoot;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
    this.renderer.setSize(canvas.width, canvas.height);
    this.scene = new THREE.Scene();

    const aspect = canvas.width / canvas.height;
    const width = 1600;
    const height = width / aspect;
    this.camera = new THREE.OrthographicCamera(0, width, height, 0, -1000, 1000);
    this.camera.position.set(width / 2, height / 2, 10);
    this.camera.lookAt(width / 2, height / 2, 0);

    this.clock = new THREE.Clock();
    this.accumulator = 0;

    this.assetLoader = new AssetLoader();
    this.levelRenderer = new LevelRenderer(this.scene, null);
    this.playerRenderer = new PlayerRenderer(this.scene, this.assetLoader);
    this.projectileRenderer = new ProjectileRenderer(this.scene);
    this.uiRenderer = new UIRenderer(uiRoot);

    this.projectiles = [];
    this.player = null;
    this.physics = null;
    this.input = new InputManager(canvas);
    this.mouseVector = new THREE.Vector3();

    this._loadAssets().then(() => {
      this._initGame();
      this._loop();
    });
  }

  async _loadAssets() {
    const loads = [
      this.assetLoader.loadTexture('ranger-idle', 'assets/player1ranger.png').catch(() => null),
      this.assetLoader.loadTexture('wizard-idle', 'assets/player1wizard.png').catch(() => null),
      this.assetLoader.loadTexture('warrior-idle', 'assets/player1warrior.png').catch(() => null),
      this.assetLoader.loadTexture('landblock', 'assets/landblock.png').catch(() => null)
    ];

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
    const spawn = this.level.spawnPoints[0];
    this.player = new Player({ x: spawn.x, y: spawn.y, character: 'ranger' });
    this.playerRenderer.createSpriteFor(this.player);
  }

  _loop() {
    requestAnimationFrame(() => this._loop());
    const delta = this.clock.getDelta();
    this.accumulator += delta;

    while (this.accumulator >= FIXED_TIMESTEP) {
      this._step(FIXED_TIMESTEP);
      this.accumulator -= FIXED_TIMESTEP;
    }

    this._render();
  }

  _step(deltaSeconds) {
    const inputState = this.input.getState();
    this._updateMouseWorld(inputState);
    this.physics.updatePlayer(this.player, inputState, deltaSeconds);

    if (inputState.mouseDown && this.player.canFire()) {
      this._spawnProjectile(inputState);
      this.player.triggerCooldown();
    }

    this.projectiles = this.projectiles.filter((proj) => proj.isAlive);
    this.projectiles.forEach((projectile) => {
      this.physics.updateProjectile(projectile, deltaSeconds);
    });

    this.uiRenderer.update(this.player);
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

  _spawnProjectile(inputState) {
    const origin = { x: this.player.position.x, y: this.player.position.y };
    const dx = inputState.mouseWorldX - origin.x;
    const dy = inputState.mouseWorldY - origin.y;
    const length = Math.hypot(dx, dy) || 1;
    const dirX = dx / length;
    const dirY = dy / length;
    const speed = this.player.stats.projectileSpeed;
    const projectile = new Projectile({
      x: origin.x + dirX * (this.player.width / 2),
      y: origin.y + dirY * (this.player.height / 2),
      velocity: { x: dirX * speed, y: dirY * speed },
      lifetime: 3,
      radius: 8
    });
    this.projectiles.push(projectile);
  }

  _render() {
    this.playerRenderer.update(this.player);
    this.projectileRenderer.sync(this.projectiles);
    this.renderer.render(this.scene, this.camera);
  }
}
