const SIZE = 500;
const $ = (id) => document.getElementById(id);

const canvas = $('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = $('score');
const timerEl = $('timer');
const startBtn = $('startBtn');
const resetBtn = $('resetBtn');
const goScreen = $('gameOver');
const finalScoreEl = $('finalScore');
const goHSEl = $('goHighScore');
const playAgainBtn = $('playAgainBtn');
const goCloseBtn = $('goClose');

const TARGET_RADIUS = 28;
const CENTER_RADIUS = 7;
let targets, score, timeLeft, phase, highScore, animId, timerInterval;
let lastSpawn, spawnInterval;

highScore = Number(localStorage.getItem('tiroHS') || 0);

function reset() {
  targets = [];
  score = 0;
  timeLeft = 60;
  phase = 'idle';
  spawnInterval = 1200;
  lastSpawn = 0;
  scoreEl.textContent = score;
  timerEl.textContent = timeLeft;
  goScreen.classList.add('hidden');
  startBtn.disabled = false;
  draw();
}

function spawnTarget() {
  const r = TARGET_RADIUS + 4;
  const x = r + Math.random() * (SIZE - r * 2);
  const y = r + Math.random() * (SIZE - r * 2);
  const angle = Math.random() * Math.PI * 2;
  const speed = 0.3 + Math.random() * 0.5;
  targets.push({
    x, y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: TARGET_RADIUS,
    life: 4000,
    spawnedAt: Date.now(),
    opacity: 1,
  });
}

function updateTargets() {
  const now = Date.now();
  targets = targets.filter((t) => {
    t.x += t.vx;
    t.y += t.vy;
    if (t.x < t.radius || t.x > SIZE - t.radius) t.vx *= -1;
    if (t.y < t.radius || t.y > SIZE - t.radius) t.vy *= -1;
    t.x = Math.max(t.radius, Math.min(SIZE - t.radius, t.x));
    t.y = Math.max(t.radius, Math.min(SIZE - t.radius, t.y));
    t.life -= 16;
    if (t.life < 500) t.opacity = t.life / 500;
    return t.life > 0;
  });
}

function drawTarget(t) {
  ctx.save();
  ctx.globalAlpha = t.opacity;
  const cx = t.x, cy = t.y, r = t.radius;
  ctx.shadowColor = '#ff6b6b';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = '#e74c3c';
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.7, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.4, 0, Math.PI * 2);
  ctx.fillStyle = '#e74c3c';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, CENTER_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = '#c0392b';
  ctx.fill();
  ctx.restore();
}

let particles = [];

function addExplosion(x, y) {
  for (let i = 0; i < 14; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 3;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 400 + Math.random() * 300,
      maxLife: 700,
      color: ['#ff6b6b', '#ffa94d', '#ffd43b', '#fff'][Math.floor(Math.random() * 4)],
      size: 2 + Math.random() * 4,
    });
  }
}

function updateParticles() {
  particles = particles.filter((p) => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.05;
    p.life -= 16;
    return p.life > 0;
  });
}

function drawParticles() {
  for (const p of particles) {
    ctx.save();
    ctx.globalAlpha = p.life / p.maxLife;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawBackground() {
  ctx.fillStyle = '#0a0e1a';
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.strokeStyle = '#141c30';
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 10; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 50, 0);
    ctx.lineTo(i * 50, SIZE);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * 50);
    ctx.lineTo(SIZE, i * 50);
    ctx.stroke();
  }
}

function draw() {
  ctx.clearRect(0, 0, SIZE, SIZE);
  drawBackground();
  for (const t of targets) drawTarget(t);
  drawParticles();
  if (phase === 'idle') {
    ctx.fillStyle = 'rgba(10, 14, 26, 0.6)';
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.fillStyle = '#e7eefc';
    ctx.font = 'bold 28px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Tiro al Blanco', SIZE / 2, SIZE / 2 - 12);
    ctx.font = '15px system-ui, sans-serif';
    ctx.fillStyle = '#a8b3cc';
    ctx.fillText('Presioná Comenzar', SIZE / 2, SIZE / 2 + 24);
  }
}

function hitTarget(mx, my) {
  for (let i = targets.length - 1; i >= 0; i--) {
    const t = targets[i];
    const dx = mx - t.x, dy = my - t.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= t.radius) {
      let pts = 0;
      if (dist <= CENTER_RADIUS) pts = 10;
      else if (dist <= t.radius * 0.4) pts = 7;
      else if (dist <= t.radius * 0.7) pts = 5;
      else pts = 3;
      score += pts;
      scoreEl.textContent = score;
      addExplosion(t.x, t.y);
      targets.splice(i, 1);
      return true;
    }
  }
  return false;
}

function gameLoop() {
  if (phase === 'idle') { draw(); animId = requestAnimationFrame(gameLoop); return; }
  if (phase === 'over') { draw(); animId = requestAnimationFrame(gameLoop); return; }
  const now = Date.now();
  if (now - lastSpawn > spawnInterval && targets.length < 8) {
    spawnTarget();
    lastSpawn = now;
    if (spawnInterval > 400) spawnInterval -= 15;
  }
  updateTargets();
  updateParticles();
  draw();
  animId = requestAnimationFrame(gameLoop);
}

function startTimer() {
  timerInterval = setInterval(() => {
    timeLeft--;
    timerEl.textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      endGame();
    }
  }, 1000);
}

function endGame() {
  phase = 'over';
  finalScoreEl.textContent = score;
  let isNew = false;
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('tiroHS', highScore);
    isNew = true;
  }
  goHSEl.textContent = isNew ? '¡Nuevo récord!' : '';
  goScreen.classList.remove('hidden');
}

function startGame() {
  if (phase === 'playing') return;
  reset();
  phase = 'playing';
  lastSpawn = Date.now();
  startBtn.disabled = true;
  startTimer();
  animId = requestAnimationFrame(gameLoop);
}

startBtn.addEventListener('click', startGame);
resetBtn.addEventListener('click', () => {
  clearInterval(timerInterval);
  cancelAnimationFrame(animId);
  reset();
  animId = requestAnimationFrame(gameLoop);
});
playAgainBtn.addEventListener('click', startGame);
goCloseBtn.addEventListener('click', () => {
  goScreen.classList.add('hidden');
  phase = 'idle';
  startBtn.disabled = false;
});

canvas.addEventListener('click', (e) => {
  if (phase !== 'playing') return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = SIZE / rect.width;
  const scaleY = SIZE / rect.height;
  const mx = (e.clientX - rect.left) * scaleX;
  const my = (e.clientY - rect.top) * scaleY;
  hitTarget(mx, my);
});

reset();
animId = requestAnimationFrame(gameLoop);
