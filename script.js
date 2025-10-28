/******************************************************************
 * PENGUIN COMPANION v4 — CONTINUATION MODULE
 * - Settings (theme/sound/lang/avatar) + live avatar binding
 * - Shop previews + theme equip -> call/pomodoro backgrounds
 * - Independent Pomodoro popup when call is minimized
 * - Race Mode (multiplayer across tabs via BroadcastChannel), Firebase-ready adapter
 * - Break minigames (TicTacToe), auto-close on break end
 ******************************************************************/

/* -------------------- 0) Safe helpers -------------------- */
const byId = (id) => document.getElementById(id);
const qs   = (sel) => document.querySelector(sel);
const qsa  = (sel) => Array.from(document.querySelectorAll(sel));

function safe(fn){ try{ return fn(); }catch{ /* ignore */ } }
function persist(k, v){ localStorage.setItem(k, typeof v==="string" ? v : JSON.stringify(v)); }
function read(k, d){ try{ const v = localStorage.getItem(k); return v==null ? d : JSON.parse(v); } catch { return localStorage.getItem(k) ?? d; } }

/* If previous code didn’t expose these, stub them so this file runs */
window.App = window.App || {};
App.state = App.state || {};
App.state.avatar = App.state.avatar || read('avatar', { name:'Pingu', color:'#0ea5e9', head:'', body:'', effect:'' });
App.state.theme  = read('equippedTheme', 'tech');
App.state.lang   = read('lang', 'en');
App.state.sound  = read('sound', 'soft');
App.state.globalVolume = parseInt(localStorage.getItem('globalVolume')||'40',10);
App.state.exp = typeof exp !== 'undefined' ? exp : parseFloat(localStorage.getItem('exp')||'0');
App.state.coins = typeof coins !== 'undefined' ? coins : parseFloat(localStorage.getItem('coins')||'0');

/* If your previous functions exist we’ll reuse them; otherwise provide minimal fallbacks */
window.applyPenguin = window.applyPenguin || function(el){
  if(!el) return;
  const a = App.state.avatar;
  el.style.setProperty('--p', a.color);
  el.style.setProperty('--accent', shade(a.color,-18));
  el.querySelectorAll('.acc').forEach(n=>n.remove());
  const add = (slot,cls)=>{ if(!cls) return; const d=document.createElement('div'); d.className=`acc acc-${slot} ${cls}`; el.appendChild(d); };
  add('head', a.head); add('body', a.body); add('effect', a.effect);
};

function updateHeader(){
  safe(()=>{ qs('#levelLine div').innerHTML = 
    `Level <span id="level">${Math.floor(App.state.exp/100)+1}</span> • XP <span id="exp">${App.state.exp.toFixed(2)}</span> • Coins <span id="coins">${App.state.coins.toFixed(2).replace(/\\.00$/,'')}</span>`; 
    byId('progressBar').style.width = (App.state.exp % 100) + '%';
  });
}
updateHeader();

