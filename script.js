// ===== Canvas =====
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 600;
canvas.height = 400;

// ===== Assets (images) =====
const playerImg = new Image();
playerImg.src = "player.png";   // put player.png in same folder

const enemyImg = new Image();
enemyImg.src = "enemy.png";     // put enemy.png in same folder

// ===== Audio =====
const bgMusic = new Audio("bgmusic.mp3");  // put bgmusic.mp3 in same folder
bgMusic.loop = true;
bgMusic.volume = 0.5;

const gunSound = new Audio("gun.mp3");     // put gun.mp3 in same folder
gunSound.volume = 0.7;

let audioStarted = false;
function maybeStartAudio() {
  if (audioStarted) return;
  audioStarted = true;
  // try to play; some browsers block until gesture — this runs on first gesture
  bgMusic.currentTime = 0;
  bgMusic.play().catch(() => {});
}

// ===== Game State =====
const player = {
  x: canvas.width / 2 - 20,
  y: canvas.height - 30,
  width: 40,
  height: 20,
  speed: 5
};

let bullets = [];
let enemies = [];
let enemyDirection = 1; // 1 => right, -1 => left
let enemySpeed = 1;
let enemyDrop = 20;

let level = 1;
let lives = 3;
let score = 0;
let gameOver = false;

let timeLeft = 60;  // 1 minute
let timerInterval = null;

const enemyRowsBase = 3;
const enemyCols = 7;

// ===== Helpers =====
function createEnemies(rows = enemyRowsBase) {
  enemies = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < enemyCols; c++) {
      enemies.push({
        x: 80 + c * 60,
        y: 30 + r * 40,
        width: 40,
        height: 20,
        alive: true
      });
    }
  }
}

function resetWave() {
  bullets = [];
  enemyDirection = 1;
  createEnemies(enemyRowsBase);
}

function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (!gameOver) {
      timeLeft--;
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        endGame();
      }
    }
  }, 1000);
}

function startGame() {
  score = 0;
  level = 1;
  lives = 3;
  timeLeft = 60;
  gameOver = false;
  bullets = [];
  enemySpeed = 1;
  enemyDirection = 1;

  player.x = canvas.width / 2 - player.width / 2;

  createEnemies(enemyRowsBase);
  startTimer();

  // try play music (may be blocked until first input)
  bgMusic.currentTime = 0;
  bgMusic.play().catch(() => { /* will start on first gesture */ });

  requestAnimationFrame(gameLoop);
}

function endGame() {
  gameOver = true;
  clearInterval(timerInterval);
  bgMusic.pause();
  bgMusic.currentTime = 0;
}

function nextLevel() {
  level++;
  enemySpeed += 0.5; // increase difficulty
  // Optional: add more rows every 2 levels
  // const extraRows = 0; // tweak if you want
  createEnemies(enemyRowsBase);
}

function loseLife() {
  lives--;
  if (lives <= 0) {
    endGame();
  } else {
    resetWave();
  }
}

// ===== Input (Keyboard) =====
let rightPressed = false;
let leftPressed = false;

document.addEventListener("keydown", (e) => {
  maybeStartAudio();
  if (gameOver && (e.key === "Enter" || e.key === " ")) {
    startGame();
    return;
  }
  if (e.key === "ArrowRight") rightPressed = true;
  if (e.key === "ArrowLeft") leftPressed = true;
  if (e.key === " ") shoot();
});

document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowRight") rightPressed = false;
  if (e.key === "ArrowLeft") leftPressed = false;
});

// ===== Input (Touch & Mouse Buttons) =====
function addControl(buttonId, onPress, onRelease) {
  const btn = document.getElementById(buttonId);

  // Touch
  btn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    maybeStartAudio();
    onPress();
  }, { passive: false });

  btn.addEventListener("touchend", (e) => {
    e.preventDefault();
    if (onRelease) onRelease();
  }, { passive: false });

  btn.addEventListener("touchcancel", (e) => {
    e.preventDefault();
    if (onRelease) onRelease();
  }, { passive: false });

  // Mouse
  btn.addEventListener("mousedown", () => { maybeStartAudio(); onPress(); });
  btn.addEventListener("mouseup", () => { if (onRelease) onRelease(); });
  btn.addEventListener("mouseleave", () => { if (onRelease) onRelease(); });
}

addControl("leftBtn", () => leftPressed = true, () => leftPressed = false);
addControl("rightBtn", () => rightPressed = true, () => rightPressed = false);
addControl("fireBtn", () => shoot());

