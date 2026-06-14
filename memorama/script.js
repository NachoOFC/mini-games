const EMOJIS = ['🎮', '🎯', '🚀', '🌟', '🎨', '🎵', '🎪', '🦋'];
const PAIRS = EMOJIS.length;

const $ = (id) => document.getElementById(id);

const gridEl = $('grid');
const pairsEl = $('pairs');
const movesEl = $('moves');
const newGameBtn = $('newGameBtn');
const winScreen = $('winScreen');
const finalMovesEl = $('finalMoves');
const playAgainBtn = $('playAgainBtn');
const winClose = $('winClose');

let cards = [];
let flipped = [];
let moves = 0;
let matchedCount = 0;
let locked = false;

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildDeck() {
  const deck = [];
  EMOJIS.forEach((emoji, i) => {
    deck.push({ id: i, emoji });
    deck.push({ id: i, emoji });
  });
  return shuffle(deck);
}

function render() {
  gridEl.innerHTML = '';
  cards = buildDeck();
  flipped = [];
  moves = 0;
  matchedCount = 0;
  locked = false;
  updateStats();

  cards.forEach((card, i) => {
    const el = document.createElement('div');
    el.className = 'card';
    el.dataset.index = i;
    el.innerHTML = `
      <div class="card-inner">
        <div class="card-face card-back"></div>
        <div class="card-face card-front">${card.emoji}</div>
      </div>`;
    el.addEventListener('click', () => flipCard(i));
    gridEl.appendChild(el);
  });
}

function flipCard(index) {
  if (locked) return;
  const el = gridEl.children[index];
  if (el.classList.contains('flipped') || el.classList.contains('matched')) return;
  if (flipped.length === 2) return;

  el.classList.add('flipped', 'disabled');
  flipped.push(index);

  if (flipped.length === 2) {
    moves++;
    updateStats();
    checkMatch();
  }
}

function checkMatch() {
  locked = true;
  const [a, b] = flipped;
  const cardA = cards[a];
  const cardB = cards[b];

  if (cardA.id === cardB.id) {
    setTimeout(() => {
      gridEl.children[a].classList.add('matched');
      gridEl.children[b].classList.add('matched');
      gridEl.children[a].classList.remove('disabled');
      gridEl.children[b].classList.remove('disabled');
      matchedCount++;
      updateStats();
      flipped = [];
      locked = false;
      if (matchedCount === PAIRS) showWin();
    }, 400);
  } else {
    setTimeout(() => {
      gridEl.children[a].classList.add('wrong');
      gridEl.children[b].classList.add('wrong');
    }, 300);
    setTimeout(() => {
      gridEl.children[a].classList.remove('flipped', 'disabled', 'wrong');
      gridEl.children[b].classList.remove('flipped', 'disabled', 'wrong');
      flipped = [];
      locked = false;
    }, 900);
  }
}

function updateStats() {
  pairsEl.textContent = `${matchedCount} / ${PAIRS}`;
  movesEl.textContent = moves;
}

function showWin() {
  finalMovesEl.textContent = moves;
  winScreen.classList.remove('hidden');
}

function hideWin() {
  winScreen.classList.add('hidden');
}

function newGame() {
  hideWin();
  render();
}

newGameBtn.addEventListener('click', newGame);
playAgainBtn.addEventListener('click', newGame);
winClose.addEventListener('click', hideWin);

render();
