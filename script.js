/* ============================================================
   PENGUIN COMPANION — XP PLANNER
   Offline/localStorage version (Firebase-ready structure)
   ============================================================ */

const state = {
  xp: 0,
  coins: 0,
  level: 1,
  theme: 'tech',
  lang: 'en',
  sound: 'soft',
  volume: 0.4,
  avatar: {
    name: 'Pingu',
    color: '#7c3aed',
    head: 'none',
    body: 'none',
    effect: 'none',
  },
  pomodoro: { focus: 25, short: 5, long: 15, autoNext: true },
  tasks: [],
  rewards: [],
  alarms: [],
  blocks: [],
  owned: { accessories: [], themes: ['tech'], effects: [] },
  race: null
};

const $ = (id) => document.getElementById(id);

/* ============================
   LOCAL STORAGE
   ============================ */
function saveState() {
  localStorage.setItem('penguinPlanner', JSON.stringify(state));
}
function loadState() {
  const s = localStorage.getItem('penguinPlanner');
  if (s) Object.assign(state, JSON.parse(s));
}

/* ============================
   INITIALIZATION
   ============================ */
window.addEventListener('DOMContentLoaded', () => {
  loadState();
  updateHeader();
  updateAvatarPreview();
  renderTasks();
  renderRewards();
  renderSchedule();
  renderShop();
  renderAlarms();
  applyTheme(state.theme);
  setupEventHandlers();
});

/* ============================
   HEADER / XP
   ============================ */
function updateHeader() {
  $('levelText').textContent = `Level ${state.level} • XP ${state.xp.toFixed(1)} • Coins ${state.coins}`;
  const xpPct = Math.min((state.xp % 100) / 100 * 100, 100);
  $('xpBar').style.width = xpPct + '%';
}

/* Level up logic */
function addXP(amount) {
  state.xp += amount;
  if (state.xp >= state.level * 100) {
    state.level++;
    state.coins += 5;
    alert(`🎉 Level up! You are now level ${state.level}!`);
  }
  saveState();
  updateHeader();
}

/* ============================
   TASKS / REWARDS
   ============================ */
function renderTasks() {
  const ul = $('taskList');
  ul.innerHTML = '';
  state.tasks.forEach((t, i) => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${t.name} (${t.xp} XP)</span>
    <button class='success small' onclick='finishTask(${i})'>✔</button>
    <button class='danger small' onclick='deleteTask(${i})'>✖</button>`;
    ul.appendChild(li);
  });
}
function finishTask(i) {
  addXP(parseFloat(state.tasks[i].xp));
  state.tasks.splice(i, 1);
  saveState(); renderTasks();
}
function deleteTask(i) { state.tasks.splice(i, 1); saveState(); renderTasks(); }
$('taskAdd').onclick = () => {
  const name = $('taskName').value.trim();
  const cat = $('taskCategory').value;
  const xp = parseFloat($('taskXP').value) || 0;
  if (!name) return;
  state.tasks.push({ name, cat, xp });
  $('taskName').value = '';
  $('taskXP').value = '';
  saveState(); renderTasks(); updateStats();
};

function renderRewards() {
  const ul = $('rewardList');
  ul.innerHTML = '';
  state.rewards.forEach((r, i) => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${r.name} (${r.cost} XP)</span>
    <button class='primary small' onclick='buyReward(${i})'>Buy</button>
    <button class='danger small' onclick='deleteReward(${i})'>✖</button>`;
    ul.appendChild(li);
  });
}
function deleteReward(i) { state.rewards.splice(i, 1); saveState(); renderRewards(); }
function buyReward(i) {
  const cost = parseFloat(state.rewards[i].cost);
  if (state.xp >= cost) {
    state.xp -= cost;
    alert(`Enjoy your reward: ${state.rewards[i].name}!`);
    saveState(); updateHeader();
  } else alert('Not enough XP!');
}
$('rewardAdd').onclick = () => {
  const name = $('rewardName').value.trim();
  const cost = parseFloat($('rewardCost').value);
  if (!name || isNaN(cost)) return;
  state.rewards.push({ name, cost });
  $('rewardName').value = '';
  $('rewardCost').value = '';
  saveState(); renderRewards();
};

