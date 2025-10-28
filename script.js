/* ==============================================
   Penguin Companion — script.js
   ============================================== */

// ============ GLOBAL DATA STRUCTURE ============
const state = {
  user: {
    name: "Pingu",
    color: "#7c3aed",
    head: "none",
    body: "none",
    effect: "none",
    xp: 0,
    coins: 0,
    level: 1,
    theme: "tech",
    lang: "en",
    sound: "soft",
    volume: 40
  },
  settings: {
    focus: 25,
    short: 5,
    long: 15,
    autoNext: false
  },
  tasks: [],
  rewards: [],
  alarms: [],
  schedule: [],
  shop: {
    accessories: [
      { id: "hat", name: "Hat", cost: 10, unlocked: false, icon: "🧢" },
      { id: "bow", name: "Bow", cost: 8, unlocked: false, icon: "🎀" },
      { id: "scarf", name: "Scarf", cost: 9, unlocked: false, icon: "🧣" },
      { id: "glasses", name: "Glasses", cost: 12, unlocked: false, icon: "🕶️" },
      { id: "headphones", name: "Headphones", cost: 15, unlocked: false, icon: "🎧" },
      { id: "crown", name: "Crown", cost: 20, unlocked: false, icon: "👑" },
      { id: "hoodie", name: "Hoodie", cost: 18, unlocked: false, icon: "🧥" },
      { id: "suit", name: "Suit", cost: 25, unlocked: false, icon: "🤵" },
      { id: "wizard", name: "Wizard Hat", cost: 22, unlocked: false, icon: "🪄" },
      { id: "jetpack", name: "Jetpack", cost: 28, unlocked: false, icon: "🚀" }
    ],
    themes: [
      { id: "tech", name: "Tech Lab", owned: true, cost: 0 },
      { id: "arctic", name: "Arctic Base", owned: false, cost: 20 },
      { id: "sunset", name: "Sunset Beach", owned: false, cost: 24 },
      { id: "space", name: "Cosmic Orbit", owned: false, cost: 28 }
    ],
    effects: [
      { id: "aura", name: "Aura", level: 12, unlocked: false },
      { id: "rainbow", name: "Rainbow Aura", level: 16, unlocked: false },
      { id: "frost", name: "Frost Aura", level: 18, unlocked: false },
      { id: "spark", name: "Spark Effect", level: 20, unlocked: false }
    ]
  },
  race: null,
  pomo: { time: 0, mode: "focus", running: false, timer: null }
};

// ============ STORAGE HANDLING ============
function saveState() {
  localStorage.setItem("penguinAppData", JSON.stringify(state));
}
function loadState() {
  const saved = localStorage.getItem("penguinAppData");
  if (saved) Object.assign(state, JSON.parse(saved));
}
loadState();

// ============ UTILITY ============
function $(sel) { return document.querySelector(sel); }
function create(tag, cls) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  return el;
}
function randCode(len = 5) {
  return Math.random().toString(36).substr(2, len).toUpperCase();
}

// ============ XP & LEVEL ============
function updateXP(amount) {
  state.user.xp += amount;
  if (state.user.xp < 0) state.user.xp = 0;
  const levelUp = Math.floor(state.user.xp / 100) + 1;
  if (levelUp > state.user.level) {
    state.user.level = levelUp;
    state.user.coins += 10;
  }
  updateHeader();
  saveState();
}

function updateHeader() {
  $("#levelText").textContent = `Level ${state.user.level} • XP ${state.user.xp.toFixed(2)} • Coins ${state.user.coins}`;
  $("#xpBar").style.width = `${(state.user.xp % 100)}%`;
}

// ============ TASKS ============
function renderTasks() {
  const list = $("#taskList");
  list.innerHTML = "";
  state.tasks.forEach((t, i) => {
    const li = create("li");
    li.innerHTML = `<span>${t.name} (${t.xp} XP, ${t.category})</span>
      <div><button data-i="${i}" class="success small">Done</button>
      <button data-i="${i}" class="danger small">✖</button></div>`;
    list.appendChild(li);
  });
}
$("#taskAdd").onclick = () => {
  const name = $("#taskName").value.trim();
  const cat = $("#taskCategory").value;
  const xp = parseFloat($("#taskXP").value || "0");
  if (!name) return;
  state.tasks.push({ name, category: cat, xp });
  saveState();
  renderTasks();
  $("#taskName").value = "";
};
$("#taskList").onclick = e => {
  if (e.target.classList.contains("success")) {
    const i = e.target.dataset.i;
    updateXP(state.tasks[i].xp);
    state.tasks.splice(i, 1);
  } else if (e.target.classList.contains("danger")) {
    state.tasks.splice(e.target.dataset.i, 1);
  }
  saveState();
  renderTasks();
};
renderTasks();

// ============ REWARDS ============
function renderRewards() {
  const list = $("#rewardList");
  list.innerHTML = "";
  state.rewards.forEach((r, i) => {
    const li = create("li");
    li.innerHTML = `<span>${r.name} (${r.cost} XP)</span>
      <div><button data-i="${i}" class="primary small">Buy</button>
      <button data-i="${i}" class="danger small">✖</button></div>`;
    list.appendChild(li);
  });
}
$("#rewardAdd").onclick = () => {
  const name = $("#rewardName").value.trim();
  const cost = parseFloat($("#rewardCost").value || "0");
  if (!name) return;
  state.rewards.push({ name, cost });
  saveState();
  renderRewards();
};
$("#rewardList").onclick = e => {
  const i = e.target.dataset.i;
  if (e.target.classList.contains("primary")) {
    if (state.user.xp >= state.rewards[i].cost) {
      state.user.xp -= state.rewards[i].cost;
      alert("Reward claimed!");
    } else alert("Not enough XP!");
  } else if (e.target.classList.contains("danger")) {
    state.rewards.splice(i, 1);
  }
  saveState();
  renderRewards();
  updateHeader();
};
renderRewards();

