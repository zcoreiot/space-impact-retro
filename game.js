const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// --- 1. ตั้งค่าพื้นฐาน ---
const SCREEN_WIDTH = canvas.width;
const SCREEN_HEIGHT = canvas.height;

// --- 2. ตั้งค่าตัวละครผู้เล่น (ยานอวกาศ) ---
let player = {
    x: 50,
    y: 180,
    width: 36, 
    height: 24,
    speed: 5
};

// --- 3. ตั้งค่าระบบกระสุน (ผู้เล่น) ---
let bullets = [];
let bulletSpeed = 8; 
let bulletWidth = 10;
let bulletHeight = 3;

// --- 4. ตั้งค่าระดับปืน และ ไอเทมดรอป (ออกทุกๆ 3 วินาที) ---
let weaponLevel = 1; 
let powerUp = null;  
let powerUpTimer = 0;
let powerUpInterval = 3000; 

// --- 5. ตั้งค่าระบบศัตรู ---
let enemies = [];
let enemyBaseSpeed = 2; 
let enemySpawnerTimer = 0;
let enemySpawnInterval = 1500; 
let enemyBullets = []; 

// --- 6. ตั้งค่าฉากหลังดาวขยับได้ (Scrolling Stars) ---
let stars = [];
const MAX_STARS = 40;

function initStars() {
    stars = [];
    for (let i = 0; i < MAX_STARS; i++) {
        stars.push({
            x: Math.random() * SCREEN_WIDTH,
            y: Math.random() * SCREEN_HEIGHT,
            size: Math.random() * 3 + 1,
            speed: Math.random() * 1.5 + 0.5
        });
    }
}

function updateStars() {
    for (let i = 0; i < stars.length; i++) {
        stars[i].x -= stars[i].speed;
        if (stars[i].x < 0) {
            stars[i].x = SCREEN_WIDTH;
            stars[i].y = Math.random() * SCREEN_HEIGHT;
        }
    }
}

// --- 7. ตั้งค่าเกม ---
let keys = {};
let score = 0;
let gameOver = false;

window.addEventListener("keydown", (e) => {
    keys[e.key] = true;
    if (gameOver && (e.key === "r" || e.key === "R")) {
        resetGame();
    } else if (!gameOver) {
        if (e.key === " " || e.key === "Spacebar") {
            createPlayerBullet();
        }
    }
});

window.addEventListener("keyup", (e) => keys[e.key] = false);

function createPlayerBullet() {
    let startX = player.x + player.width - 5;
    let startY = player.y + player.height / 2 - bulletHeight / 2;

    if (weaponLevel === 1) {
        bullets.push({ x: startX, y: startY, vx: bulletSpeed, vy: 0, width: bulletWidth, height: bulletHeight });
    } else {
        bullets.push({ x: startX, y: startY - 4, vx: bulletSpeed, vy: 0, width: bulletWidth, height: bulletHeight }); 
        bullets.push({ x: startX, y: startY - 8, vx: bulletSpeed, vy: -2, width: bulletWidth, height: bulletHeight }); 
        bullets.push({ x: startX, y: startY, vx: bulletSpeed, vy: 2, width: bulletWidth, height: bulletHeight });  
    }
}

function spawnPowerUp() {
    powerUp = {
        x: SCREEN_WIDTH + 20,
        y: Math.random() * (SCREEN_HEIGHT - 20),
        width: 16,
        height: 16,
        speed: 1.5
    };
}

function spawnEnemy() {
    const width = 25;
    const height = 15;
    const y = Math.random() * (SCREEN_HEIGHT - height);
    
    enemies.push({
        x: SCREEN_WIDTH + width,
        y: y,
        width: width,
        height: height,
        speed: enemyBaseSpeed + Math.random() * 0.5, 
        shootTimer: 0,
        shootInterval: 2000 + Math.random() * 2000 
    });
}

function createEnemyBullet(enemy) {
    enemyBullets.push({
        x: enemy.x - bulletWidth, 
        y: enemy.y + enemy.height / 2 - bulletHeight / 2, 
        width: bulletWidth,
        height: bulletHeight,
        speed: 4
    });
}

function checkCollision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

function resetGame() {
    player.x = 50;
    player.y = 180;
    bullets = [];
    enemies = [];
    enemyBullets = [];
    score = 0;
    gameOver = false;
    enemyBaseSpeed = 2; 
    weaponLevel = 1; 
    powerUp = null;
    powerUpTimer = 0;
    initStars();
}