/* ============================
   CATEGORY STATS
   ============================ */
function updateStats() {
  const counts = { Study: 0, Work: 0, 'Self-Care': 0, Other: 0 };
  state.tasks.forEach(t => counts[t.cat]++);
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  for (const key in counts) {
    const pct = Math.round((counts[key] / total) * 100);
    $('pct' + key.replace('-', '')).textContent = pct + '%';
    $('bar' + key.replace('-', '')).style.width = pct + '%';
  }
}

/* ============================
   SCHEDULE / TIME BLOCKS
   ============================ */
function renderSchedule() {
  const grid = $('scheduleGrid');
  grid.innerHTML = '';
  const startDay = 8; // 8:00
  const endDay = 22; // 22:00
  for (let h = startDay; h <= endDay; h++) {
    const row = document.createElement('div');
    row.style.height = '40px';
    row.textContent = `${String(h).padStart(2, '0')}:00`;
    row.style.color = '#94a3b8';
    row.style.paddingLeft = '8px';
    grid.appendChild(row);
  }
  state.blocks.forEach(b => {
    const block = document.createElement('div');
    block.className = 'schedule-block';
    block.style.top = `${(b.start - startDay) * 40}px`;
    block.style.height = `${(b.end - b.start) * 40}px`;
    block.style.background = b.color;
    block.textContent = b.title;
    block.onclick = () => editBlock(b);
    grid.appendChild(block);
  });
}
function editBlock(b) {
  const newTitle = prompt('Edit block title:', b.title);
  if (newTitle) b.title = newTitle;
  saveState(); renderSchedule();
}
$('addBlock').onclick = () => {
  const title = $('blockTitle').value.trim();
  const color = $('blockColor').value;
  const start = parseInt($('blockStart').value.split(':')[0]);
  const end = parseInt($('blockEnd').value.split(':')[0]);
  if (!title || isNaN(start) || isNaN(end)) return;
  state.blocks.push({ title, start, end, color });
  saveState(); renderSchedule();
};
$('clearSchedule').onclick = () => {
  if (confirm('Clear schedule?')) {
    state.blocks = []; saveState(); renderSchedule();
  }
};

/* ============================
   SHOP (ACCESSORIES + THEMES + EFFECTS)
   ============================ */
const accessories = [
  { id: 'hat', name: 'Hat', cost: 5 },
  { id: 'glasses', name: 'Glasses', cost: 6 },
  { id: 'bowtie', name: 'Bowtie', cost: 7 },
  { id: 'scarf', name: 'Scarf', cost: 8 },
  { id: 'crown', name: 'Crown', cost: 10 },
  { id: 'cape', name: 'Cape', cost: 12 },
  { id: 'headphones', name: 'Headphones', cost: 14 },
  { id: 'mask', name: 'Mask', cost: 16 },
  { id: 'goggles', name: 'Goggles', cost: 18 },
  { id: 'flower', name: 'Flower', cost: 20 },
];
const themes = [
  { id: 'tech', name: 'Tech Lab', cost: 0 },
  { id: 'arctic', name: 'Arctic Base', cost: 20 },
  { id: 'sunset', name: 'Sunset Beach', cost: 24 },
  { id: 'space', name: 'Space', cost: 28 },
];
const effects = [
  { id: 'aura', name: 'Aura', level: 12 },
  { id: 'rainbow', name: 'Rainbow Aura', level: 16 },
  { id: 'frost', name: 'Frost Aura', level: 18 },
  { id: 'shadow', name: 'Shadow', level: 20 },
];

