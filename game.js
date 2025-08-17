const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Load images with corrected SVG data
const playerImg = new Image();
playerImg.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
  <!-- Helmet dome -->
  <ellipse cx="20" cy="18" rx="16" ry="14" fill="#E8E8E8" stroke="#000" stroke-width="1"/>
  <!-- Face mask -->
  <rect x="10" y="16" width="20" height="18" fill="#333" rx="3"/>
  <!-- Breathing apparatus -->
  <rect x="17" y="20" width="6" height="12" fill="#000" rx="2"/>
  <rect x="18" y="21" width="4" height="10" fill="#444" rx="1"/>
  <!-- Eye lenses -->
  <ellipse cx="15" cy="22" rx="3" ry="2" fill="#1a1a1a"/>
  <ellipse cx="25" cy="22" rx="3" ry="2" fill="#1a1a1a"/>
  <!-- Eye reflections -->
  <ellipse cx="15" cy="21.5" rx="1" ry="0.5" fill="#666"/>
  <ellipse cx="25" cy="21.5" rx="1" ry="0.5" fill="#666"/>
  <!-- Mouth grille lines -->
  <line x1="12" y1="28" x2="18" y2="28" stroke="#666" stroke-width="1"/>
  <line x1="22" y1="28" x2="28" y2="28" stroke="#666" stroke-width="1"/>
  <line x1="12" y1="30" x2="18" y2="30" stroke="#666" stroke-width="1"/>
  <line x1="22" y1="30" x2="28" y2="30" stroke="#666" stroke-width="1"/>
</svg>`);

const invaderImg = new Image();
invaderImg.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
<svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
  <text x="15" y="20" font-size="20" text-anchor="middle" font-family="Arial">👽</text>
</svg>`);

// Generate stars for background
const stars = [];
for (let i = 0; i < 100; i++) {
    stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 1
    });
}

function speakGameOver() {
    try {
        const utterance = new SpeechSynthesisUtterance("GAME OVER");
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.volume = 1;
        speechSynthesis.speak(utterance);
    } catch (e) {
        console.log('Text-to-speech failed');
    }
}

// Game settings
const PLAYER_WIDTH = 40, PLAYER_HEIGHT = 50, PLAYER_SPEED = 5;
const INVADER_WIDTH = 30, INVADER_HEIGHT = 20;
const BULLET_WIDTH = 4, BULLET_HEIGHT = 10, BULLET_SPEED = 7;
const INVADER_FALL_SPEED = 2;
const INVADER_SPAWN_RATE = 0.02; // Probability per frame of spawning new invader
const GAME_TIME = 60; // 60 seconds

let leftPressed = false, rightPressed = false, spacePressed = false;
let gameOver = false, win = false;
let timeLeft = GAME_TIME;
let gameStartTime = Date.now();
let soundPlayed = false;

// Player
let player = {
    x: canvas.width / 2 - PLAYER_WIDTH / 2,
    y: canvas.height - PLAYER_HEIGHT - 10,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT
};

// Bullets
let bullets = [];

// Invaders
let invaders = [];

function spawnInvader() {
    if (Math.random() < INVADER_SPAWN_RATE) {
        invaders.push({
            x: Math.random() * (canvas.width - INVADER_WIDTH),
            y: -INVADER_HEIGHT,
            width: INVADER_WIDTH,
            height: INVADER_HEIGHT,
            alive: true
        });
    }
}

// Input
document.addEventListener('keydown', e => {
    if (e.code === 'ArrowLeft') leftPressed = true;
    if (e.code === 'ArrowRight') rightPressed = true;
    if (e.code === 'Space') spacePressed = true;
});
document.addEventListener('keyup', e => {
    if (e.code === 'ArrowLeft') leftPressed = false;
    if (e.code === 'ArrowRight') rightPressed = false;
    if (e.code === 'Space') spacePressed = false;
});

// Game loop
function update() {
    if (gameOver) return;

    // Update timer
    const elapsed = (Date.now() - gameStartTime) / 1000;
    timeLeft = Math.max(0, GAME_TIME - elapsed);
    
    // Check if time is up - if survived full time, player wins
    if (timeLeft <= 0) {
        win = true;
        gameOver = true;
        if (!soundPlayed) {
            speakGameOver();
            soundPlayed = true;
        }
        return;
    }

    // Player movement
    if (leftPressed) player.x -= PLAYER_SPEED;
    if (rightPressed) player.x += PLAYER_SPEED;
    player.x = Math.max(0, Math.min(canvas.width - PLAYER_WIDTH, player.x));

    // Shooting
    if (spacePressed && bullets.length < 1) {
        bullets.push({
            x: player.x + PLAYER_WIDTH / 2 - BULLET_WIDTH / 2,
            y: player.y,
            width: BULLET_WIDTH,
            height: BULLET_HEIGHT
        });
    }

    // Update bullets
    bullets.forEach(bullet => bullet.y -= BULLET_SPEED);
    bullets = bullets.filter(bullet => bullet.y + BULLET_HEIGHT > 0);

    // Spawn new invaders
    spawnInvader();

    // Update invaders - make them fall down
    for (let invader of invaders) {
        if (invader.alive) {
            invader.y += INVADER_FALL_SPEED;
        }
    }

    // Remove invaders that have fallen off screen
    invaders = invaders.filter(invader => invader.alive && invader.y < canvas.height + INVADER_HEIGHT);

    // Bullet-invader collision
    for (let bullet of bullets) {
        for (let invader of invaders) {
            if (invader.alive &&
                bullet.x < invader.x + invader.width &&
                bullet.x + bullet.width > invader.x &&
                bullet.y < invader.y + invader.height &&
                bullet.y + bullet.height > invader.y) {
                invader.alive = false;
                bullet.y = -100; // Remove bullet
            }
        }
    }

    // Invader-player collision
    for (let invader of invaders) {
        if (!invader.alive) continue;
        if (
            invader.x < player.x + player.width &&
            invader.x + invader.width > player.x &&
            invader.y < player.y + player.height &&
            invader.y + invader.height > player.y
        ) {
            gameOver = true;
            if (!soundPlayed) {
                speakGameOver();
                soundPlayed = true;
            }
        }
    }
}

