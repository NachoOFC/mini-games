const MAX_WRONG = 6;
const ALPHABET = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';

const WORDS = [
  { word: 'PROGRAMACION', hint: 'Pistas: código, lógica, bugs' },
  { word: 'JAVASCRIPT', hint: 'Lenguaje para la web' },
  { word: 'DESARROLLO', hint: 'Crear y mejorar software' },
  { word: 'COMPUTADORA', hint: 'La máquina donde corrés esto' },
  { word: 'ALGORITMO', hint: 'Pasos para resolver un problema' },
  { word: 'GITHUB', hint: 'Repos, commits y PRs' },
  { word: 'NETLIFY', hint: 'Deploy de sitios estáticos' },
  { word: 'FRONTEND', hint: 'Interfaz que ve el usuario' },
  { word: 'BACKEND', hint: 'Servidor y lógica' },
  { word: 'DISEÑO', hint: 'UI/UX, estilos y composición' },
  { word: 'AÑO NUEVO', hint: 'Dos palabras con espacio' },
];

const el = {
  status: document.getElementById('status'),
  reset: document.getElementById('reset'),
  gallows: document.getElementById('gallows'),
  hint: document.getElementById('hint'),
  used: document.getElementById('used'),
  word: document.getElementById('word'),
  keyboard: document.getElementById('keyboard'),
};

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function normalizeSpanish(input) {
  // Mantiene Ñ como letra distinta, y elimina acentos en el resto.
  const placeholder = '__ENYE__';
  return input
    .toUpperCase()
    .replaceAll('Ñ', placeholder)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replaceAll(placeholder, 'Ñ');
}

function isPlayableLetter(char) {
  return char.length === 1 && ALPHABET.includes(char);
}

function getGallows(wrongCount) {
  const frames = [
    [
      ' +---+',
      ' |   |',
      '     |',
      '     |',
      '     |',
      '     |',
      '======',
    ],
    [
      ' +---+',
      ' |   |',
      ' O   |',
      '     |',
      '     |',
      '     |',
      '======',
    ],
    [
      ' +---+',
      ' |   |',
      ' O   |',
      ' |   |',
      '     |',
      '     |',
      '======',
    ],
    [
      ' +---+',
      ' |   |',
      ' O   |',
      '/|   |',
      '     |',
      '     |',
      '======',
    ],
    [
      ' +---+',
      ' |   |',
      ' O   |',
      '/|\\  |',
      '     |',
      '     |',
      '======',
    ],
    [
      ' +---+',
      ' |   |',
      ' O   |',
      '/|\\  |',
      '/    |',
      '     |',
      '======',
    ],
    [
      ' +---+',
      ' |   |',
      ' O   |',
      '/|\\  |',
      '/ \\  |',
      '     |',
      '======',
    ],
  ];

  return frames[Math.max(0, Math.min(frames.length - 1, wrongCount))].join('\n');
}

function createState() {
  const picked = randomItem(WORDS);
  const original = picked.word.toUpperCase();
  const normalized = normalizeSpanish(original);

  return {
    wordOriginal: original,
    wordNormalized: normalized,
    hint: picked.hint ?? '',
    guessed: new Set(),
    wrong: new Set(),
    finished: false,
  };
}

let state = createState();

function getUniqueLetters(normalizedWord) {
  const letters = new Set();
  for (const ch of normalizedWord) {
    if (isPlayableLetter(ch)) letters.add(ch);
  }
  return letters;
}

function isWin() {
  const needed = getUniqueLetters(state.wordNormalized);
  for (const ch of needed) {
    if (!state.guessed.has(ch)) return false;
  }
  return true;
}

function isLose() {
  return state.wrong.size >= MAX_WRONG;
}

function renderWord() {
  el.word.innerHTML = '';

  const normalized = state.wordNormalized;
  const original = state.wordOriginal;

  for (let i = 0; i < original.length; i += 1) {
    const chOriginal = original[i];
    const chNormalized = normalized[i];

    const span = document.createElement('span');
    span.className = 'letter';

    if (chOriginal === ' ') {
      span.classList.add('space');
      span.textContent = ' ';
    } else if (!isPlayableLetter(chNormalized)) {
      span.textContent = chOriginal;
    } else if (state.guessed.has(chNormalized) || state.finished) {
      span.textContent = chOriginal;
    } else {
      span.textContent = '';
      span.setAttribute('aria-label', 'Letra oculta');
    }

    el.word.appendChild(span);
  }
}

function renderUsed() {
  const used = [...state.guessed, ...state.wrong];
  used.sort((a, b) => ALPHABET.indexOf(a) - ALPHABET.indexOf(b));

  el.used.textContent = used.length ? `Usadas: ${used.join(' ')}` : 'Usadas: —';
}

function renderGallows() {
  el.gallows.textContent = getGallows(state.wrong.size);
}

function renderKeyboard() {
  el.keyboard.innerHTML = '';

  for (const letter of ALPHABET) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'key';
    btn.textContent = letter;
    btn.dataset.letter = letter;

    const alreadyUsed = state.guessed.has(letter) || state.wrong.has(letter);
    btn.disabled = state.finished || alreadyUsed;

    el.keyboard.appendChild(btn);
  }
}

function renderStatus() {
  const wrongCount = state.wrong.size;
  const remaining = MAX_WRONG - wrongCount;

  if (isWin()) {
    el.status.textContent = `¡Ganaste! La palabra era: ${state.wordOriginal}`;
    return;
  }

  if (isLose()) {
    el.status.textContent = `Perdiste. La palabra era: ${state.wordOriginal}`;
    return;
  }

  el.status.textContent = `Vidas: ${remaining} · Errores: ${wrongCount}/${MAX_WRONG}`;
}

function renderAll() {
  el.hint.textContent = state.hint ? state.hint : '';
  renderGallows();
  renderWord();
  renderUsed();
  renderKeyboard();
  renderStatus();
}

function finishIfNeeded() {
  if (state.finished) return;
  if (isWin() || isLose()) state.finished = true;
}

function guess(letter) {
  if (state.finished) return;
  if (!isPlayableLetter(letter)) return;

  if (state.guessed.has(letter) || state.wrong.has(letter)) return;

  if (state.wordNormalized.includes(letter)) {
    state.guessed.add(letter);
  } else {
    state.wrong.add(letter);
  }

  finishIfNeeded();
  renderAll();
}

function resetGame() {
  state = createState();
  renderAll();
}

function onKeyDown(event) {
  if (event.ctrlKey || event.metaKey || event.altKey) return;

  const key = event.key;
  if (!key) return;

  // Soporta ñ, letras con acento, etc.
  const normalized = normalizeSpanish(key);

  // Si el usuario tipea "á" queremos tratarlo como "A".
  // Pero si tipea "ñ" queremos tratarlo como "Ñ".
  const letter = normalized.length === 1 ? normalized : normalized[0];
  if (!isPlayableLetter(letter)) return;

  guess(letter);
}

function onKeyboardClick(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const letter = target.dataset.letter;
  if (!letter) return;

  guess(letter);
}

function init() {
  el.reset.addEventListener('click', resetGame);
  el.keyboard.addEventListener('click', onKeyboardClick);
  window.addEventListener('keydown', onKeyDown);

  resetGame();
}

init();