// ============ STATS ============
function updateStats() {
  const total = state.tasks.length ? state.tasks.length : 1;
  const cats = { Study: 0, Work: 0, "Self-Care": 0, Other: 0 };
  state.tasks.forEach(t => cats[t.category]++);
  for (let c in cats) {
    const pct = (cats[c] / total) * 100;
    const bar = $("#bar" + c.replace("-", ""));
    const label = $("#pct" + (c.split("-")[0] || c));
    if (bar && label) {
      bar.style.width = pct + "%";
      label.textContent = pct.toFixed(0) + "%";
    }
  }
}
setInterval(updateStats, 3000);

// ============ SCHEDULE ============
function renderSchedule() {
  const grid = $("#scheduleGrid");
  grid.innerHTML = "";
  state.schedule.forEach((b, i) => {
    const el = create("div", "schedule-block");
    el.style.background = b.color;
    el.style.top = b.start + "px";
    el.style.height = b.end - b.start + "px";
    el.textContent = b.title;
    el.onclick = () => {
      if (confirm("Delete block?")) {
        state.schedule.splice(i, 1);
        renderSchedule();
        saveState();
      }
    };
    grid.appendChild(el);
  });
}
$("#addBlock").onclick = () => {
  const title = $("#blockTitle").value.trim();
  const s = $("#blockStart").value;
  const e = $("#blockEnd").value;
  const color = $("#blockColor").value;
  if (!title || !s || !e) return;
  const start = parseInt(s.split(":")[0]) * 60 + parseInt(s.split(":")[1]);
  const end = parseInt(e.split(":")[0]) * 60 + parseInt(e.split(":")[1]);
  state.schedule.push({ title, start, end, color });
  saveState();
  renderSchedule();
};
$("#clearSchedule").onclick = () => {
  if (confirm("Clear all blocks?")) {
    state.schedule = [];
    renderSchedule();
    saveState();
  }
};
renderSchedule();

// ============ ALARMS ============
function renderAlarms() {
  const list = $("#alarmList");
  list.innerHTML = "";
  state.alarms.forEach((a, i) => {
    const li = create("li");
    li.innerHTML = `<span>${a.time} - ${a.label}</span>
      <div><button data-i="${i}" class="danger small">✖</button></div>`;
    list.appendChild(li);
  });
}
$("#addAlarm").onclick = () => {
  const time = $("#alarmTime").value;
  const label = $("#alarmLabel").value || "Alarm";
  const sound = $("#alarmSound").value;
  state.alarms.push({ time, label, sound });
  saveState();
  renderAlarms();
};
$("#alarmList").onclick = e => {
  if (e.target.classList.contains("danger")) {
    state.alarms.splice(e.target.dataset.i, 1);
    renderAlarms();
    saveState();
  }
};
setInterval(() => {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  state.alarms.forEach(a => {
    if (`${hh}:${mm}` === a.time) {
      playSound(a.sound);
      alert("🐧 Alarm: " + a.label);
    }
  });
}, 60000);
renderAlarms();

// ============ SHOP ============
function renderShop() {
  const aGrid = $("#shopAccessories");
  const tGrid = $("#shopThemes");
  const eGrid = $("#shopEffects");
  aGrid.innerHTML = ""; tGrid.innerHTML = ""; eGrid.innerHTML = "";
  let ownedCount = 0;

  state.shop.accessories.forEach(item => {
    const div = create("div", "shop-item" + (item.unlocked ? "" : " locked"));
    div.innerHTML = `<div class="badge">${item.icon}</div><div>${item.name}</div>
      <div class="cost">${item.cost} coins</div>`;
    div.onclick = () => buyItem(item, "accessories");
    aGrid.appendChild(div);
    if (item.unlocked) ownedCount++;
  });
  state.shop.themes.forEach(item => {
    const div = create("div", "shop-item" + (item.owned ? "" : " locked"));
    div.innerHTML = `<div>${item.name}</div><div class="cost">${item.cost} coins</div>`;
    div.onclick = () => buyItem(item, "themes");
    tGrid.appendChild(div);
    if (item.owned) ownedCount++;
  });
  state.shop.effects.forEach(item => {
    const div = create("div", "shop-item" + (item.unlocked ? "" : " locked"));
    div.innerHTML = `<div>${item.name}</div><div class="cost">Lvl ${item.level}</div>`;
    eGrid.appendChild(div);
    if (item.unlocked) ownedCount++;
  });
  $("#coinsText").textContent = state.user.coins;
  $("#ownedCount").textContent = ownedCount;
}
function buyItem(item, type) {
  if (item.unlocked || item.owned) return;
  if (type === "effects") {
    if (state.user.level >= item.level) item.unlocked = true;
    else return alert("Reach level " + item.level + " to unlock this!");
  } else {
    if (state.user.coins >= item.cost) {
      state.user.coins -= item.cost;
      item.unlocked = item.owned = true;
    } else return alert("Not enough coins!");
  }
  saveState();
  renderShop();
  updateHeader();
}
renderShop();

// ============ AVATAR ============
function renderAvatar(target = "#settingsAvatarPreview") {
  const container = $(target);
  container.innerHTML = "";
  const base = create("div", "penguin3d");
  base.style.setProperty("--body", state.user.color);
  const leftEye = create("div", "eye left");
  const rightEye = create("div", "eye right");
  const beak = create("div", "beak");
  base.append(left
