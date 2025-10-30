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

// ========== Avatar ====
/*$('#saveAvatar').onclick = () => {
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
*/
// ========== Tasks ==========
/*$('#addTask').onclick = () => {
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
}*/

/* ---------- Utilities ---------- */
function shade(hex,p){const c=parseInt(hex.slice(1),16);let r=(c>>16)&255,g=(c>>8)&255,b=c&255;
r=Math.min(255,Math.max(0,r+Math.round(255*p/100)));
g=Math.min(255,Math.max(0,g+Math.round(255*p/100)));
b=Math.min(255,Math.max(0,b+Math.round(255*p/100)));
return '#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);}
const toMin=t=>{const[h,m]=t.split(":").map(Number);return h*60+m;};
const fromMin=m=>`${String(Math.floor(m/60)).padStart(2,"0")}:${String(m%60).padStart(2,"0")}`;

/* ---------- Persistent State /DATA---------- */
let exp=parseFloat(localStorage.getItem("exp"))||0;
let coins=parseFloat(localStorage.getItem("coins"))||0;
let tasks=JSON.parse(localStorage.getItem("tasks")||"[]");
let rewards=JSON.parse(localStorage.getItem("rewards")||"[]");
let categories=JSON.parse(localStorage.getItem("categories")||"[]"); if(!categories.length) categories=["Self-Care","Study","Work","Other"];
let categoryCounts=JSON.parse(localStorage.getItem("categoryCounts")||"{}");
let history=JSON.parse(localStorage.getItem("history"))||{};
let history=JSON.parse(localStorage.getItem("history")||"{}");const today=new Date().toISOString().slice(0,10);if(!history[today])history[today]=[];
if(!history[today])history[today]=[];

let focusMinutes=parseInt(localStorage.getItem("focusMinutes"))||25;
let breakMinutes=parseInt(localStorage.getItem("breakMinutes"))||5;
let longBreakMinutes=parseInt(localStorage.getItem("longBreakMinutes"))||15;
let autoStartNext=(localStorage.getItem("autoStartNext")==="1");

let avatar=JSON.parse(localStorage.getItem("avatar"))||{name:"Pingu",color:"#0ea5e9"};
let ownedItems=JSON.parse(localStorage.getItem("ownedItems")||"{}");
let equipped=JSON.parse(localStorage.getItem("equipped")||"{\"head\":\"\",\"body\":\"\",\"effect\":\"\"}");
let equippedTheme=localStorage.getItem("equippedTheme")||"tech"; // tech/arctic/sunset/space

let daySchedule=JSON.parse(localStorage.getItem("daySchedule")||"[]");
let alarms=JSON.parse(localStorage.getItem("alarms")||"[]");

let ambientOn=(localStorage.getItem("ambientOn")==="1");
let ambientVol=parseInt(localStorage.getItem("ambientVol")||"40");

/* ---------- Elements ---------- */
const expEl=document.getElementById("exp"), lvlEl=document.getElementById("level"), coinsEl=document.getElementById("coins");
const progressBar=document.getElementById("progressBar");
const taskList=document.getElementById("taskList"), rewardList=document.getElementById("rewardList");
const taskCat=document.getElementById("taskCat");
const penguinPreview=document.getElementById("penguinPreview");
const avatarNameSpan=document.getElementById("avatarName");
const nameInput=document.getElementById("nameInput");
const chips=[...document.querySelectorAll('.chip')];
const equipHead=document.getElementById("equipHead"), equipBody=document.getElementById("equipBody"), equipEffect=document.getElementById("equipEffect");
const overlay=document.getElementById("pomodoroOverlay"), titleDisplay=document.getElementById("pomoTaskTitle"), phaseText=document.getElementById("phaseText");
const focusCircle=document.getElementById("focusCircle"), breakCircle=document.getElementById("breakCircle"), timerDisplay=document.getElementById("pomodoroTimer");
const scene=document.getElementById("scene");
const callOverlay=document.getElementById("callOverlay"), callTitle=document.getElementById("callTitle"), sceneCall=document.getElementById("sceneCall");
const callWindow=document.getElementById("callWindow"), callHeader=document.getElementById("callHeader");
const callPenguin=document.getElementById("callPenguin"), callCaption=document.getElementById("callCaption");
const callAmbientToggle=document.getElementById("callAmbientToggle"), callAmbientVolume=document.getElementById("callAmbientVolume");
const snd={Study: sndStudy,Exercise: sndExercise,Eat: sndEat,Bath: sndBath,Sleep: sndSleep,Chill: sndChill}, bell=bellSound, ambient=ambientLab;
const ambientToggle=document.getElementById("ambientToggle"), ambientVolume=document.getElementById("ambientVolume");
const gearBtn=document.getElementById("gearBtn"), settingsOverlay=document.getElementById("settingsOverlay");
const globalThemeSel=document.getElementById("globalTheme");
const setWork=document.getElementById("setWork"), setShort=document.getElementById("setShort"), setLong=document.getElementById("setLong");
const autoNext=document.getElementById("autoNext"), globalVolume=document.getElementById("globalVolume");
const alarmList=document.getElementById("alarmList");
const callPomoTiny=document.getElementById("callPomoTiny");

/* Toast elems */
const toast=document.getElementById("toast");
const toastTitle=document.getElementById("toastTitle");
const toastMsg=document.getElementById("toastMsg");
const toastPenguin=document.getElementById("toastPenguin");

/* ---------- Render / Save ---------- */
function getLevel(){return Math.floor(exp/100)+1;}
function updateProgress(){
  expEl.textContent=exp.toFixed(2);lvlEl.textContent=getLevel();
  coinsEl.textContent=coins.toFixed(2).replace(/\.00$/,'');
  progressBar.style.width=(exp%100)+"%";
}
function saveAll(){
  localStorage.setItem("exp",exp.toFixed(2));
  localStorage.setItem("coins",coins.toString());
  localStorage.setItem("tasks",JSON.stringify(tasks));
  localStorage.setItem("rewards",JSON.stringify(rewards));
  localStorage.setItem("categories",JSON.stringify(categories));
  localStorage.setItem("categoryCounts",JSON.stringify(categoryCounts));
  localStorage.setItem("history",JSON.stringify(history));
  localStorage.setItem("avatar",JSON.stringify(avatar));
  localStorage.setItem("ownedItems",JSON.stringify(ownedItems));
  localStorage.setItem("equipped",JSON.stringify(equipped));
  localStorage.setItem("equippedTheme",equippedTheme);
  localStorage.setItem("daySchedule",JSON.stringify(daySchedule));
  localStorage.setItem("alarms",JSON.stringify(alarms));
  localStorage.setItem("ambientOn",ambientOn?"1":"0");
  localStorage.setItem("ambientVol",String(ambientVol));
  localStorage.setItem("focusMinutes",focusMinutes);
  localStorage.setItem("breakMinutes",breakMinutes);
  localStorage.setItem("longBreakMinutes",longBreakMinutes);
  localStorage.setItem("autoStartNext",autoStartNext?"1":"0");
}
function renderCategories(){taskCat.innerHTML="";categories.forEach(c=>{const o=document.createElement("option");o.value=c;o.textContent=c;taskCat.append(o);});}

/* ---------- Tasks / Rewards ---------- */
function renderTasks(){taskList.innerHTML="";
tasks.forEach((t,i)=>{const li=document.createElement("li");
const left=document.createElement("div");left.style.display="flex";left.style.flexDirection="column";
const title=document.createElement("span");title.className="editable";title.textContent=t.name;title.onclick=()=>editItem(tasks,i,"task");
const meta=document.createElement("span");meta.className="small";meta.textContent=`${t.category||"Uncategorized"} • ${t.xp} XP`;
left.append(title,meta);
const right=document.createElement("div");
const btnFocus=document.createElement("button");btnFocus.textContent="🎮 Focus";btnFocus.onclick=()=>startPomodoro(i);
const btnDone=document.createElement("button");btnDone.textContent="✔";btnDone.onclick=()=>completeTask(i);
const btnDel=document.createElement("button");btnDel.textContent="🗑";btnDel.className="deleteBtn";btnDel.onclick=()=>deleteItem(tasks,i,"task");
right.append(btnFocus,btnDone,btnDel);li.append(left,right);taskList.append(li);});}
function addTask(){const name=document.getElementById("taskName").value.trim();const xp=parseFloat(document.getElementById("taskXP").value);const cat=taskCat.value;
if(!name||isNaN(xp))return alert("Enter task & XP");tasks.push({name,xp,category:cat});document.getElementById("taskName").value="";document.getElementById("taskXP").value="";
saveAll();renderTasks();}
function editItem(list,i,type){const nn=prompt(`Edit ${type} name:`,list[i].name);if(nn&&nn.trim())list[i].name=nn.trim();saveAll();type==="task"?renderTasks():renderRewards();}
function deleteItem(list,i,type){if(confirm(`Delete this ${type}?`)){list.splice(i,1);saveAll();type==="task"?renderTasks():renderRewards();}}
function completeTask(i){
  const before=getLevel();const g=parseFloat(tasks[i].xp);exp+=g;
  const cat=tasks[i].category;categoryCounts[cat]=(categoryCounts[cat]||0)+1;
  if(categoryCounts[cat]%5===0) alert(`👏 ${categoryCounts[cat]} ${cat} tasks completed!`);
  history[today].push({name:tasks[i].name,xp:g,pomodoros:0,category:cat});
  tasks.splice(i,1);
  const after=getLevel();
  if(after>before){const gain=(after-before)*5;coins+=gain;alert(`🏆 Level Up! ${after}! (+${gain} coins)`);}
  saveAll();updateProgress();renderTasks();
}

/* Rewards */
function renderRewards(){rewardList.innerHTML="";
rewards.forEach((r,i)=>{const li=document.createElement("li");const left=document.createElement("div");left.style.display="flex";left.style.flexDirection="column";
const title=document.createElement("span");title.className="editable";title.textContent=r.name;title.onclick=()=>editItem(rewards,i,"reward");
const meta=document.createElement("span");meta.className="small";meta.textContent=`Costs ${r.cost} XP`;left.append(title,meta);
const right=document.createElement("div");const b=document.createElement("button");b.textContent="Buy";b.onclick=()=>redeemReward(i);
const d=document.createElement("button");d.textContent="🗑";d.className="deleteBtn";d.onclick=()=>deleteItem(rewards,i,"reward");right.append(b,d);li.append(left,right);rewardList.append(li);});}
function addReward(){const name=document.getElementById("rewardName").value.trim();const cost=parseFloat(document.getElementById("rewardCost").value);
if(!name||isNaN(cost))return alert("Enter reward & cost");rewards.push({name,cost});document.getElementById("rewardName").value="";document.getElementById("rewardCost").value="";
saveAll();renderRewards();}
function redeemReward(i){const c=parseFloat(rewards[i].cost);if(exp<c)return alert("Not enough XP");exp-=c;saveAll();updateProgress();renderRewards();}

/* ---------- Stats ---------- */
function renderStats(){
  const s=document.getElementById("statsChart");s.innerHTML="";
  const cats=Object.keys(categoryCounts).length?categoryCounts:{Study:38,Work:27,"Self-Care":17,Other:19};
  const total=Object.values(cats).reduce((a,b)=>a+b,0)||1;let idx=0;
  Object.entries(cats).forEach(([k,v])=>{
    const pct=Math.round((v/total)*100);
    const row=document.createElement("div");row.className="statRow";
    row.innerHTML=`<div class="statHeader"><span>${k}</span><span>${pct}%</span></div><div class="statOuter"><div class="statBar"></div><div class="statPct">${pct}%</div></div>`;
    s.append(row);setTimeout(()=>{
      row.querySelector(".statBar").style.width=pct+"%";
      row.querySelector(".statBar").style.background=`linear-gradient(90deg,hsl(${(idx*80)%360} 80% 60%),hsl(${(idx*80+45)%360} 80% 55%))`;
      idx++;
    },80*idx);
  });
}

/* ---------- Planner ---------- */
const wrap=document.getElementById("scheduleWrap"),labels=document.getElementById("timeLabels"),layer=document.getElementById("eventLayer"),
marker=document.getElementById("nowMarker"),pMark=document.getElementById("nowPenguin");const px=1,minsDay=1440;
function buildGrid(){labels.innerHTML="";[...document.querySelectorAll('.gridLine')].forEach(n=>n.remove());const tl=document.getElementById("timeline");
for(let m=0;m<=minsDay;m+=15){const top=m*px,hh=String(Math.floor(m/60)).padStart(2,"0"),mm=String(m%60).padStart(2,"0");
const l=document.createElement("div");l.className="timeLabel";l.style.top=top+"px";if(mm==="00")l.textContent=`${hh}:00`;labels.append(l);
const g=document.createElement("div");g.className="gridLine"+((mm==="15"||mm==="45")?" quarter":"");g.style.top=top+"px";tl.append(g);} }
function addBlock(){const title=(document.getElementById("schedTitle").value||"Task").trim();const s=document.getElementById("schedStart").value;const e=document.getElementById("schedEnd").value;const color=document.getElementById("schedColor").value;
if(!s||!e)return alert("Select start & end");const sm=toMin(s),em=toMin(e);if(em<=sm)return alert("End must be after start");daySchedule.push({title,start:s,end:e,color});saveAll();renderSchedule();}
function addFromTasks(){if(!tasks.length)return alert("No tasks");let cursor=toMin("08:00");tasks.forEach(t=>{const s=cursor-(cursor%15),e=s+60;
daySchedule.push({title:t.name,start:fromMin(Math.min(s,minsDay-15)),end:fromMin(Math.min(e,minsDay)),color:"#60a5fa"});cursor=e;});saveAll();renderSchedule();}
function renderSchedule(){layer.innerHTML="";daySchedule.forEach((b,i)=>{const s=toMin(b.start),e=toMin(b.end);const el=document.createElement("div");el.className="eventBlock";
el.style.top=(s*px)+"px";el.style.height=((e-s)*px)+"px";el.style.background=`linear-gradient(180deg,${b.color},${shade(b.color,-20)})`;el.style.borderColor=shade(b.color,-35);
el.innerHTML=`<div class="eventTitle">${b.title}</div><div class="eventTime">${b.start}–${b.end}</div>`;el.onclick=()=>openModal(i);layer.append(el);});updateMarker();}
let editIndex=-1;function openModal(i){editIndex=i;const b=daySchedule[i];mTitle.value=b.title;mStart.value=b.start;mEnd.value=b.end;mColor.value=b.color;document.getElementById("modal").classList.add("show");}
function closeModal(){document.getElementById("modal").classList.remove("show");}
function saveModal(){if(editIndex<0)return;const t=mTitle.value.trim()||"Task",s=mStart.value,e=mEnd.value,c=mColor.value;if(!s||!e)return alert("Select times");if(toMin(e)<=toMin(s))return alert("End must be after start");
daySchedule[editIndex]={title:t,start:s,end:e,color:c};saveAll();closeModal();renderSchedule();}
function deleteModal(){if(editIndex<0)return;if(!confirm("Delete?"))return;daySchedule.splice(editIndex,1);saveAll();closeModal();renderSchedule();}
function clearSchedule(){if(!confirm("Clear all blocks for today?"))return;daySchedule=[];saveAll();renderSchedule();}
function clearTodayHistory(){if(!confirm("Clear today’s history?"))return;history[today]=[];saveAll();alert("Today’s history cleared.");}
function updateMarker(){const now=new Date(),y=(now.getHours()*60+now.getMinutes())*px;marker.style.top=y+"px";pMark.style.top=y+"px";wrap.scrollTo({top:Math.max(0,y-200),behavior:"smooth"});}setInterval(updateMarker,60000);

/* ---------- Avatar ---------- */
function applyLayer(el,slot,item){
  el.querySelectorAll(`.acc.acc-${slot}`).forEach(n=>n.remove());
  if(!item) return;
  const a=document.createElement('div');a.className=`acc acc-${slot} ${item}`;
  if(slot==="effect"){
    a.classList.add("acc-eff");
    if(item==="aura"){a.style.animation="auraPulse 2.2s infinite ease-in-out";a.style.boxShadow=`0 0 18px 6px ${avatar.color}80, inset 0 0 12px ${avatar.color}66`;}
    if(item==="rainbow"){a.style.animation="auraPulse 1.8s infinite ease-in-out";a.style.boxShadow=`0 0 18px 6px #ff00ff60, inset 0 0 12px #00e1ff66`;a.style.background="conic-gradient(from 0deg, #0ff, #0f0, #ff0, #f0f, #0ff)";a.style.opacity=.35;}
    if(item==="frost"){a.style.animation="auraPulse 2.8s infinite ease-in-out";a.style.boxShadow=`0 0 22px 8px #aaf3ff80, inset 0 0 14px #bdefff66`;a.style.filter="blur(1px)";}
  }
  el.append(a);
}
function applyPenguin(el){
  el.style.setProperty('--p',avatar.color);
  el.style.setProperty('--accent',shade(avatar.color,-18));
  el.querySelectorAll('.acc').forEach(n=>n.remove());
  applyLayer(el,"head",equipped.head);
  applyLayer(el,"body",equipped.body);
  applyLayer(el,"effect",equipped.effect);
}
function saveAvatar(){
  avatar.name=(nameInput.value.trim()||avatar.name);
  avatar.color=currentChipColor||avatar.color;
  equipped.head=equipHead.value;equipped.body=equipBody.value;equipped.effect=equipEffect.value;
  avatarNameSpan.textContent=avatar.name;applyPenguin(penguinPreview);applyPenguin(callPenguin);
  saveAll();alert("Avatar updated!");
}
let currentChipColor=avatar.color;

/* ---------- Shop (Accessories + Themes) ---------- */
const shopItems=[
  // Head
  {key:"beanie",name:"Beanie",cost:15,minLevel:1,slot:"head"},
  {key:"glasses",name:"Glasses",cost:20,minLevel:3,slot:"head"},
  {key:"headphones",name:"Headphones",cost:25,minLevel:5,slot:"head"},
  {key:"cap",name:"Cap",cost:30,minLevel:6,slot:"head"},
  {key:"crown",name:"Crown",cost:50,minLevel:10,slot:"head"},
  {key:"grad",name:"Graduation Cap",cost:40,minLevel:8,slot:"head"},
  {key:"bunny",name:"Bunny Ears",cost:35,minLevel:6,slot:"head"},
  {key:"santa",name:"Santa Hat",cost:25,minLevel:5,slot:"head"},
  // Body
  {key:"scarf",name:"Scarf",cost:10,minLevel:1,slot:"body"},
  {key:"bow",name:"Bowtie",cost:12,minLevel:1,slot:"body"},
  {key:"cape",name:"Cape",cost:60,minLevel:12,slot:"body"},
  {key:"mittens",name:"Mittens",cost:18,minLevel:2,slot:"body"},
  // Effects
  {key:"aura",name:"Aura",cost:80,minLevel:12,slot:"effect"},
  {key:"rainbow",name:"Rainbow Aura",cost:110,minLevel:16,slot:"effect"},
  {key:"frost",name:"Frost Aura",cost:120,minLevel:18,slot:"effect"},
  // Themes
  {key:"theme_tech",name:"Theme: Tech Lab",cost:0,minLevel:1,slot:"theme"},
  {key:"theme_arctic",name:"Theme: Arctic Base",cost:20,minLevel:4,slot:"theme"},
  {key:"theme_sunset",name:"Theme: Sunset Beach",cost:24,minLevel:6,slot:"theme"},
  {key:"theme_space",name:"Theme: Space Nebula",cost:28,minLevel:8,slot:"theme"}
];
ownedItems["theme_tech"]=true;

function renderShop(){
  const grid=document.getElementById("shopGrid");grid.innerHTML="";
  const lvl=getLevel();
  shopItems.forEach(item=>{
    const it=document.createElement("div");it.className="shop-item";
    if(lvl<item.minLevel) it.classList.add("locked");
    const badge=document.createElement("div");badge.className="badgeCorner";badge.textContent=item.slot==="theme"?"Theme":`Lvl ${item.minLevel}`;it.append(badge);

    const thumb=document.createElement("div");thumb.className="thumb";
    if(item.slot!=="theme"){
      const demo=document.createElement("div");demo.className="penguin";demo.style.transform="scale(.55)";
      demo.innerHTML='<div class="body"></div><div class="wing left"></div><div class="wing right"></div><div class="eye left"></div><div class="eye right"></div><div class="beak"></div>';
      const bak={...equipped};const tmp={...equipped};tmp[item.slot]=item.key;
      it.addEventListener("mouseenter",()=>{equipped=tmp;applyPenguin(demo);});
      it.addEventListener("mouseleave",()=>{equipped=bak;applyPenguin(demo);});
      thumb.append(demo);equipped=bak;applyPenguin(demo);
    } else {
      const themeLabel=document.createElement("div");
      themeLabel.style.width="100%";themeLabel.style.height="72px";themeLabel.style.borderRadius="10px";
      themeLabel.style.border="1px solid #1e2e44";themeLabel.style.boxShadow="inset 0 0 12px #00eaff22";
      themeLabel.style.background = themePreviewCss(item.key);
      thumb.append(themeLabel);
      it.addEventListener("mouseenter",()=>{buildSceneWithTheme(themeFromKey(item.key), true);});
      it.addEventListener("mouseleave",()=>{buildSceneWithTheme(equippedTheme, true);});
    }
    it.append(thumb);

    const name=document.createElement("div");name.className="name";name.textContent=item.name;
    const meta=document.createElement("div");meta.className="meta";
    meta.textContent = (item.slot==="theme" ? (ownedItems[item.key]?"Owned":"Theme • "+(item.cost||0)+" coins"): (lvl<item.minLevel?`Unlocks at level ${item.minLevel}`:`Cost: ${item.cost} • Slot: ${item.slot}`));

    const btns=document.createElement("div");btns.className="btns";
    const owned=!!ownedItems[item.key];
    if(item.slot==="theme"){
      const eq=(themeFromKey(item.key)===equippedTheme);
      if(!owned && item.cost>0) btns.append(btn("Buy",()=>buyItem(item)));
      if(owned) btns.append(btn(eq?"Equipped":"Equip",()=>equipTheme(item), eq?"ghost":""));
    } else {
      const eq=(equipped[item.slot]===item.key);
      if(lvl>=item.minLevel){ if(!owned) btns.append(btn("Buy",()=>buyItem(item))); else btns.append(btn(eq?"Equipped":"Equip",()=>equipItem(item),eq?"ghost":"")); }
    }
    if(owned){const o=document.createElement("div");o.className="owned";o.textContent="Owned";it.append(o);}
    it.append(name,meta,btns);
    grid.append(it);
  });
}
function btn(txt,fn,cls){const b=document.createElement("button");b.textContent=txt;b.onclick=fn;if(cls)b.className=cls;return b;}
function buyItem(item){if(coins<item.cost)return alert("Not enough coins!");coins-=item.cost;ownedItems[item.key]=true;saveAll();renderShop();updateProgress();}
function equipItem(item){if(!ownedItems[item.key])return;equipped[item.slot]=item.key;applyPenguin(penguinPreview);applyPenguin(callPenguin);saveAll();renderShop();}
function themeFromKey(key){return key.endsWith("tech")?"tech":key.endsWith("arctic")?"arctic":key.endsWith("sunset")?"sunset":"space";}
function equipTheme(item){if(!ownedItems[item.key])return;equippedTheme=themeFromKey(item.key);saveAll();renderShop();buildSceneWithTheme(equippedTheme,true);}

/* Pomodoro elems */
const overlay=document.getElementById("pomodoroOverlay");
const timerDisplay=document.getElementById("pomodoroTimer");
const titleDisplay=document.getElementById("pomoTaskTitle");
const focusCircle=document.getElementById("focusCircle");
const breakCircle=document.getElementById("breakCircle");
const phaseText=document.getElementById("phaseText");

// ========== Pomodoro ==========
/*let pomoTimer, timeLeft = 0;

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
}*/

/* ---------- Pomodoro (independent) ---------- */
let pomoIndex=null,pomoTimer=null,secondsLeft=0,pomoCount=0,isPaused=false,isBreak=false,cycleCount=0,currentMode="Chill";
function openPomodoroBlank(){
  currentMode="Chill";titleDisplay.textContent="🍅 Pomodoro";
  phaseText.textContent="Focus";overlay.style.display="flex";
  focusCircle.style.display="block";breakCircle.style.display="none";
  secondsLeft=focusMinutes*60;updateTimerDisplay();
  clearInterval(pomoTimer);pomoTimer=setInterval(runPomodoro,1000);
  buildSceneWithTheme(equippedTheme,true);playModeSound("Study"); // ambience
  updateCallTinyTimer(); // sync tiny timer if call visible
}
function startPomodoro(i){
  currentMode="Study";pomoIndex=i;pomoCount=0;secondsLeft=focusMinutes*60;isPaused=false;isBreak=false;
  titleDisplay.textContent=`🍅 Focus: ${tasks[i].name}`;phaseText.textContent="Focus";overlay.style.display="flex";
  focusCircle.style.display="block";breakCircle.style.display="none";
  updateTimerDisplay();clearInterval(pomoTimer);pomoTimer=setInterval(runPomodoro,1000);
  buildSceneWithTheme(equippedTheme,true);playModeSound("Study");
  updateCallTinyTimer();
}
function runPomodoro(){
  if(isPaused)return;secondsLeft--;
  if(secondsLeft<=0){
    clearInterval(pomoTimer);bell.play();
    if(!isBreak){
      pomoCount++;cycleCount++;
      if(cycleCount%4===0) startLongBreak(); else startBreak();
    } else startNextFocus();
  }
  updateTimerDisplay();updateCallTinyTimer();
}
function startBreak(){isBreak=true;secondsLeft=breakMinutes*60;focusCircle.style.display="none";breakCircle.style.display="block";phaseText.textContent="Short break";
  buildSceneWithTheme(equippedTheme,true);playModeSound("Chill"); if(autoStartNext) pResume();}
function startLongBreak(){isBreak=true;secondsLeft=longBreakMinutes*60;focusCircle.style.display="none";breakCircle.style.display="block";phaseText.textContent="Long break";
  buildSceneWithTheme(equippedTheme,true);playModeSound("Chill"); if(autoStartNext) pResume();}
function startNextFocus(){isBreak=false;secondsLeft=focusMinutes*60;focusCircle.style.display="block";breakCircle.style.display="none";phaseText.textContent="Focus";
  buildSceneWithTheme(equippedTheme,true);playModeSound("Study");bell.play(); if(autoStartNext) pResume();}
function pResume(){clearInterval(pomoTimer);pomoTimer=setInterval(runPomodoro,1000);}
function updateTimerDisplay(){const m=Math.floor(secondsLeft/60),s=secondsLeft%60;timerDisplay.textContent=`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;}
function togglePause(){isPaused=!isPaused;pauseModeSound(isPaused);}
function exitPomodoro(){stopAllModeSounds();clearInterval(pomoTimer);overlay.style.display="none";pomoIndex=null;secondsLeft=0;isPaused=false;isBreak=false;updateCallTinyTimer();}
function completePomodoro(){
  clearInterval(pomoTimer);overlay.style.display="none";stopAllModeSounds();if(pomoIndex===null){updateCallTinyTimer();return;}
  const before=getLevel();const done=confirm(`Finish "${tasks[pomoIndex].name}"?\nPomodoros: ${pomoCount}`);
  if(done){
    const xpGain=parseFloat(tasks[pomoIndex].xp);exp+=xpGain;const coinGain=pomoCount*1;coins+=coinGain;
    const cat=tasks[pomoIndex].category;categoryCounts[cat]=(categoryCounts[cat]||0)+1;if(categoryCounts[cat]%5===0) alert(`👏 ${categoryCounts[cat]} ${cat} tasks completed!`);
    const after=getLevel();if(after>before){const lvlCoins=(after-before)*5;coins+=lvlCoins;alert(`🏆 Level Up! ${after}! (+${lvlCoins} coins)`);}
    history[today].push({name:tasks[pomoIndex].name,xp:xpGain,pomodoros:pomoCount,category:cat});tasks.splice(pomoIndex,1);
    alert(`✅ Done in ${pomoCount} Pomodoro(s)! +${xpGain} XP, +${coinGain} coins`);
    saveAll();renderTasks();
  }
  pomoIndex=null;secondsLeft=0;isPaused=false;isBreak=false;updateProgress();updateCallTinyTimer();
}

/* ---------- Calls (independent overlay) ---------- */
let callMode="Chill";
callAmbientToggle.checked = (localStorage.getItem("ambientOn")==="1");
callAmbientVolume.value = localStorage.getItem("ambientVol") || "40";

function startFreeCall(mode){
  callMode=mode||"Chill";
  callTitle.textContent=`📞 ${avatar.name} — ${callMode}`;
  callOverlay.style.display="flex";
  buildCallScene(callMode);
  playModeSound(callMode);
  setupCallAmbientControls();
  updateCallTinyTimer();
}
function closeCallOverlay(){
  callOverlay.style.display="none";
  stopAllModeSounds();
  try{ ambient.pause(); ambient.currentTime=0; }catch{}
}
function minimizeCall(){
  callOverlay.style.display="none";
  callWindow.style.display="flex";
  setPenguinActivity(callPenguin, callMode, false);
  callCaption.textContent=captionFor(callMode);
}
function restoreCall(){
  callWindow.style.display="none";
  callOverlay.style.display="flex";
  buildCallScene(callMode);
  playModeSound(callMode);
  setupCallAmbientControls();
  updateCallTinyTimer();
}
(function(){let drag=false,offX=0,offY=0;callHeader.addEventListener('mousedown',e=>{drag=true;const r=callWindow.getBoundingClientRect();offX=e.clientX-r.left;offY=e.clientY-r.top;document.body.style.userSelect='none';});
window.addEventListener('mousemove',e=>{if(!drag)return;callWindow.style.left=(e.clientX-offX)+'px';callWindow.style.top=(e.clientY-offY)+'px';callWindow.style.right='auto';callWindow.style.bottom='auto';});
window.addEventListener('mouseup',()=>{drag=false;document.body.style.userSelect='';});})();

/* Ambient controls for Pomodoro overlay */
function setupAmbientControls(){
  ambientToggle.checked = ambientOn && equippedTheme==="tech";
  ambientVolume.value = ambientVol;
  ambient.volume = (ambientVol/100)*.2;
  if(ambientOn && equippedTheme==="tech"){
    ambient.play().catch(()=>{});
  } else { try{ambient.pause();ambient.currentTime=0;}catch{} }
}
ambientToggle.addEventListener("change",()=>{ambientOn=ambientToggle.checked;saveAll();setupAmbientControls();});
ambientVolume.addEventListener("input",()=>{ambientVol=parseInt(ambientVolume.value);saveAll();setupAmbientControls();});

/* Ambient controls for CALL overlay */
function setupCallAmbientControls(){
  const on = callAmbientToggle.checked;
  const vol = parseInt(callAmbientVolume.value);
  ambientOn = on; ambientVol = vol; // share same state
  saveAll();
  ambient.volume = (vol/100)*.2;
  if(on && equippedTheme==="tech"){ ambient.play().catch(()=>{}); }
  else { try{ambient.pause();ambient.currentTime=0;}catch{} }
}
callAmbientToggle.addEventListener("change",setupCallAmbientControls);
callAmbientVolume.addEventListener("input",setupCallAmbientControls);

/* Tiny live timer in Call overlay (remaining time) */
function updateCallTinyTimer(){
  if(callOverlay.style.display!=="flex"){callPomoTiny.style.display="none";return;}
  if(pomoTimer && secondsLeft>0){
    const m=Math.floor(secondsLeft/60),s=secondsLeft%60;
    callPomoTiny.textContent=`Pomodoro: ${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")} left`;
    callPomoTiny.style.display="block";
  } else {
    callPomoTiny.style.display="none";
  }
}

/* ---------- Themes & Scene (Pomodoro) ---------- */
function themePreviewCss(key){
  const t=themeFromKey(key);
  if(t==="arctic") return "linear-gradient(180deg,#e0f7ff,#bde9ff)";
  if(t==="sunset") return "linear-gradient(180deg,#ff9966,#8e54e9)";
  if(t==="space") return "radial-gradient(circle at 30% 30%, #3b246b, #0a0a1a)";
  return "linear-gradient(180deg,#031a2e,#083b62)";
}
function clearScene(){while(scene.firstChild)scene.removeChild(scene.firstChild);}
function add(el){scene.appendChild(el);return el;}
function prop(x,y,w,h,bg,br=10){const d=document.createElement('div');d.className='scene-item';Object.assign(d.style,{left:x+"px",top:y+"px",width:w+"px",height:h+"px",background:bg,borderRadius:br+"px"});return d;}
function buildSceneWithTheme(theme, keepActivity){
  clearScene();
  // Base Tech Lab layers for blend
  add(divWithClass("lab-bg"));
  add(divWithClass("lab-circuits"));
  add(divWithClass("lab-pulse"));
  // Penguin in center
  const P=document.createElement('div');P.style.position='absolute';P.style.left='220px';P.style.top='90px';
  const pg=document.createElement('div');pg.className='penguin';
  pg.innerHTML='<div class="body"></div><div class="wing left"></div><div class="wing right"></div><div class="eye left"></div><div class="eye right"></div><div class="beak"></div>';
  P.append(pg);scene.append(P);applyPenguin(pg);
  // Desk for focus
  add(prop(110,160,340,18,"linear-gradient(180deg,#0e233b,#0a1728)",8));
  const glow=prop(120,120,120,40,"radial-gradient(ellipse at left,#00e5ff55,transparent 60%)",10);glow.style.filter='blur(2px)';glow.style.opacity=.7;add(glow);
  // Activity motion
  setPenguinActivity(pg, currentMode || "Chill", true);
  setupAmbientControls();
}
function divWithClass(cls){const d=document.createElement('div');d.className=cls;return d;}
let wingAnimInterval=null;
function setPenguinActivity(el,mode,full){
  clearInterval(wingAnimInterval);
  const L=el.querySelector('.wing.left'),R=el.querySelector('.wing.right'),B=el.querySelector('.body'),E=[...el.querySelectorAll('.eye')];
  let t=0;const amp=full?1:.4;
  wingAnimInterval=setInterval(()=>{t++;
    switch(mode){
      case"Study":L.style.transform=`rotate(${-12+Math.sin(t/3)*3*amp}deg)`;R.style.transform=`rotate(${12-Math.sin(t/3)*3*amp}deg)`;B.style.transform=`translateY(${Math.sin(t/6)*1.5*amp}px)`;break;
      case"Exercise":L.style.transform=`rotate(${-30+Math.sin(t/4)*20*amp}deg)`;R.style.transform=`rotate(${30-Math.sin(t/4)*20*amp}deg)`;B.style.transform=`translateY(${Math.abs(Math.sin(t/5))*6*amp}px)`;break;
      case"Eat":L.style.transform=`rotate(-12deg)`;R.style.transform=`rotate(12deg)`;B.style.transform=`translateY(${Math.abs(Math.sin(t/7))*3*amp}px)`;break;
      case"Bath":L.style.transform=`rotate(${-20+Math.sin(t/4)*12*amp}deg)`;R.style.transform=`rotate(${20-Math.sin(t/4)*12*amp}deg)`;B.style.transform=`translateY(${Math.sin(t/3)*2.5*amp}px)`;break;
      case"Sleep":L.style.transform=`rotate(-12deg)`;R.style.transform=`rotate(12deg)`;B.style.transform=`translateY(${Math.sin(t/12)*1.2*amp}px)`;break;
      default:L.style.transform=`rotate(${-12+Math.sin(t/8)*5*amp}deg)`;R.style.transform=`rotate(${12-Math.sin(t/8)*5*amp}deg)`;B.style.transform=`translateY(${Math.sin(t/10)*2*amp}px)`;
    }
    if(full&&t%120===0){E.forEach(e=>{e.style.height='4px';setTimeout(()=>e.style.height='14px',180);});}
  },50);
}
function captionFor(m){return({Study:"Studying with you…",Exercise:"Let’s move! 💪",Eat:"Snack break 🍣",Bath:"Self-care 🛁",Sleep:"Resting 😴",Chill:"Chilling…"})[m]||"Chilling…";}

/* ---------- CALL Scenes (blended with Tech Lab circuits behind) ---------- */
function buildCallScene(mode){
  // reset
  while(sceneCall.firstChild) sceneCall.removeChild(sceneCall.firstChild);
  // Tech Lab base (blend layer)
  addC(divClass("call-bg")); // plain base
  addC(divClass("call-circuits")); // glowing grid behind
  // Activity gradient foreground (semi-opaque to blend)
  let fg;
  if(mode==="Study") fg="linear-gradient(180deg,rgba(12,26,46,.9),rgba(10,19,48,.9))";
  else if(mode==="Exercise") fg="radial-gradient(circle at 50% 20%, rgba(15,30,54,.9), rgba(7,17,36,.9))";
  else if(mode==="Eat") fg="linear-gradient(180deg,rgba(42,14,26,.9),rgba(53,26,46,.9))";
  else if(mode==="Bath") fg="linear-gradient(180deg,rgba(12,34,48,.9),rgba(11,47,56,.9))";
  else if(mode==="Sleep") fg="radial-gradient(60% 50% at 50% 20%,rgba(27,22,68,.92),rgba(8,9,24,.92))";
  else fg="linear-gradient(180deg,rgba(7,20,32,.9),rgba(10,30,52,.9))";
  addC(callRect(0,0,560,320,fg,0));

  // Penguin
  const P=document.createElement('div');P.style.position='absolute';P.style.left='220px';P.style.top='95px';
  const pg=document.createElement('div');pg.className='penguin';
  pg.innerHTML='<div class="body"></div><div class="wing left"></div><div class="wing right"></div><div class="eye left"></div><div class="eye right"></div><div class="beak"></div>';
  P.append(pg);sceneCall.append(P);applyPenguin(pg);

  // Props per activity (3D-ish)
  if(mode==="Study"){
    addC(callRect(100,200,360,22,`linear-gradient(180deg,${shade(avatar.color,-40)},${shade(avatar.color,-65)})`,8));
    addC(callRect(130,150,120,8,"linear-gradient(180deg,#0ff6,#09c4)",4));
    addC(callRect(310,190,60,8,"linear-gradient(180deg,#fafafa,#c7d2fe)",6));
  }
  if(mode==="Exercise"){
    floor(0,240,560,80,"linear-gradient(180deg,#0c1a2c,#081423)");
    const leftX=180, y=200;
    addC(callRect(leftX-6,y,12,18,"linear-gradient(180deg,#9ca3af,#4b5563)",6));
    addC(callRect(leftX+54,y,12,18,"linear-gradient(180deg,#9ca3af,#4b5563)",6));
    addC(callRect(leftX,y+6,60,6,"linear-gradient(180deg,#6b7280,#374151)",3));
  }
  if(mode==="Eat"){
    addC(callRect(240,210,80,22,"linear-gradient(180deg,#ffd7a6,#f59e0b)",12));
    addC(callRect(315,195,26,6,"linear-gradient(180deg,#d1d5db,#6b7280)",6));
  }
  if(mode==="Bath"){
    addC(callRect(220,210,120,28,"linear-gradient(180deg,#eaf8ff,#a7dfff)",14));
    bubble(230,210);bubble(280,205);bubble(320,215);bubble(265,195);
  }
  if(mode==="Sleep"){
    addC(callRect(210,220,140,20,"linear-gradient(180deg,#3b2c6f,#2d2157)",10));
    addC(callRect(210,210,140,16,"linear-gradient(180deg,#a78bfa,#7c3aed)",10));
    stars();zzz(350,120);zzz(365,100);
  }

  // Motion
  setPenguinActivity(pg, mode, true);
}
function addC(el){sceneCall.appendChild(el);return el;}
function callRect(x,y,w,h,bg,br=10){const d=document.createElement('div');Object.assign(d.style,{position:"absolute",left:x+"px",top:y+"px",width:w+"px",height:h+"px",background:bg,borderRadius:br+"px"});return d;}
function divClass(c){const d=document.createElement("div");d.className=c;return d;}
function floor(x,y,w,h,bg){const f=callRect(x,y,w,h,bg,0);f.style.boxShadow="inset 0 12px 20px rgba(0,0,0,.35)";addC(f);}
function bubble(x,y){const b=callRect(x,y,14,14,"radial-gradient(circle,#bdefff,#7dd3fc)",999);b.style.opacity=.9;b.animate([{transform:"translateY(0)"},{transform:"translateY(-24px)"}],{duration:1800+Math.random()*800,iterations:Infinity});}
function stars(){for(let i=0;i<36;i++){const s=callRect(Math.random()*560,Math.random()*160,2,2,"#c7d2fe",1);s.style.opacity=Math.random();addC(s);}}
function zzz(x,y){const z=document.createElement("div");z.textContent="Z";Object.assign(z.style,{position:"absolute",left:x+"px",top:y+"px",color:"#b4c6ff",fontWeight:"700",opacity:.8});addC(z);
  z.animate([{transform:"translateY(0)",opacity:.8},{transform:"translateY(-14px)",opacity:.2}],{duration:2200,iterations:Infinity});}

/* Sounds */
function stopAllModeSounds(){ Object.values(snd).forEach(a=>{try{a.pause();a.currentTime=0;}catch{}} ); }
function playModeSound(mode){ stopAllModeSounds(); const a=snd[mode]; if(!a) return; a.volume=(globalVolume.value/100)*.2; a.play().catch(()=>{}); }
function pauseModeSound(p){ if(p) Object.values(snd).forEach(a=>a.pause()); else playModeSound(currentMode); }

/* ---------- Tools ---------- */
const calcModal=document.getElementById("calcModal");const calcDisplay=document.getElementById("calcDisplay");let calcExpr="";
function openCalc(){calcModal.classList.add("show");calcDisplay.value=calcExpr;}
function closeCalc(){calcModal.classList.remove("show");}
function calcUpdate(){calcDisplay.value=calcExpr;}
function calcPress(k){if(k==="="){if(!calcExpr.trim())return;try{const safe=calcExpr.replace(/[^0-9+\-*/().]/g,"");calcExpr=String(Function(`"use strict";return (${safe})`)());}catch{calcExpr="Error";}calcUpdate();return;}calcExpr+=k;calcUpdate();}
document.getElementById("calcBtns").addEventListener("click",e=>{const k=e.target.getAttribute("data-k");if(k)calcPress(k);});
document.getElementById("calcClear").addEventListener("click",()=>{calcExpr="";calcUpdate();});
document.getElementById("calcDel").addEventListener("click",()=>{calcExpr=calcExpr.slice(0,-1);calcUpdate();});
const searchModal=document.getElementById("searchModal"),searchInput=document.getElementById("searchInput"),searchFrame=document.getElementById("searchFrame");
function openSearch(){searchModal.classList.add("show");searchInput.focus();if(searchInput.value.trim())triggerSearch();}
function closeSearch(){searchModal.classList.remove("show");}
function triggerSearch(){const q=searchInput.value.trim();if(!q)return;const url="https://www.google.com/search?q="+encodeURIComponent(q);try{searchFrame.src=url;}catch{window.open(url,"_blank");}}
searchInput.addEventListener("keydown",e=>{if(e.key==="Enter")triggerSearch();});

/* ---------- Settings Sidebar ---------- */
gearBtn.onclick=()=>{openSettings();};
function openSettings(){
  settingsOverlay.classList.add("show");
  globalThemeSel.value = equippedTheme;
  setWork.value=focusMinutes;setShort.value=breakMinutes;setLong.value=longBreakMinutes;
  autoNext.checked = autoStartNext;
  globalVolume.value = localStorage.getItem("globalVolume")||"40";
}
function closeSettings(){settingsOverlay.classList.remove("show");}
settingsOverlay.addEventListener("click",e=>{ if(e.target===settingsOverlay) closeSettings(); });
globalThemeSel.addEventListener("change",()=>{
  const pick=globalThemeSel.value;
  equippedTheme = pick; saveAll(); renderShop(); buildSceneWithTheme(equippedTheme,true);
});
[setWork,setShort,setLong].forEach(inp=>inp.addEventListener("change",()=>{
  focusMinutes=parseInt(setWork.value)||25;
  breakMinutes=parseInt(setShort.value)||5;
  longBreakMinutes=parseInt(setLong.value)||15;
  saveAll();
}));
autoNext.addEventListener("change",()=>{autoStartNext=autoNext.checked;saveAll();});
globalVolume.addEventListener("input",()=>{localStorage.setItem("globalVolume",globalVolume.value);});

/* ---------- Alarms ---------- */
function renderAlarms(){alarmList.innerHTML="";alarms.forEach((a,i)=>{const li=document.createElement("li");
li.innerHTML=`<span class="alarm-time">${a.time}</span> <span class="small" style="margin-left:6px">${a.label||""}</span>`;
const box=document.createElement("div");
const toggle=document.createElement("button");toggle.textContent=a.enabled?"On":"Off";toggle.className=a.enabled?"":"ghost";toggle.onclick=()=>{a.enabled=!a.enabled;saveAll();renderAlarms();};
const edit=document.createElement("button");edit.textContent="✎";edit.onclick=()=>editAlarm(i);
const del=document.createElement("button");del.textContent="🗑";del.className="deleteBtn";del.onclick=()=>{alarms.splice(i,1);saveAll();renderAlarms();};
box.append(toggle,edit,del);li.append(box);alarmList.append(li);});}
function addAlarm(){const t=document.getElementById("alarmTime").value,label=document.getElementById("alarmLabel").value.trim();
const tone=document.getElementById("alarmTone").value;if(!t)return alert("Pick a time");
alarms.push({id:Date.now(),time:t,label,tone,enabled:true,lastFired:null});saveAll();renderAlarms();}
function editAlarm(i){const a=alarms[i];const nt=prompt("Time (HH:MM)",a.time);if(!nt)return;const nl=prompt("Label",a.label||"");if(nl===null)return;
let ntone=prompt("Tone (soft|beep|ping)",a.tone);if(!ntone)return;a.time=nt;a.label=nl;a.tone=ntone;saveAll();renderAlarms();}
function checkAlarms(){const now=new Date();const hh=String(now.getHours()).padStart(2,"0");const mm=String(now.getMinutes()).padStart(2,"0");const cur=`${hh}:${mm}`;
alarms.forEach(a=>{if(!a.enabled)return;if(a.time===cur && a.lastFired!==today){a.lastFired=today;saveAll();fireAlarm(a);}});}
setInterval(checkAlarms,15000);
let alarmPlaying=null;
function fireAlarm(a){document.getElementById("alarmPopupMsg").textContent=(a.label||"Alarm!")+" — "+a.time;
document.getElementById("alarmPopup").classList.add("show");stopAlarm();
const m={soft:toneSoft,beep:toneBeep,ping:tonePing}[a.tone]||toneSoft;try{m.currentTime=0;m.loop=true;m.volume=(globalVolume.value/100)*.9;m.play();alarmPlaying=m;}catch{}}
function stopAlarm(){try{if(alarmPlaying){alarmPlaying.pause();alarmPlaying.currentTime=0;alarmPlaying=null;}}catch{} document.getElementById("alarmPopup").classList.remove("show");}

/* ---------- Categories ---------- */
function addCategory(){const name=prompt("New category name:");if(!name)return;categories.push(name.trim());saveAll();renderCategories();}

/* ---------- Economy maintenance ---------- */
function recalcEconomy(){updateProgress();alert("Coins are earned by level-ups (+5) and Pomodoros (+1 each). Current balance kept.");}
function resetToday(){if(!confirm("Reset today only? (schedule + today’s history)"))return;daySchedule=[];history[today]=[];saveAll();renderSchedule();alert("Today reset.");}
function clearAllData(){if(!confirm("This clears ALL data (tasks, rewards, schedule, avatar, shop, alarms). Continue?"))return;
  localStorage.clear();location.reload();}

/* ---------- Init ---------- */
function initAvatarUI(){
  nameInput.value=avatar.name;avatarNameSpan.textContent=avatar.name;
  chips.forEach(ch=>{if(ch.dataset.color===avatar.color)ch.classList.add('active');
    ch.onclick=()=>{chips.forEach(c=>c.classList.remove('active'));ch.classList.add('active');currentChipColor=ch.dataset.color;avatar.color=currentChipColor;applyPenguin(penguinPreview);applyPenguin(callPenguin);};
  });
  equipHead.value=equipped.head||"";equipBody.value=equipped.body||"";equipEffect.value=equipped.effect||"";
  applyPenguin(penguinPreview);applyPenguin(callPenguin);
}
function renderAll(){
  renderCategories();renderTasks();renderRewards();renderStats();renderShop();updateProgress();buildGrid();renderSchedule();updateMarker();renderAlarms();
}
window.onload=()=>{
  document.getElementById("focusInput").value=focusMinutes;
  document.getElementById("breakInput").value=breakMinutes;
  document.getElementById("longBreakInput").value=longBreakMinutes;
  globalVolume.value = localStorage.getItem("globalVolume")||"40";
  initAvatarUI();renderAll();checkAlarms();
  buildSceneWithTheme(equippedTheme,true);
};

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

/* ====================== LEVEL & PROGRESS ====================== */
function getLevel(){return Math.floor(exp/100)+1;}
function getBarColor(l){ if(l<3) return "linear-gradient(90deg,#60a5fa,#3b82f6)";
  if(l<6) return "linear-gradient(90deg,#9333ea,#a855f7)";
  if(l<10) return "linear-gradient(90deg,#f59e0b,#fbbf24)";
  return "linear-gradient(90deg,#facc15,#fcd34d)";
}
function updateProgressBar(){
  const l=getLevel(); const p=(exp%100);
  progressBar.style.width=`${p}%`; progressBar.style.background=getBarColor(l);
  levelDisplay.textContent=l;
}
function saveAll(){
  localStorage.setItem("exp",exp.toFixed(2));
  localStorage.setItem("tasks",JSON.stringify(tasks));
  localStorage.setItem("rewards",JSON.stringify(rewards));
  localStorage.setItem("categories",JSON.stringify(categories));
  localStorage.setItem("categoryCounts",JSON.stringify(categoryCounts));
  localStorage.setItem("history",JSON.stringify(history));
  localStorage.setItem("avatar",JSON.stringify(avatar));
  expDisplay.textContent=exp.toFixed(2);
  updateProgressBar(); renderHistory(); renderStats();
}

/* ====================== TASKS / REWARDS ====================== */
function renderTasks(){
  taskList.innerHTML="";
  tasks.forEach((t,i)=>{
    const li=document.createElement("li");
    const left=document.createElement("div"); left.className="left";
    const title=document.createElement("span"); title.className="editable"; title.textContent=t.name;
    title.onclick=()=>editItem(tasks,i,"task");
    const meta=document.createElement("span"); meta.className="small"; meta.textContent=`${t.category} • ${t.xp} XP`;
    left.append(title,meta);

    const right=document.createElement("div"); right.className="inline-btns";
    const play=b("🎮 Focus",()=>startPomodoro(i));
    const done=b("✔",e=>completeTask(i,e));
    const del=b("🗑️",()=>deleteItem(tasks,i,"task"),"deleteBtn");
    right.append(play,done,del);

    li.append(left,right); taskList.append(li);
  });
}
function renderRewards(){
  rewardList.innerHTML="";
  rewards.forEach((r,i)=>{
    const li=document.createElement("li");
    const left=document.createElement("div"); left.className="left";
    const title=document.createElement("span"); title.className="editable"; title.textContent=r.name;
    title.onclick=()=>editItem(rewards,i,"reward");
    const meta=document.createElement("span"); meta.className="small"; meta.textContent=`Costs ${r.cost} XP`;
    left.append(title,meta);

    const right=document.createElement("div"); right.className="inline-btns";
    const buy=b("Buy",()=>redeemReward(i));
    const del=b("🗑️",()=>deleteItem(rewards,i,"reward"),"deleteBtn");
    right.append(buy,del);

    li.append(left,right); rewardList.append(li);
  });
}
function editItem(list,i,type){
  const nn=prompt(`Edit ${type} name:`,list[i].name);
  if(nn && nn.trim()!==""){ list[i].name=nn.trim(); saveAll(); type==="task"?renderTasks():renderRewards(); }
}
function deleteItem(list,i,type){
  if(confirm(`Delete this ${type}?`)){ list.splice(i,1); saveAll(); type==="task"?renderTasks():renderRewards(); }
}
function addTask(){
  const name=document.getElementById("taskName").value.trim();
  const xp=parseFloat(document.getElementById("taskXP").value);
  const cat=taskCategory.value;
  if(!name || isNaN(xp)) return alert("Enter task and XP");
  tasks.push({name,xp,category:cat});
  document.getElementById("taskName").value=""; document.getElementById("taskXP").value="";
  saveAll(); renderTasks();
}
function addReward(){
  const name=document.getElementById("rewardName").value.trim();
  const cost=parseFloat(document.getElementById("rewardCost").value);
  if(!name || isNaN(cost)) return alert("Enter reward & cost");
  rewards.push({name,cost});
  document.getElementById("rewardName").value=""; document.getElementById("rewardCost").value="";
  saveAll(); renderRewards();
}

/* XP float */
function createXPFloat(xp,e){
  const s=document.createElement("span"); s.className="xp-float"; s.textContent=`+${xp} XP`;
  s.style.color="#facc15"; s.style.fontSize="18px";
  document.body.appendChild(s);
  const r=e.target.getBoundingClientRect(); s.style.left=r.left+r.width/2+"px"; s.style.top=r.top-10+"px";
  setTimeout(()=>s.remove(),1200);
}

/* Complete task */
function completeTask(i,e){
  const before=getLevel(); const g=parseFloat(tasks[i].xp);
  exp+=g; createXPFloat(g,e);
  const cat=tasks[i].category;
  categoryCounts[cat]=(categoryCounts[cat]||0)+1;
  if(categoryCounts[cat]%5===0) showToast(avatar.name,`👏 You’ve completed ${categoryCounts[cat]} ${cat} tasks!`);
  history[today].push({name:tasks[i].name,xp:g,pomodoros:0,category:cat});
  tasks.splice(i,1); saveAll(); renderTasks();
  const after=getLevel(); if(after>before) showToast(avatar.name,`🏆 Level Up! You’re now Level ${after}!`);
}

/* Rewards spend */
function redeemReward(i){
  const c=parseFloat(rewards[i].cost);
  if(exp<c) return alert("Not enough XP!");
  exp-=c; saveAll(); renderRewards();
}

/* ====================== HISTORY & STATS ====================== */
function renderHistory(){
  const data=history[today]||[]; historyList.innerHTML="";
  let totalXP=0,totalPomo=0;
  data.forEach(h=>{
    totalXP+=h.xp; totalPomo+=h.pomodoros;
    const li=document.createElement("li");
    li.textContent=`${h.name} (${h.category||"Uncategorized"}) – ${h.pomodoros} Pomodoro(s) +${h.xp} XP`;
    historyList.append(li);
  });
  historySummary.textContent=`Total: ${totalPomo} Pomodoro${totalPomo!==1?"s":""} • ${totalXP.toFixed(2)} XP earned`;
}
function renderStats(){
  statsChart.innerHTML="";
  const totalCompleted=Object.values(categoryCounts).reduce((a,b)=>a+b,0);
  if(totalCompleted===0){ statsChart.innerHTML="<p class='small'>No tasks completed yet.</p>"; return; }
  // Animated rows
  Object.entries(categoryCounts).forEach(([cat,count],idx)=>{
    const row=document.createElement("div"); row.className="stat-row";
    const label=document.createElement("div"); label.className="stat-label"; label.textContent=`${cat}: ${count}`;
    const bar=document.createElement("div"); bar.className="stat-bar";
    const pct=document.createElement("div"); pct.className="pct"; const p=((count/totalCompleted)*100).toFixed(0);
    pct.textContent=`${p}%`;
    bar.append(pct); row.append(label,bar); statsChart.append(row);
    // Delay for staggered animation
    setTimeout(()=>{ bar.style.width=p+"%"; bar.style.background=`linear-gradient(90deg, hsl(${(idx*60)%360} 90% 60%), hsl(${(idx*60+45)%360} 90% 55%))`; }, 80*idx);
  });
}

/* ====================== AVATAR (Penguin) ====================== */
function applyPenguin(el,color,accessory){
  el.style.setProperty('--p',color);
  el.style.setProperty('--accent',shade(color,-18));
  // remove old accessories
  el.querySelectorAll('.acc').forEach(n=>n.remove());
  if(accessory){
    const a=document.createElement('div'); a.className=`acc ${accessory}`;
    el.appendChild(a);
    if(accessory==='glasses'){ // glasses uses frame over eyes
      a.classList.add('glasses');
    }
  }
}
function saveAvatar(){
  avatar.name=(nameInput.value.trim()||avatar.name);
  avatar.color=currentChipColor||avatar.color;
  avatar.accessory=accessorySelect.value||"";
  avatarNameSpan.textContent=avatar.name;
  applyPenguin(penguinPreview,avatar.color,avatar.accessory);
  applyPenguin(toastPenguin,avatar.color,avatar.accessory);
  applyPenguin(callPenguin,avatar.color,avatar.accessory);
  saveAll();
  showToast(avatar.name,"I’m updated! Let’s crush some tasks 🐧");
}
let currentChipColor=avatar.color;
colorChips.forEach(ch=>{
  if(ch.dataset.color===avatar.color) ch.classList.add('active');
  ch.onclick=()=>{
    colorChips.forEach(c=>c.classList.remove('active'));
    ch.classList.add('active');
    currentChipColor=ch.dataset.color;
    applyPenguin(penguinPreview,currentChipColor,accessorySelect.value);
  };
});
function initAvatar(){
  nameInput.value=avatar.name;
  accessorySelect.value=avatar.accessory||"";
  avatarNameSpan.textContent=avatar.name;
  applyPenguin(penguinPreview,avatar.color,avatar.accessory);
  applyPenguin(toastPenguin,avatar.color,avatar.accessory);
  applyPenguin(callPenguin,avatar.color,avatar.accessory);
}
/* Tiny helpers */
function shade(hex,percent){
  // simple HSL-ish shading
  const c=parseInt(hex.slice(1),16); let r=(c>>16)&255,g=(c>>8)&255,b=c&255;
  r=Math.min(255,Math.max(0, r + Math.round(255*percent/100)));
  g=Math.min(255,Math.max(0, g + Math.round(255*percent/100)));
  b=Math.min(255,Math.max(0, b + Math.round(255*percent/100)));
  return '#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);
}

/* ====================== TOAST ====================== */
let toastTimeout=null;
function showToast(title,msg){
  toastTitle.textContent=title;
  toastMsg.textContent=msg;
  toast.style.display="flex";
  clearTimeout(toastTimeout);
  toastTimeout=setTimeout(()=>{ toast.style.display="none"; }, 3400);
}

/* ====================== POMODORO / CALL ====================== */
let pomoIndex=null,pomoTimer=null,secondsLeft=0,pomoCount=0,isPaused=false,isBreak=false;
let currentCallMode="Chill"; // for free call
function startPomodoro(i){
  currentCallMode="Study";
  pomoIndex=i; pomoCount=0; secondsLeft=focusMinutes*60; isPaused=false; isBreak=false;
  titleDisplay.textContent=`🍅 Focus: ${tasks[i].name}`;
  phaseText.textContent="Focus";
  overlay.style.display="flex";
  focusCircle.style.display="block"; breakCircle.style.display="none";
  updateTimerDisplay();
  clearInterval(pomoTimer); pomoTimer=setInterval(runPomodoro,1000);
  // activity animation
  setPenguinActivity(callPenguin,"Study");
}
function runPomodoro(){
  if(isPaused) return;
  secondsLeft--;
  if(secondsLeft<=0){
    clearInterval(pomoTimer); bell.play();
    if(!isBreak){ pomoCount++; startBreak(); }
    else{ startNextFocus(); }
  }
  updateTimerDisplay();
}
function startBreak(){
  isBreak=true; secondsLeft=breakMinutes*60;
  focusCircle.style.display="none"; breakCircle.style.display="block";
  phaseText.textContent="Short break";
  setPenguinActivity(callPenguin,"Chill");
  pomoTimer=setInterval(runPomodoro,1000);
}
function startNextFocus(){
  isBreak=false; secondsLeft=focusMinutes*60;
  focusCircle.style.display="block"; breakCircle.style.display="none";
  phaseText.textContent="Focus";
  setPenguinActivity(callPenguin,"Study");
  bell.play(); pomoTimer=setInterval(runPomodoro,1000);
}
function updateTimerDisplay(){
  const m=Math.floor(secondsLeft/60),s=secondsLeft%60;
  timerDisplay.textContent=`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}
function togglePause(){ isPaused=!isPaused; }
function exitPomodoro(){
  clearInterval(pomoTimer); overlay.style.display="none";
  // keep floating window if minimized; no changes to tasks/exp
  pomoIndex=null; secondsLeft=0; isPaused=false; isBreak=false;
}
function completePomodoro(){
  clearInterval(pomoTimer); overlay.style.display="none";
  if(pomoIndex===null) return;
  const done=confirm(`Finish "${tasks[pomoIndex].name}"?\nPomodoros: ${pomoCount}`);
  if(done){
    const xpGain=parseFloat(tasks[pomoIndex].xp);
    exp+=xpGain;
    const cat=tasks[pomoIndex].category;
    categoryCounts[cat]=(categoryCounts[cat]||0)+1;
    if(categoryCounts[cat]%5===0) showToast(avatar.name,`👏 You’ve completed ${categoryCounts[cat]} ${cat} tasks!`);
    history[today].push({name:tasks[pomoIndex].name,xp:xpGain,pomodoros:pomoCount,category:cat});
    tasks.splice(pomoIndex,1);
    showToast(avatar.name,`✅ Completed in ${pomoCount} Pomodoro(s)! +${xpGain} XP`);
    saveAll(); renderTasks();
  }
  pomoIndex=null; secondsLeft=0; isPaused=false; isBreak=false;
}

/* Start a free “call” with a selected category animation */
function startFreeCall(mode){
  currentCallMode=mode||"Chill";
  // show fullscreen overlay like a call with controls
  titleDisplay.textContent=`📞 ${avatar.name} — ${mode}`;
  phaseText.textContent=mode;
  secondsLeft=focusMinutes*60; // just show timer if needed
  overlay.style.display="flex"; focusCircle.style.display="block"; breakCircle.style.display="none";
  setPenguinActivity(callPenguin,mode);
  clearInterval(pomoTimer);
}

/* Minimize / Restore / Close call */
function minimizeCall(){
  overlay.style.display="none";
  callWindow.style.display="flex";
  setPenguinActivity(callPenguin,currentCallMode);
  callCaption.textContent=captionFor(currentCallMode);
}
function restoreCall(){
  overlay.style.display="flex";
}
function closeCall(){
  callWindow.style.display="none";
}
function openMeet(){
  // Opens Google Meet “new meeting” shortcut (user grants/uses their account in browser)
  window.open("https://meet.new","_blank");
}

/* Draggable floating window */
(function makeDraggable(){
  let dragging=false,offX=0,offY=0;
  callHeader.addEventListener('mousedown',e=>{
    dragging=true; const r=callWindow.getBoundingClientRect(); offX=e.clientX-r.left; offY=e.clientY-r.top;
    document.body.style.userSelect='none';
  });
  window.addEventListener('mousemove',e=>{
    if(!dragging) return;
    callWindow.style.left=(e.clientX-offX)+'px';
    callWindow.style.top=(e.clientY-offY)+'px';
    callWindow.style.right='auto'; callWindow.style.bottom='auto';
  });
  window.addEventListener('mouseup',()=>{ dragging=false; document.body.style.userSelect=''; });
})();

/* Penguin activity animations (simple wing wiggles / bounce per mode) */
let wingAnimInterval=null;
function setPenguinActivity(el,mode){
  clearInterval(wingAnimInterval);
  const left=el.querySelector('.wing.left'), right=el.querySelector('.wing.right');
  const body=el.querySelector('.body');
  let t=0;
  wingAnimInterval=setInterval(()=>{
    t+=1;
    switch(mode){
      case "Study":
        // subtle typing wiggle
        left.style.transform=`rotate(${-12 + Math.sin(t/3)*3}deg)`;
        right.style.transform=`rotate(${12 - Math.sin(t/3)*3}deg)`;
        body.style.transform=`translateY(${Math.sin(t/6)*1.5}px)`;
        break;
      case "Exercise":
        // jumping jacks
        left.style.transform=`rotate(${-30 + Math.sin(t/4)*20}deg)`;
        right.style.transform=`rotate(${30 - Math.sin(t/4)*20}deg)`;
        body.style.transform=`translateY(${Math.abs(Math.sin(t/5))*6}px)`;
        break;
      case "Eat":
        // little chomp (beak bounce)
        left.style.transform=`rotate(-12deg)`;
        right.style.transform=`rotate(12deg)`;
        body.style.transform=`translateY(${Math.abs(Math.sin(t/7))*3}px)`;
        break;
      case "Bath":
        // splashing
        left.style.transform=`rotate(${-20 + Math.sin(t/4)*12}deg)`;
        right.style.transform=`rotate(${20 - Math.sin(t/4)*12}deg)`;
        body.style.transform=`translateY(${Math.sin(t/3)*2.5}px)`;
        break;
      case "Sleep":
        left.style.transform=`rotate(-12deg)`;
        right.style.transform=`rotate(12deg)`;
        body.style.transform=`translateY(${Math.sin(t/12)*1.2}px)`;
        break;
      default: // Chill
        left.style.transform=`rotate(${-12 + Math.sin(t/8)*5}deg)`;
        right.style.transform=`rotate(${12 - Math.sin(t/8)*5}deg)`;
        body.style.transform=`translateY(${Math.sin(t/10)*2}px)`;
    }
  }, 50);
}
function captionFor(mode){
  return ({
    Study:"Studying with you…",
    Exercise:"Let’s move! 💪",
    Eat:"Snack break 🍣",
    Bath:"Self-care time 🛁",
    Sleep:"Resting 😴",
    Chill:"Chilling…"
  })[mode] || "Chilling…";
}

/* ====================== SETTINGS ====================== */
function saveSettings(){
  focusMinutes=parseInt(document.getElementById("focusInput").value)||25;
  breakMinutes=parseInt(document.getElementById("breakInput").value)||5;
  localStorage.setItem("focusMinutes",focusMinutes);
  localStorage.setItem("breakMinutes",breakMinutes);
  showToast(avatar.name,`Pomodoro set: ${focusMinutes}m focus / ${breakMinutes}m break`);
}

/* ====================== HELPERS ====================== */
function b(label,fn,cls){ const bt=document.createElement("button"); bt.textContent=label; bt.onclick=fn; if(cls) bt.className=cls; return bt; }


// ========== Shop ==========
/* renderShop() {
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
}*/

/* ====================== TOAST ====================== */
let toastTimeout=null;
function showToast(title,msg){
  toastTitle.textContent=title;
  toastMsg.textContent=msg;
  toast.style.display="flex";
  clearTimeout(toastTimeout);
  toastTimeout=setTimeout(()=>{ toast.style.display="none"; }, 3400);
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
