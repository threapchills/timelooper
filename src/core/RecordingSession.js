export class RecordingSession {
  constructor({ playerId, character, round }) {
    this.playerId = playerId;
    this.character = character;
    this.round = round;
    this.frames = [];
    this.projectiles = [];
    this.duration = 0;
    this._frameIndex = 0;
  }

  captureFrame({
    time,
    input,
    player,
    fireEvent = false
  }) {
    this.frames.push({
      index: this._frameIndex,
      time,
      input: {
        w: !!input.w,
        a: !!input.a,
        s: !!input.s,
        d: !!input.d,
        mouseDown: !!input.mouseDown,
        mouseWorldX: input.mouseWorldX ?? player.position.x,
        mouseWorldY: input.mouseWorldY ?? player.position.y
      },
      fireEvent,
      state: {
        position: { x: player.position.x, y: player.position.y },
        velocity: { x: player.velocity.x, y: player.velocity.y },
        health: player.health,
        jetpackFuel: player.jetpackFuel,
        facing: player.facingDirection
      }
    });

    this._frameIndex += 1;
    this.duration = time;
  }

  recordProjectile(event) {
    this.projectiles.push({
      ...event,
      frameIndex: Math.max(0, this._frameIndex)
    });
  }

  finish({ deathFrameIndex = null, totalTime }) {
    this.duration = totalTime ?? this.duration;
    return {
      playerId: this.playerId,
      character: this.character,
      round: this.round,
      frames: this.frames,
      projectiles: this.projectiles,
      duration: this.duration,
      deathFrameIndex
    };
  }
}