function renderShop() {
  renderShopSection('shopAccessories', accessories, 'accessories');
  renderShopSection('shopThemes', themes, 'themes');
  renderShopSection('shopEffects', effects, 'effects');
  $('coinsText').textContent = state.coins;
  $('ownedCount').textContent = state.owned.accessories.length;
}
function renderShopSection(id, items, type) {
  const c = $(id);
  c.innerHTML = '';
  items.forEach(item => {
    const owned = state.owned[type].includes(item.id);
    const locked = item.level && state.level < item.level;
    const div = document.createElement('div');
    div.className = 'shop-item' + (locked ? ' locked' : '');
    div.innerHTML = `
      <div class="badge">${item.name}</div>
      <div class="cost">${item.cost ? item.cost + ' coins' : 'Free'}</div>
      <button ${locked ? 'disabled' : ''} class='${owned ? 'success' : 'primary'} small'>
        ${owned ? 'Owned' : 'Buy'}
      </button>`;
    div.querySelector('button').onclick = () => {
      if (owned) return;
      if (locked) return alert('Unlock at level ' + item.level);
      if (state.coins >= item.cost) {
        state.coins -= item.cost;
        state.owned[type].push(item.id);
        saveState(); renderShop();
      } else alert('Not enough coins!');
    };
    c.appendChild(div);
  });
}

/* ============================
   AVATAR (Preview + Settings)
   ============================ */
function updateAvatarPreview() {
  const avatar = $('settingsAvatarPreview');
  avatar.innerHTML = '';
  avatar.style.setProperty('--body', state.avatar.color);
  avatar.appendChild(Object.assign(document.createElement('div'), { className: 'eye left' }));
  avatar.appendChild(Object.assign(document.createElement('div'), { className: 'eye right' }));
  avatar.appendChild(Object.assign(document.createElement('div'), { className: 'beak' }));
}
$('saveAvatarSettings').onclick = () => {
  state.avatar.name = $('setAName').value || 'Pingu';
  state.avatar.color = $('setAColor').value;
  state.avatar.head = $('setAHead').value;
  state.avatar.body = $('setABody').value;
  state.avatar.effect = $('setAEffect').value;
  saveState();
  updateAvatarPreview();
};

/* ============================
   SETTINGS PANEL
   ============================ */
$('openSettings').onclick = () => $('settingsPanel').classList.add('show');
$('closeSettings').onclick = () => $('settingsPanel').classList.remove('show');

$('optTheme').onchange = (e) => {
  state.theme = e.target.value;
  applyTheme(state.theme);
  saveState();
};
$('optLang').onchange = (e) => { state.lang = e.target.value; saveState(); };
$('optSound').onchange = (e) => { state.sound = e.target.value; saveState(); };
$('optVolume').oninput = (e) => { state.volume = e.target.value / 100; saveState(); };

/* ============================
   THEME
   ============================ */
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
}

/* ============================
   POMODORO + CALL
   ============================ */
let pomoTimer = null, pomoTimeLeft = 0, pomoMode = 'focus';

function startPomodoro() {
  const minutes = state.pomodoro.focus;
  pomoTimeLeft = minutes * 60;
  updatePomoDisplay();
  if (pomoTimer) clearInterval(pomoTimer);
  pomoTimer = setInterval(() => {
    pomoTimeLeft--;
    updatePomoDisplay();
    if (pomoTimeLeft <= 0) nextPomodoroPhase();
  }, 1000);
}
function updatePomoDisplay() {
  const m = Math.floor(pomoTimeLeft / 60).toString().padStart(2, '0');
  const s = (pomoTimeLeft % 60).toString().padStart(2, '0');
  $('pomoTime').textContent = `${m}:${s}`;
  const micro = $('pomoMicro');
  if (!micro.classList.contains('hidden')) micro.textContent = `${m} min ${s} s left`;
}
function nextPomodoroPhase() {
  clearInterval(pomoTimer);
  pomoTimer = null;
  if (pomoMode === 'focus') {
    pomoMode = 'break';
    pomoTimeLeft = state.pomodoro.short * 60;
    $('pomoTaskTitle').textContent = 'Short Break';
    startPomodoro();
  } else {
    pomoMode = 'focus';
    pomoTimeLeft = state.pomodoro.focus * 60;
    $('pomoTaskTitle').textContent = 'Focus';
    if (state.pomodoro.autoNext) startPomodoro();
  }
}
$('pomoStart').onclick = startPomodoro;
$('pomoPause').onclick = () => clearInterval(pomoTimer);
$('pomoExit').onclick = () => { clearInterval(pomoTimer); $('pomoOverlay').classList.add('hidden'); };

/* ============================
   CALL
   ============================ */
