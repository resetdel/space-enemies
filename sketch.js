// Game variables
let player, enemies = [], playerBullets = [], enemyBullets = [], explosions = [], stars = [];
let score = 0, level = 1, gameOver = false, groupX = 0, groupY = 0, groupDirection = 1, groupSpeed = 50;
let highScore = localStorage.getItem('highScore') || 0;
let boss = null, bossHealth = 100, weaponType = 0; // 0: standard, 1: spread, 2: laser
let playerHealth = 100, maxPlayerHealth = 100;

// Player class with health bar
class Player {
  constructor() {
    this.x = width / 2;
    this.y = height - 40;
    this.width = 30;
    this.height = 30;
    this.lastShot = -12;
    this.engineGlow = 0;
    this.glowDirection = 1;
    this.health = playerHealth;
  }

  draw() {
    this.engineGlow += 0.05 * this.glowDirection;
    if (this.engineGlow > 1 || this.engineGlow < 0) this.glowDirection *= -1;
    noStroke();
    fill(50, 50, 150); // Body
    beginShape();
    vertex(this.x, this.y - this.height / 2);
    vertex(this.x - this.width / 2, this.y + this.height / 2);
    vertex(this.x + this.width / 2, this.y + this.height / 2);
    endShape(CLOSE);
    fill(200, 200, 255); // Cockpit
    ellipse(this.x, this.y - 5, 10, 10);
    fill(100, 100, 200); // Wings
    triangle(this.x - 15, this.y + 10, this.x - 25, this.y + 20, this.x - 5, this.y + 20);
    triangle(this.x + 15, this.y + 10, this.x + 25, this.y + 20, this.x + 5, this.y + 20);
    fill(255, 165, 0, 100 + this.engineGlow * 155); // Engine glow
    ellipse(this.x, this.y + 15, 10, 20);
    // Health bar
    fill(255, 0, 0);
    rect(this.x - this.width / 2, this.y - this.height / 2 - 10, this.width, 5);
    fill(0, 255, 0);
    rect(this.x - this.width / 2, this.y - this.height / 2 - 10, map(this.health, 0, maxPlayerHealth, 0, this.width), 5);
  }

  move(left, right) {
    let speed = 200;
    if (left) this.x -= speed * (deltaTime / 1000);
    if (right) this.x += speed * (deltaTime / 1000);
    this.x = constrain(this.x, this.width / 2, width - this.width / 2);
  }

  shoot() {
    if (frameCount - this.lastShot > 12) {
      if (weaponType === 0) { // Standard
        playerBullets.push(new Bullet(this.x, this.y - this.height / 2, 1, color(0, 255, 0)));
      } else if (weaponType === 1) { // Spread
        for (let i = -1; i <= 1; i++) {
          playerBullets.push(new Bullet(this.x, this.y - this.height / 2, 1, color(0, 255, 0), i * 0.1));
        }
      } else if (weaponType === 2) { // Laser
        playerBullets.push(new Laser(this.x, this.y - this.height / 2));
      }
      this.lastShot = frameCount;
    }
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) gameOver = true;
  }
}

// Enemy class
class Enemy {
  constructor(x, y) {
    this.initialX = x;
    this.initialY = y;
    this.width = 30;
    this.height = 20;
    this.wingAngle = 0;
  }

  update() {
    this.wingAngle += 0.1;
    if (random() < 0.005) {
      enemyBullets.push(new Bullet(this.initialX + groupX, this.initialY + groupY + this.height / 2, -1, color(255, 0, 0)));
    }
  }

  draw() {
    let x = this.initialX + groupX, y = this.initialY + groupY;
    fill(100, 100, 100); // Body
    rect(x - 15, y - 10, 30, 20);
    fill(150, 150, 150); // Wings
    push();
    translate(x - 15, y);
    rotate(sin(this.wingAngle) * 0.2);
    triangle(0, 0, -10, 10, 5, 10);
    pop();
    push();
    translate(x + 15, y);
    rotate(-sin(this.wingAngle) * 0.2);
    triangle(0, 0, 10, 10, -5, 10);
    pop();
    fill(200, 200, 200); // Cockpit
    ellipse(x, y - 5, 8, 8);
    fill(255, 0, 0); // Engines
    rect(x - 12, y + 10, 4, 2);
    rect(x + 8, y + 10, 4, 2);
    fill(255, 100, 0, 100); // Engine trails
    ellipse(x - 10, y + 11, 6, 3);
    ellipse(x + 10, y + 11, 6, 3);
  }
}

