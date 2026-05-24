const TASKS_KEY    = 'taskrng:tasks';
const SETTINGS_KEY = 'taskrng:settings';

const THEMES = {
  classic: { '--paper':'#fff9b1','--paper-2':'#ffffdf','--ink':'#2a1820','--ink-soft':'#7a5468','--accent':'#ff28b0','--accent-ink':'#ffffff','--gold':'#fffa64','--rule':'rgba(255,40,176,.2)' },
  neon:    { '--paper':'#1a0612','--paper-2':'#260a1d','--ink':'#fff9b1','--ink-soft':'#caa5b7','--accent':'#ff28b0','--accent-ink':'#1a0612','--gold':'#fffa64','--rule':'rgba(255,154,204,.2)' },
  cotton:  { '--paper':'#ffeaf5','--paper-2':'#ffffff','--ink':'#2a1820','--ink-soft':'#7a5468','--accent':'#ff28b0','--accent-ink':'#ffffff','--gold':'#fffa64','--rule':'rgba(255,40,176,.18)' },
};

let rolling = false;
let chosenId = null;
let hideDone = false;

/* ── init ─────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  loadTasksFromCache();
  updateUI();

  window.addEventListener('keydown', (e) => {
    if (e.code !== 'Space') return;
    const tag = (document.activeElement?.tagName || '');
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    e.preventDefault();
    roll();
  });
});

/* ── settings ─────────────────────────────────── */
function getSettings() {
  return {
    weighted:      document.getElementById('weighted-toggle').checked,
    showWeights:   document.getElementById('show-weights').checked,
    defaultWeight: parseInt(document.getElementById('default-weight').value) || 1,
    animate:       document.getElementById('animate-toggle').checked,
    confetti:      document.getElementById('confetti-toggle').checked,
    theme:         document.body.dataset.theme || 'classic',
    hideDone,
  };
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(getSettings()));
}

function loadSettings() {
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) { applyTheme('classic', false); return; }
  try {
    const s = JSON.parse(raw);
    if (s.weighted    !== undefined) document.getElementById('weighted-toggle').checked = s.weighted;
    if (s.showWeights !== undefined) document.getElementById('show-weights').checked    = s.showWeights;
    if (s.defaultWeight)             document.getElementById('default-weight').value    = s.defaultWeight;
    if (s.animate     !== undefined) document.getElementById('animate-toggle').checked  = s.animate;
    if (s.confetti    !== undefined) document.getElementById('confetti-toggle').checked = s.confetti;
    if (s.hideDone    !== undefined) hideDone = s.hideDone;
    if (s.theme)                     applyTheme(s.theme, false);
  } catch {}
}

function setTheme(name) {
  applyTheme(name, true);
}

function applyTheme(name, save) {
  document.body.dataset.theme = name === 'classic' ? '' : name;
  const vars = THEMES[name] || THEMES.classic;
  Object.entries(vars).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
  document.body.style.background = vars['--paper'];

  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === name);
  });

  if (save) saveSettings();
}

/* ── cache ────────────────────────────────────── */
function cacheTasksToStorage() {
  const items = Array.from(document.getElementById('tasks-container').children);
  const data = items.map(el => {
    const textSpan = el.querySelector('.task-text');
    const editInput = el.querySelector('.task-edit-input');
    return {
      id:     el.dataset.id,
      text:   textSpan?.textContent || editInput?.value || '',
      weight: parseInt(el.querySelector('.weight-input')?.value) || 1,
      done:   el.classList.contains('is-done'),
    };
  });
  localStorage.setItem(TASKS_KEY, JSON.stringify(data));
  updateUI();
}

function loadTasksFromCache() {
  const raw = localStorage.getItem(TASKS_KEY);
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    const container = document.getElementById('tasks-container');
    data.forEach(({ id, text, weight, done }) => {
      container.appendChild(createTaskItem(text, weight, id, done));
    });
  } catch {}
}

/* ── tasks ────────────────────────────────────── */
function addTask() {
  const input = document.getElementById('new-task');
  const text = input.value.trim();
  if (!text) return;
  const weight = parseInt(document.getElementById('default-weight').value) || 1;
  const item = createTaskItem(text, weight);
  document.getElementById('tasks-container').appendChild(item);
  input.value = '';
  cacheTasksToStorage();
}

