const GRID = 20;
const SIZE = 500;
const CELL = SIZE / GRID;
const BASE_TICK = 150;

const $ = (id) => document.getElementById(id);

const canvas = $('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = $('score');
const hsEl = $('highScore');
const startBtn = $('startBtn');
const pauseBtn = $('pauseBtn');
const resetBtn = $('resetBtn');
const goScreen = $('gameOver');
const finalScoreEl = $('finalScore');
const goHSEl = $('goHighScore');
const playAgainBtn = $('playAgainBtn');
const pauseOverlay = $('pauseOverlay');

let snake, direction, nextDir, food, score, highScore, speed, phase;
let lastTime, accumulator, animId, newRecord, countdownStart;

highScore = Number(localStorage.getItem('snakeHS') || 0);
hsEl.textContent = highScore;

function roundRect(x, y, w, h, r) {
	ctx.beginPath();
	ctx.moveTo(x + r, y);
	ctx.lineTo(x + w - r, y);
	ctx.quadraticCurveTo(x + w, y, x + w, y + r);
	ctx.lineTo(x + w, y + h - r);
	ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
	ctx.lineTo(x + r, y + h);
	ctx.quadraticCurveTo(x, y + h, x, y + h - r);
	ctx.lineTo(x, y + r);
	ctx.quadraticCurveTo(x, y, x + r, y);
	ctx.closePath();
}

function reset() {
	snake = [
		{ x: 10, y: 10 },
		{ x: 9, y: 10 },
		{ x: 8, y: 10 },
	];
	direction = { x: 1, y: 0 };
	nextDir = { x: 1, y: 0 };
	score = 0;
	speed = BASE_TICK;
	phase = 'idle';
	lastTime = 0;
	accumulator = 0;
	newRecord = false;
	countdownStart = 0;
	pauseOverlay.classList.add('hidden');
	goScreen.classList.add('hidden');
	startBtn.disabled = false;
	pauseBtn.disabled = true;
	pauseBtn.textContent = 'Pausa';
	updateScore();
	spawnFood();
}

function spawnFood() {
	let f;
	do {
		f = {
			x: Math.floor(Math.random() * GRID),
			y: Math.floor(Math.random() * GRID),
		};
	} while (snake.some((s) => s.x === f.x && s.y === f.y));
	food = f;
}

function updateScore() {
	scoreEl.textContent = score;
	if (score > highScore) {
		highScore = score;
		hsEl.textContent = highScore;
		localStorage.setItem('snakeHS', highScore);
		newRecord = true;
	}
}

function move() {
	direction = { ...nextDir };
	const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
	if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID) { die(); return; }
	if (snake.some((s) => s.x === head.x && s.y === head.y)) { die(); return; }

	snake.unshift(head);
	if (head.x === food.x && head.y === food.y) {
		score += 10;
		updateScore();
		spawnFood();
		if (speed > 60) speed -= 2;
	} else {
		snake.pop();
	}
}

function die() {
	phase = 'dead';
	finalScoreEl.textContent = score;
	goHSEl.textContent = newRecord ? '\u00a1Nuevo r\u00e9cord!' : '';
	goScreen.classList.remove('hidden');
}

function draw() {
	ctx.clearRect(0, 0, SIZE, SIZE);

	ctx.fillStyle = '#0a0e1a';
	ctx.fillRect(0, 0, SIZE, SIZE);

	ctx.strokeStyle = '#141c30';
	ctx.lineWidth = 0.5;
	for (let i = 0; i <= GRID; i++) {
		ctx.beginPath();
		ctx.moveTo(i * CELL, 0);
		ctx.lineTo(i * CELL, SIZE);
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(0, i * CELL);
		ctx.lineTo(SIZE, i * CELL);
		ctx.stroke();
	}

	if (food) {
		const fx = food.x * CELL + CELL / 2;
		const fy = food.y * CELL + CELL / 2;
		const r = CELL / 2 - 2;
		ctx.save();
		ctx.shadowColor = '#ff6b6b';
		ctx.shadowBlur = 14;
		ctx.fillStyle = '#ff6b6b';
		ctx.beginPath();
		ctx.moveTo(fx, fy - r);
		ctx.lineTo(fx + r, fy);
		ctx.lineTo(fx, fy + r);
		ctx.lineTo(fx - r, fy);
		ctx.closePath();
		ctx.fill();
		ctx.restore();
	}

	for (let i = snake.length - 1; i >= 0; i--) {
		const s = snake[i];
		const px = s.x * CELL + 1;
		const py = s.y * CELL + 1;
		const pw = CELL - 2;
		const ph = CELL - 2;
		const t = snake.length > 1 ? i / (snake.length - 1) : 0;

		if (i === 0) {
			ctx.save();
			ctx.shadowColor = '#63e6be';
			ctx.shadowBlur = 6;
			ctx.fillStyle = '#63e6be';
		} else {
			const r = Math.round(42 + t * -32);
			const g = Math.round(184 + t * -100);
			const b = Math.round(150 + t * -80);
			ctx.fillStyle = `rgb(${r},${g},${b})`;
		}

		roundRect(px, py, pw, ph, 5);
		ctx.fill();
		if (i === 0) ctx.restore();
	}

	if (snake.length) {
		const head = snake[0];
		const hx = head.x * CELL;
		const hy = head.y * CELL;
		ctx.fillStyle = '#fff';
		const er = 2.5;
		if (direction.x === 1) {
			ctx.beginPath(); ctx.arc(hx + 16, hy + 7, er, 0, Math.PI * 2); ctx.fill();
			ctx.beginPath(); ctx.arc(hx + 16, hy + 17, er, 0, Math.PI * 2); ctx.fill();
		} else if (direction.x === -1) {
			ctx.beginPath(); ctx.arc(hx + 8, hy + 7, er, 0, Math.PI * 2); ctx.fill();
			ctx.beginPath(); ctx.arc(hx + 8, hy + 17, er, 0, Math.PI * 2); ctx.fill();
		} else if (direction.y === -1) {
			ctx.beginPath(); ctx.arc(hx + 7, hy + 8, er, 0, Math.PI * 2); ctx.fill();
			ctx.beginPath(); ctx.arc(hx + 17, hy + 8, er, 0, Math.PI * 2); ctx.fill();
		} else {
			ctx.beginPath(); ctx.arc(hx + 7, hy + 16, er, 0, Math.PI * 2); ctx.fill();
			ctx.beginPath(); ctx.arc(hx + 17, hy + 16, er, 0, Math.PI * 2); ctx.fill();
		}
	}

	if (phase === 'idle') {
		ctx.fillStyle = 'rgba(10, 14, 26, 0.6)';
		ctx.fillRect(0, 0, SIZE, SIZE);
		ctx.fillStyle = '#e7eefc';
		ctx.font = 'bold 28px system-ui, sans-serif';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText('Snake', SIZE / 2, SIZE / 2 - 12);
		ctx.font = '15px system-ui, sans-serif';
		ctx.fillStyle = '#a8b3cc';
		ctx.fillText('Presiona Comenzar o ESPACIO', SIZE / 2, SIZE / 2 + 24);
	}
}