// Boss class with multi-phase behavior
class Boss {
  constructor() {
    this.x = width / 2;
    this.y = 50;
    this.width = 60;
    this.height = 50;
    this.speed = 100;
    this.direction = 1;
    this.health = bossHealth;
    this.lastShot = 0;
    this.phase = 1;
  }

  update() {
    this.x += this.speed * this.direction * (deltaTime / 1000);
    if (this.x - this.width / 2 < 0 || this.x + this.width / 2 > width) this.direction *= -1;
    if (this.health < bossHealth / 2 && this.phase === 1) {
      this.phase = 2;
      this.speed *= 1.5; // Faster in phase 2
    }
    if (frameCount - this.lastShot > 60) {
      for (let i = 0; i < (this.phase === 1 ? 3 : 5); i++) { // More shots in phase 2
        setTimeout(() => {
          enemyBullets.push(new Bullet(this.x, this.y + this.height / 2, -1, color(255, 0, 0)));
        }, i * 200);
      }
      this.lastShot = frameCount;
    }
  }

  draw() {
    fill(80, 80, 80); // Body
    rect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
    fill(0, 255, 0); // Core
    ellipse(this.x, this.y - 10, 20, 20);
    fill(200, 0, 0); // Weapons
    rect(this.x - 25, this.y + 10, 5, 15);
    rect(this.x + 20, this.y + 10, 5, 15);
    fill(255, 100, 0, 100); // Engine trails
    ellipse(this.x - 25, this.y + this.height / 2, 15, 5);
    ellipse(this.x + 25, this.y + this.height / 2, 15, 5);
    fill(255, 0, 0); // Health bar background
    rect(this.x - this.width / 2, this.y - this.height / 2 - 10, this.width, 5);
    fill(0, 255, 0); // Health bar
    rect(this.x - this.width / 2, this.y - this.height / 2 - 10, map(this.health, 0, bossHealth, 0, this.width), 5);
  }

  takeDamage() {
    if (this.health > 0) this.health -= 10;
    if (this.health <= 0) {
      score += 50;
      explosions.push(new Explosion(this.x, this.y));
      boss = null;
      levelUp(); // Advance to next level
    }
  }
}

// Bullet class with angle for spread shot
class Bullet {
  constructor(x, y, direction, color, angle = 0) {
    this.x = x;
    this.y = y;
    this.direction = direction;
    this.color = color;
    this.speed = 300;
    this.angle = angle;
  }

  update() {
    this.y -= this.direction * this.speed * (deltaTime / 1000);
    this.x += this.angle * this.speed * (deltaTime / 1000);
  }

  draw() {
    fill(this.color);
    noStroke();
    circle(this.x, this.y, 4);
  }
}

// Laser class for piercing shots
class Laser {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 5;
    this.height = height;
  }

  update() {
    // Laser is instant, no movement
  }

  draw() {
    fill(255, 0, 0, 150);
    noStroke();
    rect(this.x - this.width / 2, 0, this.width, this.height);
  }
}

// Explosion class
class Explosion {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.particles = [];
    for (let i = 0; i < 30; i++) {
      this.particles.push({ x: 0, y: 0, vx: random(-4, 4), vy: random(-4, 4), size: random(4, 8), alpha: 255 });
    }
  }

  update() {
    for (let p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.size -= 0.1;
      p.alpha -= 5;
      if (p.alpha < 0) p.alpha = 0;
    }
    this.particles = this.particles.filter(p => p.alpha > 0);
  }

  draw() {
    noStroke();
    for (let p of this.particles) {
      fill(255, 165, 0, p.alpha);
      circle(this.x + p.x, this.y + p.y, p.size);
    }
  }
}

// Setup function
function setup() {
  createCanvas(600, 400);
  player = new Player();
  spawnEnemies();
  for (let i = 0; i < 150; i++) {
    stars.push({ x: random(width), y: random(height), size: random(1, 3), speed: random(0.5, 2) });
  }
}

// Function to spawn enemies based on level
function spawnEnemies() {
  enemies = [];
  for (let row = 0; row < 3 + level; row++) { // More rows with higher levels
    for (let col = 0; col < 5; col++) {
      enemies.push(new Enemy(100 + col * 60, 50 + row * 40));
    }
  }
}

// Function to advance to next level
function levelUp() {
  level++;
  groupX = 0;
  groupY = 0;
  groupDirection = 1;
  groupSpeed += 10 * level; // Increase speed with level
  spawnEnemies();
  // Unlock new weapons
  if (level === 2) weaponType = 1; // Spread shot
  if (level === 3) weaponType = 2; // Laser
}

