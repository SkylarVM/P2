/* ==========================================================
   Penguin Companion — script.js
   Version: Mobile + Desktop Compatible MVP
   ========================================================== */

// ========== Data and State ==========
let state = {
  xp: 0,
  coins: 0,
  level: 1,
  tasks: [],
  avatar: { name: "Pingu", color: "#1DA1F2", head: "", body: "", effect: "" },
  shop: [],
  challenges: [],
  focusMins: 25,
  breakMins: 5,
  pomodoroActive: false,
  currentTask: null,
  today: new Date().toDateString()
};

// Confetti celebration
function confettiBurst() {
  const canvas = document.createElement('canvas');
  canvas.className = 'confetti';
  canvas.style.position = 'fixed';
  canvas.style.top = 0;
  canvas.style.left = 0;
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  canvas.style.pointerEvents = 'none';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const particles = Array.from({ length: 120 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height - canvas.height,
    r: Math.random() * 6 + 2,
    c: `hsl(${Math.random() * 360},100%,60%)`,
    d: Math.random() * 5 + 2
  }));

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let p of particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.c;
      ctx.fill();
      p.y += p.d;
      if (p.y > canvas.height) p.y = -10;
    }
    requestAnimationFrame(draw);
  }
  draw();
  setTimeout(() => canvas.remove(), 4000);
}

// ========== Persistent Storage ==========
function saveAll() {
  localStorage.setItem('penguinData', JSON.stringify(state));
}
function loadAll() {
  const s = localStorage.getItem('penguinData');
  if (s) state = { ...state, ...JSON.parse(s) };
}

// ========== UI Helpers ==========
function $(sel) { return document.querySelector(sel); }
function createEl(tag, cls, text) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (text) el.textContent = text;
  return el;
}

// Toast
let toastTimeout;
function toast(title, msg) {
  const t = $('#toast');
  $('#toastTitle').textContent = title;
  $('#toastMsg').textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => t.classList.remove('show'), 3500);
}

// ========== Onboarding ==========
window.addEventListener('DOMContentLoaded', () => {
  loadAll();
  if (!localStorage.getItem('penguinUser')) {
    $('#onboard').classList.add('shown');
  } else {
    $('#onboard').remove();
    initApp();
  }
});

$('#ob-continue').onclick = () => {
  const user = $('#ob-username').value.trim();
  const pass = $('#ob-password').value.trim();
  if (user && pass) {
    localStorage.setItem('penguinUser', user);
    localStorage.setItem('penguinPass', pass);
    $('#onboard').remove();
    toast('Welcome', `Hi ${user}!`);
    initApp();
  } else toast('Error', 'Please fill in username and password');
};

// ========== App Initialization ==========
function initApp() {
  updateHeader();
  renderTasks();
  renderShop();
  dailyChallengesInit();
  penguinEmotionsInit();
  applyAvatar();
}

// ========== Header Update ==========
function updateHeader() {
  $('#lvl').textContent = state.level;
  $('#xp').textContent = state.xp.toFixed(1);
  $('#coins').textContent = state.coins;
  $('#coinCount').textContent = state.coins;
  $('#metaLine').textContent = `Level ${state.level} • XP ${state.xp.toFixed(1)} • Coins ${state.coins}`;
}

// ========== Avatar ==========
$('#saveAvatar').onclick = () => {
  state.avatar.name = $('#nameInput').value || "Pingu";
  state.avatar.head = $('#headAcc').value;
  state.avatar.body = $('#bodyAcc').value;
  state.avatar.effect = $('#effectAcc').value;
  toast('Avatar', 'Saved successfully!');
  saveAll();
  applyAvatar();
};

document.querySelectorAll('.chip').forEach(btn => {
  btn.onclick = () => {
    state.avatar.color = btn.dataset.color;
    applyAvatar();
  };
});

function applyAvatar() {
  const penguin = $('#penguin');
  penguin.style.background = 'none';
  penguin.querySelector('.p-body').style.background = state.avatar.color;
  penguin.className = `penguin ${state.avatar.head} ${state.avatar.body} ${state.avatar.effect}`;
  $('#avName').textContent = state.avatar.name;
  saveAll();
}

