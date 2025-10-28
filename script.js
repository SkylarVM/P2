/* ===========================================================
   Penguin Companion — Add-Ons (Avatar + Shop + Race + I/O)
   This file EXTENDS your current app. No rewrites, just hooks.
   =========================================================== */

/* -----------------------------
   Safe getters for existing app
------------------------------*/
const LS = window.localStorage;
const $  = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];
const on = (el, ev, fn) => el && el.addEventListener(ev, fn);
const emit = (name, detail={}) => window.dispatchEvent(new CustomEvent(name, {detail}));

// Try to read existing state from your app, fallback if not there.
let tasks = safeJSON('tasks', []);
let rewards = safeJSON('rewards', []);
let categories = safeJSON('categories', ['Study','Work','Self-Care']);
let categoryCounts = safeJSON('categoryCounts', {});
let history = safeJSON('history', {});
let exp = parseFloat(LS.getItem('exp') || '0');
let coins = parseInt(LS.getItem('coins') || '0', 10);
const today = new Date().toISOString().slice(0,10);
if (!history[today]) history[today] = [];

/* -----------------------------
   Avatar & Inventory (Shop)
------------------------------*/
let avatar = safeJSON('avatar', {
  name: 'Pingu',
  color: '#a855f7',  // purple default to match screenshots
  accessory: '',     // head
  body: '',          // body item (cape, hoodie… we use same list for demo)
  effect: ''         // aura/shadow etc.
});

// Simple inventory with equip & own
let inventory = safeJSON('inventory', {
  owned: {
    themes: ['tech-lab'],       // default owned
    accessories: [],            // head/body accessories
    effects: []                 // visual effects
  },
  equipped: {
    theme: 'tech-lab',
    head: avatar.accessory || '',
    body: avatar.body || '',
    effect: avatar.effect || ''
  }
});

// Shop catalog (icons are emoji for the MVP; replace with SVGs later)
const SHOP = {
  accessories: [
    {id:'beanie', label:'Beanie', icon:'🧢', price:6, unlock:1},
    {id:'glasses', label:'Glasses', icon:'👓', price:8, unlock:2},
    {id:'headphones', label:'Headphones', icon:'🎧', price:10, unlock:3},
    {id:'cap', label:'Cap', icon:'🧢', price:6, unlock:3},
    {id:'crown', label:'Crown', icon:'👑', price:14, unlock:5},
    {id:'gradcap', label:'Grad Cap', icon:'🎓', price:10, unlock:4},
    {id:'bunny', label:'Bunny Ears', icon:'🐰', price:9, unlock:4},
    {id:'santa', label:'Santa Hat', icon:'🎅', price:9, unlock:4},
    {id:'scarf', label:'Scarf', icon:'🧣', price:7, unlock:2},
    {id:'goggles', label:'Goggles', icon:'🥽', price:7, unlock:2}
  ],
  themes: [
    {id:'tech-lab', label:'Tech Lab', icon:'🧪', price:0,  unlock:1, owned:true},
    {id:'arctic',   label:'Arctic Base', icon:'❄️', price:20, unlock:3},
    {id:'sunset',   label:'Sunset Beach', icon:'🌅', price:24, unlock:4},
    {id:'nebula',   label:'Night Nebula', icon:'🌌', price:28, unlock:5}
  ],
  effects: [
    {id:'aura',     label:'Aura', icon:'✨', price:12, unlock:3},
    {id:'rainbow',  label:'Rainbow Aura', icon:'🌈', price:18, unlock:4},
    {id:'frost',    label:'Frost Aura', icon:'🧊', price:20, unlock:5},
    {id:'shadow',   label:'Shadow Trail', icon:'🌙', price:16, unlock:4}
  ]
};

/* -----------------------------
   Elements from your new HTML
------------------------------*/
// Avatar builder
const penguinPreview = $('#penguinPreview');
const avatarNameEl   = $('#avatarName');
const nameInput      = $('#nameInput');
const swatches       = $$('.swatch');
const accessorySel   = $('#accessorySelect');
const bodySel        = $('#bodySelect');
const effectSel      = $('#effectSelect');
const saveAvatarBtn  = $('#saveAvatarBtn');

