const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const BLOCK_SIZE = 30;
const DROP_INTERVAL = 500;
const DROP_INTERVAL_LEVELS = [1000, 800, 600, 500, 400, 300, 200];

const TETROMINOS = [
  [[1, 1, 1, 1]],
  [[1, 1], [1, 1]],
  [[1, 1, 0], [0, 1, 1]],
  [[0, 1, 1], [1, 1, 0]],
  [[1, 1, 1], [0, 0, 1]],
  [[1, 1, 1], [1, 0, 0]],
  [[1, 1, 1], [0, 1, 0]]
];

let gameBoard;
let currentTetromino;
let currentX;
let currentY;
let score;
let level;
let isGameOver;
let isPaused;
let lastDropTime;

const canvas = document.getElementById('game-board');
const ctx = canvas.getContext('2d');
canvas.width = BOARD_WIDTH * BLOCK_SIZE;
canvas.height = BOARD_HEIGHT * BLOCK_SIZE;

document.addEventListener('keydown', handleKeyPress);

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

function moveTetrominoLeft() {
  currentX--;
  if (collisionDetected()) {
    currentX++;
  }
}

function moveTetrominoRight() {
  currentX++;
  if (collisionDetected()) {
    currentX--;
  }
}

function moveTetrominoDown() {
  currentY++;
  if (collisionDetected()) {
    currentY--;
    lockTetromino();
    spawnNewTetromino();
  }
}

function rotateTetromino() {
  const rotatedTetromino = [];
  for (let x = 0; x < currentTetromino[0].length; x++) {
    rotatedTetromino.push([]);
    for (let y = 0; y < currentTetromino.length; y++) {
      rotatedTetromino[x].unshift(currentTetromino[y][x]);
    }
  }
  currentTetromino = rotatedTetromino;
  if (collisionDetected()) {
    rotateTetromino();
  }
}

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

function checkAndClearLines() {
  let linesCleared = 0;
  for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
    if (gameBoard[y].every(block => block === 1)) {
      gameBoard.splice(y, 1);
      gameBoard.unshift(Array(BOARD_WIDTH).fill(0));
      linesCleared++;
      y++;
    }
  }
  if (linesCleared > 0) {
    score += linesCleared * 100;
    level = Math.floor(score / 1000) + 1;
    document.getElementById('score').innerText = score;
    document.getElementById('level').innerText = level;
  }
}

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
        ctx.fillStyle = tetrominoColor;
        ctx.fillRect((currentX + x) * BLOCK_SIZE, (currentY + y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
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

function getTetrominoColor(tetromino) {
  if (tetromino === TETROMINOS[0]) return '#00bcd4';
  if (tetromino === TETROMINOS[1]) return '#ffc107';
  if (tetromino === TETROMINOS[2]) return '#e91e63';
  if (tetromino === TETROMINOS[3]) return '#4caf50';
  if (tetromino === TETROMINOS[4]) return '#ff9800';
  if (tetromino === TETROMINOS[5]) return '#2196f3';
  if (tetromino === TETROMINOS[6]) return '#9c27b0';
}

function showGameOverScreen() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'white';
  ctx.font = '48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 24);
  ctx.font = '24px Arial';
  ctx.fillText('Your score: ' + score, canvas.width / 2, canvas.height / 2 + 24);
  ctx.font = '18px Arial';
  ctx.fillText('Press "Start" to play again', canvas.width / 2, canvas.height / 2 + 60);
  ctx.fillText('Press "m" to toggle music', canvas.width / 2, canvas.height / 2 + 100);
}

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
    if (event.key === 'm') {
      startBackgroundMusic();
    }
  });
}

function startBackgroundMusic() {
  const backgroundMusic = document.getElementById('background-music');
  backgroundMusic.play();
}

canvas.addEventListener('touchstart', handleTouchStart);
canvas.addEventListener('touchmove', handleTouchMove);
canvas.addEventListener('touchend', handleTouchEnd);

let touchStartX, touchStartY;

function handleTouchStart(event) {
  touchStartX = event.touches[0].clientX;
  touchStartY = event.touches[0].clientY;
}

function handleTouchMove(event) {
  const touchX = event.touches[0].clientX;
  const touchY = event.touches[0].clientY;
  const deltaX = touchX - touchStartX;
  const deltaY = touchY - touchStartY;

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    if (deltaX < -50) {
      moveTetrominoLeft();
    } else if (deltaX > 50) {
      moveTetrominoRight();
    }
  } else {
    if (deltaY > 50) {
      moveTetrominoDown();
    } else if (deltaY < -50) {
      rotateTetromino();
    }
  }

  touchStartX = touchX;
  touchStartY = touchY;
}

function handleTouchEnd(event) {
}

startGame();