function drawCountdown(remaining) {
	ctx.fillStyle = 'rgba(10, 14, 26, 0.5)';
	ctx.fillRect(0, 0, SIZE, SIZE);
	ctx.fillStyle = '#e7eefc';
	ctx.font = 'bold 72px system-ui, sans-serif';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillText(remaining > 0 ? remaining : 'Go!', SIZE / 2, SIZE / 2);
}

function loop(time) {
	if (phase === 'idle' || phase === 'dead') {
		draw();
		animId = requestAnimationFrame(loop);
		return;
	}

	if (phase === 'countdown') {
		if (!countdownStart) countdownStart = time;
		const elapsed = time - countdownStart;
		draw();
		drawCountdown(Math.ceil(3 - elapsed / 1000));
		if (elapsed >= 3500) {
			phase = 'playing';
			lastTime = 0;
			accumulator = 0;
			countdownStart = 0;
			pauseBtn.disabled = false;
		}
		animId = requestAnimationFrame(loop);
		return;
	}

	if (phase === 'paused') {
		draw();
		animId = requestAnimationFrame(loop);
		return;
	}

	if (!lastTime) lastTime = time;
	const delta = Math.min(time - lastTime, 100);
	lastTime = time;

	accumulator += delta;
	while (accumulator >= speed) {
		move();
		accumulator -= speed;
		if (phase === 'dead') { draw(); return; }
	}

	draw();
	animId = requestAnimationFrame(loop);
}

function startGame() {
	if (phase === 'playing' || phase === 'countdown') return;
	reset();
	phase = 'countdown';
	countdownStart = 0;
	startBtn.disabled = true;
	pauseBtn.disabled = true;
	goScreen.classList.add('hidden');
	animId = requestAnimationFrame(loop);
}

function togglePause() {
	if (phase === 'playing') {
		phase = 'paused';
		pauseBtn.textContent = 'Reanudar';
		pauseOverlay.classList.remove('hidden');
	} else if (phase === 'paused') {
		phase = 'playing';
		pauseBtn.textContent = 'Pausa';
		pauseOverlay.classList.add('hidden');
		lastTime = 0;
	}
}

function setDir(d) {
	if (phase !== 'playing' && phase !== 'paused') return;
	if (d.x && d.x === -direction.x) return;
	if (d.y && d.y === -direction.y) return;
	nextDir = d;
}

startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', togglePause);
resetBtn.addEventListener('click', () => {
	cancelAnimationFrame(animId);
	reset();
	animId = requestAnimationFrame(loop);
});
playAgainBtn.addEventListener('click', startGame);

document.addEventListener('keydown', (e) => {
	if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
	if (e.key === ' ') {
		if (phase === 'idle' || phase === 'dead') { startGame(); return; }
		togglePause();
		return;
	}
	const map = {
		ArrowUp: { x: 0, y: -1 },
		ArrowDown: { x: 0, y: 1 },
		ArrowLeft: { x: -1, y: 0 },
		ArrowRight: { x: 1, y: 0 },
	};
	if (map[e.key]) setDir(map[e.key]);
});

document.querySelectorAll('.dpad-btn').forEach((btn) => {
	btn.addEventListener('click', () => {
		const map = {
			up: { x: 0, y: -1 },
			down: { x: 0, y: 1 },
			left: { x: -1, y: 0 },
			right: { x: 1, y: 0 },
		};
		setDir(map[btn.dataset.dir]);
	});
});

let tx = 0, ty = 0;
canvas.addEventListener('touchstart', (e) => {
	tx = e.touches[0].clientX;
	ty = e.touches[0].clientY;
});
canvas.addEventListener('touchend', (e) => {
	const dx = e.changedTouches[0].clientX - tx;
	const dy = e.changedTouches[0].clientY - ty;
	if (Math.abs(dx) > Math.abs(dy)) {
		setDir({ x: dx > 0 ? 1 : -1, y: 0 });
	} else {
		setDir({ x: 0, y: dy > 0 ? 1 : -1 });
	}
});

reset();
animId = requestAnimationFrame(loop);