// Shop
const shopAcc = $('#shopAccessories');
const shopThm = $('#shopThemes');
const shopEff = $('#shopEffects');

// Import/Export / Meet
const exportJSONBtn = $('#exportJsonBtn');
const exportCSVBtn  = $('#exportCsvBtn');
const importFile    = $('#importFile');
const shareMeetBtn  = $('#shareMeetBtn');

// Race modal + arena
const raceModal       = $('#raceModal');
const raceCreateBtn   = $('#raceCreateBtn');
const raceJoinBtn     = $('#raceJoinBtn');
const raceStartBtn    = $('#raceStartBtn');
const raceCloseBtn    = $('#raceCloseBtn');
const raceCodeEl      = $('#raceCode');
const raceJoinInput   = $('#raceJoinCode');
const raceNameInput   = $('#raceDisplayName');
const raceParticipants= $('#raceParticipants');

const arena           = $('#raceArena');
const arenaCloseBtn   = $('#arenaCloseBtn');
const raceTaskTitle   = $('#raceTaskTitle');
const raceTimerEl     = $('#raceTimer');
const startJointBtn   = $('#startJointBtn');
const miniArea        = $('#minigameArea');
const tttBoard        = $('#tttBoard');
const c4Board         = $('#c4Board');

// Header coin XP UI (if present)
const levelSpan = $('#levelValue');
const xpSpan    = $('#xpValue');
const coinSpan  = $('#coinValue');
const progressBar = $('#progressBar');

// Optional “Race” header button (if exists)
const raceHeaderBtn = $('#raceHeaderBtn');

