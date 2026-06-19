const SIZE = 4;
const $ = (id) => document.getElementById(id);

const boardEl = $('board');
const scoreEl = $('score');
const bestEl = $('best');
const newGameBtn = $('newGameBtn');
const gameOverScreen = $('gameOverScreen');
const winScreen = $('winScreen');
const finalScoreEl = $('finalScore');
const winScoreEl = $('winScore');
const retryBtn = $('retryBtn');
const continueBtn = $('continueBtn');
const newGameWinBtn = $('newGameWinBtn');

let grid, score, best, won;

function init() {
  grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  score = 0;
  won = false;
  best = Number(localStorage.getItem('2048best') || 0);
  bestEl.textContent = best;
  spawn();
  spawn();
  render();
  hideAllOverlays();
}

function spawn() {
  const empty = [];
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (!grid[r][c]) empty.push({ r, c });
  if (!empty.length) return;
  const { r, c } = empty[Math.floor(Math.random() * empty.length)];
  grid[r][c] = Math.random() < 0.9 ? 2 : 4;
}

function render() {
  boardEl.innerHTML = '';
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      const v = grid[r][c];
      cell.dataset.value = v || '';
      cell.textContent = v || '';
      boardEl.appendChild(cell);
    }
  }
  scoreEl.textContent = score;
  if (score > best) {
    best = score;
    bestEl.textContent = best;
    localStorage.setItem('2048best', best);
  }
}

function slideRow(row) {
  const filtered = row.filter((v) => v);
  const newRow = [];
  let pts = 0;
  for (let i = 0; i < filtered.length; i++) {
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      newRow.push(filtered[i] * 2);
      pts += filtered[i] * 2;
      i++;
    } else {
      newRow.push(filtered[i]);
    }
  }
  while (newRow.length < SIZE) newRow.push(0);
  return { row: newRow, pts };
}

function rotateClockwise(m) {
  return m[0].map((_, i) => m.map((row) => row[i]).reverse());
}

function rotateCounterClockwise(m) {
  return m[0].map((_, i) => m.map((row) => row[SIZE - 1 - i]));
}

function move(direction) {
  if (gameOverScreen.classList.contains('hidden') === false) return false;
  if (winScreen.classList.contains('hidden') === false && !won) return false;

  let rotated = false;
  let matrix = grid.map((r) => [...r]);

  if (direction === 'up') { matrix = rotateCounterClockwise(matrix); rotated = true; }
  else if (direction === 'down') { matrix = rotateClockwise(matrix); rotated = true; }
  else if (direction === 'right') { matrix = matrix.map((r) => [...r].reverse()); rotated = true; }

  let totalPts = 0;
  let changed = false;
  const newMatrix = matrix.map((row) => {
    const { row: slid, pts } = slideRow(row);
    totalPts += pts;
    if (slid.join(',') !== row.join(',')) changed = true;
    return slid;
  });

  if (!changed) return false;

  if (direction === 'up') { matrix = rotateClockwise(newMatrix); rotated = false; }
  else if (direction === 'down') { matrix = rotateCounterClockwise(newMatrix); rotated = false; }
  else if (direction === 'right') { matrix = newMatrix.map((r) => [...r].reverse()); rotated = false; }
  else matrix = newMatrix;

  grid = matrix;
  score += totalPts;

  spawn();
  render();

  if (!won && grid.some((r) => r.some((v) => v >= 2048))) {
    won = true;
    winScoreEl.textContent = score;
    winScreen.classList.remove('hidden');
  }

  if (isGameOver()) {
    finalScoreEl.textContent = score;
    gameOverScreen.classList.remove('hidden');
  }

  return true;
}

function isGameOver() {
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) {
      if (!grid[r][c]) return false;
      if (c + 1 < SIZE && grid[r][c] === grid[r][c + 1]) return false;
      if (r + 1 < SIZE && grid[r][c] === grid[r + 1][c]) return false;
    }
  return true;
}

function hideAllOverlays() {
  gameOverScreen.classList.add('hidden');
  winScreen.classList.add('hidden');
}

function newGame() {
  hideAllOverlays();
  init();
}

retryBtn.addEventListener('click', newGame);
continueBtn.addEventListener('click', () => {
  winScreen.classList.add('hidden');
});
newGameWinBtn.addEventListener('click', newGame);
newGameBtn.addEventListener('click', newGame);

document.addEventListener('keydown', (e) => {
  const map = {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
  };
  if (map[e.key]) {
    e.preventDefault();
    move(map[e.key]);
  }
});

let tx = 0, ty = 0;
boardEl.addEventListener('touchstart', (e) => {
  tx = e.touches[0].clientX;
  ty = e.touches[0].clientY;
}, { passive: true });
boardEl.addEventListener('touchend', (e) => {
  const dx = e.changedTouches[0].clientX - tx;
  const dy = e.changedTouches[0].clientY - ty;
  const adx = Math.abs(dx), ady = Math.abs(dy);
  if (Math.max(adx, ady) < 20) return;
  if (adx > ady) move(dx > 0 ? 'right' : 'left');
  else move(dy > 0 ? 'down' : 'up');
});

init();