function createTaskItem(text, weight = 1, id = null, done = false) {
  const showWeights = document.getElementById('show-weights').checked;
  const taskId = id || Math.random().toString(36).slice(2, 9);

  const row = document.createElement('li');
  row.className = 'task-row' + (done ? ' is-done' : '');
  row.dataset.id = taskId;

  // Check button
  const checkBtn = document.createElement('button');
  checkBtn.className = 'task-check';
  checkBtn.title = done ? 'Mark not done' : 'Mark done';
  checkBtn.innerHTML = done
    ? `<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8.5l3.2 3L13 4.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
    : `<span class="check-ring"></span>`;
  checkBtn.addEventListener('click', () => toggleDone(row));

  // Index label
  const idx = document.createElement('span');
  idx.className = 'task-idx';

  // Weight input
  const weightInput = document.createElement('input');
  weightInput.type = 'number';
  weightInput.value = weight;
  weightInput.min = 1;
  weightInput.max = 99;
  weightInput.className = 'weight-input' + (showWeights ? '' : ' hidden');
  weightInput.title = 'Task weight';
  weightInput.addEventListener('change', cacheTasksToStorage);

  // Text + weight wrapper so they share the grid cell
  const textWrap = document.createElement('div');
  textWrap.className = 'flex items-center gap-2 min-w-0';
  textWrap.appendChild(weightInput);

  const textSpan = document.createElement('span');
  textSpan.className = 'task-text flex-1';
  textSpan.textContent = text;
  textSpan.addEventListener('dblclick', () => startInlineEdit(row, textSpan));
  textWrap.appendChild(textSpan);

  // Actions
  const actions = document.createElement('div');
  actions.className = 'task-actions';

  const editBtn = document.createElement('button');
  editBtn.className = 'icon-btn';
  editBtn.title = 'Edit';
  editBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M2.5 13.5l3-.8 7.4-7.4-2.2-2.2L3.3 10.5l-.8 3z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>`;
  editBtn.addEventListener('click', () => startInlineEdit(row, textSpan));

  const removeBtn = document.createElement('button');
  removeBtn.className = 'icon-btn';
  removeBtn.title = 'Remove';
  removeBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 4.5h10M6.5 4V3a1 1 0 011-1h1a1 1 0 011 1v1M4.5 4.5l.7 8a1.5 1.5 0 001.5 1.4h2.6a1.5 1.5 0 001.5-1.4l.7-8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  removeBtn.addEventListener('click', () => { row.remove(); cacheTasksToStorage(); });

  actions.append(editBtn, removeBtn);
  row.append(checkBtn, idx, textWrap, actions);
  return row;
}

function startInlineEdit(row, textSpan) {
  if (row.querySelector('.task-edit-input')) return;
  const input = document.createElement('input');
  input.className = 'task-edit-input flex-1';
  input.value = textSpan.textContent;
  textSpan.replaceWith(input);
  input.focus();
  input.select();

  const commit = () => {
    const next = input.value.trim();
    textSpan.textContent = next || textSpan.textContent;
    input.replaceWith(textSpan);
    cacheTasksToStorage();
  };
  input.addEventListener('blur', commit);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
    if (e.key === 'Escape') { input.value = textSpan.textContent; input.blur(); }
  });
}