// ========== Tasks ==========
$('#addTask').onclick = () => {
  const name = $('#taskName').value.trim();
  const cat = $('#taskCat').value || 'General';
  const xp = parseFloat($('#taskXP').value) || 0.25;
  if (!name) return toast('Task', 'Enter a task name');
  state.tasks.push({ name, cat, xp, done: false });
  $('#taskName').value = ''; $('#taskXP').value = '';
  renderTasks();
  saveAll();
};

function renderTasks() {
  const list = $('#taskList');
  list.innerHTML = '';
  state.tasks.forEach((t, i) => {
    const li = createEl('li');
    const left = createEl('div', '', `${t.name} (${t.cat})`);
    const btns = createEl('div', 'row');
    const focus = createEl('button', 'btn', 'Focus');
    const del = createEl('button', 'btn danger', '✖');
    focus.onclick = () => startPomodoro(t, i);
    del.onclick = () => { state.tasks.splice(i, 1); renderTasks(); saveAll(); };
    btns.append(focus, del);
    li.append(left, btns);
    list.append(li);
  });
}

// ========== Pomodoro ==========
let pomoTimer, timeLeft = 0;

function startPomodoro(task) {
  state.currentTask = task;
  $('#pomo').classList.add('show');
  $('#pomoTitle').textContent = `Focus: ${task.name}`;
  $('#timerText').textContent = `${state.focusMins}:00`;
  timeLeft = state.focusMins * 60;
  state.pomodoroActive = true;
  runTimer();
}

function runTimer() {
  clearInterval(pomoTimer);
  pomoTimer = setInterval(() => {
    if (timeLeft <= 0) {
      clearInterval(pomoTimer);
      finishPomodoro();
    } else {
      timeLeft--;
      const min = Math.floor(timeLeft / 60).toString().padStart(2, '0');
      const sec = (timeLeft % 60).toString().padStart(2, '0');
      $('#timerText').textContent = `${min}:${sec}`;
    }
  }, 1000);
}

$('#pauseBtn').onclick = () => {
  if (state.pomodoroActive) {
    clearInterval(pomoTimer);
    state.pomodoroActive = false;
    toast('Pomodoro', 'Paused');
  } else {
    state.pomodoroActive = true;
    runTimer();
    toast('Pomodoro', 'Resumed');
  }
};

$('#doneBtn').onclick = finishPomodoro;

function finishPomodoro() {
  $('#pomo').classList.remove('show');
  toast('Great job!', `Finished ${state.currentTask.name}!`);
  state.xp += state.currentTask.xp;
  state.coins += Math.round(state.currentTask.xp);
  confettiBurst();
  checkChallenges();
  updateHeader();
  saveAll();
  state.pomodoroActive = false;
}

// ========== Daily Challenges ==========
function dailyChallengesInit() {
  const todayKey = `ch-${state.today}`;
  if (!localStorage.getItem(todayKey)) {
    state.challenges = [
      { id: 1, text: 'Complete 2 Pomodoros', target: 2, done: 0, reward: 20 },
      { id: 2, text: 'Earn 10 XP today', target: 10, done: 0, reward: 15 },
      { id: 3, text: 'Add 3 tasks', target: 3, done: 0, reward: 10 }
    ];
    localStorage.setItem(todayKey, JSON.stringify(state.challenges));
  } else {
    state.challenges = JSON.parse(localStorage.getItem(todayKey));
  }
  renderChallenges();
}

function renderChallenges() {
  const list = $('#challenges');
  list.innerHTML = '';
  state.challenges.forEach(ch => {
    const li = createEl('li');
    li.textContent = `${ch.text} — ${ch.done}/${ch.target} `;
    if (ch.done >= ch.target) li.append('✅');
    list.append(li);
  });
}

