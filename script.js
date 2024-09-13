const canvas = document.getElementById('gameMap');
const ctx = canvas.getContext('2d');


// Constants
const PLAYER_RADIUS = 20;
const GUN_LENGTH = 30; // Length of the "gun"
const ZOMBIE_SIZE = 30;
const ZOMBIE_BOSS_SIZE = ZOMBIE_SIZE * 2; // Size of the Zombie Boss
const EXIT_WIDTH = 100;
const EXIT_HEIGHT = 20;
const BULLET_RADIUS = 5;
const PLAYER_SPEED = 7; // Player speed
const ZOMBIE_SPEED = 1.5; // Zombie speed
const ZOMBIE_RESPAWN_COUNT = 6; // Initial number of zombies to spawn at level 1
const BULLET_SPEED = 10; // Speed of bullets
const SHOOT_DELAY = 350; // Delay between shots in milliseconds
const BANDAGE_SIZE = 15; // Size of the bandages


// Game State
let gameStarted = false;
let gameMode = '';
let player1, player2;
let zombies = [];
let bullets = [];
let bosses = []; // Array to hold boss zombies
let level = 1;
let gameOver = false;
let hitCooldown = false; // Track if player is in hit cooldown
let lastShotTime = 0; // Track last shot time for shooting delay
let timer = 0; // Timer variable
let timerInterval; // Timer interval
let bandage; // Bandage pill object
let bandageSpawned = false; // Flag to track if bandage has been spawned this level


// UI Elements
const ui = document.getElementById('ui');
const startSinglePlayer = document.getElementById('startSinglePlayer');
const startMultiplayer = document.getElementById('startMultiplayer');


// Set initial positions for mouse coordinates
let mouseX = 0;
let mouseY = 0;


// Resize Canvas
function resizeCanvas() {
   canvas.width = window.innerWidth;
   canvas.height = window.innerHeight;
   draw();
}


// Draw Function
function draw() {
   ctx.clearRect(0, 0, canvas.width, canvas.height);
  
   // Draw current level only during the game
   if (gameStarted) {
       ctx.fillStyle = 'black';
       ctx.font = '30px Arial';
       ctx.textAlign = 'center';
       ctx.fillText(`Level: ${level}`, canvas.width / 2, 30);
      
       // Draw timer in the top right corner
       ctx.fillText(`Time: ${Math.floor(timer / 1000)}s`, canvas.width - 100, 30);
   }


   if (!gameStarted) {
       ctx.fillStyle = 'black';
       ctx.font = '60px Arial';
       ctx.textAlign = 'center';
       ctx.fillText('Zombie Shooter Game', canvas.width / 2, canvas.height / 2 - 20);
       ctx.font = '20px Arial';
       ctx.fillText('By: Snehasish Biswas', canvas.width / 2, canvas.height / 2 + 20);
       ctx.fillText('Press any key to start', canvas.width / 2, canvas.height / 2 + 200);
   } else if (gameOver) {
       ctx.fillStyle = 'red';
       ctx.font = '40px Arial';
       ctx.fillText('You Died!', canvas.width / 2, canvas.height / 2);
   } else {
       drawPlayer(player1);
       if (player2) drawPlayer(player2);
       drawZombies();
       drawBosses();
       drawBullets();
       drawExit();
       drawHealthBar(player1);
       if (player2) drawHealthBar(player2);
       drawBandage();
   }
}


// Draw Player Function
function drawPlayer(player) {
   ctx.fillStyle = 'tan';
   ctx.beginPath();
   ctx.arc(player.x, player.y, PLAYER_RADIUS, 0, Math.PI * 2);
   ctx.fill();


   // Draw the "gun" pointing in the direction of the mouse
   const angle = Math.atan2(mouseY - player.y, mouseX - player.x);
   ctx.strokeStyle = 'black';
   ctx.lineWidth = 5;
   ctx.beginPath();
   ctx.moveTo(player.x + 10, player.y + 10);
   ctx.lineTo(player.x + Math.cos(angle) * GUN_LENGTH, player.y + Math.sin(angle) * GUN_LENGTH);
   ctx.stroke();
}


// Draw Zombies Function
function drawZombies() {
   zombies.forEach(zombie => {
       ctx.fillStyle = 'rgb(138, 154, 91)';
       ctx.fillRect(zombie.x, zombie.y, ZOMBIE_SIZE, ZOMBIE_SIZE);
   });
}