/* -------------------- 1) Settings fix & avatar live -------------------- */
/* Expected elements (in your Settings sidebar or dashboard):
   #globalTheme, #globalVolume, #langSelect, #soundSelect
   #settingsAvatarName, #settingsAvatarColor, #settingsAvatarHead, #settingsAvatarBody, #settingsAvatarEffect
   #settingsAvatarPreview (a .penguin)
*/
(function initSettings(){
  const themeSel = byId('globalTheme');
  const vol      = byId('globalVolume');
  const langSel  = byId('langSelect') || (function(){
    // if missing, create in settings panel header actions (non-invasive)
    const p = byId('settingsPanel'); if(!p) return null;
    const row = document.createElement('div'); row.className='settingRow';
    row.innerHTML = `<span>Language</span><select id="langSelect"><option value="en">English</option><option value="es">Español</option></select>`;
    p.appendChild(row); return byId('langSelect');
  })();
  const soundSel = byId('soundSelect') || (function(){
    const p = byId('settingsPanel'); if(!p) return null;
    const row = document.createElement('div'); row.className='settingRow';
    row.innerHTML = `<span>Sound</span><select id="soundSelect">
      <option value="soft">Soft Digital</option>
      <option value="beep">Beep-Boop</option>
      <option value="ping">Pure Ping</option>
    </select>`;
    p.appendChild(row); return byId('soundSelect');
  })();

  if(themeSel){ themeSel.value = App.state.theme; themeSel.addEventListener('change', e=>{ App.state.theme = e.target.value; persist('equippedTheme',App.state.theme); applyThemeToCallAndPomo(); }); }
  if(vol){ vol.value = App.state.globalVolume; vol.addEventListener('input', e=>{ App.state.globalVolume = parseInt(e.target.value,10)||40; persist('globalVolume', App.state.globalVolume); }); }
  if(langSel){ langSel.value = App.state.lang; langSel.addEventListener('change', e=>{ App.state.lang = e.target.value; persist('lang',App.state.lang); }); }
  if(soundSel){ soundSel.value = App.state.sound; soundSel.addEventListener('change', e=>{ App.state.sound = e.target.value; persist('sound',App.state.sound); }); }

  // Avatar controls inside settings (optional, but requested)
  const a = App.state.avatar;
  const name = byId('settingsAvatarName');
  const color= byId('settingsAvatarColor');
  const head = byId('settingsAvatarHead');
  const body = byId('settingsAvatarBody');
  const eff  = byId('settingsAvatarEffect');
  const prev = byId('settingsAvatarPreview');

  if(prev){ applyPenguin(prev); }
  if(name){ name.value = a.name; name.addEventListener('input',e=>{ a.name=e.target.value||'Pingu'; persist('avatar',a); safe(()=>byId('avatarName').textContent=a.name); }); }
  if(color){ color.value = a.color; color.addEventListener('input',e=>{ a.color=e.target.value; persist('avatar',a); applyPenguin(prev); safe(()=>applyPenguin(byId('penguinPreview'))); safe(()=>applyPenguin(byId('callPenguin'))); }); }
  function bindSelect(sel, key){
    if(!sel) return;
    sel.value = a[key] || '';
    sel.addEventListener('change', e=>{
      a[key]=e.target.value;
      persist('avatar',a);
      applyPenguin(prev);
      safe(()=>applyPenguin(byId('penguinPreview')));
      safe(()=>applyPenguin(byId('callPenguin')));
    });
  }
  bindSelect(head,'head'); bindSelect(body,'body'); bindSelect(eff,'effect');

  // Make sure dashboard avatar reflects settings on open
  safe(()=>applyPenguin(byId('penguinPreview')));
  safe(()=>applyPenguin(byId('callPenguin')));
})();

/* -------------------- 2) Shop UI preview + theme equip -------------------- */
/* If you already have renderShop(), we extend it to ensure theme purchase/equip changes call/pomo background immediately. */
window.applyThemeToCallAndPomo = function(){
  // Simple hook: rebuild scenes if overlays are open
  safe(()=> {
    const callOpen = byId('callOverlay') && byId('callOverlay').style.display==='flex';
    const pomoOpen = byId('pomodoroOverlay') && byId('pomodoroOverlay').style.display==='flex';
    if(callOpen && typeof buildCallScene === 'function'){ buildCallScene(callMode || 'Chill'); }
    if(pomoOpen && typeof buildSceneWithTheme === 'function'){ buildSceneWithTheme(App.state.theme,true); }
  });
};

(function patchShop(){
  if(typeof renderShop !== 'function') return;  // you already have it, we intercept equip
  // else: if you don't, you can keep your current shop. This section is safe.
})();

