// Configuración del canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Configuración del juego
const GRID_SIZE = 20;
const CANVAS_SIZE = 500;
canvas.width = CANVAS_SIZE;
canvas.height = CANVAS_SIZE;

const CELL_SIZE = CANVAS_SIZE / GRID_SIZE;

// Variables del juego
let snake = [];
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let food = { x: 0, y: 0 };
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameLoop = null;
let gameSpeed = 150;
let isPaused = false;
let gameStarted = false;

// Elementos DOM
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const gameOverScreen = document.getElementById('gameOver');
const finalScoreElement = document.getElementById('finalScore');
const playAgainBtn = document.getElementById('playAgainBtn');

// Inicializar
highScoreElement.textContent = highScore;

// Funciones del juego
function initGame() {
    snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
    ];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    gameSpeed = 150;
    isPaused = false;
    gameStarted = true;
    updateScore();
    spawnFood();
    gameOverScreen.classList.add('hidden');
}

function spawnFood() {
    do {
        food = {
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE)
        };
    } while (snake.some(segment => segment.x === food.x && segment.y === food.y));
}

function updateScore() {
    scoreElement.textContent = score;
    if (score > highScore) {
        highScore = score;
        highScoreElement.textContent = highScore;
        localStorage.setItem('snakeHighScore', highScore);
    }
}

function drawGame() {
    // Limpiar canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Dibujar cuadrícula sutil
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE, 0);
        ctx.lineTo(i * CELL_SIZE, CANVAS_SIZE);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * CELL_SIZE);
        ctx.lineTo(CANVAS_SIZE, i * CELL_SIZE);
        ctx.stroke();
    }

    // Dibujar serpiente
    snake.forEach((segment, index) => {
        if (index === 0) {
            // Cabeza de la serpiente
            ctx.fillStyle = '#00ff00';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#00ff00';
        } else {
            // Cuerpo de la serpiente
            ctx.fillStyle = '#00cc00';
            ctx.shadowBlur = 5;
            ctx.shadowColor = '#00cc00';
        }
        
        ctx.fillRect(
            segment.x * CELL_SIZE + 1,
            segment.y * CELL_SIZE + 1,
            CELL_SIZE - 2,
            CELL_SIZE - 2
        );
    });

    // Dibujar comida
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff0000';
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(
        food.x * CELL_SIZE + CELL_SIZE / 2,
        food.y * CELL_SIZE + CELL_SIZE / 2,
        CELL_SIZE / 2 - 2,
        0,
        Math.PI * 2
    );
    ctx.fill();

    // Resetear shadow
    ctx.shadowBlur = 0;
}

function moveSnake() {
    if (isPaused) return;

    // Actualizar dirección
    direction = { ...nextDirection };

    // Calcular nueva posición de la cabeza
    const head = { ...snake[0] };
    head.x += direction.x;
    head.y += direction.y;

    // Verificar colisiones con paredes
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        gameOver();
        return;
    }

    // Verificar colisiones con el propio cuerpo
    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        gameOver();
        return;
    }

    // Agregar nueva cabeza
    snake.unshift(head);

    // Verificar si comió la comida
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        updateScore();
        spawnFood();
        
        // Aumentar velocidad gradualmente
        if (score % 50 === 0 && gameSpeed > 50) {
            gameSpeed -= 10;
            clearInterval(gameLoop);
            gameLoop = setInterval(update, gameSpeed);
        }
    } else {
        // Quitar cola si no comió
        snake.pop();
    }
}

function update() {
    moveSnake();
    drawGame();
}

function gameOver() {
    clearInterval(gameLoop);
    gameStarted = false;
    finalScoreElement.textContent = score;
    gameOverScreen.classList.remove('hidden');
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    pauseBtn.textContent = 'Pausar';
}

function startGame() {
    if (gameStarted) return;
    
    initGame();
    drawGame();
    
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(update, gameSpeed);
    
    startBtn.disabled = true;
    pauseBtn.disabled = false;
}

function togglePause() {
    if (!gameStarted) return;
    
    isPaused = !isPaused;
    pauseBtn.textContent = isPaused ? 'Reanudar' : 'Pausar';
}

function resetGame() {
    if (gameLoop) clearInterval(gameLoop);
    gameStarted = false;
    isPaused = false;
    initGame();
    drawGame();
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    pauseBtn.textContent = 'Pausar';
    gameOverScreen.classList.add('hidden');
}

// Event Listeners
startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', togglePause);
resetBtn.addEventListener('click', resetGame);
playAgainBtn.addEventListener('click', () => {
    resetGame();
    startGame();
});

// Controles del teclado
document.addEventListener('keydown', (e) => {
    if (!gameStarted && e.key !== ' ') return;

    switch (e.key) {
        case 'ArrowUp':
            e.preventDefault();
            if (direction.y === 0) {
                nextDirection = { x: 0, y: -1 };
            }
            break;
        case 'ArrowDown':
            e.preventDefault();
            if (direction.y === 0) {
                nextDirection = { x: 0, y: 1 };
            }
            break;
        case 'ArrowLeft':
            e.preventDefault();
            if (direction.x === 0) {
                nextDirection = { x: -1, y: 0 };
            }
            break;
        case 'ArrowRight':
            e.preventDefault();
            if (direction.x === 0) {
                nextDirection = { x: 1, y: 0 };
            }
            break;
        case ' ':
            e.preventDefault();
            if (gameStarted) {
                togglePause();
            } else {
                startGame();
            }
            break;
    }
});

// Controles táctiles para móviles
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

canvas.addEventListener('touchend', (e) => {
    if (!gameStarted) {
        startGame();
        return;
    }

    e.preventDefault();
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Movimiento horizontal
        if (deltaX > 0 && direction.x === 0) {
            nextDirection = { x: 1, y: 0 };
        } else if (deltaX < 0 && direction.x === 0) {
            nextDirection = { x: -1, y: 0 };
        }
    } else {
        // Movimiento vertical
        if (deltaY > 0 && direction.y === 0) {
            nextDirection = { x: 0, y: 1 };
        } else if (deltaY < 0 && direction.y === 0) {
            nextDirection = { x: 0, y: -1 };
        }
    }
});

// Dibujar estado inicial
initGame();
drawGame();
gameStarted = false;
startBtn.disabled = false;
pauseBtn.disabled = true;
