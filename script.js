/* ============================================================
   Penguin Companion — XP Planner  (v3.2)
   Everything works offline; designed for Firebase sync later.
   ============================================================ */

/* ---------- Helpers ---------- */
const $ = sel => document.querySelector(sel);
const $$ = sel => document.querySelectorAll(sel);
const uuid = () => Math.random().toString(36).substr(2, 9);
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const load = (k, def) => JSON.parse(localStorage.getItem(k) || JSON.stringify(def));

/* ---------- Global State ---------- */
let data = load("penguinData", {
  xp: 0,
  coins: 0,
  level: 1,
  tasks: [],
  rewards: [],
  alarms: [],
  blocks: [],
  settings: {
    theme: "tech",
    lang: "en",
    autoNext: true,
    sound: "soft",
    volume: 0.4,
  },
  avatar: {
    name: "Pingu",
    color: "#8155ff",
    head: "none",
    body: "none",
    effect: "none",
  },
  shop: { owned: [] },
  history: [],
  race: null,
});

function commit() {
  save("penguinData", data);
}

/* ============================================================
   XP & LEVEL SYSTEM
   ============================================================ */
function addXP(x) {
  data.xp += x;
  const req = 10 + (data.level - 1) * 5;
  if (data.xp >= req) {
    data.xp -= req;
    data.level++;
    data.coins += 10;
    toast(`🎉 Level up! Level ${data.level} reached. +10 Coins`);
  }
  renderHeader();
  commit();
}
function renderHeader() {
  $("#levelText").textContent =
    `Level ${data.level} • XP ${data.xp.toFixed(1)} • Coins ${data.coins}`;
  const req = 10 + (data.level - 1) * 5;
  $("#xpBar").style.width = `${(data.xp / req) * 100}%`;
}

/* ============================================================
   TASKS
   ============================================================ */
const taskList = $("#taskList");
function renderTasks() {
  taskList.innerHTML = "";
  data.tasks.forEach(t => {
    const li = document.createElement("li");
    li.className = "item";
    li.innerHTML = `
      <div class="left">
        <b>${t.name}</b>
        <div class="meta">${t.category || "Other"} • ${t.xp} XP</div>
      </div>
      <div class="btn-row">
        <button class="btn-focus">🎮 Focus</button>
        <button class="btn-done">✓</button>
        <button class="btn-del">🗑️</button>
      </div>`;
    li.querySelector(".btn-focus").onclick = () => startPomodoro(t);
    li.querySelector(".btn-done").onclick = () => {
      addXP(Number(t.xp));
      data.tasks = data.tasks.filter(x => x.id !== t.id);
      commit();
      renderTasks();
      updateStats();
    };
    li.querySelector(".btn-del").onclick = () => {
      data.tasks = data.tasks.filter(x => x.id !== t.id);
      commit();
      renderTasks();
      updateStats();
    };
    taskList.append(li);
  });
  updateStats();
}
$("#taskAdd").onclick = () => {
  const n = $("#taskName").value.trim();
  const c = $("#taskCategory").value;
  const x = parseFloat($("#taskXP").value) || 0.25;
  if (!n) return;
  data.tasks.push({ id: uuid(), name: n, category: c, xp: x });
  $("#taskName").value = "";
  commit();
  renderTasks();
};

/* ============================================================
   REWARDS
   ============================================================ */
const rewardList = $("#rewardList");
function renderRewards() {
  rewardList.innerHTML = "";
  data.rewards.forEach(r => {
    const li = document.createElement("li");
    li.className = "item";
    li.innerHTML = `
      <div class="left"><b>${r.name}</b><div class="meta">${r.cost} XP</div></div>
      <div class="btn-row">
        <button class="btn-focus">Buy</button>
        <button class="btn-del">🗑️</button>
      </div>`;
    li.querySelector(".btn-focus").onclick = () => {
      if (data.xp >= r.cost) {
        data.xp -= r.cost;
        toast(`Bought ${r.name}!`);
        renderHeader();
        commit();
      } else toast("Not enough XP!");
    };
    li.querySelector(".btn-del").onclick = () => {
      data.rewards = data.rewards.filter(x => x.id !== r.id);
      commit();
      renderRewards();
    };
    rewardList.append(li);
  });
}
$("#rewardAdd").onclick = () => {
  const n = $("#rewardName").value.trim();
  const cost = parseFloat($("#rewardCost").value) || 1;
  if (!n) return;
  data.rewards.push({ id: uuid(), name: n, cost });
  $("#rewardName").value = "";
  commit();
  renderRewards();
};

