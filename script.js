/* ============================================================
   Penguin Companion — XP Planner  (v3.2 JS)
   ============================================================ */

(function(){
'use strict';

/* ------------------------------------------------------------
   Helpers
------------------------------------------------------------ */
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const storage = (k,v) => v===undefined ? JSON.parse(localStorage.getItem(k)||'null') : localStorage.setItem(k,JSON.stringify(v));

function fmtTime(sec){
  const m = Math.floor(sec/60).toString().padStart(2,'0');
  const s = Math.floor(sec%60).toString().padStart(2,'0');
  return `${m}:${s}`;
}

/* ------------------------------------------------------------
   State
------------------------------------------------------------ */
let data = storage('penguinData') || {
  xp:0, level:1, coins:0,
  tasks:[], rewards:[], history:[],
  alarms:[], schedule:[], categories:{},
  settings:{theme:'techlab',lang:'en',volume:0.6},
  avatar:{name:'Pingu',color:'purple',head:'none',body:'none',effect:'none'},
  shop:{owned:[],accessories:[],themes:[],effects:[]}
};
let pomodoro = {focus:25, short:5, long:15, mode:'focus', running:false, seconds:1500, timer:null, task:null};
let raceRoom=null; // for Race mode
let miniGameActive=false;

/* ------------------------------------------------------------
   Init
------------------------------------------------------------ */
window.addEventListener('DOMContentLoaded',init);

function init(){
  buildShop(); renderAll();
  bindUI();
  buildScheduleGrid();
  updateNowMarker();
  setInterval(updateNowMarker,60*1000);
}

/* ------------------------------------------------------------
   Render
------------------------------------------------------------ */
function renderAll(){
  renderTasks();
  renderRewards();
  renderStats();
  renderHistory();
  renderAvatar();
  renderShop();
  renderHeader();
}

function renderHeader(){
  $('#levelLabel').textContent = `Level ${data.level}`;
  $('#xpLabel').textContent = `• XP ${data.xp.toFixed(2)}`;
  $('#coinLabel').textContent = `• Coins ${data.coins}`;
  const pct = Math.min(100,(data.xp%100));
  $('#xpProgress').style.width = `${pct}%`;
}

/* ------------------------------------------------------------
   Tasks
------------------------------------------------------------ */
function renderTasks(){
  const list = $('#taskList'); list.innerHTML='';
  data.tasks.forEach((t,i)=>{
    const li = $('#tplTaskItem').content.cloneNode(true);
    li.querySelector('.title').textContent=t.name;
    li.querySelector('.category').textContent=t.category;
    li.querySelector('.xp').textContent=`${t.xp} XP`;
    li.querySelector('.btn-focus').onclick=()=>startFocusTask(i);
    li.querySelector('.btn-complete').onclick=()=>completeTask(i);
    li.querySelector('.btn-delete').onclick=()=>{data.tasks.splice(i,1);save();renderTasks();};
    li.querySelector('.btn-edit').onclick=()=>editTask(i);
    list.appendChild(li);
  });
}
function editTask(i){
  const t=data.tasks[i];
  const n=prompt('Edit task name',t.name);
  if(!n)return;
  t.name=n; save(); renderTasks();
}
function addTask(){
  const name=$('#taskName').value.trim();
  const xp=parseFloat($('#taskXp').value)||1;
  const cat=$('#taskCategory').value;
  if(!name)return;
  data.tasks.push({name,xp,category:cat});
  $('#taskName').value=''; $('#taskXp').value='';
  save(); renderTasks();
}
function startFocusTask(i){
  pomodoro.task=data.tasks[i];
  openPomodoro();
}
function completeTask(i){
  const t=data.tasks[i];
  gainXP(t.xp);
  data.history.push(`${t.name} (${t.category}) +${t.xp}XP`);
  renderHistory(); save();
}

/* ------------------------------------------------------------
   Rewards
------------------------------------------------------------ */
function renderRewards(){
  const list=$('#rewardList'); list.innerHTML='';
  data.rewards.forEach((r,i)=>{
    const li=$('#tplRewardItem').content.cloneNode(true);
    li.querySelector('.title').textContent=r.name;
    li.querySelector('.cost').textContent=`Cost ${r.cost} XP`;
    li.querySelector('.btn-buy').onclick=()=>buyReward(i);
    li.querySelector('.btn-delete').onclick=()=>{data.rewards.splice(i,1);save();renderRewards();};
    li.querySelector('.btn-edit').onclick=()=>editReward(i);
    list.appendChild(li);
  });
}
function addReward(){
  const name=$('#rewardName').value.trim();
  const cost=parseFloat($('#rewardCost').value)||1;
  if(!name)return;
  data.rewards.push({name,cost});
  $('#rewardName').value='';$('#rewardCost').value='';
  save();renderRewards();
}
function editReward(i){
  const r=data.rewards[i];
  const n=prompt('Edit reward',r.name);
  if(!n)return;
  r.name=n; save();renderRewards();
}
function buyReward(i){
  const r=data.rewards[i];
  if(data.xp>=r.cost){
    data.xp-=r.cost;
    alert(`Enjoy your ${r.name}!`);
    save(); renderHeader();
  } else alert('Not enough XP');
}

/* ------------------------------------------------------------
   Stats & History
------------------------------------------------------------ */
function renderStats(){
  const el=$('#statsBars'); el.innerHTML='';
  const cats={};
  data.tasks.forEach(t=>cats[t.category]=(cats[t.category]||0)+1);
  Object.entries(cats).forEach(([k,v])=>{
    const t=$('#tplStatBar').content.cloneNode(true);
    t.querySelector('.stat-label').textContent=`${k}: ${v}`;
    const fill=t.querySelector('.fill');
    fill.style.width=Math.min(100,v*10)+'%';
    el.appendChild(t);
  });
}
function renderHistory(){
  const h=$('#historyList'); h.innerHTML='';
  data.history.slice(-20).reverse().forEach(line=>{
    const li=$('#tplHistoryItem').content.cloneNode(true);
    li.querySelector('.pill').textContent=line;
    h.appendChild(li);
  });
  $('#historySummary').textContent=`Total: ${data.history.length} entries • ${data.xp.toFixed(2)} XP earned`;
}

/* ------------------------------------------------------------
   Pomodoro
------------------------------------------------------------ */
function openPomodoro(){
  $('#pomodoroOverlay').classList.remove('hidden');
  pomodoro.seconds=pomodoro.focus*60;
  updatePomodoroDisplay();
}
function updatePomodoroDisplay(){
  $('#pomTimer').textContent=fmtTime(pomodoro.seconds);
}
function tickPomodoro(){
  if(!pomodoro.running)return;
  pomodoro.seconds--;
  updatePomodoroDisplay();
  $('#miniPomodoroTick').textContent=fmtTime(pomodoro.seconds);
  if(pomodoro.seconds<=0){
    pomodoro.running=false;
    gainXP(1);
    nextPhase();
  }
}
function startPomodoro(){
  pomodoro.running=true;
  clearInterval(pomodoro.timer);
  pomodoro.timer=setInterval(tickPomodoro,1000);
}
function pausePomodoro(){pomodoro.running=false;}
function donePomodoro(){gainXP(1);closePomodoro();}
function closePomodoro(){
  clearInterval(pomodoro.timer);
  pomodoro.running=false;
  $('#pomodoroOverlay').classList.add('hidden');
}
function nextPhase(){
  if(pomodoro.mode==='focus'){
    pomodoro.mode='break';
    pomodoro.seconds=pomodoro.short*60;
  } else {
    pomodoro.mode='focus';
    pomodoro.seconds=pomodoro.focus*60;
  }
  startPomodoro();
}

/* ------------------------------------------------------------
   Calls
------------------------------------------------------------ */
function callPenguin(mode='Study'){
  $('#callOverlay').classList.remove('hidden');
  $('#callMode').textContent=mode;
  $('#callName').textContent=data.avatar.name;
  $('#miniCallBubble').classList.add('hidden');
  renderCallScene(mode);
}
function renderCallScene(mode){
  const stage=$('#callStage');
  stage.innerHTML='';
  const p=document.createElement('div');
  p.className='avatar-3d';
  stage.appendChild(p);
  stage.style.background=({
    Study:'linear-gradient(#0b1220,#1e2b4d)',
    Exercise:'linear-gradient(#0b1220,#003)',
    Eat:'linear-gradient(#2b0b0b,#200)',
    Bath:'linear-gradient(#0b2025,#0b3055)',
    Sleep:'linear-gradient(#01010a,#020025)'
  })[mode]||'#111';
}
function minimizeCall(){
  $('#callOverlay').classList.add('hidden');
  $('#miniCallBubble').classList.remove('hidden');
}
function closeCall(){
  $('#callOverlay').classList.add('hidden');
  $('#miniCallBubble').classList.add('hidden');
}

/* ------------------------------------------------------------
   Alarms
------------------------------------------------------------ */
function renderAlarms(){
  const list=$('#alarmList'); list.innerHTML='';
  data.alarms.forEach((a,i)=>{
    const li=$('#tplAlarmItem').content.cloneNode(true);
    li.querySelector('.time').textContent=a.time;
    li.querySelector('.label').textContent=a.label;
    const t=li.querySelector('.btn-toggle');
    t.textContent=a.on?'On':'Off';
    t.onclick=()=>{a.on=!a.on;save();renderAlarms();};
    li.querySelector('.btn-delete').onclick=()=>{data.alarms.splice(i,1);save();renderAlarms();};
    li.querySelector('.btn-edit').onclick=()=>editAlarm(i);
    li.querySelector('.btn-snooze').onclick=()=>snoozeAlarm(i);
    list.appendChild(li);
  });
}
function addAlarm(){
  const time=$('#alarmTime').value;
  const label=$('#alarmLabel').value||'Alarm';
  const sound=$('#alarmSound').value;
  if(!time)return;
  data.alarms.push({time,label,sound,on:true});
  save(); renderAlarms();
}
function editAlarm(i){
  const a=data.alarms[i];
  const n=prompt('Edit label',a.label);
  if(n)a.label=n;
  save();renderAlarms();
}
function snoozeAlarm(i){
  const a=data.alarms[i];
  const [h,m]=a.time.split(':').map(Number);
  const t=new Date();
  t.setHours(h);t.setMinutes(m+5);
  a.time=`${t.getHours().toString().padStart(2,'0')}:${t.getMinutes().toString().padStart(2,'0')}`;
  save();renderAlarms();
}
setInterval(checkAlarms,1000*20);
function checkAlarms(){
  const now=new Date();
  const hm=`${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
  data.alarms.forEach(a=>{
    if(a.on && a.time===hm){
      playSound(a.sound);
      alert(a.label);
      a.on=false;
    }
  });
  save();
}

/* ------------------------------------------------------------
   Tools
------------------------------------------------------------ */
$('#btnOpenCalc')?.addEventListener('click',()=>$('#calcModal').classList.remove('hidden'));
$('#btnCalcClose')?.addEventListener('click',()=>$('#calcModal').classList.add('hidden'));
$('#btnOpenSearch')?.addEventListener('click',()=>$('#searchModal').classList.remove('hidden'));
$('#btnSearchClose')?.addEventListener('click',()=>$('#searchModal').classList.add('hidden'));
$('#btnSearchGo')?.addEventListener('click',()=>{
  const q=encodeURIComponent($('#searchQuery').value);
  $('#searchFrame').src=`https://duckduckgo.com/?q=${q}`;
});

/* ------------------------------------------------------------
   Schedule
------------------------------------------------------------ */
function buildScheduleGrid(){
  const g=$('#dayGrid');
  for(let h=0;h<24;h++){
    for(let q=0;q<4;q++){
      const slot=document.createElement('div');
      const t=`${h.toString().padStart(2,'0')}:${(q*15).toString().padStart(2,'0')}`;
      slot.className='slot'; slot.dataset.time=t;
      slot.textContent=t;
      g.appendChild(slot);
    }
  }
}
function updateNowMarker(){
  const now=new Date();
  const minutes=now.getHours()*60+now.getMinutes();
  const pct=minutes/(24*60)*100;
  $('#nowMarker').style.top=pct+'%';
}

/* ------------------------------------------------------------
   Shop
------------------------------------------------------------ */
function buildShop(){
  const accs=[
    {name:'Beanie',type:'head',cost:5},
    {name:'Glasses',type:'head',cost:8},
    {name:'Headphones',type:'head',cost:12},
    {name:'Cap',type:'head',cost:10},
    {name:'Crown',type:'head',cost:20},
    {name:'Mask',type:'head',cost:7},
    {name:'Goggles',type:'head',cost:9},
    {name:'Scarf',type:'body',cost:4},
    {name:'Bowtie',type:'body',cost:6},
    {name:'Cape',type:'body',cost:15}
  ];
  data.shop.accessories=accs;
  const grid=$('#shopAccessories'); grid.innerHTML='';
  accs.forEach(a=>{
    const c=$('#tplShopItem').content.cloneNode(true);
    c.querySelector('.name').textContent=a.name;
    const btn=c.querySelector('.btn-buy');
    btn.onclick=()=>buyAccessory(a);
    grid.appendChild(c);
  });
}
function buyAccessory(a){
  if(data.coins>=a.cost){
    data.coins-=a.cost;
    data.shop.owned.push(a.name);
    alert(`Bought ${a.name}!`);
    save(); renderShop();
  }else alert('Not enough coins');
}
function renderShop(){
  $('#coinCount').textContent=data.coins;
  $('#ownedCount').textContent=data.shop.owned.length;
}

/* ------------------------------------------------------------
   Avatar
------------------------------------------------------------ */
function renderAvatar(){
  $('#avatarNameInline').textContent=data.avatar.name;
  $('#avatarPreview').style.background=avatarColor(data.avatar.color);
}
function avatarColor(c){
  const map={blue:'#4c8bf5',red:'#f55454',green:'#33cc7a',purple:'#8155ff',gold:'#e7c156'};
  return `radial-gradient(circle at 30% 30%, ${map[c]||'#8155ff'}, #000)`;
}

/* ------------------------------------------------------------
   XP + Level
------------------------------------------------------------ */
function gainXP(x){
  data.xp+=x;
  if(data.xp>=data.level*100){
    data.level++; data.coins+=5;
    alert('Level up!');
  }
  save(); renderHeader();
}

/* ------------------------------------------------------------
   Race mode (tab sync simulation)
------------------------------------------------------------ */
window.addEventListener('storage',e=>{
  if(e.key==='raceEvent')handleRaceEvent(JSON.parse(e.newValue||'{}'));
});
function broadcastRace(ev){localStorage.setItem('raceEvent',JSON.stringify(ev));}

function openRaceLobby(){ $('#raceLobby').classList.remove('hidden'); }
function closeRaceLobby(){ $('#raceLobby').classList.add('hidden'); }

function createRace(){
  const code=Math.random().toString(36).substr(2,5).toUpperCase();
  raceRoom={code,players:[data.avatar.name]};
  $('#raceCode').textContent=code;
  broadcastRace({type:'create',code,host:data.avatar.name});
}
function joinRace(){
  const code=$('#joinCode').value.trim().toUpperCase();
  broadcastRace({type:'join',code,name:data.avatar.name});
}
function handleRaceEvent(ev){
  if(ev.type==='create'){
    raceRoom={code:ev.code,players:[ev.host]};
    $('#raceCode').textContent=ev.code;
  }
  if(ev.type==='join' && raceRoom && ev.code===raceRoom.code){
    raceRoom.players.push(ev.name);
    renderRaceParticipants();
  }
  if(ev.type==='start' && raceRoom && ev.code===raceRoom.code){
    openRaceArena();
  }
}
function renderRaceParticipants(){
  const ul=$('#raceParticipants'); ul.innerHTML='';
  raceRoom.players.forEach(p=>{
    const li=document.createElement('li'); li.textContent=p; ul.appendChild(li);
  });
}
function startRace(){
  broadcastRace({type:'start',code:raceRoom.code});
  openRaceArena();
}
function openRaceArena(){
  $('#raceArena').classList.remove('hidden');
  $('#raceRoomTag').textContent='Code: '+raceRoom.code;
  buildRacePlayers();
}
function buildRacePlayers(){
  const ul=$('#racePlayerList'); ul.innerHTML='';
  raceRoom.players.forEach(p=>{
    const li=document.createElement('li'); li.textContent=p; ul.appendChild(li);
  });
}
function leaveRace(){
  $('#raceArena').classList.add('hidden');
  raceRoom=null;
}

/* Shared Pomodoro for race */
let racePom={running:false,mode:'focus',seconds:1500,timer:null};
function tickRacePom(){
  if(!racePom.running)return;
  racePom.seconds--;
  $('#raceTimer').textContent=fmtTime(racePom.seconds);
  if(racePom.seconds<=0){
    racePom.running=false;
    if(racePom.mode==='focus'){
      racePom.mode='break';
      racePom.seconds=300;
      startMiniGame();
    }else{
      endMiniGame();
      racePom.mode='focus';
      racePom.seconds=1500;
    }
    racePom.running=true;
  }
}
function startRacePom(){
  racePom.running=true;
  clearInterval(racePom.timer);
  racePom.timer=setInterval(tickRacePom,1000);
}
function pauseRacePom(){racePom.running=false;}
function resetRacePom(){racePom.seconds=1500;$('#raceTimer').textContent='25:00';}

/* Mini-games simulation */
function startMiniGame(){
  const a=$('#miniGameArea');
  a.classList.remove('hidden');
  a.innerHTML='<h3>🎮 Break Mini-Game: Connect 4 (demo)</h3><p>Relax! Game auto-closes in 5 min.</p>';
  miniGameActive=true;
}
function endMiniGame(){
  const a=$('#miniGameArea');
  a.classList.add('hidden');
  a.innerHTML='';
  miniGameActive=false;
}

/* ------------------------------------------------------------
  
