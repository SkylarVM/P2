/* ==========================================================
   Penguin Companion — XP Planner
   Part 3: script.js  (final MVP with Race / Pomodoro Sync)
   ========================================================== */

/* ---------- Utility shortcuts ---------- */
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

/* ---------- Data ---------- */
let xp=parseFloat(localStorage.xp||0);
let coins=parseFloat(localStorage.coins||0);
let avatar=JSON.parse(localStorage.avatar||'{"name":"Pingu","color":"#3b82f6"}');
let tasks=JSON.parse(localStorage.tasks||"[]");
let owned=JSON.parse(localStorage.owned||"[]");
let cats=JSON.parse(localStorage.cats||'["Study","Self-Care","Work"]');

/* ---------- XP + Coins ---------- */
function saveAll(){
  localStorage.xp=xp; localStorage.coins=coins;
  localStorage.avatar=JSON.stringify(avatar);
  localStorage.tasks=JSON.stringify(tasks);
  localStorage.owned=JSON.stringify(owned);
}
function updateHeader(){
  $("xpBar").style.width=`${xp%100}%`;
  $("xpTotal").textContent=xp.toFixed(1);
  $("level").textContent=Math.floor(xp/100)+1;
  $("coinsTotal").textContent=Math.floor(coins);
}

/* ==========================================================
   AVATAR + SHOP
========================================================== */
function ensurePenguinParts(el){
  if(!el.querySelector(".body")){
    el.innerHTML=`<div class="body"></div>
      <div class="wing left"></div><div class="wing right"></div>
      <div class="eye left"></div><div class="eye right"></div><div class="beak"></div>`;
  }
}
function applyPenguin(el,av){
  ensurePenguinParts(el);
  el.style.setProperty("--p",av.color||"#3b82f6");
  el.querySelectorAll(".acc").forEach(x=>x.remove());
  if(av.head){const h=document.createElement("div");h.className=`acc ${av.head}`;el.append(h);}
  if(av.body){const b=document.createElement("div");b.className=`acc ${av.body}`;el.append(b);}
  if(av.effect)el.classList.add(av.effect);
}
applyPenguin($("penguinPreview"),avatar);
updateHeader();

/* ==========================================================
   TASKS
========================================================== */
function renderTasks(){
  const ul=$("taskList"); ul.innerHTML="";
  tasks.forEach((t,i)=>{
    const li=document.createElement("li");
    li.innerHTML=`<div><b>${t.name}</b><br><span class='muted small'>${t.category} • ${t.xp} XP</span></div>
    <div class='row'><button class='btn ghost'>Focus</button>
    <button class='btn'>Done</button></div>`;
    li.querySelectorAll("button")[0].onclick=()=>openCall("Study");
    li.querySelectorAll("button")[1].onclick=()=>{
      xp+=parseFloat(t.xp);coins+=Math.floor(t.xp/5)+1;
      tasks.splice(i,1);saveAll();updateHeader();renderTasks();toast(`${avatar.name}`,`+${t.xp} XP • +${Math.floor(t.xp/5)+1} coins`);
    };
    ul.append(li);
  });
}
$("addTask").onclick=()=>{
  const n=$("taskName").value.trim(),xpv=parseFloat($("taskXP").value)||0,cat=$("taskCategory").value||"General";
  if(!n||xpv<=0)return alert("Enter task + XP");
  tasks.push({name:n,xp:xpv,category:cat}); saveAll(); renderTasks();
  $("taskName").value=$("taskXP").value="";
};
function renderCategories(){
  const s=$("taskCategory"); s.innerHTML="";
  cats.forEach(c=>{const o=document.createElement("option");o.textContent=c;s.append(o);});
}
renderCategories(); renderTasks();

/* ==========================================================
   TOAST
========================================================== */
function toast(t,m){
  $("toastTitle").textContent=t; $("toastMsg").textContent=m;
  applyPenguin($("toastPenguin"),avatar);
  $("toast").classList.remove("hidden");
  clearTimeout(toast._t); toast._t=setTimeout(()=>$("toast").classList.add("hidden"),3000);
}

/* ==========================================================
   CALLS / ANIMATIONS
========================================================== */
const callBg=$("callBg"),callPenguin=$("callPenguin");
const BG={Study:"study",Exercise:"exercise",Eat:"eat",Bath:"bath",Sleep:"sleep",Chill:"study"};
const ICON={Study:"✍️",Exercise:"🏋️",Eat:"🍲",Bath:"🫧",Sleep:"💤"};
function openCall(mode="Chill"){
  $("callOverlay").classList.remove("hidden");
  callBg.className="call-bg "+(BG[mode]||"study");
  $("callAction").textContent=ICON[mode]||"";
  applyPenguin(callPenguin,avatar);
  animatePenguin(callPenguin,mode);
}
function animatePenguin(el,mode){
  const l=el.querySelector(".wing.left"),r=el.querySelector(".wing.right"),b=el.querySelector(".body");
  clearInterval(el._ani);let t=0;
  el._ani=setInterval(()=>{t++;
    const s=Math.sin(t/5);
    if(mode==="Exercise"){l.style.transform=`rotate(${-25+s*20}deg)`;r.style.transform=`rotate(${25-s*20}deg)`;}
    else{l.style.transform=`rotate(${-8+s*4}deg)`;r.style.transform=`rotate(${8-s*4}deg)`;}
    b.style.transform=`translateY(${s*2}px)`;
  },60);
}
$("closeCall").onclick=()=>{$("callOverlay").classList.add("hidden");clearInterval(callPenguin._ani);};
$$(".callMode").forEach(b=>b.onclick=()=>openCall(b.dataset.mode));
$("meetBtn").onclick=()=>window.open("https://meet.new","_blank");

