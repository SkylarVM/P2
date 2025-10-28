/* ===================================================
   Penguin Companion — XP Planner  (Final MVP Build)
   =================================================== */

/* ========== GLOBAL STATE ========== */
let exp = parseFloat(localStorage.getItem("xp")) || 0;
let coins = parseFloat(localStorage.getItem("coins")) || 0;
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let rewards = JSON.parse(localStorage.getItem("rewards")) || [];
let categories = JSON.parse(localStorage.getItem("categories")) || ["Study","Self-Care"];
let history = JSON.parse(localStorage.getItem("history")) || {};
let categoryCounts = JSON.parse(localStorage.getItem("categoryCounts")) || {};
let today = new Date().toISOString().slice(0,10);
if(!history[today]) history[today] = [];

let focusMin = parseInt(localStorage.getItem("focusMin")) || 25;
let shortMin = parseInt(localStorage.getItem("shortMin")) || 5;
let longMin  = parseInt(localStorage.getItem("longMin"))  || 15;
let lang = localStorage.getItem("lang") || "en";

let avatar = JSON.parse(localStorage.getItem("avatar")) || {
  name:"Pingu", color:"#3b82f6", head:"", body:"", effect:""
};
let owned = JSON.parse(localStorage.getItem("owned")) || [];

/* ========== ELEMENTS ========== */
const xpBar = document.getElementById("xpBar");
const xpTotal = document.getElementById("xpTotal");
const levelEl = document.getElementById("level");
const coinsTotal = document.getElementById("coinsTotal");
const penguinPreview = document.getElementById("penguinPreview");
const toast = document.getElementById("toast");
const toastTitle = document.getElementById("toastTitle");
const toastMsg = document.getElementById("toastMsg");
const toastPenguin = document.getElementById("toastPenguin");
const bell = document.getElementById("bell");
const ambient = document.getElementById("ambient");

/* ========== INITIALIZE ========== */
window.addEventListener("load", () => {
  renderProgress(); renderTasks(); renderRewards(); renderStats(); renderAvatar();
  renderShop(); renderTimeline(); renderAlarms();
  updateCoins();
});

/* ========== UTILITIES ========== */
function level(){ return Math.floor(exp / 100) + 1; }
function renderProgress(){
  const p = exp % 100;
  xpBar.style.width = `${p}%`;
  xpTotal.textContent = exp.toFixed(2);
  levelEl.textContent = level();
}
function updateCoins(){ coinsTotal.textContent = coins; }

/* XP / Coins Award */
function addXP(amount){ exp += amount; if(exp<0) exp=0; renderProgress(); saveAll(); }
function addCoins(amount){ coins += amount; if(coins<0) coins=0; updateCoins(); saveAll(); }

function saveAll(){
  localStorage.setItem("xp",exp);
  localStorage.setItem("coins",coins);
  localStorage.setItem("tasks",JSON.stringify(tasks));
  localStorage.setItem("rewards",JSON.stringify(rewards));
  localStorage.setItem("categories",JSON.stringify(categories));
  localStorage.setItem("categoryCounts",JSON.stringify(categoryCounts));
  localStorage.setItem("history",JSON.stringify(history));
  localStorage.setItem("avatar",JSON.stringify(avatar));
  localStorage.setItem("owned",JSON.stringify(owned));
}

/* ========== TOAST ========== */
function showToast(title,msg){
  toastTitle.textContent = title; toastMsg.textContent = msg;
  toast.classList.remove("hidden");
  applyPenguin(toastPenguin,avatar.color,avatar.head,avatar.body,avatar.effect);
  clearTimeout(toast.timer);
  toast.timer = setTimeout(()=>toast.classList.add("hidden"),3000);
}

/* ========== TASKS (simplified) ========== */
function renderTasks(){
  const list = document.getElementById("taskList");
  list.innerHTML = "";
  tasks.forEach((t,i)=>{
    const li = document.createElement("li");
    li.innerHTML = `<div>${t.name}</div><div>${t.xp} XP</div>`;
    li.onclick=()=>startPomodoro(t,i);
    list.appendChild(li);
  });
}

