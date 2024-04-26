// Game settings
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const BLOCK_SIZE = 30;
const DROP_INTERVAL = 500; // Milliseconds
const DROP_INTERVAL_LEVELS = [1000, 800, 600, 500, 400, 300, 200];

// Tetromino shapes
const TETROMINOS = [
  [[1, 1, 1, 1]], // I-Tetromino
  [[1, 1], [1, 1]], // O-Tetromino
  [[1, 1, 0], [0, 1, 1]], // Z-Tetromino
  [[0, 1, 1], [1, 1, 0]], // S-Tetromino
  [[1, 1, 1], [0, 0, 1]], // L-Tetromino
  [[1, 1, 1], [1, 0, 0]], // J-Tetromino
  [[1, 1, 1], [0, 1, 0]] // T-Tetromino
];

// Game state
let gameBoard;
let currentTetromino;
let currentX;
let currentY;
let score;
let level;
let isGameOver;
let isPaused;
let lastDropTime;

// Canvas setup
const canvas = document.getElementById('game-board');
const ctx = canvas.getContext('2d');
canvas.width = BOARD_WIDTH * BLOCK_SIZE;
canvas.height = BOARD_HEIGHT * BLOCK_SIZE;

// Controls
document.addEventListener('keydown', handleKeyPress);

// Touch controls
let touchStartX = 0;
let touchStartY = 0;

// Handle key press
function handleKeyPress(event) {
  if (isGameOver || isPaused) return;

  switch (event.key) {
    case 'ArrowLeft':
      moveTetrominoLeft();
      break;
    case 'ArrowRight':
      moveTetrominoRight();
      break;
    case 'ArrowDown':
      moveTetrominoDown();
      break;
    case 'ArrowUp':
      rotateTetromino();
      break;
    case 'm':
      startBackgroundMusic();
      break;
  }
}

// Handle touch start
canvas.addEventListener('touchstart', function(event) {
  if (isGameOver || isPaused) return;
  touchStartX = event.touches[0].clientX;
  touchStartY = event.touches[0].clientY;
});

// Handle touch move
canvas.addEventListener('touchmove', function(event) {
  event.preventDefault(); // Prevent scrolling when touching canvas
});

// Handle touch end
canvas.addEventListener('touchend', function(event) {
  const touchEndX = event.changedTouches[0].clientX;
  const touchEndY = event.changedTouches[0].clientY;

  const deltaX = touchEndX - touchStartX;
  const deltaY = touchEndY - touchStartY;

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    // Horizontal swipe
    if (deltaX > 0) {
      moveTetrominoRight();
    } else {
      moveTetrominoLeft();
    }
  } else {
    // Vertical swipe
    if (deltaY > 0) {
      moveTetrominoDown();
    } else {
      rotateTetromino();
    }
  }
});

// Game loop
function gameLoop() {
  const currentTime = Date.now();
  const deltaTime = currentTime - lastDropTime;

  if (isGameOver) {
    showGameOverScreen();
    return;
  }

  if (isPaused) return;

  if (deltaTime > DROP_INTERVAL_LEVELS[level - 1]) {
    currentY++;
    if (collisionDetected()) {
      currentY--;
      lockTetromino();
      spawnNewTetromino();
    }
    lastDropTime = currentTime;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGameBoard();
  drawTetromino();

  requestAnimationFrame(gameLoop);
}

// Tetromino management
function spawnNewTetromino() {
  const tetrominoIndex = Math.floor(Math.random() * TETROMINOS.length);
  currentTetromino = TETROMINOS[tetrominoIndex];
  currentX = Math.floor(BOARD_WIDTH / 2) - 1;
  currentY = 0;

  if (collisionDetected()) {
    if (checkGameOver()) {
      isGameOver = true;
      showGameOverScreen();
      return;
    } else {
      currentY--;
      lockTetromino();
      spawnNewTetromino();
    }
  }
}

// Lock tetromino
function lockTetromino() {
  for (let y = 0; y < currentTetromino.length; y++) {
    for (let x = 0; x < currentTetromino[y].length; x++) {
      if (currentTetromino[y][x]) {
        gameBoard[currentY + y][currentX + x] = 1;
      }
    }
  }
  checkAndClearLines();
}

// Check and clear full lines
function checkAndClearLines() {
  let linesCleared = 0;
  for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
    if (gameBoard[y].every(block => block === 1)) {
      gameBoard.splice(y, 1);
      gameBoard.unshift(Array(BOARD_WIDTH).fill(0));
      linesCleared++;
      y++; // Check the same row again as it's shifted down
    }
  }
  if (linesCleared > 0) {
    score += linesCleared * 100;
    level = Math.floor(score / 1000) + 1;
    document.getElementById('score').innerText = score;
    document.getElementById('level').innerText = level;
  }
}

// Collision detection
function collisionDetected() {
  for (let y = 0; y < currentTetromino.length; y++) {
    for (let x = 0; x < currentTetromino[y].length; x++) {
      if (currentTetromino[y][x]) {
        const newX = currentX + x;
        const newY = currentY + y;
        if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT || gameBoard[newY][newX]) {
          return true;
        }
      }
    }
  }
  return false;
}

// Rendering
function drawGameBoard() {
  for (let y = 0; y < BOARD_HEIGHT; y++) {
    for (let x = 0; x < BOARD_WIDTH; x++) {
      if (gameBoard[y][x]) {
        ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
      }
    }
  }
}

function drawTetromino() {
  for (let y = 0; y < currentTetromino.length; y++) {
    for (let x = 0; x < currentTetromino[y].length; x++) {
      if (currentTetromino[y][x]) {
        const tetrominoColor = getTetrominoColor(currentTetromino);
        // Fill tetromino block
        ctx.fillStyle = tetrominoColor;
        ctx.fillRect((currentX + x) * BLOCK_SIZE, (currentY + y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        // Add outline for tetromino block
        ctx.strokeStyle = '#333';
        ctx.strokeRect((currentX + x) * BLOCK_SIZE, (currentY + y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
      }
    }
  }
}

function checkGameOver() {
  for (let x = 0; x < BOARD_WIDTH; x++) {
    if (gameBoard[0][x] === 1) {
      return true;
    }
  }
  return false;
}

// Get color based on tetromino
function getTetrominoColor(tetromino) {
  if (tetromino === TETROMINOS[0]) return '#00bcd4'; // Blue color for I-Tetromino
  if (tetromino === TETROMINOS[1]) return '#ffc107'; // Yellow color for O-Tetromino
  if (tetromino === TETROMINOS[2]) return '#e91e63'; // Red color for Z-Tetromino
  if (tetromino === TETROMINOS[3]) return '#4caf50'; // Green color for S-Tetromino
  if (tetromino === TETROMINOS[4]) return '#ff9800'; // Orange color for L-Tetromino
  if (tetromino === TETROMINOS[5]) return '#2196f3'; // Blue color for J-Tetromino
  if (tetromino === TETROMINOS[6]) return '#9c27b0'; // Purple color for T-Tetromino
}

// Game start
function startGame() {
  gameBoard = Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0));
  score = 0;
  level = 1;
  isGameOver = false;
  isPaused = false;
  lastDropTime = 0;
  spawnNewTetromino();
  gameLoop();

  document.addEventListener('keydown', function(event) {
    // Check if 'm' key is pressed
    if (event.key === 'm') {
      startBackgroundMusic();
    }
  });
}

// Start background music
function startBackgroundMusic() {
  // Play background music
  const backgroundMusic = document.getElementById('background-music');
  backgroundMusic.play();
}

startGame(); // Start the game when the script is loaded