/* ============================================================
   CATEGORY STATS
   ============================================================ */
function updateStats() {
  const cats = { Study: 0, Work: 0, "Self-Care": 0, Other: 0 };
  data.tasks.forEach(t => (cats[t.category] = (cats[t.category] || 0) + 1));
  const total = Object.values(cats).reduce((a, b) => a + b, 0) || 1;
  $("#countStudy").textContent = cats.Study;
  $("#countWork").textContent = cats.Work;
  $("#countSelfCare").textContent = cats["Self-Care"];
  $("#countOther").textContent = cats.Other;
  $("#barStudy").style.width = (cats.Study / total) * 100 + "%";
  $("#barWork").style.width = (cats.Work / total) * 100 + "%";
  $("#barSelfCare").style.width = (cats["Self-Care"] / total) * 100 + "%";
  $("#barOther").style.width = (cats.Other / total) * 100 + "%";
}

/* ============================================================
   POMODORO ENGINE
   ============================================================ */
let pomo = {
  phase: "focus",
  seconds: 0,
  timer: null,
  running: false,
  task: null,
};
function startPomodoro(t) {
  pomo.task = t;
  $("#pomoTaskTitle").textContent = t.name || "Focus";
  $("#pomoOverlay").classList.remove("hidden");
  setPomoPhase("focus");
}
function setPomoPhase(ph) {
  pomo.phase = ph;
  const mins = parseInt($("#pomoFocus").value);
  const smins = parseInt($("#pomoShort").value);
  const lmins = parseInt($("#pomoLong").value);
  pomo.seconds = (ph === "focus" ? mins : ph === "short" ? smins : lmins) * 60;
  renderPomoTime();
}
function renderPomoTime() {
  const m = Math.floor(pomo.seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (pomo.seconds % 60).toString().padStart(2, "0");
  $("#pomoTime").textContent = `${m}:${s}`;
  $("#pomoMicro").textContent = `${m} min ${s} s left`;
  $("#callMiniMicro").textContent = `${m}:${s}`;
}
function tickPomo() {
  if (pomo.running && pomo.seconds > 0) {
    pomo.seconds--;
    renderPomoTime();
  } else if (pomo.running && pomo.seconds <= 0) {
    pomo.running = false;
    clearInterval(pomo.timer);
    if (pomo.phase === "focus") {
      addXP(Number(pomo.task?.xp || 1));
      if (data.settings.autoNext) setPomoPhase("short");
      toast("Focus session done!");
    } else toast("Break ended!");
  }
}
$("#pomoStart").onclick = () => {
  if (!pomo.running) {
    pomo.running = true;
    pomo.timer = setInterval(tickPomo, 1000);
    $("#pomoMicro").classList.remove("hidden");
    $("#callMiniMicro").classList.remove("hidden");
  }
};
$("#pomoPause").onclick = () => {
  pomo.running = false;
  clearInterval(pomo.timer);
};
$("#pomoDone").onclick = () => {
  addXP(Number(pomo.task?.xp || 1));
  $("#pomoOverlay").classList.add("hidden");
  $("#pomoMicro").classList.add("hidden");
  pomo.running = false;
  clearInterval(pomo.timer);
};
$("#pomoExit").onclick = () => {
  $("#pomoOverlay").classList.add("hidden");
  $("#pomoMicro").classList.add("hidden");
  pomo.running = false;
  clearInterval(pomo.timer);
};

/* ============================================================
   CALL OVERLAY  (Activities)
   ============================================================ */
const call = { open: false, mode: "Study" };
const backdrop = $("#callBackdrop");
const penguin = $("#callPenguin");
const props = {
  Study: ".prop-pen",
  Exercise: ".prop-bar",
  Eat: ".prop-spoon",
  Bath: ".prop-bath",
  Sleep: ".prop-zzz",
};
function openCall(mode) {
  call.mode = mode;
  $("#callOverlay").classList.remove("hidden");
  $("#callModeLabel").textContent = mode;
  backdrop.className = `backdrop tech ${mode.toLowerCase()}`;
  penguin.querySelectorAll(".prop").forEach(p => (p.style.opacity = 0));
  if (props[mode]) penguin.querySelector(props[mode]).style.opacity = 1;
}
["Study", "Exercise", "Eat", "Bath", "Sleep"].forEach(m => {
  $("#call" + m).onclick = () => openCall(m);
});
$("#openCall").onclick = () => openCall("Study");
$("#closeCall").onclick = () => $("#callOverlay").classList.add("hidden");
$("#callMin").onclick = () => {
  $("#callOverlay").classList.add("hidden");
  $("#callMini").classList.remove("hidden");
  $("#callMiniText").textContent = `${call.mode} with ${data.avatar.name}`;
};
$("#callMiniRestore").onclick = () => {
  $("#callOverlay").classList.remove("hidden");
  $("#callMini").classList.add("hidden");
};
$("#callMiniClose").onclick = () => $("#callMini").classList.add("hidden");

/* ============================================================
   CALCULATOR + SEARCH MODALS
   ============================================================ */
$("#openCalc").onclick = () => {
  $("#calcModal").classList.add("show");
  $("#calcFrame").srcdoc = `
    <html><body style="background:#09131f;color:white;font-family:sans-serif;padding:10px">
    <input id='expr' style='width:90%;font-size:22px;background:#1b2a44;color:#fff;border:0;padding:8px;border-radius:8px'><button onclick='try{r.innerText=eval(expr.value)}catch(e){r.innerText="Err"}'>=</button>
    <div id='r' style='margin-top:10px;font-size:24px'></div></body></html>`;
};
$("#closeCalc").onclick = () => $("#calcModal").classList.remove("show");

$("#openSearch").onclick = () => {
  $("#searchModal").classList.add("show");
  $("#searchFrame").src = "https://duckduckgo.com";
};
$("#closeSearch").onclick = () => $("#searchModal").classList.remove("show");

/* ============================================================
   ALARMS
   ============================================================ */
function renderAlarms() {
  const ul = $("#alarmList");
  ul.innerHTML = "";
  data.alarms.forEach(a => {
    const li = document.createElement("li");
    li.className = "item";
    li.innerHTML = `
      <div class="left"><b>${a.time}</b><div class="meta">${a.label}</div></div>
      <div class="btn-row">
        <button class="btn-focus on">${a.on ? "On" : "Off"}</button>
        <button class="btn-done">✎</button>
        <button class="btn-del">🗑️</button>
      </div>`;
    li.querySelector(".btn-focus").onclick = () => {
      a.on = !a.on;
      renderAlarms();
      commit();
    };
    li.querySelector(".btn-done").onclick = () => {
      const newL = prompt("Edit label", a.label);
      if (newL) a.label = newL;
      commit();
      renderAlarms();
    };
    li.querySelector(".btn-del").onclick = () => {
      data.alarms = data.alarms.filter(x => x.id !== a.id);
      commit();
      renderAlarms();
    };
    ul.append(li);
  });
}
$("#addAlarm").onclick = () => {
  const t = $("#alarmTime").value;
  const l = $("#alarmLabel").value || "Alarm";
  const s = $("#alarmSound").value;
  if (!t) return;
  data.alarms.push({ id: uuid(), time: t, label: l, sound: s, on: true });
  commit();
  renderAlarms();
};
setInterval(() => {
  const now = new Date();
  const time = now.toTimeString().slice(0, 5);
  data.alarms.forEach(a => {
    if (a.on && a.time === time) {
      toast(`⏰ ${a.label}`);
      $("#alarmBeep").play();
      a.on = false;
      renderAlarms();
      commit();
      setTimeout(() => {
        if (confirm("Snooze 5 min?"))
          a.time = new Date(now.getTime() + 5 * 60000)
            .toTimeString()
            .slice(0, 5);
        a.on = true;
        commit();
        renderAlarms();
      }, 5000);
    }
  });
}, 10000);

/* ============================================================
   TIME-BLOCKING
   ============================================================ */
function renderSchedule() {
  const grid = $("#scheduleGrid");
  grid.innerHTML = "";
  data.blocks.forEach(b => {
    const div = document.createElement("div");
    div.className = "block";
    div.style.background = b.color;
    div.style.top = timeToY(b.start) + "px";
    div.style.height = timeToY(b.end) - timeToY(b.start) + "px";
    div.innerHTML = `${b.title}<span class='edit'>✎</span>`;
    div.querySelector(".edit").onclick = () => {
      const newT = prompt("Edit block", b.title);
      if (newT) b.title = newT;
      commit();
      renderSchedule();
    };
    grid.append(div);
  });
}
function timeToY(t) {
  const [h, m] = t.split(":").map(Number);
  return (h * 60 + m) * 0.6; // 1min=0.6px for ~1440px height
}
$("#addBlock").onclick = () => {
  const b = {
    id: uuid(),
    title: $("#blockTitle").value || "Block",
    start: $("#blockStart").value,
    end: $("#blockEnd").value,
    color: $("#blockColor").value,
  };
  data.blocks.push(b);
  commit();
  renderSchedule();
};
$("#addFromTasks").onclick = () => {
  if (!data.tasks.length) return toast("No tasks");
  const t = data.tasks[0];
  data.blocks.push({
    id: uuid(),
    title: t.name,
    start: $("#blockStart").value,
    end: $("#blockEnd").value,
    color: "#4f83ff",
  });
  commit();
  renderSchedule();
};
$("#clearSchedule").onclick = () => {
  if (confirm("Clear schedule?")) {
    data.blocks = [];
    commit();
    renderSchedule();
  }
};
$("#clearToday").onclick = () => {
  if (confirm("Clear today’s history?")) {
    data.history = [];
    commit();
  }
};
setInterval(() => {
  const n = new Date();
  const top = timeToY(n.toTimeString().slice(0, 5));
  $("#nowMarker").style.top = top + "px";
}, 60000);

/* ============================================================
   SHOP & AVATAR
   ============================================================ */
const accessories = [
  "Headphones","Glasses","Hat","Crown","Beanie",
  "Scarf","Tie","Bow","Headband","Cap"
];
const themes = ["tech","arctic","sunset","space"];
const effects = ["sparkle","bubbles","hearts"];
function renderShop() {
  const accC = $("#shopAccessories");
  const thC = $("#shopThemes");
  const efC = $("#shopEffects");
  accC.innerHTML = themes.innerHTML = efC.innerHTML = "";
  accessories.forEach(a => addTile(accC, a, 5));
  themes.forEach(t => addTile(thC, t, 20));
  effects.forEach(e => addTile(efC, e, 15));
  $("#coinsText").textContent = data.coins;
  $("#ownedCount").textContent = data.shop.owned.length;
}
function addTile(container, name, cost) {
  const owned = data.shop.owned.includes(name);
  const div = document.createElement("div");
  div.className = "tile";
  div.innerHTML = `
    <div class="thumb"></div>
    <div class="row">
      <div>${name}</div>
      <button class="buy">${owned ? "Owned" : cost + "💰"}</button>
    </div>`;
  const btn = div.querySelector(".buy");
  btn.disabled = owned;
  btn.onclick = () => {
    if (data.coins >= cost) {
      data.coins -= cost;
      data.shop.owned.push(name);
      toast(`Bought ${name}`);
      commit();
      renderShop();
    } else toast("Not enough coins");
  };
  container.append(div);
}

/* ============================================================
   SETTINGS SIDEBAR
   ============================================================ */
$("#openSettings").onclick = () => $("#settingsPanel").classList.add("show");
$("#closeSettings").onclick = () => $("#settingsPanel").classList.remove("show");
$("#optTheme").onchange = e => {
  data.settings.theme = e.target.value;
  document.body.dataset.theme = e.target.value;
  commit();
};
$("#optLang").onchange = e => {
  data.settings.lang = e.target.value;
  commit();
};
$("#optSound").onchange = e => (data.settings.sound = e.target.value);
$("#optVolume").oninput = e => (data.settings.volume = e.target.value / 100);
$("#saveAvatarSettings").onclick = () => {
  data.avatar.name = $("#setAName").value || "Pingu";
  data.avatar.color = $("#setAColor").value;
  data.avatar.head = $("#setAHead").value;
  data.avatar.body = $("#setABody").value;
  data.avatar.effect = $("#setAEffect").value;
  toast("Avatar saved!");
  commit();
};
$("#clearAllData").onclick = () => {
  if (confirm("Erase all data?")) {
    localStorage.clear();
    location.reload();
  }
};

/* ============================================================
   RACE (Kahoot-like)
   ============================================================ */
const raceDiv = $("#raceFull"), raceContent = $("#raceContent");
$("#raceClose").onclick = () => raceDiv.classList.remove("show");

function startRaceHost() {
  const code = Math.floor(Math.random() * 90000 + 10000);
  data.race = { code, players: [data.avatar.name], host: true, leaderboard: {} };
  raceDiv.classList.add("show");
  raceContent.innerHTML = `
    <div class='race-panel'>
      <h2>Share this code</h2>
      <div class='race-code'>${code}</div>
      <div class='race-participants' id='racePlayers'><div class='part-chip'>${data.avatar.name}</div></div>
      <button id='raceStart' class='primary'>Start Pomodoro Race</button>
    </div>`;
  $("#raceStart").onclick = startRacePomodoro;
}
function startRaceJoin() {
  const code = prompt("Enter race code:");
  if (!code) return;
  data.race = { code, host: false };
  raceDiv.classList.add("show");
  raceContent.innerHTML = `
    <div class='race-panel'><h2>Joined race ${code}</h2><div>Waiting for host...</div></div>`;
}
function startRacePomodoro() {
  raceContent.innerHTML = `
    <div class='race-panel'>
      <h2>Pomodoro Race Started!</h2>
      <div id='raceTimer' style='font-size:42px;margin:20px'>25:00</div>
      <div>Work with your penguin! XP will determine leaderboard.</div>
    </div>`;
  let secs = 1500;
  const timer = setInterval(() => {
    const m = String(Math.floor(secs / 60)).padStart(2, "0");
    const s = String(secs % 60).padStart(2, "0");
    $("#raceTimer").textContent = `${m}:${s}`;
    secs--;
    if (secs < 0) {
      clearInterval(timer);
      raceContent.innerHTML = `<div class='race-panel'><h2>Leaderboard</h2><p>${data.avatar.name}: +2 XP</p></div>`;
      addXP(2);
    }
  }, 1000);
}
window.startRaceHost = startRaceHost;
window.startRaceJoin = startRaceJoin;

/* ============================================================
   UTILITIES
   ============================================================ */
function toast(msg) {
  const d = document.createElement("div");
  d.textContent = msg;
  d.style.position = "fixed";
  d.style.bottom = "20px";
  d.style.right = "20px";
  d.style.background = "#0a1421";
  d.style.padding = "10px 14px";
  d.style.borderRadius = "10px";
  d.style.boxShadow = "0 4px 12px rgba(0,0,0,.4)";
  document.body.append(d);
  setTimeout(() => d.remove(), 3000);
}

/* ============================================================
   INIT
   ============================================================ */
function init() {
  document.body.dataset.theme = data.settings.theme;
  renderHeader();
  renderTasks();
  renderRewards();
  renderAlarms();
  renderSchedule();
  renderShop();
}
init();