/* ========== REWARDS ========== */
function renderRewards(){
  const list = document.getElementById("rewardList");
  list.innerHTML="";
  rewards.forEach((r,i)=>{
    const li=document.createElement("li");
    li.innerHTML=`<div>${r.name}</div><div>${r.cost} XP</div>`;
    li.onclick=()=>redeemReward(i);
    list.appendChild(li);
  });
}
function redeemReward(i){
  const r = rewards[i];
  if(exp < r.cost) return showToast(avatar.name,"Not enough XP!");
  addXP(-r.cost); showToast(avatar.name,`Bought ${r.name}!`);
}

/* ========== HISTORY / STATS ========== */
function renderStats(){
  const chart=document.getElementById("statsChart"); chart.innerHTML="";
  const tot=Object.values(categoryCounts).reduce((a,b)=>a+b,0);
  if(tot===0){chart.innerHTML="<p class='muted small'>No data yet.</p>";return;}
  Object.entries(categoryCounts).forEach(([cat,c],i)=>{
    const bar=document.createElement("div");
    bar.className="stat-bar";
    bar.style.width=`${(c/tot)*100}%`;
    bar.style.background=`hsl(${i*60} 80% 55%)`;
    bar.style.margin="4px 0"; bar.textContent=`${cat}: ${c}`;
    chart.appendChild(bar);
  });
}

/* ========== AVATAR BUILDER ========== */
function renderAvatar(){
  document.getElementById("avatarName").textContent=avatar.name;
  document.getElementById("avatarInput").value=avatar.name;
  applyPenguin(penguinPreview,avatar.color,avatar.head,avatar.body,avatar.effect);
}
function applyPenguin(el,color,head,body,effect){
  el.style.setProperty("--p",color);
  el.querySelectorAll(".acc").forEach(a=>a.remove());
  if(head){ const h=document.createElement("div"); h.className=`acc ${head}`; el.appendChild(h);}
  if(body){ const b=document.createElement("div"); b.className=`acc ${body}`; el.appendChild(b);}
  if(effect){ el.classList.add(effect);} else el.classList.remove("effect");
}
document.getElementById("saveAvatar").onclick=()=>{
  avatar.name=document.getElementById("avatarInput").value||avatar.name;
  avatar.color=document.querySelector(".chip.active")?.dataset.color||avatar.color;
  avatar.head=document.getElementById("headSelect").value;
  avatar.body=document.getElementById("bodySelect").value;
  avatar.effect=document.getElementById("effectSelect").value;
  renderAvatar(); saveAll(); showToast(avatar.name,"Updated!");
};
document.querySelectorAll(".chip").forEach(ch=>{
  ch.onclick=()=>{
    document.querySelectorAll(".chip").forEach(c=>c.classList.remove("active"));
    ch.classList.add("active");
    applyPenguin(penguinPreview,ch.dataset.color,avatar.head,avatar.body,avatar.effect);
  };
});

/* ========== SHOP ========== */
const baseShop = {
  accessories:["scarf","glasses","headphones","bow","beanie","crown","gradcap","bunny","santa","hoodie"],
  themes:["tech","arctic","sunset","midnight"],
  effects:["aura","rainbow","frost","shadow"]
};
function renderShop(){
  fillShop("shopAccessories",baseShop.accessories);
  fillShop("shopThemes",baseShop.themes);
  fillShop("shopEffects",baseShop.effects);
}
function fillShop(id,arr){
  const area=document.getElementById(id); area.innerHTML="";
  arr.forEach(item=>{
    const div=document.createElement("div"); div.className="shop-item";
    if(owned.includes(item)) div.classList.add("owned");
    div.textContent="★";
    div.title=item;
    div.onclick=()=>buyItem(item);
    area.appendChild(div);
  });
}
function buyItem(item){
  const price=10;
  if(owned.includes(item)) return showToast(avatar.name,"Already owned!");
  if(coins<price) return showToast(avatar.name,"Not enough coins!");
  addCoins(-price); owned.push(item); saveAll(); renderShop();
  showToast(avatar.name,`Bought ${item}!`);
}