// Draw function
function draw() {
  if (!gameOver) {
    // Animated background based on level
    if (level === 1) {
      background(0, 0, 50); // Dark blue
      for (let star of stars) {
        star.y += star.speed;
        if (star.y > height) star.y = 0;
        fill(255);
        circle(star.x, star.y, star.size);
      }
    } else if (level === 2) {
      background(10, 0, 40);
      for (let star of stars) {
        star.y += star.speed * 1.5; // Faster stars
        if (star.y > height) star.y = 0;
        fill(255, 255, 150); // Yellowish stars
        circle(star.x, star.y, star.size);
      }
    } else {
      background(20, 0, 30);
      for (let star of stars) {
        star.y += star.speed * 2; // Even faster
        if (star.y > height) star.y = 0;
        fill(255, 150, 150); // Reddish stars
        circle(star.x, star.y, star.size);
      }
    }

    if (keyIsDown(LEFT_ARROW)) player.move(true, false);
    if (keyIsDown(RIGHT_ARROW)) player.move(false, true);
    if (keyIsDown(32)) player.shoot();

    if (!boss) {
      groupX += groupSpeed * groupDirection * (deltaTime / 1000);
      let leftmost = 100 - 15 + groupX, rightmost = 100 + 4 * 60 + 15 + groupX;
      if (leftmost < 0 || rightmost > width) {
        groupDirection *= -1;
        groupY += 20;
      }
    }

    for (let enemy of enemies) {
      enemy.update();
      enemy.draw();
    }

    if (score >= 15 * level && !boss && enemies.length === 0) boss = new Boss();
    if (boss) {
      boss.update();
      boss.draw();
    }

    for (let i = playerBullets.length - 1; i >= 0; i--) {
      let bullet = playerBullets[i];
      bullet.update();
      bullet.draw();
      if (bullet.y < 0) {
        playerBullets.splice(i, 1);
      } else {
        for (let j = enemies.length - 1; j >= 0; j--) {
          let enemy = enemies[j], ex = enemy.initialX + groupX, ey = enemy.initialY + groupY;
          if (bullet.x > ex - enemy.width / 2 && bullet.x < ex + enemy.width / 2 &&
              bullet.y > ey - enemy.height / 2 && bullet.y < ey + enemy.height / 2) {
            playerBullets.splice(i, 1);
            enemies.splice(j, 1);
            score += 1;
            explosions.push(new Explosion(ex, ey));
            break;
          }
        }
        if (boss && bullet.y < boss.y + boss.height / 2 && bullet.y > boss.y - boss.height / 2 &&
            bullet.x > boss.x - boss.width / 2 && bullet.x < boss.x + boss.width / 2) {
          playerBullets.splice(i, 1);
          boss.takeDamage();
        }
      }
    }

    for (let i = enemyBullets.length - 1; i >= 0; i--) {
      let bullet = enemyBullets[i];
      bullet.update();
      bullet.draw();
      if (bullet.y > height) {
        enemyBullets.splice(i, 1);
      } else if (bullet.x > player.x - player.width / 2 && bullet.x < player.x + player.width / 2 &&
                 bullet.y > player.y - player.height / 2 && bullet.y < player.y + player.height / 2) {
        player.takeDamage(10);
        enemyBullets.splice(i, 1);
      }
    }

    for (let i = explosions.length - 1; i >= 0; i--) {
      let explosion = explosions[i];
      explosion.update();
      explosion.draw();
      if (explosion.particles.length === 0) explosions.splice(i, 1);
    }

    player.draw();

    fill(255);
    textSize(16);
    text("Score: " + score, 10, 20);
    text("Level: " + level, 10, 40);
    if (weaponType === 1) text("Weapon: Spread Shot", 10, 60);
    else if (weaponType === 2) text("Weapon: Laser", 10, 60);
  } else {
    fill(255);
    textSize(32);
    textAlign(CENTER);
    text("Game Over", width / 2, height / 2 - 40);
    textSize(16);
    text("Score: " + score, width / 2, height / 2);
    text("High Score: " + highScore, width / 2, height / 2 + 30);
    text("Press R to restart", width / 2, height / 2 + 60);
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('highScore', highScore);
    }
  }
}

// Handle key presses for restarting
function keyPressed() {
  if (gameOver && (key === "r" || key === "R")) {
    player = new Player();
    enemies = [];
    playerBullets = [];
    enemyBullets = [];
    explosions = [];
    score = 0;
    level = 1;
    gameOver = false;
    groupX = 0;
    groupY = 0;
    groupDirection = 1;
    groupSpeed = 50;
    boss = null;
    weaponType = 0;
    playerHealth = 100;
    spawnEnemies();
  }
}