/* -----------------------------
   Utilities
------------------------------*/
function safeJSON(key, fallback) {
  try { const v = LS.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function save(key, val){ LS.setItem(key, JSON.stringify(val)); }
function clamp(n, lo, hi){ return Math.max(lo, Math.min(hi, n)); }

// XP/Coins + header strip update
function levelFromXP(x){ return Math.floor(x/100)+1; }
function refreshHeader(){
  if (levelSpan) levelSpan.textContent = levelFromXP(exp);
  if (xpSpan)    xpSpan.textContent    = Math.round((exp % 100));
  if (coinSpan)  coinSpan.textContent  = coins;
  if (progressBar){
    const pct = clamp((exp % 100),0,100);
    progressBar.style.width = `${pct}%`;
  }
  LS.setItem('exp', exp.toFixed(2));
  LS.setItem('coins', String(coins));
}

// Color helpers
function shade(hex,percent){
  const c=parseInt(hex.slice(1),16);
  let r=(c>>16)&255,g=(c>>8)&255,b=c&255;
  r=Math.min(255,Math.max(0, r + Math.round(255*percent/100)));
  g=Math.min(255,Math.max(0, g + Math.round(255*percent/100)));
  b=Math.min(255,Math.max(0, b + Math.round(255*percent/100)));
  return '#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);
}

/* -----------------------------
   Avatar rendering + builder
------------------------------*/
function applyPenguin(el, color, headAcc, bodyAcc, effect){
  if(!el) return;
  el.style.setProperty('--p', color);
  el.style.setProperty('--accent', shade(color, -18));
  // purge old acc
  $$('.acc', el).forEach(n=>n.remove());
  // Head accessory
  if (headAcc){
    const a = document.createElement('div');
    a.className = `acc ${headAcc}`;
    el.appendChild(a);
  }
  // Body accessory treated as scarf/cape variant for MVP
  if (bodyAcc === 'scarf'){
    const s = document.createElement('div');
    s.className = 'acc scarf';
    el.appendChild(s);
  }
  // Effect placeholder (aura glow)
  if (effect){
    el.style.filter = 'drop-shadow(0 0 16px rgba(124,58,237,.55))';
  } else {
    el.style.filter = 'drop-shadow(0 4px 8px rgba(0,0,0,.4))';
  }
}

function initAvatarBuilder(){
  if(!penguinPreview) return;
  // Set initial values
  nameInput && (nameInput.value = avatar.name);
  avatarNameEl && (avatarNameEl.textContent = avatar.name);
  accessorySel && (accessorySel.value = avatar.accessory || '');
  bodySel && (bodySel.value = avatar.body || '');
  effectSel && (effectSel.value = avatar.effect || '');
  applyPenguin(penguinPreview, avatar.color, avatar.accessory, avatar.body, avatar.effect);

  // Swatches
  swatches.forEach(sw => {
    on(sw, 'click', () => {
      swatches.forEach(s=>s.style.outline='none');
      sw.style.outline = '2px solid #60a5fa';
      const map = {blue:'#3b82f6', red:'#ef4444', green:'#22c55e', purple:'#a855f7', gold:'#fbbf24'};
      const val = map[sw.dataset.color] || '#a855f7';
      avatar.color = val;
      applyPenguin(penguinPreview, avatar.color, accessorySel?.value, bodySel?.value, effectSel?.value);
    });
  });

  // Dropdown bindings
  on(accessorySel, 'change', () => applyPenguin(penguinPreview, avatar.color, accessorySel.value, bodySel?.value, effectSel?.value));
  on(bodySel, 'change',      () => applyPenguin(penguinPreview, avatar.color, accessorySel?.value, bodySel.value, effectSel?.value));
  on(effectSel, 'change',    () => applyPenguin(penguinPreview, avatar.color, accessorySel?.value, bodySel?.value, effectSel.value));

  on(saveAvatarBtn,'click', () => {
    avatar.name      = (nameInput?.value?.trim() || avatar.name);
    avatar.accessory = accessorySel?.value || '';
    avatar.body      = bodySel?.value || '';
    avatar.effect    = effectSel?.value || '';
    save('avatar', avatar);
    // mirror to inventory equip
    inventory.equipped.head   = avatar.accessory;
    inventory.equipped.body   = avatar.body;
    inventory.equipped.effect = avatar.effect;
    save('inventory', inventory);
    if (avatarNameEl) avatarNameEl.textContent = avatar.name;
    // Notify the rest of the app (calls/toasts can re-render the avatar)
    emit('avatar:updated', {avatar});
  });
}

/* -----------------------------
   Shop rendering (buy/equip)
------------------------------*/
function renderShop(){
  if (!shopAcc || !shopThm || !shopEff) return;

  // Helpers
  const makeItem = (cat, item) => {
    const div = document.createElement('div');
    div.className = 'shop-item';
    if (inventory.owned[cat].includes(item.id) || item.owned) div.classList.add('owned');
    div.title = `${item.label} • ${item.price} coins`;

    div.innerHTML = `<span>${item.icon}</span>`;
    div.dataset.id  = item.id;
    div.dataset.cat = cat;

    div.addEventListener('click', () => {
      if (item.owned || inventory.owned[cat].includes(item.id)) {
        // equip
        if (cat === 'themes') inventory.equipped.theme = item.id;
        if (cat === 'accessories') inventory.equipped.head = item.id;
        if (cat === 'effects') inventory.equipped.effect = item.id;
        save('inventory', inventory);
        // reflect in avatar preview if same type
        if (cat === 'accessories'){ accessorySel && (accessorySel.value = item.id); avatar.accessory = item.id; }
        if (cat === 'effects'){ effectSel && (effectSel.value = item.id); avatar.effect = item.id; }
        applyPenguin(penguinPreview, avatar.color, avatar.accessory, avatar.body, avatar.effect);
        return;
      }
      // buy path
      const lvl = levelFromXP(exp);
      if (lvl < item.unlock) { alert(`Unlocks at Level ${item.unlock}`); return; }
      if (coins < item.price) { alert('Not enough coins'); return; }
      coins -= item.price;
      inventory.owned[cat].push(item.id);
      save('inventory', inventory);
      refreshHeader();
      renderShop();
    });

    return div;
  };

  shopAcc.innerHTML = ''; shopThm.innerHTML=''; shopEff.innerHTML='';
  SHOP.accessories.forEach(a => shopAcc.appendChild(makeItem('accessories', a)));
  SHOP.themes.forEach(t => shopThm.appendChild(makeItem('themes', t)));
  SHOP.effects.forEach(e => shopEff.appendChild(makeItem('effects', e)));
}

/* -----------------------------
   Import / Export
------------------------------*/
function exportJSON(){
  const blob = new Blob([JSON.stringify(snapshot(), null, 2)], {type:'application/json'});
  triggerDownload(blob, 'penguin_export.json');
}
function exportCSV(){
  // Very lightweight CSV of tasks + rewards + history today
  const t = [['type','name','meta1','meta2']];
  tasks.forEach(x=>t.push(['task', x.name, x.category, x.xp]));
  rewards.forEach(x=>t.push(['reward', x.name, x.cost, '']));
  (history[today]||[]).forEach(h=>t.push(['history', h.name, h.category, `${h.pomodoros} pomo / +${h.xp} xp`]));
  const csv = t.map(r => r.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(',')).join('\n');
  triggerDownload(new Blob([csv],{type:'text/csv'}), 'penguin_export.csv');
}
function triggerDownload(blob, filename){
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href), 500);
}
function snapshot(){
  return {
    exp, coins, avatar, inventory,
    tasks, rewards, categories, categoryCounts, history
  };
}
function importFromFile(file){
  const reader = new FileReader();
  reader.onload = () => {
    try{
      const data = JSON.parse(reader.result);
      if (data.exp != null) exp = parseFloat(data.exp);
      if (data.coins != null) coins = parseInt(data.coins,10);
      if (data.avatar) avatar = data.avatar;
      if (data.inventory) inventory = data.inventory;
      if (data.tasks) tasks = data.tasks;
      if (data.rewards) rewards = data.rewards;
      if (data.categories) categories = data.categories;
      if (data.categoryCounts) categoryCounts = data.categoryCounts;
      if (data.history) history = data.history;
      persistAll();
      initAvatarBuilder();
      renderShop();
      refreshHeader();
      alert('Import completed.');
    }catch(e){ alert('Invalid file.'); }
  };
  reader.readAsText(file);
}
on(exportJSONBtn, 'click', exportJSON);
on(exportCSVBtn,  'click', exportCSV);
on(importFile, 'change', e => e.target.files[0] && importFromFile(e.target.files[0]));