/* ========== POMODORO (shortened functional) ========== */
let pomoTimer=null,secondsLeft=0,isBreak=false,isPaused=false,currentTask=null;
function startPomodoro(t){
  currentTask=t; secondsLeft=focusMin*60; isBreak=false; isPaused=false;
  document.getElementById("pomoOverlay").classList.remove("hidden");
  document.getElementById("timer").textContent=formatTime(secondsLeft);
  applyPenguin(document.getElementById("pomoPenguin"),avatar.color,avatar.head,avatar.body,avatar.effect);
  clearInterval(pomoTimer); pomoTimer=setInterval(runPomodoro,1000);
}
function runPomodoro(){
  if(isPaused) return;
  secondsLeft--; updateTimer();
  if(secondsLeft<=0){
    clearInterval(pomoTimer); bell.play();
    if(!isBreak){ addXP(currentTask.xp); addCoins(Math.floor(currentTask.xp/5));
      history[today].push({name:currentTask.name,xp:currentTask.xp}); saveAll();
      showToast(avatar.name,`+${currentTask.xp} XP + ${Math.floor(currentTask.xp/5)} Coins!`);
      startBreak();
    }else endPomodoro();
  }
}
function updateTimer(){ document.getElementById("timer").textContent=formatTime(secondsLeft); }
function formatTime(sec){const m=Math.floor(sec/60),s=sec%60;return `${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`;}
function startBreak(){isBreak=true;secondsLeft=shortMin*60;startMiniGame();pomoTimer=setInterval(runPomodoro,1000);}
function endPomodoro(){document.getElementById("pomoOverlay").classList.add("hidden");renderProgress();}

/* ========== MINIGAMES (breaks) ========== */
function startMiniGame(){
  const gm=document.getElementById("gameModal");
  gm.classList.remove("hidden");
  const area=document.getElementById("gameArea");
  area.innerHTML="<p>🎲 Quick memory: click when you see 🐧</p>";
  let shown=false;
  const btn=document.createElement("button");btn.className="btn";btn.textContent="Start";
  area.appendChild(btn);
  btn.onclick=()=>{btn.remove();setTimeout(()=>{
    area.textContent="🐧";shown=true;},Math.random()*3000);
  };
  area.onclick=()=>{if(shown){area.textContent="✅ Great reflex!";setTimeout(()=>gm.classList.add("hidden"),1000);}};
}

/* ========== RACE (multiplayer across tabs) ========== */
const channel=new BroadcastChannel("penguinRace");
let raceCode=null,isHost=false;
document.getElementById("raceBtn").onclick=()=>openRaceLobby();
function openRaceLobby(){document.getElementById("raceLobby").classList.remove("hidden");}
document.getElementById("closeRaceLobby").onclick=()=>document.getElementById("raceLobby").classList.add("hidden");
document.getElementById("createRace").onclick=()=>{
  raceCode=Math.random().toString().slice(2,8);isHost=true;
  document.getElementById("createdCode").textContent=raceCode;
  document.getElementById("createdCodeWrap").style.display="block";
  navigator.clipboard.writeText(raceCode);
  openRaceRoom();
};
document.getElementById("joinRace").onclick=()=>{
  raceCode=document.getElementById("joinCode").value.trim();isHost=false;
  openRaceRoom();channel.postMessage({type:"join",name:avatar.name});
};
function openRaceRoom(){
  document.getElementById("raceLobby").classList.add("hidden");
  document.getElementById("raceRoom").classList.remove("hidden");
  document.getElementById("raceCodeLabel").textContent=raceCode;
  updateRaceList();
}
function updateRaceList(){
  const ul=document.getElementById("raceUsers");
  ul.innerHTML=`<li>${avatar.name}</li>`;
}
document.getElementById("raceClose").onclick=()=>document.getElementById("raceRoom").classList.add("hidden");
channel.onmessage=(e)=>{
  if(e.data.type==="join") addRaceUser(e.data.name);
  if(e.data.type==="updateXP") updateLeaderboard(e.data.name,e.data.xp);
};
function addRaceUser(name){
  const ul=document.getElementById("raceUsers");
  const li=document.createElement("li");li.textContent=name;ul.appendChild(li);
}
function updateLeaderboard(name,xp){
  const ul=document.getElementById("raceBoard");
  const li=document.createElement("li");li.textContent=`${name}: ${xp} XP`;
  ul.appendChild(li);
}

