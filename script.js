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
const daySelect = document.querySelector('#daySelect');
const talkSelect = document.querySelector('#talkSelect');
const reloadTalksButton = document.querySelector('#reloadTalksButton');
const importButton = document.querySelector('#importButton');
const manualLinkInput = document.querySelector('#manualLinkInput');
const manualImportButton = document.querySelector('#manualImportButton');
const importHint = document.querySelector('#sheetHint');
const rangeStartInput = document.querySelector('#rangeStartInput');
const rangeInput = document.querySelector('#rangeInput');
const rangeButton = document.querySelector('#rangeButton');
let countdownTimer = null;
let loadedTalk = null;
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

function buildCsvUrl(link) {
  let url;
  try {
    url = new URL(link.trim());
  } catch {
    return null;
  }

  if (!url.hostname.endsWith('docs.google.com') || !url.pathname.includes('/spreadsheets/')) {
    return null;
  }

  // Planilha publicada na web: .../spreadsheets/d/e/<id>/pubhtml
  if (url.pathname.includes('/spreadsheets/d/e/')) {
    url.pathname = url.pathname.replace(/\/pubhtml$/, '/pub');
    url.searchParams.set('output', 'csv');
    return url.toString();
  }

  // Planilha compartilhada por link: .../spreadsheets/d/<id>/edit#gid=0
  const match = url.pathname.match(/\/spreadsheets\/d\/([\w-]+)/);
  if (!match) return null;
  const gid = url.searchParams.get('gid') || (url.hash.match(/gid=(\d+)/) || [])[1];
  const csvUrl = new URL(`https://docs.google.com/spreadsheets/d/${match[1]}/gviz/tq`);
  csvUrl.searchParams.set('tqx', 'out:csv');
  if (gid) csvUrl.searchParams.set('gid', gid);
  return csvUrl.toString();
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (inQuotes) {
      if (char === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[index + 1] === '\n') index += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function findNameColumn(headers) {
  const index = headers.findIndex((header) => /\bnome|\bname/i.test(header));
  if (index !== -1) return index;
  // A primeira coluna do Forms é o "Carimbo de data/hora"
  return headers.length > 1 ? 1 : 0;
}

function showImportMessage(message, type = '') {
  importHint.textContent = message;
  importHint.className = `import-hint ${type ? `is-${type}` : ''}`;
}

function addImportedNames(importedNames) {
  const existing = new Set(getNames().map(normalizeName));
  const newNames = importedNames.filter((name) => {
    const key = normalizeName(name);
    if (existing.has(key)) return false;
    existing.add(key);
    return true;
  });

  if (newNames.length) {
    const current = namesInput.value.trim();
    namesInput.value = current ? `${current}\n${newNames.join('\n')}` : newNames.join('\n');
    updateCount();
  }

  return newNames.length;
}

function talkKey(talk) {
  return [talk.day, talk.time, talk.title, talk.link].join('|');
}

function parseDay(value) {
  const text = value.trim();
  // Aceita "02/10", "2/10/2026" e "2026-10-02"
  const iso = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  const [dayOfMonth, month] = iso ? [Number(iso[3]), Number(iso[2])] : text.split('/').map(Number);
  if (!(dayOfMonth >= 1 && dayOfMonth <= 31 && month >= 1 && month <= 12)) return null;
  return `${String(dayOfMonth).padStart(2, '0')}/${String(month).padStart(2, '0')}`;
}

function parseTime(value) {
  const [hours, minutes = 0] = value.trim().split(/[:h]/).map(Number);
  if (!(hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59)) return null;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function dayToNumber(day) {
  const [dayOfMonth, month] = day.split('/').map(Number);
  return (month || 0) * 100 + (dayOfMonth || 0);
}

function timeToMinutes(time) {
  const [hours, minutes = 0] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function findColumn(headers, pattern, fallback) {
  const index = headers.findIndex((header) => pattern.test(header.trim()));
  return index === -1 ? fallback : index;
}

async function fetchTalks() {
  const sheetLink = typeof PLANILHA_PALESTRAS === 'string' ? PLANILHA_PALESTRAS : '';
  const csvUrl = buildCsvUrl(sheetLink);
  if (!csvUrl) throw new Error('config');

  const url = new URL(csvUrl);
  if (url.pathname.endsWith('/gviz/tq')) url.searchParams.set('headers', '1');
  const response = await fetch(url, { cache: 'no-store' });
  const text = await response.text();
  if (!response.ok || text.trimStart().startsWith('<')) throw new Error('access');

  const [headers = [], ...rows] = parseCsv(text);
  const dayColumn = findColumn(headers, /^(dia|data)/i, 0);
  const timeColumn = findColumn(headers, /^(hora|horário|horario|início|inicio)/i, 1);
  const titleColumn = findColumn(headers, /^(título|titulo|palestra|nome|tema)/i, 2);
  const linkColumn = findColumn(headers, /^(link|planilha|url)/i, 3);

  return rows
    .map((row) => ({
      day: parseDay(row[dayColumn] || ''),
      time: parseTime(row[timeColumn] || ''),
      title: (row[titleColumn] || '').trim(),
      link: (row[linkColumn] || '').trim(),
    }))
    .filter((talk) => talk.day && talk.time && talk.link)
    .sort((a, b) => dayToNumber(a.day) - dayToNumber(b.day)
      || timeToMinutes(a.time) - timeToMinutes(b.time)
      || a.title.localeCompare(b.title, 'pt-BR'));
}

let talks = [];

function selectedTalk() {
  return talkSelect.value === '' ? null : talks[Number(talkSelect.value)];
}

function talksOfDay(day) {
  return talks.map((talk, index) => ({ ...talk, index })).filter((talk) => talk.day === day);
}

function updateImportButton() {
  const talk = selectedTalk();
  importButton.textContent = talk && talkKey(talk) === loadedTalk ? 'Atualizar' : 'Carregar';
}

function fillTalkSelect(preferredIndex) {
  const dayTalks = talksOfDay(daySelect.value);
  talkSelect.innerHTML = '';
  dayTalks.forEach((talk) => {
    talkSelect.add(new Option(talk.title ? `${talk.time} — ${talk.title}` : talk.time, talk.index));
  });
  if (dayTalks.some((talk) => talk.index === preferredIndex)) talkSelect.value = preferredIndex;
  updateImportButton();
}

function selectCurrentTalk(days) {
  // Pré-seleciona o dia de hoje e a palestra que está acontecendo agora
  const now = new Date();
  const today = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}`;
  const todayDay = days.find((day) => day === today);
  daySelect.value = todayDay || days[0];

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const current = talksOfDay(daySelect.value)
    .filter((talk) => timeToMinutes(talk.time) <= nowMinutes)
    .pop();
  fillTalkSelect(todayDay && current ? current.index : undefined);
}

function setTalkControlsDisabled(disabled) {
  daySelect.disabled = disabled;
  talkSelect.disabled = disabled;
  importButton.disabled = disabled;
}

async function refreshTalks() {
  const previous = selectedTalk();
  const keyToSelect = previous && talkKey(previous);
  reloadTalksButton.disabled = true;
  reloadTalksButton.textContent = 'Carregando...';

  try {
    talks = await fetchTalks();
  } catch (error) {
    talks = [];
    showImportMessage(
      error.message === 'config'
        ? 'Coloque o link da planilha de palestras no arquivo palestras.js.'
        : 'Não foi possível ler a planilha de palestras. Verifique se ela está compartilhada como "Qualquer pessoa com o link".',
      'error',
    );
  } finally {
    reloadTalksButton.disabled = false;
    reloadTalksButton.textContent = '↻ Recarregar palestras';
  }

  daySelect.innerHTML = '';
  talkSelect.innerHTML = '';
  const days = [...new Set(talks.map((talk) => talk.day))];
  setTalkControlsDisabled(!days.length);

  if (!days.length) {
    if (!importHint.classList.contains('is-error')) {
      showImportMessage('Nenhuma palestra encontrada na planilha. Preencha as colunas Dia, Hora, Título e Link.', 'error');
    }
    return;
  }

  days.forEach((day) => daySelect.add(new Option(day, day)));

  const index = talks.findIndex((talk) => talkKey(talk) === keyToSelect);
  if (index === -1) {
    selectCurrentTalk(days);
  } else {
    daySelect.value = talks[index].day;
    fillTalkSelect(index);
  }

  showImportMessage(`${talks.length} ${talks.length === 1 ? 'palestra' : 'palestras'} na planilha. Escolha o dia e o horário e clique em Carregar.`);
}

function updateManualButton() {
  const link = manualLinkInput.value.trim();
  manualImportButton.textContent = link && talkKey(manualTalk(link)) === loadedTalk ? 'Atualizar' : 'Importar';
}

function manualTalk(link) {
  return { day: '', time: '', title: 'Link manual', link };
}

async function importTalk(talk, button, invalidLinkMessage) {
  const csvUrl = buildCsvUrl(talk.link);

  if (!csvUrl) {
    showImportMessage(invalidLinkMessage, 'error');
    return;
  }

  const isRefresh = talkKey(talk) === loadedTalk;
  button.disabled = true;
  button.textContent = isRefresh ? 'Atualizando...' : 'Carregando...';

  try {
    const response = await fetch(csvUrl);
    const text = await response.text();

    if (!response.ok || text.trimStart().startsWith('<')) {
      throw new Error('access');
    }

    const [headers = [], ...rows] = parseCsv(text);
    const column = findNameColumn(headers);
    const importedNames = rows.map((row) => (row[column] || '').trim()).filter(Boolean);

    if (!isRefresh) {
      // Palestra nova: começa uma lista e um sorteio do zero
      namesInput.value = '';
      resetDrawState();
      updateCount();
      showMessage('');
      loadedTalk = talkKey(talk);
    }

    if (!importedNames.length) {
      showImportMessage(`Nenhum nome encontrado na coluna "${headers[column] || '?'}".`, 'error');
      return;
    }

    const added = addImportedNames(importedNames);
    const label = talk.title || `${talk.day} ${talk.time}`;
    showImportMessage(
      added
        ? `${label}: ${added} ${added === 1 ? 'nome novo' : 'nomes novos'} da coluna "${headers[column]}".`
        : `${label}: nenhum nome novo.`,
      'success',
    );
  } catch {
    showImportMessage('Não foi possível ler a planilha. Verifique se ela está compartilhada como "Qualquer pessoa com o link".', 'error');
  } finally {
    button.disabled = false;
    updateImportButton();
    updateManualButton();
  }
}

function importSelectedTalk() {
  const talk = selectedTalk();
  if (!talk) return;
  importTalk(
    talk,
    importButton,
    `O link cadastrado para ${talk.day} ${talk.time} não é de uma planilha (docs.google.com/spreadsheets/...). Corrija na planilha de palestras e clique em Recarregar palestras.`,
  );
}

function importManualLink() {
  const link = manualLinkInput.value.trim();
  importTalk(
    manualTalk(link),
    manualImportButton,
    'Cole o link da planilha de respostas (docs.google.com/spreadsheets/...), não o link do formulário.',
  );
  try {
    localStorage.setItem('sheetUrl', link);
  } catch {}
}

function fillNumberRange() {
  const min = Number.parseInt(rangeStartInput.value, 10);
  const max = Number.parseInt(rangeInput.value, 10);

  if (!Number.isInteger(min)) {
    showMessage('Informe o número inicial.');
    rangeStartInput.focus();
    return;
  }

  if (!Number.isInteger(max) || max < min) {
    showMessage(`O número final deve ser maior ou igual a ${min}.`);
    rangeInput.focus();
    return;
  }

  const total = max - min + 1;
  if (total > 100000 && !window.confirm(`Serão gerados ${total.toLocaleString('pt-BR')} números. Isso pode deixar a página lenta. Continuar?`)) {
    return;
  }

  namesInput.value = Array.from({ length: total }, (_, index) => min + index).join('\n');
  loadedTalk = null;
  resetDrawState();
  updateCount();
  updateImportButton();
  updateManualButton();
  showMessage(`Números de ${min} a ${max} prontos para o sorteio.`);
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
importButton.addEventListener('click', importSelectedTalk);
rangeButton.addEventListener('click', fillNumberRange);
[rangeStartInput, rangeInput].forEach((input) => input.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') fillNumberRange();
}));
manualImportButton.addEventListener('click', importManualLink);
manualLinkInput.addEventListener('input', updateManualButton);
manualLinkInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') importManualLink();
});

try {
  const savedUrl = localStorage.getItem('sheetUrl');
  if (savedUrl) manualLinkInput.value = savedUrl;
} catch {}
daySelect.addEventListener('change', () => fillTalkSelect());
talkSelect.addEventListener('change', updateImportButton);
reloadTalksButton.addEventListener('click', refreshTalks);

refreshTalks();
updateCount();