function checkChallenges() {
  state.challenges.forEach(ch => {
    if (ch.text.includes('Pomodoro')) ch.done++;
    if (state.xp >= 10 && ch.id === 2) ch.done = ch.target;
  });
  const completed = state.challenges.filter(ch => ch.done >= ch.target && !ch.rewarded);
  completed.forEach(ch => {
    ch.rewarded = true;
    state.coins += ch.reward;
    toast('🎯 Challenge Complete!', `${ch.text} +${ch.reward} coins`);
    confettiBurst();
  });
  renderChallenges();
  updateHeader();
  saveAll();
}

// ========== Emotional Penguin ==========
function penguinEmotionsInit() {
  setInterval(() => {
    const moods = [
      "Let's focus together! 🧠",
      "Hydrate, take a short stretch!",
      "Proud of your consistency 💪",
      "Every Pomodoro counts!",
      "Your future self will thank you."
    ];
    const msg = moods[Math.floor(Math.random() * moods.length)];
    toast(state.avatar.name, msg);
  }, 60000); // every minute
}

// ========== Shop ==========
function renderShop() {
  const items = [
    { name: "Beanie", price: 10 },
    { name: "Glasses", price: 15 },
    { name: "Crown", price: 25 },
    { name: "Headphones", price: 18 },
    { name: "Scarf", price: 8 },
    { name: "Cape", price: 20 },
    { name: "Backpack", price: 12 },
    { name: "Aura", price: 30 },
    { name: "Frost", price: 22 },
    { name: "Shadow", price: 24 }
  ];
  const shopDiv = $('#shop');
  shopDiv.innerHTML = '';
  items.forEach(it => {
    const d = createEl('div', 'shop-item');
    d.innerHTML = `<div>${it.name}</div><div class="price">${it.price} coins</div>`;
    d.onclick = () => buyItem(it);
    shopDiv.append(d);
  });
}
function buyItem(it) {
  if (state.coins >= it.price) {
    state.coins -= it.price;
    state.shop.push(it.name);
    toast('Shop', `Bought ${it.name}!`);
    updateHeader();
    saveAll();
  } else toast('Shop', 'Not enough coins!');
}

// ========== Race Mode ==========
const channel = new BroadcastChannel('penguinRace');
$('#raceBtn').onclick = () => {
  $('#race').classList.add('show');
  $('#raceStage').innerHTML = `
    <p>Join or create a race:</p>
    <div class="row center">
      <button id="createRace" class="btn primary">Create Race</button>
      <button id="joinRace" class="btn ghost">Join Race</button>
    </div>`;
};
$('#exitRace').onclick = () => $('#race').classList.remove('show');

channel.onmessage = (e) => {
  if (e.data.type === 'raceStart') {
    $('#raceStage').innerHTML = `<h3>🏁 Race started! Focus time for all!</h3>`;
    toast('Race', 'The group Pomodoro has begun!');
    startPomodoro({ name: 'Team Focus', xp: 2 });
  }
};
document.body.addEventListener('click', e => {
  if (e.target.id === 'createRace') {
    toast('Race', 'Race created — waiting participants...');
    setTimeout(() => channel.postMessage({ type: 'raceStart' }), 3000);
  }
  if (e.target.id === 'joinRace') toast('Race', 'Joined existing race!');
});

// ========== Import / Export ==========
$('#exportBtn').onclick = () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'penguinData.json';
  a.click();
};

$('#importFile').onchange = e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = evt => {
    const data = JSON.parse(evt.target.result);
    state = { ...state, ...data };
    toast('Import', 'Data loaded successfully!');
    updateHeader(); renderTasks(); renderShop(); renderChallenges();
  };
  reader.readAsText(file);
};

// ========== Settings ==========
$('#openSettings').onclick = () => $('#settings').classList.add('shown');
$('#closeSettings').onclick = () => $('#settings').classList.remove('shown');
$('#recalcBtn').onclick = () => { updateHeader(); toast('Stats', 'Recalculated'); };
$('#wipeBtn').onclick = () => { localStorage.clear(); location.reload(); };

// ========== Fin ==========