/* -----------------------------
   Meet share (MVP — opens Meet)
------------------------------*/
on(shareMeetBtn, 'click', () => {
  window.open('https://meet.new', '_blank', 'noopener,noreferrer');
});

/* -----------------------------
   RACE (Kahoot-style) with
   Joint Pomodoro + Break Games
------------------------------*/
const raceChannel = getChannel('penguin-race'); // BroadcastChannel fallback to storage events
let myClientId = LS.getItem('clientId') || randomId();
LS.setItem('clientId', myClientId);

let myRace = null; // local projection of current room

function getChannel(name){
  if ('BroadcastChannel' in window) return new BroadcastChannel(name);
  // Fallback using storage events
  return {
    postMessage: (msg) => LS.setItem('__bc__'+name, JSON.stringify({msg, t: Date.now()}))
  };
}
window.addEventListener('storage', (e)=>{
  if (!e.key || !e.key.startsWith('__bc__penguin-race')) return;
  try{ const {msg} = JSON.parse(e.newValue); handleRaceMessage(msg); }catch(_){}
});
if (raceChannel && raceChannel.onmessage !== undefined){
  raceChannel.onmessage = (ev) => handleRaceMessage(ev.data);
}

function raceMsg(type, payload={}){
  const msg = {type, payload, clientId: myClientId};
  raceChannel && raceChannel.postMessage(msg);
  handleRaceMessage(msg, true); // apply locally immediately
}

function handleRaceMessage({type, payload}, localEcho=false){
  switch(type){
    case 'race:create':
      if (localEcho || !myRace) { // show code to creator
        myRace = payload;
        renderRaceLobby();
      }
      break;
    case 'race:join':
      if (!myRace || myRace.code !== payload.code) return;
      if (!myRace.participants.find(p=>p.id===payload.user.id)){
        myRace.participants.push(payload.user);
        saveRaceState(myRace);
        renderRaceLobby();
      }
      break;
    case 'race:start':
      if (!myRace || myRace.code !== payload.code) return;
      myRace.phase = 'focus';
      myRace.endAt = Date.now() + myRace.focusMs;
      saveRaceState(myRace);
      openArena();
      tickHostLoop(); // host runs timer
      break;
    case 'race:tick':
      if (!myRace || myRace.code !== payload.code) return;
      // non-host follows host's time
      if (payload.host && payload.remaining != null){
        raceTimerEl.textContent = fmt(payload.remaining);
      }
      break;
    case 'race:phase':
      if (!myRace || myRace.code !== payload.code) return;
      myRace.phase = payload.phase;
      if (payload.phase === 'break'){
        myRace.endAt = Date.now() + myRace.breakMs;
        showMiniGames(true);
      }else{
        myRace.endAt = Date.now() + myRace.focusMs;
        showMiniGames(false);
      }
      break;
    case 'race:ttt':
      drawTicTacToe(payload.board);
      break;
    case 'race:c4':
      drawConnect4(payload.board);
      break;
  }
}