function toggleDone(row) {
  row.classList.toggle('is-done');
  const done = row.classList.contains('is-done');
  const checkBtn = row.querySelector('.task-check');
  checkBtn.title = done ? 'Mark not done' : 'Mark done';
  checkBtn.innerHTML = done
    ? `<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8.5l3.2 3L13 4.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
    : `<span class="check-ring"></span>`;

  if (done && row.dataset.id === chosenId) {
    chosenId = null;
    row.classList.remove('is-chosen');
    resetRollCard();
  }
  cacheTasksToStorage();
}

function toggleHideDone() {
  hideDone = !hideDone;
  const btn = document.getElementById('hide-done-btn');
  btn.textContent = hideDone ? 'Show done' : 'Hide done';
  updateTaskVisibility();
  saveSettings();
}

function updateTaskVisibility() {
  document.querySelectorAll('.task-row').forEach(row => {
    const isDone = row.classList.contains('is-done');
    row.style.display = (hideDone && isDone) ? 'none' : '';
  });
}

function updateUI() {
  const container = document.getElementById('tasks-container');
  const rows = Array.from(container.children);

  // Update indices
  rows.forEach((row, i) => {
    const idx = row.querySelector('.task-idx');
    if (idx) idx.textContent = String(i + 1).padStart(2, '0');
  });

  const total = rows.length;
  const doneCount = rows.filter(r => r.classList.contains('is-done')).length;
  const pending = total - doneCount;

  document.getElementById('list-label').textContent = `Tasks · ${total}`;
  document.getElementById('header-counts').textContent = `${pending} pending · ${doneCount} done`;

  const btn = document.getElementById('hide-done-btn');
  if (btn) btn.textContent = hideDone ? 'Show done' : 'Hide done';

  const empty = document.getElementById('empty-state');
  if (empty) empty.style.display = total === 0 ? '' : 'none';

  const pendingEls = rows.filter(r => !r.classList.contains('is-done'));
  document.getElementById('roll-count').textContent = String(pendingEls.length).padStart(2, '0');

  updateTaskVisibility();
}

/* ── roll ─────────────────────────────────────── */
function roll() {
  if (rolling) return;

  const rows = Array.from(document.getElementById('tasks-container').children);
  const pool = rows.filter(r => !r.classList.contains('is-done'));

  if (!pool.length) {
    flash(rows.length ? 'All tasks are done!' : 'Add a task first');
    return;
  }

  const weighted = document.getElementById('weighted-toggle').checked;
  const winner = pickWinner(pool, weighted);
  const winnerId = winner.dataset.id;

  const animate = document.getElementById('animate-toggle').checked;

  // Clear previous
  rows.forEach(r => r.classList.remove('is-chosen'));
  chosenId = null;
  resetRollCard();

  if (!animate || pool.length === 1) {
    revealWinner(winner, winnerId, pool);
    return;
  }

  // rAF slot-machine
  rolling = true;
  setRollStatus('rolling', true);

  const dur = 900;
  const start = performance.now();

  const tick = (now) => {
    const elapsed = now - start;
    const p = Math.min(1, elapsed / dur);
    const eased = 1 - Math.pow(1 - p, 3);
    const startInt = Math.max(20, dur * 0.04);
    const endInt   = Math.max(startInt + 20, dur * 0.28);
    const interval = startInt + eased * (endInt - startInt);
    const stepIdx  = Math.floor(elapsed / interval) % pool.length;

    const displayText = pool[stepIdx].querySelector('.task-text')?.textContent || '';
    setRollText(displayText, false);

    if (p < 1) {
      requestAnimationFrame(tick);
    } else {
      rolling = false;
      revealWinner(winner, winnerId, pool);
    }
  };
  requestAnimationFrame(tick);
}

function pickWinner(pool, weighted) {
  if (!weighted) return pool[Math.floor(Math.random() * pool.length)];
  const total = pool.reduce((s, el) => s + (parseInt(el.querySelector('.weight-input')?.value) || 1), 0);
  let r = Math.random() * total;
  for (const el of pool) {
    r -= parseInt(el.querySelector('.weight-input')?.value) || 1;
    if (r <= 0) return el;
  }
  return pool[pool.length - 1];
}

function revealWinner(winner, winnerId, pool) {
  chosenId = winnerId;
  winner.classList.add('is-chosen');
  winner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  const text = winner.querySelector('.task-text')?.textContent || '';
  setRollText(text, true);
  setRollStatus('winner', false);
  setRollCardClass('has-winner');

  // Post-roll buttons
  const actionsEl = document.getElementById('roll-actions');
  actionsEl.innerHTML = '';

  const rerollBtn = document.createElement('button');
  rerollBtn.className = 'flex items-center gap-2 font-semibold py-3 px-4 rounded-xl text-sm transition-all active:scale-95';
  rerollBtn.style.cssText = 'background:var(--accent);color:var(--accent-ink);flex:1;justify-content:center;display:flex;';
  rerollBtn.innerHTML = '<span>⚄</span><span>Re-roll</span>';
  rerollBtn.onclick = roll;

  const doneBtn = document.createElement('button');
  doneBtn.className = 'ghost-btn text-sm py-3 px-3 rounded-xl border';
  doneBtn.style.borderColor = 'var(--rule)';
  doneBtn.textContent = 'Mark done';
  doneBtn.onclick = () => { toggleDone(winner); resetRollCard(); };

  const skipBtn = document.createElement('button');
  skipBtn.className = 'ghost-btn text-sm py-3 px-3 rounded-xl border';
  skipBtn.style.borderColor = 'var(--rule)';
  skipBtn.textContent = 'Skip';
  skipBtn.onclick = () => { winner.classList.remove('is-chosen'); chosenId = null; resetRollCard(); };

  actionsEl.append(rerollBtn, doneBtn, skipBtn);

  if (document.getElementById('confetti-toggle').checked) {
    burstConfetti(document.getElementById('roll-card'));
  }
}

function resetRollCard() {
  setRollStatus('ready', false);
  setRollText('Press Roll to pick', false);
  setRollCardClass('');

  const actionsEl = document.getElementById('roll-actions');
  actionsEl.innerHTML = `
    <button id="roll-btn" onclick="roll()"
      class="flex-1 flex items-center justify-center gap-2 font-semibold py-3 px-4 rounded-xl text-sm transition-all active:scale-95"
      style="background:var(--accent);color:var(--accent-ink)">
      <span>⚄</span><span>Roll</span>
      <span class="font-['JetBrains_Mono'] text-[10px] opacity-60 border rounded px-1" style="border-color:rgba(255,255,255,.3)">Space</span>
    </button>`;
}

function setRollStatus(status, isRolling) {
  document.getElementById('roll-status').textContent = status;
  document.getElementById('roll-card').classList.toggle('is-rolling', isRolling);
}

function setRollCardClass(cls) {
  const card = document.getElementById('roll-card');
  card.classList.remove('is-rolling', 'has-winner');
  if (cls) card.classList.add(cls);
}

function setRollText(text, isReveal) {
  const el = document.getElementById('roll-text');
  el.className = 'text-2xl font-semibold text-center leading-snug ' + (isReveal ? 'roll-text-reveal' : 'roll-text-flick');
  el.style.color = isReveal ? 'var(--ink)' : 'var(--ink-soft)';
  if (isReveal) {
    el.innerHTML = `<span class="winner-highlight">${escHtml(text)}</span>`;
  } else {
    el.textContent = text;
  }
}

/* ── confetti ─────────────────────────────────── */
function burstConfetti(originEl) {
  if (!originEl) return;
  const rect = originEl.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const colors = ['#ff28b0', '#fffa64', '#ff9acc', '#eeff00', '#3a7d4a'];
  const sample = arr => arr[Math.floor(Math.random() * arr.length)];
  for (let i = 0; i < 55; i++) {
    const d = document.createElement('div');
    const sz = 5 + Math.random() * 8;
    d.style.cssText = `position:fixed;left:${cx}px;top:${cy}px;width:${sz}px;height:${sz * 0.42}px;background:${sample(colors)};z-index:9999;border-radius:1px;pointer-events:none;transform:rotate(${Math.random() * 360}deg);`;
    document.body.appendChild(d);
    const angle = Math.random() * Math.PI * 2;
    const v = 260 + Math.random() * 300;
    const dx = Math.cos(angle) * v;
    const dy = Math.sin(angle) * v - 110;
    d.animate(
      [{ transform: `translate(0,0) rotate(0deg)`, opacity: 1 },
       { transform: `translate(${dx}px,${dy + 380}px) rotate(${Math.random() * 700}deg)`, opacity: 0 }],
      { duration: 1300 + Math.random() * 600, easing: 'cubic-bezier(.2,.7,.3,1)' }
    );
    setTimeout(() => d.remove(), 2100);
  }
}

/* ── weights ──────────────────────────────────── */
function toggleWeights() {
  const show = document.getElementById('show-weights').checked;
  document.querySelectorAll('.weight-input').forEach(el => el.classList.toggle('hidden', !show));
  saveSettings();
}

/* ── actions ──────────────────────────────────── */
function clearAllTasks() {
  const rows = document.getElementById('tasks-container').children;
  if (!rows.length) return;
  if (!confirm(`Clear all ${rows.length} task${rows.length === 1 ? '' : 's'}?`)) return;
  document.getElementById('tasks-container').innerHTML = '';
  document.getElementById('file-input').value = '';
  chosenId = null;
  resetRollCard();
  cacheTasksToStorage();
}

function exportTasks() {
  const rows = Array.from(document.getElementById('tasks-container').children);
  const texts = rows.map(r => r.querySelector('.task-text')?.textContent || '').filter(Boolean);
  if (!texts.length) { flash('Nothing to export'); return; }
  const blob = new Blob([texts.join(', ')], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'tasks.txt';
  a.click();
  flash(`Saved ${texts.length} tasks`);
}

function uploadTasks() {
  const fileInput = document.getElementById('file-input');
  const file = fileInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const parts = String(e.target.result || '').split(/[,\n\r]+/).map(s => s.trim()).filter(Boolean);
    if (!parts.length) { flash('File looked empty'); return; }
    document.getElementById('tasks-container').innerHTML = '';
    chosenId = null;
    resetRollCard();
    const weight = parseInt(document.getElementById('default-weight').value) || 1;
    const container = document.getElementById('tasks-container');
    parts.forEach(text => container.appendChild(createTaskItem(text, weight)));
    fileInput.value = '';
    cacheTasksToStorage();
    flash(`Loaded ${parts.length} task${parts.length === 1 ? '' : 's'}`);
  };
  reader.readAsText(file);
}

/* ── toast ────────────────────────────────────── */
let toastTimer = null;
function flash(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.classList.remove('show');
    el.classList.add('hidden');
  }, 1800);
}

/* ── util ─────────────────────────────────────── */
function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