// --- 8. ฟังก์ชันอัปเดตตำแหน่งและการคำนวณในเกม ---
function update(delta) {
    updateStars();

    if (gameOver) return;

    if (keys["ArrowUp"] && player.y > 0) player.y -= player.speed;
    if (keys["ArrowDown"] && player.y < SCREEN_HEIGHT - player.height) player.y += player.speed;
    if (keys["ArrowLeft"] && player.x > 0) player.x -= player.speed;
    if (keys["ArrowRight"] && player.x < SCREEN_WIDTH - player.width) player.x += player.speed;

    for (let i = 0; i < bullets.length; i++) {
        bullets[i].x += bullets[i].vx;
        bullets[i].y += bullets[i].vy;
    }
    bullets = bullets.filter(b => b.x < SCREEN_WIDTH && b.y > 0 && b.y < SCREEN_HEIGHT);

    powerUpTimer += delta;
    if (powerUpTimer >= powerUpInterval) {
        if (!powerUp) spawnPowerUp();
        powerUpTimer = 0;
    }

    if (powerUp) {
        powerUp.x -= powerUp.speed; 
        
        if (checkCollision(player, powerUp)) {
            weaponLevel = 2; 
            score += 500;    
            powerUp = null;  
        } else if (powerUp.x < -powerUp.width) {
            powerUp = null;  
        }
    }

    enemySpawnerTimer += delta;
    if (enemySpawnerTimer >= enemySpawnInterval) {
        spawnEnemy();
        enemySpawnerTimer = 0;
        if (enemySpawnInterval > 500) enemySpawnInterval -= 10;
        if (enemyBaseSpeed < 6) enemyBaseSpeed += 0.05;
    }

    for (let i = 0; i < enemies.length; i++) {
        enemies[i].x -= enemies[i].speed;
        enemies[i].shootTimer += delta;
        if (enemies[i].shootTimer >= enemies[i].shootInterval) {
            createEnemyBullet(enemies[i]);
            enemies[i].shootTimer = 0;
        }
    }
    enemies = enemies.filter(enemy => enemy.x > -enemy.width);

    for (let i = 0; i < enemyBullets.length; i++) {
        enemyBullets[i].x -= enemyBullets[i].speed;
    }
    enemyBullets = enemyBullets.filter(bullet => bullet.x > -bulletWidth);

    bullets.forEach(bullet => {
        enemies.forEach((enemy, indexEnemey) => {
            if (checkCollision(bullet, enemy)) {
                bullets = bullets.filter(b => b !== bullet); 
                enemies = enemies.filter(e => e !== enemy); 
                score += 100;
            }
        });
    });

    enemies.forEach(enemy => {
        if (checkCollision(player, enemy)) gameOver = true;
    });
    enemyBullets.forEach(bullet => {
        if (checkCollision(player, bullet)) gameOver = true;
    });
}

// --- 9. ฟังก์ชันวาดสิ่งต่าง ๆ ลงบนจอเกม ---
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#306230"; 
    for (let i = 0; i < stars.length; i++) {
        let s = stars[i];
        ctx.fillRect(s.x, s.y, s.size, s.size);
    }

    const NOSTALGIC_GREEN = "#0f380f";

    if (gameOver) {
        ctx.fillStyle = NOSTALGIC_GREEN;
        ctx.font = "30px sans-serif"; 
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 20);
        ctx.font = "20px sans-serif";
        ctx.fillText("SCORE: " + score, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 20);
        ctx.font = "16px sans-serif";
        ctx.fillText("Press 'R' to Restart", SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 60);
        return;
    }

    if (powerUp) {
        ctx.fillStyle = "#000000";
        ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
        ctx.strokeStyle = "#8bac0f";
        ctx.lineWidth = 2;
        ctx.strokeRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
        
        ctx.fillStyle = "#8bac0f";
        ctx.font = "bold 12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("P", powerUp.x + powerUp.width / 2, powerUp.y + powerUp.height - 3);
    }

    // วาดตัวยานอวกาศ (แก้ไขปมบั๊กความสูงตรงนี้แล้วครับ)
    ctx.fillStyle = NOSTALGIC_GREEN; 
    ctx.beginPath();
    ctx.moveTo(player.x, player.y + 4); 
    ctx.lineTo(player.x + 10, player.y + 2);
    ctx.lineTo(player.x + player.width - 8, player.y + player.height / 2 - 2);
    ctx.lineTo(player.x + player.width, player.y + player.height / 2); 
    ctx.lineTo(player.x + player.width - 8, player.y + player.height / 2 + 2);
    ctx.lineTo(player.x + 10, player.y + player.height - 2); 
    ctx.lineTo(player.x, player.y + player.height - 4);
    ctx.fill();

    // วาดปีกบน-ล่าง
    ctx.fillStyle = "#1e4d1e"; 
    ctx.beginPath();
    ctx.moveTo(player.x + 8, player.y + 2); ctx.lineTo(player.x + 16, player.y); ctx.lineTo(player.x + 22, player.y + player.height / 2 - 4); ctx.lineTo(player.x + 10, player.y + player.height / 2 - 2); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(player.x + 8, player.y + player.height - 2); ctx.lineTo(player.x + 16, player.y + player.height); ctx.lineTo(player.x + 22, player.y + player.height / 2 + 4); ctx.lineTo(player.x + 10, player.y + player.height / 2 + 2); ctx.fill();

    // เครื่องยนต์
    ctx.fillStyle = "#8bac0f"; 
    ctx.beginPath(); ctx.arc(player.x - 2, player.y + player.height / 2, 4, -Math.PI / 2, Math.PI / 2); ctx.fill();

    // วาดกระสุนผู้เล่น
    ctx.fillStyle = NOSTALGIC_GREEN;
    for (let i = 0; i < bullets.length; i++) {
        let b = bullets[i];
        ctx.fillRect(b.x, b.y, b.width, b.height);
    }

    // วาดศัตรู
    ctx.fillStyle = "#000000"; 
    for (let i = 0; i < enemies.length; i++) {
        let e = enemies[i];
        ctx.fillRect(e.x, e.y, e.width, e.height);
    }

    // วาดกระสุนของศัตรู
    for (let i = 0; i < enemyBullets.length; i++) {
        let b = enemyBullets[i];
        ctx.fillRect(b.x, b.y, b.width, b.height);
    }

    // วาดคะแนน
    ctx.fillStyle = NOSTALGIC_GREEN;
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("SCORE: " + score, SCREEN_WIDTH - 20, 30);
    
    if (weaponLevel > 1) {
        ctx.textAlign = "left";
        ctx.fillText("🔥 WEAPON: TRIPLE", 20, 30);
    }
}

// --- 10. Game Loop ---
let lastTime = 0;
function gameLoop(currentTime) {
    const delta = currentTime - lastTime;
    lastTime = currentTime;

    update(delta);
    draw();
    requestAnimationFrame(gameLoop);
}

initStars();
requestAnimationFrame(gameLoop);