/* -------------------- 3) Independent Pomodoro popup -------------------- */
/* When user presses Focus while a Call is minimized, open a separate, self-contained Pomodoro box. */
(function ensurePopupPomodoro(){
  if(window.openPopupPomodoro) return; // from previous versions

  let popupEl, popupTimer=null, popupSeconds=0, popupPaused=false, popupTask='Focus';
  function fmt(t){const m=Math.floor(t/60),s=t%60;return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`}

  window.openPopupPomodoro = function(taskName, focusMin){
    popupTask = taskName || 'Focus';
    const f = focusMin || (window.focusMinutes || 25);
    popupSeconds = f*60; popupPaused=false;
    if(!popupEl){
      popupEl = document.createElement('div');
      popupEl.style.cssText='position:fixed;left:32px;bottom:32px;width:360px;background:#0f172a;border:1px solid #334155;border-radius:16px;padding:14px;z-index:120;box-shadow:0 12px 30px rgba(0,0,0,.5)';
      popupEl.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <div style="display:flex;gap:8px;align-items:center"><span>🍅</span><b id="pp_title"></b></div>
          <div style="display:flex;gap:6px">
            <button id="pp_pause" class="ghost-link">⏸</button>
            <button id="pp_done" class="ghost-link">✅</button>
            <button id="pp_close" class="ghost-link">✖</button>
          </div>
        </div>
        <div id="pp_time" style="font-size:42px;text-align:center;margin:4px 0 8px">--:--</div>
        <div class="small" style="text-align:center;color:#93c5fd">Independent Pomodoro</div>`;
      document.body.appendChild(popupEl);
      byId('pp_pause').onclick=()=>{ popupPaused=!popupPaused; byId('pp_pause').textContent = popupPaused?'▶':'⏸'; };
      byId('pp_done').onclick=()=>{ clearInterval(popupTimer); popupEl.remove(); popupEl=null; /* not awarding XP automatically */ };
      byId('pp_close').onclick=()=>{ clearInterval(popupTimer); popupEl.remove(); popupEl=null; };
    }
    byId('pp_title').textContent = popupTask;
    byId('pp_time').textContent = fmt(popupSeconds);
    clearInterval(popupTimer);
    popupTimer = setInterval(()=>{
      if(popupPaused) return;
      popupSeconds--;
      byId('pp_time').textContent = fmt(popupSeconds);
      if(popupSeconds<=0){ clearInterval(popupTimer); }
    },1000);
  };
})();

/* -------------------- 4) Calculator robust open/close -------------------- */
(function fixCalc(){
  const modal = byId('calcModal'), box = byId('calcBox');
  if(!modal || !box) return;
  modal.addEventListener('click', (e)=>{ if(e.target===modal) modal.classList.remove('show'); });
  // Provide a global opener if not present
  window.openCalc = window.openCalc || function(){ modal.classList.add('show'); };
})();

/* -------------------- 5) Race Mode (offline sync; Firebase-ready) -------------------- */
/**
 * SyncAdapter — abstraction layer. Default uses BroadcastChannel for real-time across tabs.
 * Later, replace with Firebase implementation by keeping the same interface.
 */
class SyncAdapter {
  constructor(code){ this.code = code; this.bc = null; this.handlers = []; }
  connect(){
    this.bc = new BroadcastChannel(`penguin-race-${this.code}`);
    this.bc.onmessage = (ev)=> this.handlers.forEach(h=>h(ev.data));
  }
  send(msg){ if(this.bc) this.bc.postMessage(msg); }
  on(handler){ this.handlers.push(handler); }
  close(){ try{ this.bc && this.bc.close(); }catch{} }
}

