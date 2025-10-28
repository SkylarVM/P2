/**********************************************************************
 🐧 Penguin Companion v4.0 — XP Planner
 Compatible with provided index.html & style.css
**********************************************************************/

// ---------- Utility ----------
const $ = (s, all=false) => all ? document.querySelectorAll(s) : document.querySelector(s);
const save = (k,v) => localStorage.setItem(k, JSON.stringify(v));
const load = (k,d) => JSON.parse(localStorage.getItem(k) || JSON.stringify(d));

// ---------- Global State ----------
let state = load("penguin_state", {
  xp: 0,
  coins: 0,
  level: 1,
  theme: "tech",
  sound: "soft",
  lang: "en",
  volume: 40,
  avatar: { name:"Pingu", color:"#0ea5e9", head:"", body:"", effect:"" },
  tasks: [],
  rewards: [],
  history: [],
  alarms: []
});

// ---------- UI Update ----------
function updateHeader(){
  $("#levelLine div").innerHTML =
    `Level ${state.level} • XP ${state.xp.toFixed(2)} • Coins ${state.coins}`;
  const pct = Math.min(100, (state.xp % 100));
  $("#progressBar").style.width = pct + "%";
}
updateHeader();

// ---------- TASKS ----------
$("#addTask").onclick = () => {
  const name = $("#taskInput").value.trim();
  const xp = parseFloat($("#taskXP").value) || 0;
  if(!name) return;
  const t = { id: crypto.randomUUID(), name, xp };
  state.tasks.push(t);
  save("penguin_state", state);
  renderTasks();
};
function renderTasks(){
  const ul = $("#taskList"); ul.innerHTML="";
  state.tasks.forEach(t=>{
    const li=document.createElement("li");
    li.innerHTML = `<span>${t.name} (${t.xp} XP)</span>
    <div>
      <button class="doneBtn">✔️</button>
      <button class="delBtn">🗑️</button>
    </div>`;
    li.querySelector(".doneBtn").onclick=()=>completeTask(t.id);
    li.querySelector(".delBtn").onclick=()=>{ state.tasks=state.tasks.filter(x=>x.id!==t.id); save("penguin_state",state); renderTasks(); };
    ul.appendChild(li);
  });
}
function completeTask(id){
  const t = state.tasks.find(x=>x.id===id);
  if(!t) return;
  state.xp += t.xp;
  state.history.push({ name:t.name, xp:t.xp, date:new Date().toLocaleDateString() });
  state.tasks = state.tasks.filter(x=>x.id!==id);
  if(state.xp>=state.level*100){ state.level++; state.coins+=5; }
  save("penguin_state", state);
  updateHeader(); renderTasks(); renderHistory();
}
renderTasks();

// ---------- REWARDS ----------
$("#addReward").onclick = () => {
  const name = $("#rewardInput").value.trim();
  const cost = parseFloat($("#rewardCost").value)||0;
  if(!name) return;
  const r = { id:crypto.randomUUID(), name, cost };
  state.rewards.push(r); save("penguin_state",state); renderRewards();
};
function renderRewards(){
  const ul=$("#rewardList"); ul.innerHTML="";
  state.rewards.forEach(r=>{
    const li=document.createElement("li");
    li.innerHTML=`<span>${r.name} (${r.cost} XP)</span>
    <div>
      <button class="buyBtn">Buy</button>
      <button class="delBtn">🗑️</button>
    </div>`;
    li.querySelector(".buyBtn").onclick=()=>buyReward(r.id);
    li.querySelector(".delBtn").onclick=()=>{state.rewards=state.rewards.filter(x=>x.id!==r.id);save("penguin_state",state);renderRewards();};
    ul.appendChild(li);
  });
}
function buyReward(id){
  const r=state.rewards.find(x=>x.id===id);
  if(!r) return;
  if(state.xp<r.cost){ alert("Not enough XP!"); return; }
  state.xp-=r.cost;
  alert(`Enjoy your reward: ${r.name}!`);
  save("penguin_state",state); updateHeader();
}
renderRewards();