/* ==========================================================
   SHOP
========================================================== */
const ITEMS=[
  {id:"headphones",type:"head",name:"Headphones",price:10,icon:"🎧"},
  {id:"beanie",type:"head",name:"Beanie",price:6,icon:"🧢"},
  {id:"glasses",type:"head",name:"Glasses",price:8,icon:"👓"},
  {id:"scarf",type:"body",name:"Scarf",price:7,icon:"🧣"},
  {id:"aura",type:"effect",name:"Aura",price:12,icon:"✨"},
  {id:"rainbow",type:"effect",name:"Rainbow",price:18,icon:"🌈"},
];
function renderShop(){
  const g=$("shopGrid");g.innerHTML="";$("coinsShop").textContent=Math.floor(coins);
  applyPenguin($("shopPenguin"),avatar);
  ITEMS.forEach(it=>{
    const d=document.createElement("div");d.className="shop-item"+(owned.includes(it.id)?" owned":"");
    d.innerHTML=`<div>${it.icon}</div><div class='small'>${it.name}</div><div class='price'>${it.price}</div>`;
    d.onclick=()=>buyItem(it);
    g.append(d);
  });
}
function buyItem(it){
  if(owned.includes(it.id)){equip(it);toast(avatar.name,`${it.name} equipped!`);return;}
  if(coins<it.price){toast(avatar.name,"Not enough coins");return;}
  coins-=it.price;owned.push(it.id);equip(it);saveAll();renderShop();updateHeader();toast(avatar.name,`Bought ${it.name}!`);
}
function equip(it){
  if(it.type==="head")avatar.head=it.id;
  if(it.type==="body")avatar.body=it.id;
  if(it.type==="effect")avatar.effect=it.id;
  applyPenguin($("penguinPreview"),avatar);saveAll();
}
renderShop();

