import { Player } from './Player.js';

const FIXED_TIMESTEP = 1 / 60;

export class Ghost extends Player {
  constructor({ recording, tint }) {
    const firstFrame = recording.frames[0];
    super({
      x: firstFrame?.state?.position?.x ?? 0,
      y: firstFrame?.state?.position?.y ?? 0,
      character: recording.character,
      playerId: recording.playerId,
      tint,
      isGhost: true
    });
    this.recording = recording;
    this.elapsed = 0;
    this.frameIndex = 0;
    this.finished = false;
    this.nextProjectileIndex = 0;
  }

  step(deltaSeconds, physicsSystem) {
    if (!this.isAlive || this.finished) return null;

    this.elapsed += deltaSeconds;
    const frame = this._getFrameForElapsed();
    if (!frame) {
      this.finished = true;
      return null;
    }

    if (this.recording.deathFrameIndex !== null && this.frameIndex >= this.recording.deathFrameIndex) {
      this.isAlive = false;
      this.finished = true;
      return null;
    }

    physicsSystem.updatePlayer(this, frame.input, deltaSeconds);
    this.facingDirection = frame.state.facing;
    return frame;
  }

  collectPendingProjectiles() {
    if (!this.isAlive) return [];
    const ready = [];
    while (this.nextProjectileIndex < this.recording.projectiles.length) {
      const projectileRecord = this.recording.projectiles[this.nextProjectileIndex];
      if (projectileRecord.frameIndex <= this.frameIndex) {
        ready.push(projectileRecord);
        this.nextProjectileIndex += 1;
      } else {
        break;
      }
    }
    return ready;
  }

  _getFrameForElapsed() {
    if (!this.recording.frames.length) return null;
    const frameIdx = Math.min(
      Math.floor(this.elapsed / FIXED_TIMESTEP),
      this.recording.frames.length - 1
    );
    this.frameIndex = frameIdx;
    return this.recording.frames[frameIdx];
  }
}