// Draw Bosses Function
function drawBosses() {
   bosses.forEach(boss => {
       ctx.fillStyle = 'rgb(128, 128, 0)';
       ctx.fillRect(boss.x, boss.y, ZOMBIE_BOSS_SIZE, ZOMBIE_BOSS_SIZE);
       drawHealthBar(boss);
   });
}


// Draw Bullets Function
function drawBullets() {
   bullets.forEach(bullet => {
       ctx.fillStyle = 'gray';
       ctx.beginPath();
       ctx.arc(bullet.x, bullet.y, BULLET_RADIUS, 0, Math.PI * 2);
       ctx.fill();
   });
}


// Draw Exit Function
function drawExit() {
   ctx.fillStyle = 'black';
   ctx.fillRect(canvas.width - EXIT_WIDTH - 20, canvas.height / 2 - EXIT_HEIGHT / 2, EXIT_WIDTH, EXIT_HEIGHT);
   ctx.fillStyle = 'white';
   ctx.fillText('Exit', canvas.width - EXIT_WIDTH / 2 - 20, canvas.height / 2);
}


// Draw Health Bar Function
function drawHealthBar(entity) {
   ctx.fillStyle = 'black';
   ctx.fillRect(entity.x - PLAYER_RADIUS, entity.y - PLAYER_RADIUS - 10, 50, 5);
   ctx.fillStyle = 'lightgreen';
   ctx.fillRect(entity.x - PLAYER_RADIUS, entity.y - PLAYER_RADIUS - 10, 50 * (entity.health / entity.maxHealth), 5);
}


// Draw Bandage Function
function drawBandage() {
   if (bandage) {
       ctx.fillStyle = '#FFD700'; // Gold color for bandage
       ctx.beginPath();
       ctx.ellipse(bandage.x, bandage.y, BANDAGE_SIZE, BANDAGE_SIZE / 2, 0, 0, Math.PI * 2); // Pill shape
       ctx.fill();
       ctx.fillStyle = 'black';
       ctx.font = '12px Arial';
       ctx.textAlign = 'center';
       ctx.fillText('Bandages', bandage.x, bandage.y - 10); // Text above bandage
   }
}


// Start Game Function
function startGame(mode) {
   gameStarted = true;
   gameMode = mode;
   level = 1; // Reset level to 1
   timer = 0; // Reset timer
   player1 = { x: 100, y: canvas.height / 2, health: 8, maxHealth: 8 };
   if (mode === 'Multiplayer') {
       player2 = { x: 100, y: canvas.height / 2, health: 8, maxHealth: 8 };
   }


   addZombies();
   addZombieBosses(); // Initialize bosses
   timerInterval = setInterval(() => {
       timer += 1000; // Increment timer every second
   }, 1000);


   draw();
   requestAnimationFrame(loop);
}


// Add Zombies Function
function addZombies() {
   zombies = [];
   const zombieCount = ZOMBIE_RESPAWN_COUNT + 2 * (level - 1); // Increment zombie count by 2 for each level
   for (let i = 0; i < zombieCount; i++) {
       let newZombie;
       let overlap;
       do {
           overlap = false;
           newZombie = {
               x: Math.random() * (canvas.width - ZOMBIE_SIZE),
               y: Math.random() * (canvas.height - ZOMBIE_SIZE),
               health: 1,
               maxHealth: 1
           };
           // Check for overlap with existing zombies
           zombies.forEach(existingZombie => {
               if (Math.hypot(newZombie.x - existingZombie.x, newZombie.y - existingZombie.y) < ZOMBIE_SIZE) {
                   overlap = true;
               }
           });
       } while (overlap); // Keep trying until no overlap
       zombies.push(newZombie);
   }
}


// Add Zombie Bosses Function
function addZombieBosses() {
   bosses = []; // Reset bosses for a new level
   const bossCount = Math.floor(level / 10); // One boss each 10 levels
   for (let i = 0; i < bossCount; i++) {
       bosses.push({
           x: Math.random() * (canvas.width - ZOMBIE_BOSS_SIZE),
           y: Math.random() * (canvas.height - ZOMBIE_BOSS_SIZE),
           health: 4, // Boss health
           maxHealth: 4
       });
   }
}


// Function to spawn Bandage every 5 levels
function spawnBandage() {
   if (level % 5 === 0 && !bandageSpawned) {
       bandage = {
           x: Math.random() * (canvas.width - BANDAGE_SIZE),
           y: Math.random() * (canvas.height - BANDAGE_SIZE)
       };
       bandageSpawned = true; // Set flag to true to prevent re-spawning
   }
}