/* ==========================================================
   EXPORT / IMPORT
========================================================== */
$("exportJSON").onclick=()=>{
  const blob=new Blob([JSON.stringify({xp,coins,tasks,avatar,owned},null,2)],{type:"application/json"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="penguin-data.json";a.click();
};
$("exportCSV").onclick=()=>{
  let csv="Name,XP\n";tasks.forEach(t=>csv+=`${t.name},${t.xp}\n`);
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download="penguin.csv";a.click();
};
$("importFile").onchange=e=>{
  const f=e.target.files[0];if(!f)return;const r=new FileReader();
  r.onload=()=>{try{
    const d=JSON.parse(r.result);
    xp=d.xp||xp;coins=d.coins||coins;tasks=d.tasks||tasks;avatar=d.avatar||avatar;owned=d.owned||owned;
    saveAll();updateHeader();renderTasks();renderShop();toast(avatar.name,"Data imported");
  }catch{alert("Invalid file");}};r.readAsText(f);
};

/* ==========================================================
   RACE — Shared Pomodoro
========================================================== */
const bc=new BroadcastChannel("penguinRace");
let raceRole=null,raceCode=null,participants=[],isHost=false;
let raceTimer=null,seconds=0,phase="focus",paused=false;
let leaderboard={};

/* ----- Race UI Helpers ----- */
function showRaceModal(){ $("raceModal").classList.remove("hidden"); }
function hideRaceModal(){ $("raceModal").classList.add("hidden"); }
$("raceBtn").onclick=showRaceModal; $("closeRaceModal").onclick=hideRaceModal;

/* ----- Create / Join ----- */
$("raceCreate").onclick=()=>{
  raceCode=Math.random().toString(36).slice(2,7).toUpperCase();
  isHost=true;participants=[{name:avatar.name,score:0}];
  $("raceRoomCode").textContent=raceCode;
  $("raceStepChoose").classList.add("hidden");
  $("raceStepHost").classList.remove("hidden");
  bc.postMessage({type:"roomCreated",code:raceCode});
};
$("raceJoin").onclick=()=>{
  const code=$("raceJoinCode").value.trim().toUpperCase();
  if(!code)return alert("Enter code");
  raceCode=code;isHost=false;
  bc.postMessage({type:"joinRequest",code:raceCode,name:avatar.name});
  $("raceStepChoose").classList.add("hidden");
  $("raceStepJoin").classList.remove("hidden");
  $("raceJoinedCode").textContent=code;
};

/* ----- Broadcast Channel Events ----- */
bc.onmessage=e=>{
  const d=e.data;
  if(d.type==="roomCreated")return; // ignore self
  if(d.type==="joinRequest"&&isHost&&d.code===raceCode){
    participants.push({name:d.name,score:0});
    updateParticipants(); bc.postMessage({type:"joinedList",code:raceCode,list:participants});
  }
  if(d.type==="joinedList"&&!isHost&&d.code===raceCode){
    participants=d.list;updateJoinedList();
  }
  if(d.type==="startRace"&&d.code===raceCode){
    hideRaceModal();startRaceTimer(d.seconds||1500,d.phase||"focus");
  }
  if(d.type==="syncTick"&&d.code===raceCode&&!isHost){
    seconds=d.seconds;phase=d.phase;updateRaceTimer();
  }
  if(d.type==="updateBoard"&&d.code===raceCode){
    leaderboard=d.board;updateBoard();
  }
};

/* ----- Host Controls ----- */
function updateParticipants(){
  const ul=$("raceParticipants");ul.innerHTML="";
  participants.forEach(p=>{const li=document.createElement("li");li.textContent=p.name;ul.append(li);});
}
function updateJoinedList(){
  const ul=$("raceParticipantsYou");ul.innerHTML="";
  participants.forEach(p=>{const li=document.createElement("li");li.textContent=p.name;ul.append(li);});
}
$("raceStart").onclick=()=>{
  hideRaceModal();startRaceTimer(1500,"focus");
  bc.postMessage({type:"startRace",code:raceCode,seconds:1500,phase:"focus"});
};
$("raceCloseRoom").onclick=()=>{hideRaceModal();bc.postMessage({type:"roomClosed",code:raceCode});};

/* ==========================================================
   RACE ROOM LOGIC
========================================================== */
function startRaceTimer(sec,ph){
  $("raceRoom").classList.remove("hidden");
  $("rrCode").textContent=raceCode;
  seconds=sec;phase=ph;paused=false;
  leaderboard={};participants.forEach(p=>leaderboard[p.name]=0);
  updateBoard();updateRaceTimer();
  if(isHost){clearInterval(raceTimer);raceTimer=setInterval(tickRace,1000);}
}
function tickRace(){
  if(paused)return;
  seconds--;
  bc.postMessage({type:"syncTick",code:raceCode,seconds,phase});
  updateRaceTimer();
  if(seconds<=0){
    clearInterval(raceTimer);
    if(phase==="focus")startBreak();
    else endRace();
  }
}
function updateRaceTimer(){
  const m=Math.floor(seconds/60),s=seconds%60;
  $("rrTimer").textContent=`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  $("rrPhase").textContent=phase==="focus"?"Focus":"Break";
}
function startBreak(){
  phase="break";seconds=300;updateRaceTimer();
  bc.postMessage({type:"syncTick",code:raceCode,seconds,phase});
  toast("Break","Mini-games unlocked for 5 min!");
  if(isHost)raceTimer=setInterval(tickRace,1000);
  $("rrGames").classList.remove("hidden");
}
function endRace(){
  $("rrGames").classList.add("hidden");
  $("rrPodium").classList.remove("hidden");
  const ol=$("rrPodiumList");ol.innerHTML="";
  const arr=Object.entries(leaderboard).sort((a,b)=>b[1]-a[1]);
  arr.forEach(([n,s])=>{const li=document.createElement("li");li.textContent=`${n} — ${s} XP`;ol.append(li);});
}
$("rrPodiumClose").onclick=()=>{$("rrPodium").classList.add("hidden");$("raceRoom").classList.add("hidden");};
$("rrExit").onclick=()=>{$("raceRoom").classList.add("hidden");clearInterval(raceTimer);};

/* ----- Participant Task Complete ----- */
$("rrMarkDone").onclick=()=>{
  const n=avatar.name;leaderboard[n]=(leaderboard[n]||0)+25;
  xp+=25;coins+=5;saveAll();updateHeader();
  bc.postMessage({type:"updateBoard",code:raceCode,board:leaderboard});
  updateBoard();
};
function updateBoard(){
  const ul=$("rrLeaderboard");ul.innerHTML="";
  Object.entries(leaderboard).forEach(([n,s])=>{
    const li=document.createElement("li");li.textContent=`${n}: ${s}`;ul.append(li);
  });
}

/* ==========================================================
   MINIGAMES (simple placeholders)
========================================================== */
$$(".rr-game").forEach(btn=>{
  btn.onclick=()=>{
    $("rrGameArea").classList.remove("hidden");
    $("rrGameTitle").textContent=btn.textContent;
    const c=$("rrGameCanvas");
    if(btn.dataset.game==="reaction")c.innerHTML="<p>Wait for green then click!</p>";
    if(btn.dataset.game==="tictactoe")c.innerHTML="<p>Tic-Tac-Toe coming soon 🕹️</p>";
    if(btn.dataset.game==="connect4")c.innerHTML="<p>Connect 4 grid mockup 🎮</p>";
  };
});
$("rrCloseGame").onclick=()=>$("rrGameArea").classList.add("hidden");

/* ==========================================================
   INITIALIZATION
========================================================== */
updateHeader();
toast(avatar.name,"Welcome back!");
