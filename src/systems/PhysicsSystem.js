const GRAVITY = 720;
const FRICTION = 0.8;

export class PhysicsSystem {
  constructor(level) {
    this.level = level;
  }

  updatePlayer(player, input, deltaSeconds) {
    const stats = player.stats;

    // Horizontal movement
    let targetVelocityX = 0;
    if (input.a) targetVelocityX -= stats.speed;
    if (input.d) targetVelocityX += stats.speed;
    player.velocity.x = targetVelocityX !== 0 ? targetVelocityX : player.velocity.x * FRICTION;

    // Jetpack & gravity
    const usingJetpack = input.w && player.jetpackFuel > 0;
    if (usingJetpack) {
      player.velocity.y -= stats.jetpackThrust * deltaSeconds;
      player.jetpackFuel = Math.max(0, player.jetpackFuel - deltaSeconds);
    } else {
      player.velocity.y += GRAVITY * deltaSeconds;
    }

    // Integrate position with collision
    const proposedX = player.position.x + player.velocity.x * deltaSeconds;
    const proposedY = player.position.y + player.velocity.y * deltaSeconds;

    const collisions = [...this.level.platforms, ...this.level.obstacles];

    // Horizontal sweep
    const originalX = player.position.x;
    player.position.x = proposedX;
    const horizontalCollision = collisions.find((rect) => this._intersects(player, rect));
    if (horizontalCollision) {
      if (player.velocity.x > 0) {
        player.position.x = horizontalCollision.x - player.width / 2;
      } else if (player.velocity.x < 0) {
        player.position.x = horizontalCollision.x + horizontalCollision.width + player.width / 2;
      }
      player.velocity.x = 0;
    }

    // Vertical sweep
    const originalY = player.position.y;
    player.position.y = proposedY;
    let grounded = false;
    const verticalCollision = collisions.find((rect) => this._intersects(player, rect));
    if (verticalCollision) {
      if (player.velocity.y > 0) {
        player.position.y = verticalCollision.y - player.height / 2;
        grounded = true;
      } else if (player.velocity.y < 0) {
        player.position.y = verticalCollision.y + verticalCollision.height + player.height / 2;
      }
      player.velocity.y = 0;
    }

    if (grounded && !usingJetpack) {
      player.jetpackFuel = Math.min(player.maxJetpackFuel, player.jetpackFuel + stats.jetpackRegen * deltaSeconds);
    }

    if (!horizontalCollision && !verticalCollision) {
      player.position.x = proposedX;
      player.position.y = proposedY;
    } else {
      if (!horizontalCollision) {
        player.position.x = proposedX;
      }
      if (!verticalCollision) {
        player.position.y = proposedY;
      }
    }

    if (input.mouseX !== undefined) {
      player.updateFacing(input.mouseWorldX ?? player.position.x);
    }

    player.tickCooldown(deltaSeconds);
  }

  updateProjectile(projectile, deltaSeconds) {
    projectile.update(deltaSeconds);
    const rects = [...this.level.platforms, ...this.level.obstacles];
    if (rects.some((rect) => this._projectileHits(projectile, rect))) {
      projectile.isAlive = false;
    }
  }

  _intersects(entity, rect) {
    const { left, right, top, bottom } = entity.bounds;
    return (
      right > rect.x &&
      left < rect.x + rect.width &&
      bottom > rect.y &&
      top < rect.y + rect.height
    );
  }

  _projectileHits(projectile, rect) {
    const px = projectile.position.x;
    const py = projectile.position.y;
    return (
      px + projectile.radius > rect.x &&
      px - projectile.radius < rect.x + rect.width &&
      py + projectile.radius > rect.y &&
      py - projectile.radius < rect.y + rect.height
    );
  }
}
