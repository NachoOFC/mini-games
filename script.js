const GAMES = {
  gato: { label: 'Gato (tatetí)', path: './gato/' },
  ahorcado: { label: 'Ahorcado', path: './ahorcado/' },
};

function setGame(gameId) {
  const game = GAMES[gameId] ?? GAMES.gato;

  const frame = document.getElementById('frame');
  const open = document.getElementById('open');
  const openNew = document.getElementById('openNew');

  frame.src = game.path;
  open.href = game.path;
  openNew.href = game.path;

  const url = new URL(window.location.href);
  url.searchParams.set('game', gameId);
  window.history.replaceState({}, '', url);
}

function init() {
  const select = document.getElementById('game');

  const url = new URL(window.location.href);
  const initial = url.searchParams.get('game');

  if (initial && GAMES[initial]) {
    select.value = initial;
  }

  setGame(select.value);

  select.addEventListener('change', () => {
    setGame(select.value);
  });
}

init();
