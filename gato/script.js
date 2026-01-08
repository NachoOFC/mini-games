(() => {
  /** @type {HTMLDivElement} */
  const statusEl = document.getElementById('status');
  /** @type {HTMLParagraphElement} */
  const subtitleEl = document.getElementById('subtitle');
  /** @type {HTMLButtonElement} */
  const resetBtn = document.getElementById('reset');
  /** @type {HTMLDivElement} */
  const boardEl = document.getElementById('board');
  /** @type {HTMLButtonElement} */
  const modeLocalBtn = document.getElementById('modeLocal');
  /** @type {HTMLButtonElement} */
  const modeIABtn = document.getElementById('modeIA');
  /** @type {HTMLDivElement} */
  const difficultySelectorEl = document.getElementById('difficultySelector');
  /** @type {HTMLButtonElement} */
  const difficultyNormalBtn = document.getElementById('difficultyNormal');
  /** @type {HTMLButtonElement} */
  const difficultyImpossibleBtn = document.getElementById('difficultyImpossible');

  /** @type {HTMLButtonElement[]} */
  const cells = Array.from(boardEl.querySelectorAll('.cell'));

  const WIN_LINES = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  /** @type {('X'|'O'|null)[]} */
  let board = Array(9).fill(null);
  /** @type {'X'|'O'} */
  let currentPlayer = 'X';
  let gameOver = false;
  let vsIA = false;
  let difficulty = 'normal'; // 'normal' o 'impossible'
  let moveCount = 0;
  const IA_PLAYER = 'O';
  const HUMAN_PLAYER = 'X';

  function setStatus(message) {
    statusEl.textContent = message;
  }

  function renderCell(index) {
    const value = board[index];
    const cell = cells[index];

    cell.textContent = value ?? '';
    cell.classList.toggle('x', value === 'X');
    cell.classList.toggle('o', value === 'O');
    cell.disabled = gameOver || value !== null;
  }

  function renderAll() {
    for (let i = 0; i < 9; i++) renderCell(i);
  }

  function clearWinHighlights() {
    for (const cell of cells) cell.classList.remove('win');
  }

  function getWinnerLine() {
    for (const line of WIN_LINES) {
      const [a, b, c] = line;
      const v = board[a];
      if (v && v === board[b] && v === board[c]) return line;
    }
    return null;
  }

  function isDraw() {
    return board.every((v) => v !== null);
  }

  function endGame(winnerLine) {
    gameOver = true;

    if (winnerLine) {
      for (const idx of winnerLine) cells[idx].classList.add('win');
      const winner = board[winnerLine[0]];
      if (vsIA) {
        setStatus(winner === HUMAN_PLAYER ? '¡Ganaste! 🎉' : 'Ganó la IA 🤖');
      } else {
        setStatus(`Ganó: ${winner}`);
      }
    } else {
      setStatus('Empate');
    }

    renderAll();
  }

  function switchPlayer() {
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    if (vsIA) {
      setStatus(currentPlayer === HUMAN_PLAYER ? 'Tu turno' : 'Turno de la IA...');
    } else {
      setStatus(`Turno de: ${currentPlayer}`);
    }
  }

  // ========== IA: Algoritmo Minimax ==========
  
  function checkWinner(testBoard) {
    for (const line of WIN_LINES) {
      const [a, b, c] = line;
      const v = testBoard[a];
      if (v && v === testBoard[b] && v === testBoard[c]) return v;
    }
    return null;
  }

  function getEmptyCells(testBoard) {
    return testBoard.map((v, i) => (v === null ? i : null)).filter((v) => v !== null);
  }

  function minimax(testBoard, depth, isMaximizing) {
    const winner = checkWinner(testBoard);
    
    // Casos terminales
    if (winner === IA_PLAYER) return 10 - depth;
    if (winner === HUMAN_PLAYER) return depth - 10;
    if (getEmptyCells(testBoard).length === 0) return 0;

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (const index of getEmptyCells(testBoard)) {
        testBoard[index] = IA_PLAYER;
        const score = minimax(testBoard, depth + 1, false);
        testBoard[index] = null;
        bestScore = Math.max(score, bestScore);
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (const index of getEmptyCells(testBoard)) {
        testBoard[index] = HUMAN_PLAYER;
        const score = minimax(testBoard, depth + 1, true);
        testBoard[index] = null;
        bestScore = Math.min(score, bestScore);
      }
      return bestScore;
    }
  }

  function getBestMove() {
    const emptyCells = getEmptyCells(board);
    
    // Modo Normal: solo la primera jugada es random, después juega perfecto
    if (difficulty === 'normal' && moveCount === 1) {
      return emptyCells[Math.floor(Math.random() * emptyCells.length)];
    }
    
    // Después de la primera jugada o en modo Imposible: usar minimax (jugar perfecto)
    let bestScore = -Infinity;
    let bestMove = null;

    for (const index of emptyCells) {
      board[index] = IA_PLAYER;
      const score = minimax(board, 0, false);
      board[index] = null;

      if (score > bestScore) {
        bestScore = score;
        bestMove = index;
      }
    }

    return bestMove;
  }

  function makeIAMove() {
    if (gameOver || currentPlayer !== IA_PLAYER) return;

    // Pequeño delay para que se vea más natural
    setTimeout(() => {
      const move = getBestMove();
      if (move !== null) {
        handleMove(move, true);
      }
    }, 400);
  }

  // ========== Fin IA ==========

  function handleMove(index, isIAMove = false) {
    if (gameOver) return;
    if (board[index] !== null) return;
    
    // En modo IA, solo permitir jugadas del humano cuando es su turno (excepto si es la IA jugando)
    if (!isIAMove && vsIA && currentPlayer === IA_PLAYER) return;

    board[index] = currentPlayer;
    moveCount++;
    renderCell(index);

    const winnerLine = getWinnerLine();
    if (winnerLine) return endGame(winnerLine);
    if (isDraw()) return endGame(null);

    switchPlayer();
    renderAll();

    // Si es modo IA y ahora es turno de la IA, que juegue
    if (vsIA && currentPlayer === IA_PLAYER && !isIAMove) {
      makeIAMove();
    }
  }

  function setMode(isIA) {
    vsIA = isIA;
    
    if (isIA) {
      modeIABtn.classList.add('active');
      modeLocalBtn.classList.remove('active');
      difficultySelectorEl.style.display = 'flex';
      updateSubtitle();
    } else {
      modeLocalBtn.classList.add('active');
      modeIABtn.classList.remove('active');
      difficultySelectorEl.style.display = 'none';
      subtitleEl.textContent = 'Turnos locales: X vs O';
    }
    
    resetGame();
  }

  function setDifficulty(level) {
    difficulty = level;
    
    if (level === 'impossible') {
      difficultyImpossibleBtn.classList.add('active');
      difficultyNormalBtn.classList.remove('active');
    } else {
      difficultyNormalBtn.classList.add('active');
      difficultyImpossibleBtn.classList.remove('active');
    }
    
    updateSubtitle();
    resetGame();
  }

  function updateSubtitle() {
    if (vsIA) {
      const diffText = difficulty === 'impossible' ? 'Imposible 🔥' : 'Normal';
      subtitleEl.textContent = `Tú (X) vs IA (O) - ${diffText}`;
    }
  }

  function resetGame() {
    board = Array(9).fill(null);
    currentPlayer = 'X';
    gameOver = false;
    moveCount = 0;
    clearWinHighlights();
    
    if (vsIA) {
      setStatus('Tu turno');
    } else {
      setStatus('Turno de: X');
    }
    
    renderAll();
  }

  function onBoardClick(event) {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) return;
    if (!target.classList.contains('cell')) return;

    const index = Number(target.dataset.index);
    if (!Number.isInteger(index)) return;

    handleMove(index);
  }

  boardEl.addEventListener('click', onBoardClick);
  resetBtn.addEventListener('click', resetGame);
  modeLocalBtn.addEventListener('click', () => setMode(false));
  modeIABtn.addEventListener('click', () => setMode(true));
  difficultyNormalBtn.addEventListener('click', () => setDifficulty('normal'));
  difficultyImpossibleBtn.addEventListener('click', () => setDifficulty('impossible'));

  resetGame();
})();