// Also allow tap anywhere on canvas to start audio / restart
canvas.addEventListener("touchstart", maybeStartAudio, { passive: true });
canvas.addEventListener("mousedown", maybeStartAudio);

// ===== Shooting =====
let lastShotTime = 0;
const shotCooldownMs = 180; // small cooldown

function shoot() {
  if (gameOver || timeLeft <= 0) return;

  const now = performance.now();
  if (now - lastShotTime < shotCooldownMs) return;
  lastShotTime = now;

  // sound
  try {
    gunSound.currentTime = 0;
    gunSound.play().catch(()=>{});
  } catch (_) {}

  bullets.push({
    x: player.x + player.width / 2 - 2,
    y: player.y,
    width: 4,
    height: 10,
    speed: 6
  });
}

// ===== Enemy Movement =====
function moveEnemies() {
  let hitEdge = false;

  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    enemy.x += enemyDirection * enemySpeed;
    if (enemy.x <= 0 || enemy.x + enemy.width >= canvas.width) {
      hitEdge = true;
    }
  }

  if (hitEdge) {
    enemyDirection *= -1;
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      enemy.y += enemyDrop;
      // If any enemy reaches player's line -> lose a life
      if (enemy.y + enemy.height >= player.y) {
        loseLife();
        break;
      }
    }
  }
}

// ===== HUD =====
function drawUI() {
  ctx.fillStyle = "white";
  ctx.font = "16px Arial";
  ctx.fillText("Score: " + score, 10, 20);
  ctx.fillText("Lives: " + lives, 130, 20);
  ctx.fillText("Level: " + level, 220, 20);
  ctx.fillText("Time: " + timeLeft, 320, 20);
}

// ===== Game Loop =====
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (gameOver) {
    // draw final screen
    ctx.fillStyle = "red";
    ctx.font = "30px Arial";
    ctx.fillText("GAME OVER", canvas.width/2 - 100, canvas.height/2 - 10);
    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    ctx.fillText("Final Score: " + score, canvas.width/2 - 60, canvas.height/2 + 20);
    ctx.fillText("Press Enter / Tap to Restart", canvas.width/2 - 120, canvas.height/2 + 45);
    return; // stop the loop
  }

  // Move player
  if (rightPressed && player.x < canvas.width - player.width) player.x += player.speed;
  if (leftPressed  && player.x > 0)                             player.x -= player.speed;

  // Draw player (fallback to rect if image not loaded)
  if (playerImg.complete && playerImg.naturalWidth > 0) {
    ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
  } else {
    ctx.fillStyle = "lime";
    ctx.fillRect(player.x, player.y, player.width, player.height);
  }

  // Move & draw bullets
  ctx.fillStyle = "red";
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.y -= b.speed;
    ctx.fillRect(b.x, b.y, b.width, b.height);
    if (b.y < -b.height) bullets.splice(i, 1);
  }

  // Move & draw enemies
  moveEnemies();
  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    if (enemyImg.complete && enemyImg.naturalWidth > 0) {
      ctx.drawImage(enemyImg, enemy.x, enemy.y, enemy.width, enemy.height);
    } else {
      ctx.fillStyle = "white";
      ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    }
  }

  // Bullet-Enemy collisions (iterate backwards for safe splices)
  for (let bi = bullets.length - 1; bi >= 0; bi--) {
    const bullet = bullets[bi];
    for (let ei = 0; ei < enemies.length; ei++) {
      const enemy = enemies[ei];
      if (!enemy.alive) continue;
      if (
        bullet.x < enemy.x + enemy.width &&
        bullet.x + bullet.width > enemy.x &&
        bullet.y < enemy.y + enemy.height &&
        bullet.y + bullet.height > enemy.y
      ) {
        enemy.alive = false;
        bullets.splice(bi, 1);
        score += 10;
        break; // bullet consumed
      }
    }
  }

  // Level cleared?
  if (enemies.every(e => !e.alive)) {
    nextLevel();
  }

  // HUD
  drawUI();

  requestAnimationFrame(gameLoop);
}

// ===== Restart on tap/enter when over =====
document.addEventListener("keydown", (e) => {
  if (gameOver && (e.key === "Enter" || e.key === " ")) startGame();
});
canvas.addEventListener("touchstart", () => { if (gameOver) startGame(); }, { passive: true });
canvas.addEventListener("mousedown",   () => { if (gameOver) startGame(); });

// ===== Start =====
window.onload = () => {
  startGame();
};
