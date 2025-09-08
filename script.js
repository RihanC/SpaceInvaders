// Load images
const playerImg = new Image();
playerImg.src = "player.png";

const enemyImg = new Image();
enemyImg.src = "enemy.png";



const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 600;
canvas.height = 400;

// Player
const player = {
  x: canvas.width / 2 - 20,
  y: canvas.height - 30,
  width: 40,
  height: 20,
  speed: 5
};

let bullets = [];
let enemies = [];
let enemyDirection = 1; // 1 = right, -1 = left
let enemySpeed = 1;
let enemyDrop = 20;
let level = 1;
let lives = 3;
let gameOver = false;

const enemyRows = 3;
const enemyCols = 7;

// Create enemies
function createEnemies() {
  enemies = [];
  for (let r = 0; r < enemyRows; r++) {
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
createEnemies();

// Movement controls
let rightPressed = false;
let leftPressed = false;
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") rightPressed = true;
  if (e.key === "ArrowLeft") leftPressed = true;
  if (e.key === " ") shoot();
});
document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowRight") rightPressed = false;
  if (e.key === "ArrowLeft") leftPressed = false;
});

// Shooting
function shoot() {
  bullets.push({
    x: player.x + player.width/2 - 2,
    y: player.y,
    width: 4,
    height: 10
  });
}

// Touch & Click controls
function addControl(buttonId, onPress, onRelease) {
  const btn = document.getElementById(buttonId);

  btn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    onPress();
  });
  btn.addEventListener("touchend", (e) => {
    e.preventDefault();
    if (onRelease) onRelease();
  });

  btn.addEventListener("mousedown", onPress);
  btn.addEventListener("mouseup", () => {
    if (onRelease) onRelease();
  });
}
addControl("leftBtn", () => leftPressed = true, () => leftPressed = false);
addControl("rightBtn", () => rightPressed = true, () => rightPressed = false);
addControl("fireBtn", () => shoot());

// --- Enemy Movement ---
function moveEnemies() {
  let hitEdge = false;

  enemies.forEach(enemy => {
    if (enemy.alive) {
      enemy.x += enemyDirection * enemySpeed;
      if (enemy.x <= 0 || enemy.x + enemy.width >= canvas.width) {
        hitEdge = true;
      }
    }
  });

  if (hitEdge) {
    enemyDirection *= -1;
    enemies.forEach(enemy => {
      enemy.y += enemyDrop;
      if (enemy.y + enemy.height >= player.y) {
        loseLife();
      }
    });
  }
}

// --- Lose Life / Game Over ---
function loseLife() {
  lives--;
  if (lives <= 0) {
    gameOver = true;
  } else {
    createEnemies(); // restart enemies for new wave
  }
}

// --- Next Level ---
function nextLevel() {
  level++;
  enemySpeed += 0.5; // increase difficulty
  createEnemies();
}

// --- Draw UI ---
function drawUI() {
  ctx.fillStyle = "white";
  ctx.font = "16px Arial";
  ctx.fillText("Lives: " + lives, 10, 20);
  ctx.fillText("Level: " + level, canvas.width - 100, 20);
}

// --- Game Loop ---
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (gameOver) {
    ctx.fillStyle = "red";
    ctx.font = "30px Arial";
    ctx.fillText("GAME OVER", canvas.width/2 - 100, canvas.height/2);
    return;
  }

  // Move player
  if (rightPressed && player.x < canvas.width - player.width) player.x += player.speed;
  if (leftPressed && player.x > 0) player.x -= player.speed;

  // Draw player
  ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);


  // Move and draw bullets
  ctx.fillStyle = "red";
  bullets.forEach((bullet, i) => {
    bullet.y -= 5;
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    if (bullet.y < 0) bullets.splice(i, 1);
  });

  // Move and draw enemies
  moveEnemies();
  enemies.forEach((enemy) => {
  if (enemy.alive) {
    ctx.drawImage(enemyImg, enemy.x, enemy.y, enemy.width, enemy.height);
  }
});


  // Bullet-Enemy collision
  bullets.forEach((bullet, bi) => {
    enemies.forEach((enemy) => {
      if (
        enemy.alive &&
        bullet.x < enemy.x + enemy.width &&
        bullet.x + bullet.width > enemy.x &&
        bullet.y < enemy.y + enemy.height &&
        bullet.y + bullet.height > enemy.y
      ) {
        enemy.alive = false;
        bullets.splice(bi, 1);
      }
    });
  });

  // Check if all enemies are dead → Next Level
  if (enemies.every(e => !e.alive)) {
    nextLevel();
  }

  // Draw HUD
  drawUI();

  requestAnimationFrame(gameLoop);
}

// Start game
window.onload = () => {
  console.log("Game started!");
  gameLoop();
};
