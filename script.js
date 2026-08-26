const namesInput = document.querySelector('#namesInput');
const quantityInput = document.querySelector('#quantityInput');
const nameCount = document.querySelector('#nameCount');
const drawButton = document.querySelector('#drawButton');
const restartButton = document.querySelector('#restartButton');
const buttonIcon = drawButton.querySelector('.button-icon');
const buttonText = drawButton.querySelector('.button-text');
const clearButton = document.querySelector('#clearButton');
const resultPlaceholder = document.querySelector('#resultPlaceholder');
const resultName = document.querySelector('#resultName');
const resultCaption = document.querySelector('#resultCaption');
const resultNavigation = document.querySelector('#resultNavigation');
const previousButton = document.querySelector('#previousButton');
const nextButton = document.querySelector('#nextButton');
const resultCounter = document.querySelector('#resultCounter');
const statusMessage = document.querySelector('#statusMessage');
let countdownTimer = null;
let currentWinners = [];
let currentWinnerIndex = 0;
const drawnNames = new Set();

function normalizeName(name) {
  return name.trim().toLocaleLowerCase('pt-BR');
}

function getNames() {
  const uniqueNames = new Map();

  namesInput.value
    .split(/\r?\n/)
    .map((name) => name.trim())
    .filter(Boolean)
    .forEach((name) => uniqueNames.set(normalizeName(name), name));

  return [...uniqueNames.values()];
}

function updateCount() {
  const total = getNames().length;
  nameCount.textContent = `${total} ${total === 1 ? 'nome' : 'nomes'}`;
}

function showMessage(message) {
  statusMessage.textContent = message;
}

function resetDrawState() {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
  drawnNames.clear();
  resultPlaceholder.hidden = false;
  resultName.hidden = true;
  resultCaption.hidden = true;
  resultNavigation.hidden = true;
  currentWinners = [];
  currentWinnerIndex = 0;
  drawButton.disabled = false;
  restartButton.disabled = true;
  buttonIcon.textContent = '✦';
  buttonText.textContent = 'Sortear nome';
}

function showCurrentWinner() {
  resultName.textContent = currentWinners[currentWinnerIndex];
  resultCounter.textContent = `${currentWinnerIndex + 1} / ${currentWinners.length}`;
  previousButton.disabled = currentWinnerIndex === 0;
  nextButton.disabled = currentWinnerIndex === currentWinners.length - 1;
  resultName.style.animation = 'none';
  resultName.offsetHeight;
  resultName.style.animation = '';
}

function drawName() {
  const names = getNames();
  const quantity = Number.parseInt(quantityInput.value, 10);

  if (!names.length) {
    showMessage('Adicione pelo menos um nome para sortear.');
    namesInput.focus();
    return;
  }

  if (!Number.isInteger(quantity) || quantity < 1) {
    showMessage('Informe uma quantidade válida, a partir de 1.');
    quantityInput.focus();
    return;
  }

  const availableNames = names.filter((name) => !drawnNames.has(normalizeName(name)));

  if (quantity > availableNames.length) {
    showMessage(`Há apenas ${availableNames.length} ${availableNames.length === 1 ? 'nome disponível' : 'nomes disponíveis'}.`);
    quantityInput.focus();
    return;
  }

  let secondsLeft = 5;
  drawButton.disabled = true;
  buttonIcon.textContent = '◷';
  buttonText.textContent = `Sorteando em ${secondsLeft}s`;
  showMessage('Respire fundo...');

  countdownTimer = setInterval(() => {
    secondsLeft -= 1;

    if (secondsLeft > 0) {
      buttonText.textContent = `Sorteando em ${secondsLeft}s`;
      return;
    }

    clearInterval(countdownTimer);
    countdownTimer = null;
    const selectedNames = [];
    const pool = [...availableNames];

    for (let index = 0; index < quantity; index += 1) {
      const selectedIndex = Math.floor(Math.random() * pool.length);
      const [selectedName] = pool.splice(selectedIndex, 1);
      selectedNames.push(selectedName);
      drawnNames.add(normalizeName(selectedName));
    }

    resultPlaceholder.hidden = true;
    resultName.hidden = false;
    resultCaption.hidden = false;
    currentWinners = selectedNames;
    currentWinnerIndex = 0;
    showCurrentWinner();
    resultNavigation.hidden = selectedNames.length < 2;
    resultCaption.textContent = quantity === 1 ? 'foi o nome escolhido' : 'foram os nomes escolhidos';
    drawButton.disabled = false;
    restartButton.disabled = false;
    buttonIcon.textContent = '✦';
    buttonText.textContent = 'Sortear nome';
    const remaining = availableNames.length - quantity;
    showMessage(`${remaining} ${remaining === 1 ? 'nome restante' : 'nomes restantes'}`);
  }, 1000);
}

previousButton.addEventListener('click', () => {
  if (currentWinnerIndex > 0) {
    currentWinnerIndex -= 1;
    showCurrentWinner();
  }
});

nextButton.addEventListener('click', () => {
  if (currentWinnerIndex < currentWinners.length - 1) {
    currentWinnerIndex += 1;
    showCurrentWinner();
  }
});

namesInput.addEventListener('input', () => {
  resetDrawState();
  updateCount();
  showMessage('');
});
drawButton.addEventListener('click', drawName);
clearButton.addEventListener('click', () => {
  resetDrawState();
  namesInput.value = '';
  updateCount();
  showMessage('');
  namesInput.focus();
});
restartButton.addEventListener('click', () => {
  resetDrawState();
  showMessage('Sorteio reiniciado. Todos os nomes estão disponíveis novamente.');
});

updateCount();