/* ========== IMPORT / EXPORT ========== */
document.getElementById("exportJSON").onclick=()=>{
  const data={exp,coins,tasks,rewards,categories,history,avatar,owned};
  download("penguinData.json",JSON.stringify(data,null,2));
};
document.getElementById("exportCSV").onclick=()=>{
  let csv="Type,Name,Value\n";
  tasks.forEach(t=>csv+=`Task,${t.name},${t.xp}\n`);
  rewards.forEach(r=>csv+=`Reward,${r.name},${r.cost}\n`);
  download("penguinData.csv",csv);
};
document.getElementById("importFile").onchange=e=>{
  const file=e.target.files[0];if(!file)return;
  const r=new FileReader();r.onload=()=>{
    const data=JSON.parse(r.result);
    Object.assign(window,data); saveAll(); location.reload();
  };r.readAsText(file);
};
function download(name,content){
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([content],{type:"text/plain"}));
  a.download=name;a.click();
}

/* ========== SETTINGS ========== */
document.getElementById("openSettings").onclick=()=>document.getElementById("settingsModal").classList.remove("hidden");
document.getElementById("closeSettings").onclick=()=>document.getElementById("settingsModal").classList.add("hidden");
document.getElementById("langSelect").value=lang;
document.getElementById("langSelect").onchange=e=>{
  lang=e.target.value;localStorage.setItem("lang",lang);
  showToast(avatar.name,`Language set to ${lang}`);
};

/* ========== CALLS / MEET ========== */
document.getElementById("callPenguin").onclick=()=>openCall("Chill");
document.querySelectorAll(".callMode").forEach(b=>b.onclick=()=>openCall(b.dataset.mode));
document.getElementById("meetBtn").onclick=()=>window.open("https://meet.new","_blank");
function openCall(mode){
  const win=document.getElementById("callWindow");
  win.classList.remove("hidden");
  applyPenguin(document.getElementById("miniPenguin"),avatar.color,avatar.head,avatar.body,avatar.effect);
  document.getElementById("miniCaption").textContent=mode+" mode";
}
document.getElementById("closeCall").onclick=()=>document.getElementById("callWindow").classList.add("hidden");
document.getElementById("restoreCall").onclick=()=>document.getElementById("pomoOverlay").classList.remove("hidden");

/* ========== ALARMS ========== */
let alarms=JSON.parse(localStorage.getItem("alarms"))||[];
function renderAlarms(){
  const ul=document.getElementById("alarmList");ul.innerHTML="";
  alarms.forEach((a,i)=>{
    const li=document.createElement("li");
    li.textContent=`${a.time} – ${a.label}`;ul.appendChild(li);
  });
}
document.getElementById("addAlarm").onclick=()=>{
  const time=document.getElementById("alarmTime").value;
  const label=document.getElementById("alarmLabel").value||"Alarm";
  const sound=document.getElementById("alarmSound").value;
  if(!time) return;
  alarms.push({time,label,sound});localStorage.setItem("alarms",JSON.stringify(alarms));renderAlarms();
  showToast(avatar.name,`Alarm set for ${time}`);
};

/* ========== TIMELINE (hour blocks) ========== */
let blocks=JSON.parse(localStorage.getItem("blocks"))||[];
function renderTimeline(){
  const tl=document.getElementById("timeline");tl.querySelectorAll(".block").forEach(b=>b.remove());
  blocks.forEach((b,i)=>{
    const div=document.createElement("div");div.className="block";div.textContent=`${b.title} (${b.from}-${b.to})`;
    div.onclick=()=>{if(confirm("Delete block?")){blocks.splice(i,1);saveBlocks();}};
    tl.appendChild(div);
  });
}
function saveBlocks(){localStorage.setItem("blocks",JSON.stringify(blocks));renderTimeline();}
document.getElementById("addBlock").onclick=()=>{
  const title=document.getElementById("blockTitle").value;
  const from=document.getElementById("blockFrom").value;
  const to=document.getElementById("blockTo").value;
  if(!from||!to) return;
  blocks.push({title,from,to});saveBlocks();
};
setInterval(()=>{ // penguin marker move
  const now=document.getElementById("timelineNow");
  const date=new Date();const h=date.getHours()+date.getMinutes()/60;
  now.style.top=`${(h/24)*200}px`;
},60000);