// ---------- HISTORY ----------
function renderHistory(){
  const d = new Date().toLocaleDateString();
  const list = state.history.filter(h=>h.date===d);
  $("#historyList").innerHTML = list.length ? list.map(h=>`<div>${h.name} +${h.xp} XP</div>`).join("") : "<i>No tasks yet.</i>";
}
renderHistory();

// ---------- AVATAR ----------
function applyPenguin(el){
  if(!el) return;
  const a = state.avatar;
  el.style.setProperty("--p", a.color);
  el.innerHTML = `<div class="body"></div>
    <div class="eye left"></div><div class="eye right"></div><div class="beak"></div>`;
}
function renderAvatar(){
  applyPenguin($("#penguinPreview"));
  $("#avatarNameDisplay").textContent = `Hi, I'm ${state.avatar.name}!`;
  $("#avatarName").value = state.avatar.name;
  $("#avatarColor").value = state.avatar.color;
  $("#avatarHead").value = state.avatar.head;
  $("#avatarBody").value = state.avatar.body;
  $("#avatarEffect").value = state.avatar.effect;
}
renderAvatar();

$("#saveAvatar").onclick = () => {
  state.avatar.name = $("#avatarName").value || "Pingu";
  state.avatar.color = $("#avatarColor").value;
  state.avatar.head = $("#avatarHead").value;
  state.avatar.body = $("#avatarBody").value;
  state.avatar.effect = $("#avatarEffect").value;
  save("penguin_state",state);
  renderAvatar();
};

// ---------- SHOP ----------
const shopItems = [
  {id:"beanie", name:"Beanie", type:"head", cost:10, level:1},
  {id:"glasses", name:"Glasses", type:"head", cost:15, level:3},
  {id:"cap", name:"Cap", type:"head", cost:20, level:6},
  {id:"hoodie", name:"Hoodie", type:"body", cost:25, level:4},
  {id:"cape", name:"Cape", type:"body", cost:30, level:7},
  {id:"aura", name:"Frost Aura", type:"effect", cost:35, level:10},
  {id:"theme-tech", name:"Theme: Tech Lab", type:"theme", cost:0, level:1},
  {id:"theme-sunset", name:"Theme: Sunset Beach", type:"theme", cost:20, level:5},
  {id:"theme-space", name:"Theme: Space", type:"theme", cost:25, level:8},
  {id:"theme-arctic", name:"Theme: Arctic Base", type:"theme", cost:20, level:4}
];

function renderShop(){
  const grid=$("#shopGrid"); grid.innerHTML="";
  shopItems.forEach(it=>{
    const owned = state[it.type+"Owned"]?.includes(it.id);
    const locked = state.level<it.level;
    const div=document.createElement("div");
    div.className="shop-item"+(locked?" locked":"");
    div.innerHTML=`<div><b>${it.name}</b><br>Cost:${it.cost}</div>`;
    const btn=document.createElement("button");
    btn.textContent=owned?"Owned":"Buy";
    btn.disabled=locked || owned;
    btn.onclick=()=>buyItem(it);
    div.appendChild(btn); grid.appendChild(div);
  });
}
function buyItem(it){
  if(state.coins<it.cost){ alert("Not enough coins!"); return; }
  state.coins-=it.cost;
  if(!state[it.type+"Owned"]) state[it.type+"Owned"]=[];
  state[it.type+"Owned"].push(it.id);
  if(it.type==="theme"){ state.theme = it.id.replace("theme-",""); }
  save("penguin_state",state); renderShop(); updateHeader();
}
renderShop();

// ---------- SETTINGS SIDEBAR ----------
$("#settingsBtn").onclick=()=>$("#settingsPanel").classList.toggle("show");

// ---------- CALCULATOR ----------
$("#openCalcBtn").onclick = ()=>$("#calcModal").classList.add("show");
$("#calcModal").onclick = e=>{ if(e.target.id==="calcModal") $("#calcModal").classList.remove("show"); };
const calcDisplay=$("#calcDisplay");
const calcButtons=$("#calcButtons");
"789/456*123-0.=+".split("").forEach(c=>{
  const b=document.createElement("button");
  b.textContent=c;
  b.onclick=()=>{ if(c==="=") calcDisplay.value=eval(calcDisplay.value||"0");
    else calcDisplay.value+=c; };
  calcButtons.appendChild(b);
});