function saveRaceState(room){
  LS.setItem('race_' + room.code, JSON.stringify(room));
}
function loadRace(code){ return safeJSON('race_'+code, null); }

function randomId(){ return Math.random().toString(36).slice(2,8); }
function fmt(ms){
  const s = Math.max(0, Math.floor(ms/1000));
  const m = Math.floor(s/60);
  const r = s % 60;
  return `${String(m).padStart(2,'0')}:${String(r).padStart(2,'0')}`;
}

/* Lobby */
function openRaceModal(){ raceModal && raceModal.classList.remove('hidden'); }
function closeRaceModal(){ raceModal && raceModal.classList.add('hidden'); }
function openArena(){ arena && arena.classList.remove('hidden'); }
function closeArena(){ arena && arena.classList.add('hidden'); showMiniGames(false); }

function renderRaceLobby(){
  if (!raceModal) return;
  raceCodeEl.textContent = myRace?.code || '—';
  raceParticipants.innerHTML = '';
  (myRace?.participants || []).forEach(p=>{
    const li = document.createElement('div');
    li.textContent = p.name + (p.id===myRace.host?'  (Host)':'');
    raceParticipants.appendChild(li);
  });
  openRaceModal();
}

// Header button to open Race dialog (if present)
on(raceHeaderBtn, 'click', openRaceModal);
on(raceCloseBtn,  'click', closeRaceModal);

on(raceCreateBtn, 'click', ()=>{
  const code = (''+Math.floor(100000 + Math.random()*900000));
  myRace = {
    code,
    host: myClientId,
    participants: [{id: myClientId, name: raceNameInput?.value?.trim() || avatar.name}],
    phase: 'lobby',
    focusMs: 25*60*1000,
    breakMs: 5*60*1000,
    endAt: null,
    ttt: {board: Array(9).fill('')},
    c4:  {board: Array.from({length:6},()=>Array(7).fill(''))}
  };
  saveRaceState(myRace);
  raceMsg('race:create', myRace);
  // Creator jumps into arena view (waiting)
  renderRaceLobby();
});

on(raceJoinBtn, 'click', ()=>{
  const code = (raceJoinInput?.value || '').trim();
  if (!code) return alert('Enter a code');
  const room = loadRace(code);
  if (!room) return alert('Room not found. (Ensure the creator has it open)');
  myRace = room;
  const me = {id: myClientId, name: raceNameInput?.value?.trim() || avatar.name};
  // save in room + broadcast
  raceMsg('race:join', {code, user: me});
  renderRaceLobby();
});

on(raceStartBtn, 'click', ()=>{
  if (!myRace || myRace.host !== myClientId) return;
  closeRaceModal();
  raceMsg('race:start', {code: myRace.code});
});

// Arena controls
on(arenaCloseBtn, 'click', ()=>{ closeArena(); myRace=null; });

on(startJointBtn, 'click', ()=>{
  if (!myRace || myRace.host !== myClientId) return;
  // toggle phase host-side
  const next = (myRace.phase === 'break') ? 'focus' : 'break';
  raceMsg('race:phase', {code: myRace.code, phase: next});
});

// Host drives the timer, emits ticks
let hostLoop = null;
function tickHostLoop(){
  if (!myRace || myRace.host !== myClientId) return;
  clearInterval(hostLoop);
  hostLoop = setInterval(()=>{
    if (!myRace || !myRace.endAt) return clearInterval(hostLoop);
    const remaining = myRace.endAt - Date.now();
    if (remaining <= 0){
      // flip phase automatically
      const next = (myRace.phase === 'focus') ? 'break' : 'focus';
      raceMsg('race:phase', {code: myRace.code, phase: next});
      return;
    }
    raceTimerEl.textContent = fmt(remaining);
    raceMsg('race:tick', {code: myRace.code, remaining, host:true});
  }, 1000);
}

