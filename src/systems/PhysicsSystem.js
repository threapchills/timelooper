const GRAVITY = 760;
const AIR_DRAG = 0.86;
const GROUND_FRICTION = 0.72;

function copyRect(rect) {
  return {
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height
  };
}

export class PhysicsSystem {
  constructor(level) {
    this.level = level;
  }

  updatePlayer(player, input, deltaSeconds) {
    const stats = player.stats;

    if (input.a) {
      player.velocity.x -= stats.acceleration * deltaSeconds;
    }
    if (input.d) {
      player.velocity.x += stats.acceleration * deltaSeconds;
    }

    const maxSpeed = stats.speed;
    if (!input.a && !input.d) {
      const drag = player.isGrounded ? GROUND_FRICTION : AIR_DRAG;
      player.velocity.x *= drag;
    }
    player.velocity.x = Math.max(-maxSpeed, Math.min(maxSpeed, player.velocity.x));

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

    const collisions = [...this.level.platforms.map(copyRect), ...this.level.obstacles.map(copyRect)];

    // Horizontal sweep
    player.position.x = proposedX;
    let horizontalCollision = false;
    for (const rect of collisions) {
      if (!this._intersects(player, rect)) continue;
      horizontalCollision = true;
      if (player.velocity.x > 0) {
        player.position.x = rect.x - player.width / 2 - 0.01;
      } else if (player.velocity.x < 0) {
        player.position.x = rect.x + rect.width + player.width / 2 + 0.01;
      }
      player.velocity.x = 0;
      break;
    }

    // Vertical sweep
    player.position.y = proposedY;
    let grounded = false;
    let verticalCollision = false;
    for (const rect of collisions) {
      if (!this._intersects(player, rect)) continue;
      verticalCollision = true;
      if (player.velocity.y > 0) {
        player.position.y = rect.y - player.height / 2 - 0.01;
        grounded = true;
      } else if (player.velocity.y < 0) {
        player.position.y = rect.y + rect.height + player.height / 2 + 0.01;
      }
      player.velocity.y = 0;
      break;
    }

    if (grounded && !usingJetpack) {
      player.jetpackFuel = Math.min(player.maxJetpackFuel, player.jetpackFuel + stats.jetpackRegen * deltaSeconds);
    }

    if (!horizontalCollision) {
      player.position.x = proposedX;
    }
    if (!verticalCollision) {
      player.position.y = proposedY;
    }

    player.position.x = Math.max(player.width / 2, Math.min(this.level.width - player.width / 2, player.position.x));
    player.position.y = Math.max(player.height / 2, Math.min(this.level.height - player.height / 2, player.position.y));

    player.isGrounded = grounded;

    if (input.mouseX !== undefined) {
      player.updateFacing(input.mouseWorldX ?? player.position.x);
    }

    player.tickCooldown(deltaSeconds);
  }

  updateProjectile(projectile, deltaSeconds) {
    projectile.update(deltaSeconds);
    const rects = [...this.level.platforms, ...this.level.obstacles];
    if (rects.some((rect) => this._projectileHits(projectile, rect))) {
      if (projectile.type === 'wizard-bomb') {
        projectile.shouldExplode = true;
      }
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

  resolveActorCollisions(actors) {
    for (let i = 0; i < actors.length; i += 1) {
      for (let j = i + 1; j < actors.length; j += 1) {
        const a = actors[i];
        const b = actors[j];
        if (!a.isAlive || !b.isAlive) continue;
        if (this._entitiesOverlap(a, b)) {
          this._separateEntities(a, b);
        }
      }
    }
  }

  _entitiesOverlap(a, b) {
    return (
      a.bounds.left < b.bounds.right &&
      a.bounds.right > b.bounds.left &&
      a.bounds.top < b.bounds.bottom &&
      a.bounds.bottom > b.bounds.top
    );
  }

  _separateEntities(a, b) {
    const overlapX = Math.min(a.bounds.right, b.bounds.right) - Math.max(a.bounds.left, b.bounds.left);
    const overlapY = Math.min(a.bounds.bottom, b.bounds.bottom) - Math.max(a.bounds.top, b.bounds.top);

    if (overlapX <= 0 || overlapY <= 0) return;

    if (overlapX < overlapY) {
      const direction = a.position.x < b.position.x ? -1 : 1;
      a.position.x += (overlapX / 2) * direction;
      b.position.x -= (overlapX / 2) * direction;
      a.velocity.x = 0;
      b.velocity.x = 0;
    } else {
      const direction = a.position.y < b.position.y ? -1 : 1;
      a.position.y += (overlapY / 2) * direction;
      b.position.y -= (overlapY / 2) * direction;
      if (direction < 0) {
        a.velocity.y = Math.min(0, a.velocity.y);
        b.velocity.y = Math.max(0, b.velocity.y);
      } else {
        a.velocity.y = Math.max(0, a.velocity.y);
        b.velocity.y = Math.min(0, b.velocity.y);
      }
    }
  }
}