// ---------- SEARCH ----------
$("#openSearchBtn").onclick=()=>$("#searchModal").classList.add("show");
$("#searchModal").onclick=e=>{ if(e.target.id==="searchModal") e.target.classList.remove("show"); };
$("#searchQuery").onchange=e=>{
  const q=encodeURIComponent(e.target.value);
  $("#searchFrame").src=`https://www.google.com/search?q=${q}`;
};

// ---------- EXPORT / IMPORT ----------
$("#exportBtn").onclick=()=>{
  const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="penguin_data.json";
  a.click();
};
$("#exportCsvBtn").onclick=()=>{
  let csv="type,name,xp\n";
  state.history.forEach(h=>{csv+=`task,${h.name},${h.xp}\n`;});
  const blob=new Blob([csv],{type:"text/csv"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="penguin_data.csv";
  a.click();
};
$("#importBtn").onclick=()=>$("#importFile").click();
$("#importFile").onchange=e=>{
  const f=e.target.files[0]; if(!f) return;
  const r=new FileReader();
  r.onload=()=>{ try{state=JSON.parse(r.result); save("penguin_state",state); location.reload();}catch{alert("Invalid file");}};
  r.readAsText(f);
};

// ---------- ALARMS ----------
$("#addAlarmBtn").onclick=()=>{
  const time=prompt("Enter alarm time (HH:MM 24h)");
  if(!time) return;
  state.alarms.push({id:crypto.randomUUID(),time,active:true});
  save("penguin_state",state);
  alert("Alarm set!");
};
setInterval(()=>{
  const now=new Date(); const h=String(now.getHours()).padStart(2,"0"), m=String(now.getMinutes()).padStart(2,"0");
  state.alarms.forEach(a=>{
    if(a.active && a.time===`${h}:${m}`){ alert("⏰ Alarm!"); a.active=false; save("penguin_state",state); }
  });
},60000);

// ---------- THEME ----------
function applyTheme(){
  const t=state.theme;
  document.body.style.background = 
    t==="tech" ? "#0b1220 radial-gradient(circle at top left,rgba(59,130,246,.2),transparent)" :
    t==="sunset" ? "linear-gradient(180deg,#f97316,#9333ea)" :
    t==="space" ? "linear-gradient(180deg,#0f172a,#1e3a8a)" :
    t==="arctic" ? "linear-gradient(180deg,#e0f2fe,#bae6fd)" :
    "#0b1220";
}
applyTheme();

// ---------- RACE MODE (offline multiplayer) ----------
(function raceMode(){
  const section = $("#raceSection");
  section.innerHTML = `
    <h2>🏁 Race Mode</h2>
    <div class="row"><button id="createRace">Create</button><input id="joinCode"><button id="joinRace">Join</button></div>
    <div id="raceStatus"></div>
    <ul id="raceBoard"></ul>
  `;
  const ch = new BroadcastChannel("penguin-race");
  let code=null, isHost=false, timer=null, sec=0, members={};

  $("#createRace").onclick=()=>{
    code=Math.random().toString(36).slice(2,6).toUpperCase();
    isHost=true; members[state.avatar.name]={xp:0};
    $("#raceStatus").textContent=`Room ${code} created`;
  };
  $("#joinRace").onclick=()=>{
    code=$("#joinCode").value.toUpperCase();
    ch.postMessage({t:"join",code,name:state.avatar.name});
  };

  ch.onmessage=(e)=>{
    const msg=e.data;
    if(msg.t==="join" && isHost && msg.code===code){
      members[msg.name]={xp:0};
      ch.postMessage({t:"update",code,members});
      renderBoard();
    }
    if(msg.t==="update" && msg.code===code){ members=msg.members; renderBoard(); }
  };
  function renderBoard(){
    const ul=$("#raceBoard"); ul.innerHTML="";
    Object.entries(members).forEach(([n,v])=>{
      const li=document.createElement("li");
      li.textContent=`${n}: ${v.xp.toFixed(2)} XP`;
      ul.appendChild(li);
    });
  }
})();

console.log("🐧 Penguin Companion v4 loaded successfully.");