// When arena opens, ensure UI state matches room
window.addEventListener('race:phase', ()=>{}); // placeholder

/* -----------------------------
   Mini-Games (break only)
------------------------------*/
function showMiniGames(show){
  if (!miniArea) return;
  miniArea.classList.toggle('hidden', !show);
  startJointBtn && (startJointBtn.textContent = show ? 'Return to Focus' : 'Start Break');
  if (show){
    // Build fresh boards
    buildTTT();
    buildC4();
  }
}

/* Tic-Tac-Toe (shared board) */
function buildTTT(){
  if (!tttBoard) return;
  const board = (myRace?.ttt?.board || Array(9).fill('')).slice();
  tttBoard.innerHTML = '';
  board.forEach((cell, idx)=>{
    const b = document.createElement('button');
    b.className = 'btn ghost';
    b.style.width='60px'; b.style.height='60px'; b.style.fontSize='22px';
    b.textContent = cell;
    b.addEventListener('click', ()=>{
      if (!myRace) return;
      const turn = (board.filter(c=>c).length % 2 === 0) ? 'X' : 'O';
      if (board[idx]) return; // occupied
      board[idx] = turn;
      myRace.ttt.board = board;
      saveRaceState(myRace);
      raceMsg('race:ttt', {code: myRace.code, board});
    });
    tttBoard.appendChild(b);
  });
}
function drawTicTacToe(board){
  if (!tttBoard) return;
  $$('#tttBoard .btn').forEach((b,i)=> b.textContent = board[i] || '');
}

/* Connect-4 (shared board) */
function buildC4(){
  if (!c4Board) return;
  const rows = 6, cols = 7;
  const board = (myRace?.c4?.board || Array.from({length:rows},()=>Array(cols).fill(''))).map(r=>r.slice());
  c4Board.innerHTML = '';
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.style.width='26px'; cell.style.height='26px';
      cell.style.border='1px solid #334155'; cell.style.borderRadius='50%';
      cell.style.margin='3px';
      cell.style.background = board[r][c] === 'R' ? '#ef4444' : (board[r][c] === 'Y' ? '#fbbf24' : 'transparent');
      cell.addEventListener('click', ()=>{
        // drop in column c
        for(let rr=rows-1; rr>=0; rr--){
          if (!board[rr][c]){
            const token = (flatCount(board)%2===0) ? 'R' : 'Y';
            board[rr][c] = token;
            myRace.c4.board = board;
            saveRaceState(myRace);
            raceMsg('race:c4', {code: myRace.code, board});
            break;
          }
        }
      });
      c4Board.appendChild(cell);
    }
    c4Board.appendChild(document.createElement('br'));
  }
}
function drawConnect4(board){
  if (!c4Board) return;
  const cells = $$('#c4Board .cell');
  let k=0;
  for(let r=0;r<board.length;r++){
    for(let c=0;c<board[0].length;c++){
      const v = board[r][c];
      const el = cells[k++];
      el && (el.style.background = v==='R' ? '#ef4444' : (v==='Y' ? '#fbbf24' : 'transparent'));
    }
  }
}
function flatCount(board){ return board.reduce((a,row)=>a+row.filter(Boolean).length,0); }

/* -----------------------------
   Persistence helpers
------------------------------*/
function persistAll(){
  save('tasks', tasks);
  save('rewards', rewards);
  save('categories', categories);
  save('categoryCounts', categoryCounts);
  save('history', history);
  save('avatar', avatar);
  save('inventory', inventory);
  refreshHeader();
}

/* -----------------------------
   Init on load
------------------------------*/
function init(){
  refreshHeader();
  initAvatarBuilder();
  renderShop();

  // Re-apply avatar to any other penguin instances your old code creates
  window.addEventListener('avatar:updated', ()=>{
    // You can hook other places here (call overlay penguin, toast penguin…)
  });

  // If creator already opened a room in another tab, user can join by code
}
document.addEventListener('DOMContentLoaded', init);