$('callStudy').onclick = () => openCall('study');
$('callExercise').onclick = () => openCall('exercise');
$('callEat').onclick = () => openCall('eat');
$('callBath').onclick = () => openCall('bath');
$('callSleep').onclick = () => openCall('sleep');
$('closeCall').onclick = () => $('callOverlay').classList.add('hidden');

function openCall(mode) {
  $('callOverlay').classList.remove('hidden');
  $('callMode').textContent = mode;
  const b = $('callBackdrop');
  b.className = 'backdrop ' + (
    mode === 'exercise' ? 'gym' :
    mode === 'eat' ? 'kitchen' :
    mode === 'bath' ? 'bath' :
    mode === 'sleep' ? 'sleep' : 'tech'
  );
  $('pomoMicro').classList.toggle('hidden', pomoTimer == null);
}

/* ============================
   TOOLS — Calculator & Search
   ============================ */
$('openCalc').onclick = () => $('calcModal').classList.add('show');
$('closeCalc').onclick = () => $('calcModal').classList.remove('show');
$('openSearch').onclick = () => $('searchModal').classList.add('show');
$('closeSearch').onclick = () => $('searchModal').classList.remove('show');
$('searchQuery').oninput = e => {
  $('searchFrame').src = 'https://duckduckgo.com/?q=' + encodeURIComponent(e.target.value);
};

/* ============================
   ALARMS
   ============================ */
function renderAlarms() {
  const ul = $('alarmList');
  ul.innerHTML = '';
  state.alarms.forEach((a, i) => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${a.time} — ${a.label}</span>
    <button class='danger small' onclick='deleteAlarm(${i})'>✖</button>`;
    ul.appendChild(li);
  });
}
$('addAlarm').onclick = () => {
  const time = $('alarmTime').value;
  const label = $('alarmLabel').value;
  const sound = $('alarmSound').value;
  if (!time || !label) return;
  state.alarms.push({ time, label, sound });
  saveState(); renderAlarms();
};
function deleteAlarm(i) { state.alarms.splice(i, 1); saveState(); renderAlarms(); }

/* ============================
   EXPORT / IMPORT
   ============================ */
$('exportJSON').onclick = () => downloadJSON();
$('exportCSV').onclick = () => downloadCSV();
$('importData').onclick = () => $('importFile').click();
$('importFile').onchange = e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target.result);
      Object.assign(state, data);
      saveState(); location.reload();
    } catch { alert('Invalid file'); }
  };
  reader.readAsText(file);
};
function downloadJSON() {
  const blob = new Blob([JSON.stringify(state)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'penguin_data.json';
  a.click();
}
function downloadCSV() {
  const csv = [
    ['Type', 'Name', 'XP/Cost'].join(','),
    ...state.tasks.map(t => ['Task', t.name, t.xp].join(',')),
    ...state.rewards.map(r => ['Reward', r.name, r.cost].join(','))
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'penguin_data.csv';
  a.click();
}

/* ============================
   RACE MODE (Offline Sim)
   ============================ */
$('createRace').onclick = () => {
  const code = Math.random().toString(36).substring(2, 6).toUpperCase();
  state.race = { code, participants: [state.avatar.name], active: false };
  $('raceInfo').textContent = `Room created: ${code}`;
  $('raceParticipants').innerHTML = `<li>${state.avatar.name} (You)</li>`;
  $('startRace').disabled = false;
  $('closeRace').disabled = false;
};
$('joinRace').onclick = () => {
  const code = $('joinCode').value.trim().toUpperCase();
  if (!code) return alert('Enter code');
  state.race = { code, participants: [state.avatar.name], active: true };
  $('raceBoard').hidden = false;
  $('raceCodeView').textContent = code;
};
$('startRace').onclick = () => {
  $('raceBoard').hidden = false;
  $('raceCodeView').textContent = state.race.code;
  $('miniGames').hidden = true;
  startPomodoro();
};
$('closeRace').onclick = () => {
  state.race = null;
  $('raceInfo').textContent = 'Room closed.';
  $('startRace').disabled = true;
  $('closeRace').disabled = true;
};

/* ============================
   UTIL
   ============================ */
function setupEventHandlers() {
  updateStats();
}

/* ============================================================
   END OF SCRIPT
   ============================================================ */