// Game Loop Function
function loop() {
   if (gameStarted && !gameOver) {
       handleMovement(); // Handle player movement and shooting
       if (gameMode === "Zombies") {
           updateZombies();
           updateBosses();
           updateBullets();
           spawnBandage(); // Attempt to spawn bandage
       }
       draw();
       requestAnimationFrame(loop);
   }
}


// Update Zombies Function
function updateZombies() {
   zombies.forEach(zombie => {
       if (player1.health > 0) {
           if (zombie.x < player1.x) zombie.x += ZOMBIE_SPEED; // Zombie speed adjustments
           if (zombie.x > player1.x) zombie.x -= ZOMBIE_SPEED;
           if (zombie.y < player1.y) zombie.y += ZOMBIE_SPEED;
           if (zombie.y > player1.y) zombie.y -= ZOMBIE_SPEED;


           // Check for collision
           if (!hitCooldown && Math.hypot(player1.x - (zombie.x + ZOMBIE_SIZE / 2), player1.y - (zombie.y + ZOMBIE_SIZE / 2)) < PLAYER_RADIUS + ZOMBIE_SIZE / 2) {
               player1.health -= 1; // Decrease health
               if (player1.health <= 0) {
                   gameOver = true; // End game if health is zero
               }
               hitCooldown = true; // Activate cooldown
               setTimeout(() => { hitCooldown = false; }, 1000); // Cooldown for 1 second
           }
       }
   });


   // Check if player reaches the exit
   if (player1.x + PLAYER_RADIUS > canvas.width - EXIT_WIDTH - 20 && player1.y > canvas.height / 2 - EXIT_HEIGHT / 2 && player1.y < canvas.height / 2 + EXIT_HEIGHT / 2) {
       level += 1;
       // No health reset, it carries over
       player1.x = 100; // Reset player position to the left side
       addZombies();
       addZombieBosses(); // Refresh bosses at new level
       bandageSpawned = false; // Reset bandage spawn tracking for the new level
   }


   // Remove zombies that are outside canvas bounds
   zombies = zombies.filter(zombie => zombie.x >= 0 && zombie.x <= canvas.width && zombie.y >= 0 && zombie.y <= canvas.height);
}


// Update Bosses Function
function updateBosses() {
   bosses.forEach(boss => {
       if (player1.health > 0) {
           if (boss.x < player1.x) boss.x += ZOMBIE_SPEED; // Slower movement for bosses
           if (boss.x > player1.x) boss.x -= ZOMBIE_SPEED;
           if (boss.y < player1.y) boss.y += ZOMBIE_SPEED;
           if (boss.y > player1.y) boss.y -= ZOMBIE_SPEED;


           // Check for collision with player
           if (!hitCooldown && Math.hypot(player1.x - (boss.x + ZOMBIE_BOSS_SIZE / 2), player1.y - (boss.y + ZOMBIE_BOSS_SIZE / 2)) < PLAYER_RADIUS + ZOMBIE_BOSS_SIZE / 2) {
               player1.health -= 1; // Decrease health
               if (player1.health <= 0) {
                   gameOver = true; // End game if health is zero
               }
               hitCooldown = true; // Activate cooldown
               setTimeout(() => { hitCooldown = false; }, 1000); // Cooldown for 1 second
           }
       }
   });


   // Remove bosses that are outside canvas bounds
   bosses = bosses.filter(boss => boss.x >= 0 && boss.x <= canvas.width && boss.y >= 0 && boss.y <= canvas.height);
}


// Update Bullets Function
function updateBullets() {
   bullets.forEach((bullet, index) => {
       bullet.x += bullet.dx;
       bullet.y += bullet.dy;


       // Check for collisions with zombies
       zombies.forEach((zombie, zombieIndex) => {
           if (Math.hypot(bullet.x - (zombie.x + ZOMBIE_SIZE / 2), bullet.y - (zombie.y + ZOMBIE_SIZE / 2)) < BULLET_RADIUS + ZOMBIE_SIZE / 2) {
               zombies.splice(zombieIndex, 1); // Remove zombie
               bullets.splice(index, 1); // Remove bullet
           }
       });


       // Check for collisions with bosses
       bosses.forEach((boss, bossIndex) => {
           if (Math.hypot(bullet.x - (boss.x + ZOMBIE_BOSS_SIZE / 2), bullet.y - (boss.y + ZOMBIE_BOSS_SIZE / 2)) < BULLET_RADIUS + ZOMBIE_BOSS_SIZE / 2) {
               boss.health -= 0.25; // Boss takes 1/4 damage
               bullets.splice(index, 1); // Remove bullet


               // If boss health is depleted, remove boss
               if (boss.health <= 0) {
                   bosses.splice(bossIndex, 1);
               }
           }
       });


       // Remove bullets that are out of bounds
       if (bullet.x < 0 || bullet.x > canvas.width || bullet.y < 0 || bullet.y > canvas.height) {
           bullets.splice(index, 1);
       }
   });


   // Check for collisions with bandage
   if (bandage && Math.hypot(player1.x - bandage.x, player1.y - bandage.y) < PLAYER_RADIUS + BANDAGE_SIZE) {
       player1.health = player1.maxHealth; // Restore full health
       bandage = null; // Remove bandage
   }
}


