/* ── Clock ── */

function updateClock() {
  const now = new Date();
  const timeEl = document.getElementById('time');
  const dateEl = document.getElementById('date');

  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  timeEl.textContent = `${hours}:${minutes}:${seconds} ${ampm}`;

  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  dateEl.textContent = now.toLocaleDateString('en-US', options);
}

setInterval(updateClock, 1000);
updateClock();

/* ── Toast ── */

const toastEl = document.getElementById('toast');
let toastTimer = null;

function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200);
}

/* ── Calculator ── */

const expressionEl = document.getElementById('calc-expression');
const resultEl = document.getElementById('calc-result');
const calcButtons = document.getElementById('calc-buttons');

let currentExpr = '';
let currentResult = '0';
let justEvaluated = false;

calcButtons.addEventListener('click', (e) => {
  const btn = e.target.closest('.calc-btn');
  if (!btn) return;
  handleCalcInput(btn.dataset.value);
});

document.addEventListener('keydown', (e) => {
  const key = e.key;
  if (key === 'Enter') {
    e.preventDefault();
    handleCalcInput('=');
  } else if (key === 'Escape' || key === 'c' || key === 'C') {
    handleCalcInput('C');
  } else if (/^[0-9.+\-*/%]$/.test(key)) {
    e.preventDefault();
    handleCalcInput(key);
  } else if (key === 'Backspace') {
    e.preventDefault();
    handleCalcInput('BACK');
  }
});

function handleCalcInput(value) {
  if (value === 'C') {
    currentExpr = '';
    currentResult = '0';
    justEvaluated = false;
  } else if (value === 'BACK') {
    if (justEvaluated) {
      currentExpr = '';
      currentResult = '0';
      justEvaluated = false;
    } else if (currentExpr.length > 0) {
      currentExpr = currentExpr.slice(0, -1);
      updateResultFromExpr();
    }
  } else if (value === '=') {
    if (currentExpr.length === 0) return;
    try {
      const result = evaluateExpr(currentExpr);
      if (result === Infinity || isNaN(result) || result === undefined) {
        currentResult = 'Error';
      } else {
        currentResult = formatNumber(result);
      }
      currentExpr = currentResult;
      justEvaluated = true;
    } catch {
      currentResult = 'Error';
      justEvaluated = true;
    }
  } else {
    if (justEvaluated) {
      if (/^[0-9.]$/.test(value)) {
        currentExpr = '';
      } else {
        currentExpr = currentResult;
      }
      justEvaluated = false;
    }

    const lastChar = currentExpr.slice(-1);

    if (/^[+\-*/%]$/.test(value)) {
      if (currentExpr.length === 0 && value === '-') {
        currentExpr += value;
      } else if (currentExpr.length === 0) {
        return;
      } else if (/^[+\-*/%]$/.test(lastChar)) {
        currentExpr = currentExpr.slice(0, -1) + value;
      } else {
        currentExpr += value;
      }
    } else if (value === '.') {
      const lastNum = currentExpr.split(/[+\-*/%]/).pop() || '';
      if (lastNum.includes('.')) return;
      if (lastNum === '') currentExpr += '0';
      currentExpr += '.';
    } else {
      currentExpr += value;
    }

    if (!justEvaluated) {
      updateResultFromExpr();
    }
  }

  updateDisplay();
}

function updateResultFromExpr() {
  if (currentExpr.length === 0) {
    currentResult = '0';
    return;
  }
  const lastChar = currentExpr.slice(-1);
  if (/^[+\-*/%]$/.test(lastChar)) {
    const partial = currentExpr.slice(0, -1);
    if (partial.length === 0) {
      currentResult = '0';
      return;
    }
    try {
      currentResult = formatNumber(evaluateExpr(partial));
    } catch {
      currentResult = '\u2026';
    }
    return;
  }
  try {
    currentResult = formatNumber(evaluateExpr(currentExpr));
  } catch {
    currentResult = '\u2026';
  }
}

function evaluateExpr(expr) {
  const tokens = expr.match(/(\d+\.?\d*|\.\d+|[+\-*/%])/g);
  if (!tokens) return 0;

  const nums = [];
  const ops = [];
  let i = 0;

  if (tokens[0] === '-') {
    tokens[1] = '-' + tokens[1];
    i = 1;
  }

  const precedence = { '+': 1, '-': 1, '*': 2, '/': 2, '%': 2 };

  function applyOp() {
    const b = nums.pop();
    const a = nums.pop();
    const op = ops.pop();
    switch (op) {
      case '+': nums.push(a + b); break;
      case '-': nums.push(a - b); break;
      case '*': nums.push(a * b); break;
      case '/': nums.push(a / b); break;
      case '%': nums.push(a % b); break;
    }
  }

  for (; i < tokens.length; i++) {
    const t = tokens[i];
    if (/^[+\-*/%]$/.test(t)) {
      while (ops.length > 0 && precedence[ops[ops.length - 1]] >= precedence[t]) {
        applyOp();
      }
      ops.push(t);
    } else {
      nums.push(parseFloat(t));
    }
  }

  while (ops.length > 0) {
    applyOp();
  }

  return nums[0];
}

function formatNumber(n) {
  if (!isFinite(n) || isNaN(n)) return 'Error';
  if (Number.isInteger(n)) return String(n);
  const str = n.toFixed(10);
  const trimmed = str.replace(/\.?0+$/, '');
  if (trimmed.length > 14) {
    return n.toExponential(4);
  }
  return trimmed;
}

function updateDisplay() {
  expressionEl.textContent = currentExpr;
  resultEl.textContent = currentResult;
}

updateDisplay();

/* ── Notes ── */

const noteInput = document.getElementById('note-input');
const addNoteBtn = document.getElementById('add-note-btn');
const notesList = document.getElementById('notes-list');
const clearAllBtn = document.getElementById('clear-all-btn');

const STORAGE_KEY = 'dashboard_notes';

function loadNotes() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveNotes(notes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

function renderNotes() {
  const notes = loadNotes();
  notesList.innerHTML = '';

  if (notes.length === 0) {
    const li = document.createElement('li');
    li.className = 'empty-message';
    li.textContent = 'No notes yet. Add one above!';
    notesList.appendChild(li);
    return;
  }

  notes.forEach((text, index) => {
    const li = document.createElement('li');
    li.className = 'note-item';

    const span = document.createElement('span');
    span.className = 'note-text';
    span.textContent = text;

    const delBtn = document.createElement('button');
    delBtn.className = 'note-delete';
    delBtn.textContent = '\u00d7';
    delBtn.setAttribute('aria-label', 'Delete note');
    delBtn.addEventListener('click', () => deleteNote(index));

    li.appendChild(span);
    li.appendChild(delBtn);
    notesList.appendChild(li);
  });
}

function addNote() {
  const text = noteInput.value.trim();
  if (!text) return;
  const notes = loadNotes();
  notes.push(text);
  saveNotes(notes);
  renderNotes();
  noteInput.value = '';
  noteInput.focus();
  showToast('Note added!');
}

function deleteNote(index) {
  const notes = loadNotes();
  notes.splice(index, 1);
  saveNotes(notes);
  renderNotes();
  showToast('Note deleted');
}

function clearAllNotes() {
  const notes = loadNotes();
  if (notes.length === 0) return;
  saveNotes([]);
  renderNotes();
  showToast('All notes cleared!');
}

addNoteBtn.addEventListener('click', addNote);
noteInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addNote();
});
clearAllBtn.addEventListener('click', clearAllNotes);

renderNotes();