function draw() {
    // Draw starry background - fix the double clear issue
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw stars
    ctx.fillStyle = '#FFF';
    for (let star of stars) {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw timer
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(Math.ceil(timeLeft) + 's', canvas.width - 20, 30);

    // Draw player with image or fallback
    if (playerImg.complete && playerImg.naturalWidth > 0) {
        ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
    } else {
        // Enhanced fallback - Better scaled Darth Vader helmet for 40x60
        const px = player.x;
        const py = player.y;
        const pw = player.width;
        const ph = player.height;
        
        // Helmet dome (light gray) - top portion
        ctx.fillStyle = '#E8E8E8';
        ctx.beginPath();
        ctx.arc(px + pw/2, py + ph*0.25, pw*0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        // Face mask (dark gray) - larger portion for taller design
        ctx.fillStyle = '#333';
        ctx.fillRect(px + pw*0.125, py + ph*0.2, pw*0.75, ph*0.75);
        
        // Breathing apparatus (center) - proportionally sized
        ctx.fillStyle = '#000';
        ctx.fillRect(px + pw*0.4, py + ph*0.35, pw*0.2, ph*0.4);
        ctx.fillStyle = '#444';
        ctx.fillRect(px + pw*0.42, py + ph*0.37, pw*0.16, ph*0.36);
        
        // Eye lenses (black ovals) - positioned for taller helmet
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.ellipse(px + pw*0.3, py + ph*0.42, pw*0.1, ph*0.04, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(px + pw*0.7, py + ph*0.42, pw*0.1, ph*0.04, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Eye reflections
        ctx.fillStyle = '#666';
        ctx.beginPath();
        ctx.ellipse(px + pw*0.3, py + ph*0.40, pw*0.05, ph*0.02, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(px + pw*0.7, py + ph*0.40, pw*0.05, ph*0.02, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Mouth grille lines - positioned lower for taller design
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px + pw*0.2, py + ph*0.6);
        ctx.lineTo(px + pw*0.38, py + ph*0.6);
        ctx.moveTo(px + pw*0.62, py + ph*0.6);
        ctx.lineTo(px + pw*0.8, py + ph*0.6);
        ctx.moveTo(px + pw*0.2, py + ph*0.65);
        ctx.lineTo(px + pw*0.38, py + ph*0.65);
        ctx.moveTo(px + pw*0.62, py + ph*0.65);
        ctx.lineTo(px + pw*0.8, py + ph*0.65);
        ctx.moveTo(px + pw*0.2, py + ph*0.7);
        ctx.lineTo(px + pw*0.38, py + ph*0.7);
        ctx.moveTo(px + pw*0.62, py + ph*0.7);
        ctx.lineTo(px + pw*0.8, py + ph*0.7);
        ctx.moveTo(px + pw*0.2, py + ph*0.75);
        ctx.lineTo(px + pw*0.38, py + ph*0.75);
        ctx.moveTo(px + pw*0.62, py + ph*0.75);
        ctx.lineTo(px + pw*0.8, py + ph*0.75);
        ctx.stroke();
        
        // Additional detail - chin piece
        ctx.fillStyle = '#222';
        ctx.fillRect(px + pw*0.3, py + ph*0.8, pw*0.4, ph*0.15);
    }

    // Draw bullets
    ctx.fillStyle = '#00FF00';
    for (let bullet of bullets) {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    }

    // Draw invaders with image or fallback
    for (let invader of invaders) {
        if (invader.alive) {
            if (invaderImg.complete && invaderImg.naturalWidth > 0) {
                ctx.drawImage(invaderImg, invader.x, invader.y, invader.width, invader.height);
            } else {
                // Enhanced fallback - alien-like shape
                ctx.fillStyle = '#00FF00';
                ctx.fillRect(invader.x, invader.y + 5, invader.width, invader.height - 10);
                ctx.fillRect(invader.x + 5, invader.y, invader.width - 10, invader.height);
                ctx.fillStyle = '#FF0000';
                ctx.fillRect(invader.x + 8, invader.y + 6, 4, 4);
                ctx.fillRect(invader.x + 18, invader.y + 6, 4, 4);
            }
        }
    }

    // Draw game over/win
    if (gameOver) {
        ctx.fillStyle = '#fff';
        ctx.font = '32px Arial';
        ctx.textAlign = 'center';
        if (win) {
            ctx.fillText('You Survived!', canvas.width / 2, canvas.height / 2);
        } else {
            ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
        }
        ctx.font = '16px Arial';
        ctx.fillText('Refresh to play again', canvas.width / 2, canvas.height / 2 + 30);
    }
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

loop();