// Handle Keyboard Inputs
const keys = {};
window.addEventListener('keydown', (event) => {
   keys[event.key] = true;
   if (!gameStarted) {
       ui.style.display = 'block';
       gameStarted = true; // Set game as started
       if (timerInterval) clearInterval(timerInterval);
   }
});


window.addEventListener('keyup', (event) => {
   keys[event.key] = false;
});


// Mouse Movement
canvas.addEventListener('mousemove', (event) => {
   const rect = canvas.getBoundingClientRect();
   mouseX = event.clientX - rect.left; // Get mouse X relative to canvas
   mouseY = event.clientY - rect.top; // Get mouse Y relative to canvas
});


// Game Controls Logic in Animation Frame
function handleMovement() {
   // Player 1 Controls (WASD)
   if (keys['w']) player1.y -= PLAYER_SPEED;
   if (keys['s']) player1.y += PLAYER_SPEED;
   if (keys['a']) player1.x -= PLAYER_SPEED;
   if (keys['d']) player1.x += PLAYER_SPEED;


   // Player 2 Controls (Arrow keys)
   if (keys['ArrowUp']) player2.y -= PLAYER_SPEED;
   if (keys['ArrowDown']) player2.y += PLAYER_SPEED;
   if (keys['ArrowLeft']) player2.x -= PLAYER_SPEED;
   if (keys['ArrowRight']) player2.x += PLAYER_SPEED;


   // Handle shooting with delay (space for player 1 and "L" for player 2)
   const currentTime = Date.now();
   if (keys[' '] && (currentTime - lastShotTime >= SHOOT_DELAY)) {
       lastShotTime = currentTime;
       const angle = Math.atan2(mouseY - player1.y, mouseX - player1.x);
       bullets.push({
           x: player1.x + Math.cos(angle) * PLAYER_RADIUS,
           y: player1.y + Math.sin(angle) * PLAYER_RADIUS,
           dx: Math.cos(angle) * BULLET_SPEED,
           dy: Math.sin(angle) * BULLET_SPEED
       }); // Player 1 shoots in direction of mouse
   }
   if (keys['l'] && player2 && (currentTime - lastShotTime >= SHOOT_DELAY)) {
       lastShotTime = currentTime;
       const angle = Math.atan2(mouseY - player2.y, mouseX - player2.y);
       bullets.push({
           x: player2.x + Math.cos(angle) * PLAYER_RADIUS,
           y: player2.y + Math.sin(angle) * PLAYER_RADIUS,
           dx: Math.cos(angle) * BULLET_SPEED,
           dy: Math.sin(angle) * BULLET_SPEED
       }); // Player 2 shoots in direction of mouse
   }


   // Keep players within canvas bounds
   player1.x = Math.max(PLAYER_RADIUS, Math.min(canvas.width - PLAYER_RADIUS, player1.x));
   player1.y = Math.max(PLAYER_RADIUS, Math.min(canvas.height - PLAYER_RADIUS, player1.y));


   if (player2) {
       player2.x = Math.max(PLAYER_RADIUS, Math.min(canvas.width - PLAYER_RADIUS, player2.x));
       player2.y = Math.max(PLAYER_RADIUS, Math.min(canvas.height - PLAYER_RADIUS, player2.y));
   }
}


// Event Listeners for UI Buttons
startSinglePlayer.addEventListener('click', () => {
   startGame('Zombies');
   ui.style.display = 'none';
});


startMultiplayer.addEventListener('click', () => {
   startGame('Multiplayer');
   ui.style.display = 'none';
});


// Resize the canvas on load and resize
resizeCanvas();
window.addEventListener('resize', resizeCanvas);