/* RaceManager */
const Race = (function(){
  const S = {
    code: null,
    isHost: false,
    adapter: null,
    members: {}, // id -> {name,color,xp,coins}
    me: { id: crypto.randomUUID(), name: App.state.avatar.name, color: App.state.avatar.color, xp: 0, coins: 0 },
    phase: 'idle', // 'focus' | 'break' | 'idle'
    seconds: 0,
    focusMin: 25,
    breakMin: 5,
    timer: null,
    minigameOpen: false,
  };

  function ui(){
    // Build small UI if not present
    if(byId('racePanel')) return;
    const card = document.createElement('div');
    card.className='card';
    card.id='racePanel';
    card.style.maxWidth='780px';
    card.innerHTML = `
      <h2>🏁 Race Mode</h2>
      <div class="row">
        <button id="raceCreate">Create Room</button>
        <input id="raceCode" placeholder="Enter code" style="width:140px">
        <button id="raceJoin" class="ghost">Join Room</button>
        <span id="raceMyCode" class="badge" style="display:none"></span>
      </div>
      <div class="row" style="margin-top:8px;gap:10px">
        <label>Focus <input id="raceFocus" type="number" min="1" value="25" style="width:70px"></label>
        <label>Break <input id="raceBreak" type="number" min="1" value="5" style="width:70px"></label>
        <button id="raceStart" class="ghost">Start Pomodoro</button>
        <button id="raceStop" class="ghost">Stop</button>
      </div>
      <div style="margin:10px 0;font-size:20px"><b id="racePhase">Idle</b> • <span id="raceTime">--:--</span></div>
      <div id="raceMembers" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px"></div>
      <div style="margin-top:12px">
        <h3>🏆 Leaderboard</h3>
        <ul id="raceBoard"></ul>
      </div>
    `;
    qs('.container').appendChild(card);

    byId('raceCreate').onclick = createRoom;
    byId('raceJoin').onclick   = joinRoom;
    byId('raceStart').onclick  = ()=>{ if(!S.isHost) return alert('Only host can start'); startFocus(); };
    byId('raceStop').onclick   = endRace;
  }

  function createRoom(){
    S.code = (Math.random().toString(36).slice(2,7)).toUpperCase();
    S.isHost = true;
    S.adapter = new SyncAdapter(S.code); S.adapter.connect();
    S.adapter.on(handleMsg);
    byId('raceMyCode').textContent = `Code: ${S.code}`;
    byId('raceMyCode').style.display='inline-block';
    // announce me
    announceJoin();
    renderMembers();
    alert(`Room created. Share code: ${S.code}`);
  }

  function joinRoom(){
    const code = (byId('raceCode').value||'').trim().toUpperCase();
    if(!code) return alert('Enter a code');
    S.code = code; S.isHost = false;
    S.adapter = new SyncAdapter(S.code); S.adapter.connect();
    S.adapter.on(handleMsg);
    announceJoin();
    renderMembers();
    alert(`Joined room ${S.code}`);
  }

  function announceJoin(){
    S.adapter.send({t:'join', payload:{ id:S.me.id, name:S.me.name, color:S.me.color }});
    // Add me locally too
    S.members[S.me.id] = { name:S.me.name, color:S.me.color, xp:0, coins:0 };
    renderMembers(); renderBoard();
  }

  function handleMsg(msg){
    if(!msg || !msg.t) return;
    if(msg.t==='join'){
      const {id,name,color} = msg.payload;
      S.members[id] = S.members[id] || { name, color, xp:0, coins:0 };
      renderMembers(); renderBoard();
      if(S.isHost){ // send current state to newcomer
        S.adapter.send({t:'state', payload:{ phase:S.phase, seconds:S.seconds, members:S.members, focus:S.focusMin, br:S.breakMin }});
      }
    }
    if(msg.t==='state'){
      const { phase, seconds, members, focus, br } = msg.payload;
      S.phase=phase; S.seconds=seconds; S.members=members; S.focusMin=focus; S.breakMin=br;
      syncTickUI();
      tickTimerClient();
      renderMembers(); renderBoard();
    }
    if(msg.t==='tick'){
      S.phase=msg.payload.phase; S.seconds=msg.payload.seconds;
      syncTickUI();
      if(S.phase==='break' && !S.minigameOpen){ openMinigame(); }
      if(S.phase!=='break' && S.minigameOpen){ closeMinigame(); }
    }
    if(msg.t==='award'){
      const {id,xp} = msg.payload;
      (S.members[id] ||= {name:'?',color:'#999',xp:0,coins:0}).xp += xp;
      renderBoard();
    }
    if(msg.t==='finish'){
      S.phase='idle'; S.seconds=0; syncTickUI(); podium();
      closeMinigame();
    }
  }

  function renderMembers(){
    const wrap = byId('raceMembers'); if(!wrap) return;
    wrap.innerHTML = '';
    Object.entries(S.members).forEach(([id,u])=>{
      const d = document.createElement('div');
      d.style.cssText='background:#0b1220;border:1px solid #24324a;border-radius:12px;padding:8px';
      d.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px">
          <div class="penguin" style="transform:scale(.5);--p:${u.color}">
            <div class="body"></div><div class="wing left"></div><div class="wing right"></div>
            <div class="eye left"></div><div class="eye right"></div><div class="beak"></div>
          </div>
          <div>
            <div><b>${u.name||'Penguin'}</b></div>
            <div class="small">${(u.xp||0).toFixed(2)} XP</div>
          </div>
        </div>
      `;
      wrap.appendChild(d);
    });
  }

  function renderBoard(){
    const ul = byId('raceBoard'); if(!ul) return;
    const arr = Object.entries(S.members).map(([id,u])=>({id,...u}));
    arr.sort((a,b)=>b.xp-a.xp);
    ul.innerHTML = '';
    arr.forEach((u,i)=>{
      const li = document.createElement('li');
      li.textContent = `${i+1}. ${u.name} — ${u.xp.toFixed(2)} XP`;
      ul.appendChild(li);
    });
  }

  function syncTickUI(){
    const t = byId('raceTime'), p = byId('racePhase');
    if(t) t.textContent = S.seconds>0 ? `${String(Math.floor(S.seconds/60)).padStart(2,'0')}:${String(S.seconds%60).padStart(2,'0')}` : '--:--';
    if(p) p.textContent = (S.phase==='focus'?'Focus':S.phase==='break'?'Break':'Idle');
  }

  /* Host drives the time; clients follow via tick messages */
  function startFocus(){
    S.focusMin = parseInt(byId('raceFocus')?.value||'25',10);
    S.breakMin = parseInt(byId('raceBreak')?.value||'5',10);
    S.phase='focus'; S.seconds=S.focusMin*60; syncTickUI();
    clearInterval(S.timer);
    S.timer = setInterval(()=>{
      S.seconds--; S.adapter.send({t:'tick',payload:{phase:S.phase,seconds:S.seconds}});
      syncTickUI();
      if(S.seconds<=0){ startBreak(); }
    },1000);
  }
  function startBreak(){
    S.phase='break'; S.seconds=S.breakMin*60; syncTickUI(); openMinigame();
    clearInterval(S.timer);
    S.timer = setInterval(()=>{
      S.seconds--; S.adapter.send({t:'tick',payload:{phase:S.phase,seconds:S.seconds}});
      syncTickUI();
      if(S.seconds<=0){ startFocus(); closeMinigame(); }
    },1000);
  }
  function endRace(){
    clearInterval(S.timer);
    S.adapter && S.adapter.send({t:'finish'});
    S.phase='idle'; S.seconds=0; syncTickUI(); podium();
    closeMinigame();
  }

  function tickTimerClient(){
    // Clients rely on host ticks; nothing to do except UI
  }

  function awardMe(xp){
    S.members[S.me.id].xp = (S.members[S.me.id].xp||0) + xp;
    S.adapter.send({t:'award',payload:{id:S.me.id,xp}});
    renderBoard();
  }

  /* ----- Minigames: TicTacToe implemented, others stubs ----- */
  let mgOverlay=null, ttState=null;
  function openMinigame(){
    if(mgOverlay) return; S.minigameOpen=true;
    mgOverlay = document.createElement('div');
    mgOverlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.88);display:flex;align-items:center;justify-content:center;z-index:140';
    mgOverlay.innerHTML = `
      <div style="background:#0b1220;border:1px solid #23324a;border-radius:16px;padding:16px;width:520px;max-width:92vw;text-align:center">
        <h3>🎮 Break Minigames (auto-close when break ends)</h3>
        <div class="row" style="justify-content:center;gap:8px;margin:8px 0 12px">
          <button id="mg_ttt">Tic Tac Toe</button>
          <button class="ghost" disabled>Connect 4</button>
          <button class="ghost" disabled>UNO</button>
          <button class="ghost" disabled>Checkers</button>
          <button class="ghost" disabled>Chess</button>
          <button class="ghost" disabled>Race</button>
        </div>
        <div id="mg_board"></div>
        <div class="small" style="margin-top:8px;color:#93c5fd">You can keep playing until break ends.</div>
      </div>`;
    document.body.appendChild(mgOverlay);
    byId('mg_ttt').onclick = startTTT;
  }
  function closeMinigame(){ if(!mgOverlay) return; mgOverlay.remove(); mgOverlay=null; S.minigameOpen=false; }

  function startTTT(){
    ttState = { b:Array(9).fill(null), turn:'X', win:null };
    renderTTT();
  }
  function renderTTT(){
    const host = byId('mg_board'); if(!host) return;
    host.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(3,100px);gap:6px;justify-content:center;margin-top:8px">
        ${ttState.b.map((v,i)=>`<button data-i="${i}" style="height:100px;font-size:36px">${v||''}</button>`).join('')}
      </div>
      <div style="margin-top:8px"><b>${ttState.win?`Winner: ${ttState.win}`:`Turn: ${ttState.turn}`}</b></div>
    `;
    host.querySelectorAll('button[data-i]').forEach(btn=>{
      btn.onclick = ()=>{
        const i = +btn.getAttribute('data-i');
        if(ttState.b[i] || ttState.win) return;
        ttState.b[i] = ttState.turn;
        if(checkWin(ttState.b, ttState.turn)) ttState.win = ttState.turn;
        ttState.turn = ttState.turn==='X'?'O':'X';
        renderTTT();
      };
    });
  }
  function checkWin(b, p){
    const L=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    return L.some(([a,c,d])=>b[a]===p&&b[c]===p&&b[d]===p);
  }

  function podium(){
    // Simple podium modal with top 3
    const arr = Object.values(S.members).map(u=>({...u}));
    arr.sort((a,b)=>b.xp-a.xp);
    const overlay=document.createElement('div');
    overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:145;display:flex;align-items:center;justify-content:center';
    overlay.innerHTML = `
      <div style="background:#0b1220;border:1px solid #24324a;border-radius:16px;padding:16px;width:520px;text-align:center">
        <h3>🏁 Session Finished</h3>
        <ol style="text-align:left">
          ${arr.slice(0,3).map((u,i)=>`<li><b>${i+1}.</b> ${u.name} — ${u.xp.toFixed(2)} XP</li>`).join('')}
        </ol>
        <button id="podiumClose">Close</button>
      </div>`;
    document.body.appendChild(overlay);
    byId('podiumClose').onclick=()=>overlay.remove();
  }

  // Expose a way for your task-complete UI to award points inside a race:
  window.RaceAwardXP = function(xp=0.25){ if(!S.adapter) return; awardMe(xp); };

  // Initialize UI on page load
  safe(ui);

  return { createRoom, joinRoom, awardMe: window.RaceAwardXP };
})();

/* -------------------- 6) Hook “Focus” behavior when Call minimized -------------------- */
/* If you minimize the call and press Focus on a task card, use openPopupPomodoro() */
(function hookFocusButtons(){
  qsa('#taskList li button').forEach(btn=>{
    if(btn.textContent.includes('Focus')){
      btn.addEventListener('click', ()=>{
        const callWin = byId('callWindow');
        if(callWin && callWin.style.display==='flex'){
          // Minimized: open popup pomodoro instead of the overlay one (independent)
          const title = btn.closest('li')?.querySelector('span')?.textContent || 'Focus';
          openPopupPomodoro(title, window.focusMinutes||25);
        }
      });
    }
  });
})();

/* -------------------- 7) Final: ensure header visuals match -------------------- */
(function polishHeader(){
  safe(()=>{ document.title = '🐧 Penguin Companion — XP Planner';
    const h = document.querySelector('h1');
    if(h) h.textContent = '🐧 Penguin Companion — XP Planner';
    updateHeader();
  });
})();
