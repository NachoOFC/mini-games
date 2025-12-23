(() => {
  /** @type {HTMLDivElement} */
  const statusEl = document.getElementById('status');
  /** @type {HTMLButtonElement} */
  const resetBtn = document.getElementById('reset');
  /** @type {HTMLDivElement} */
  const boardEl = document.getElementById('board');

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
      setStatus(`Ganó: ${currentPlayer}`);
    } else {
      setStatus('Empate');
    }

    renderAll();
  }

  function switchPlayer() {
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    setStatus(`Turno de: ${currentPlayer}`);
  }

  function handleMove(index) {
    if (gameOver) return;
    if (board[index] !== null) return;

    board[index] = currentPlayer;
    renderCell(index);

    const winnerLine = getWinnerLine();
    if (winnerLine) return endGame(winnerLine);
    if (isDraw()) return endGame(null);

    switchPlayer();
    renderAll();
  }

  function resetGame() {
    board = Array(9).fill(null);
    currentPlayer = 'X';
    gameOver = false;
    clearWinHighlights();
    setStatus('Turno de: X');
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

  resetGame();
})();
