/* ======= State & Helpers ======= */
const $ = s => document.querySelector(s);
const el = (tag, cls, html) => { const d=document.createElement(tag); if(cls) d.className=cls; if(html!=null) d.innerHTML=html; return d; };
const minToStr = m => `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
const strToMin = t => { const [h,m]=t.split(':').map(Number); return h*60+m; };
const clamp = (x,a,b)=>Math.max(a,Math.min(b,x));
const shade = (hex,p)=>{const c=parseInt(hex.slice(1),16);let r=c>>16,g=(c>>8)&255,b=c&255;const s=q=>Math.min(255,Math.max(0,q+Math.round(255*p/100)));return '#'+((1<<24)+(s(r)<<16)+(s(g)<<8)+s(b)).toString(16).slice(1)};

// persistent
let exp=+localStorage.getItem('exp')||0;
let coins=+localStorage.getItem('coins')||0;
let tasks=JSON.parse(localStorage.getItem('tasks')||'[]');
let rewards=JSON.parse(localStorage.getItem('rewards')||'[]');
let categories=JSON.parse(localStorage.getItem('categories')||'[]'); if(!categories.length) categories=["Self-Care","Study","Work","Other"];
let categoryCounts=JSON.parse(localStorage.getItem('categoryCounts')||'{}');
let daySchedule=JSON.parse(localStorage.getItem('daySchedule')||'[]');
let alarms=JSON.parse(localStorage.getItem('alarms')||'[]');
let ownedItems=JSON.parse(localStorage.getItem('ownedItems')||'{}');
let equipped=JSON.parse(localStorage.getItem('equipped')||'{"head":"","body":"","effect":""}');
let theme=localStorage.getItem('theme')||'tech';
let avatar=JSON.parse(localStorage.getItem('avatar')||'{"name":"Pingu","color":"#0ea5e9"}');
let lang=localStorage.getItem('lang')||'en';
let soundPack=localStorage.getItem('soundPack')||'soft';
let focusMinutes=+(localStorage.getItem('focusMinutes')||25);
let breakMinutes=+(localStorage.getItem('breakMinutes')||5);
let longBreakMinutes=+(localStorage.getItem('longBreakMinutes')||15);
let autoNext=(localStorage.getItem('autoNext')==="1");
let history=JSON.parse(localStorage.getItem('history')||'{}');
const today = new Date().toISOString().slice(0,10);
if(!history[today]) history[today]=[];
ownedItems['theme_tech'] = true; // base theme owned

function saveAll(){
  localStorage.setItem('exp',exp.toFixed(2));
  localStorage.setItem('coins',coins.toString());
  localStorage.setItem('tasks',JSON.stringify(tasks));
  localStorage.setItem('rewards',JSON.stringify(rewards));
  localStorage.setItem('categories',JSON.stringify(categories));
  localStorage.setItem('categoryCounts',JSON.stringify(categoryCounts));
  localStorage.setItem('daySchedule',JSON.stringify(daySchedule));
  localStorage.setItem('alarms',JSON.stringify(alarms));
  localStorage.setItem('ownedItems',JSON.stringify(ownedItems));
  localStorage.setItem('equipped',JSON.stringify(equipped));
  localStorage.setItem('theme',theme);
  localStorage.setItem('avatar',JSON.stringify(avatar));
  localStorage.setItem('lang',lang);
  localStorage.setItem('soundPack',soundPack);
  localStorage.setItem('focusMinutes',focusMinutes);
  localStorage.setItem('breakMinutes',breakMinutes);
  localStorage.setItem('longBreakMinutes',longBreakMinutes);
  localStorage.setItem('autoNext',autoNext?"1":"0");
  localStorage.setItem('history',JSON.stringify(history));
}

/* ======= I18N (EN/ES basic) ======= */
const i18n={
  en:{tasksTitle:"✅ Tasks",rewardsTitle:"🎁 Rewards",statsTitle:"Category Stats",plannerTitle:"Time-Blocking (15-min)",clickBlock:"Click a block to edit or delete.",avatarTitle:"My Penguin",shopTitle:"Penguin Shop",hiIm:"Hi, I’m"},
  es:{tasksTitle:"✅ Tareas",rewardsTitle:"🎁 Recompensas",statsTitle:"Estadísticas por categoría",plannerTitle:"Plan diario (15 min)",clickBlock:"Haz clic en un bloque para editar o borrar.",avatarTitle:"Mi Pingüino",shopTitle:"Tienda del Pingüino",hiIm:"Hola, soy"}
};
function applyLang(){
  document.querySelectorAll('[data-i18n]').forEach(n=>{
    const key=n.getAttribute('data-i18n'); n.textContent=i18n[lang][key];
  });
  $('#avatarName').previousSibling.textContent = i18n[lang].hiIm + ' ';
}

/* ======= Header + Progress ======= */
const level = () => Math.floor(exp/100)+1;
function paintHeader(){
  $('#hdrLevel').textContent=`Level ${level()}`;
  $('#hdrXP').textContent=`XP ${exp.toFixed(2)}`;
  $('#hdrCoins').textContent=`Coins ${coins.toFixed(2).replace(/\.00$/,'')}`;
  $('#xpBar').style.width = (exp%100)+'%';
}

/* ======= Avatar ======= */
const defaultColors=['#0ea5e9','#ef4444','#22c55e','#a855f7','#f59e0b'];
const headItems = ["","beanie","glasses","headphones","cap","crown","grad"];
const bodyItems = ["","scarf","bow","cape","mittens"];
const effectItems = ["","aura","rainbow","frost"];
function penguinApply(el, av=avatar){
  el.style.setProperty('--p',av.color);
  el.style.setProperty('--accent',shade(av.color,-20));
}
function renderAvatarEditors(){
  // inline card
  $('#nameInput').value = avatar.name;
  const wrap = $('#colorChips'); wrap.innerHTML='';
  defaultColors.forEach(c=>{
    const b=el('button','ghost',c);
    b.style.borderColor=c; b.onclick=()=>{avatar.color=c; penguinApply($('#avatarPreview')); penguinApply($('#settingsAvatar')); saveAll();};
    wrap.append(b);
  });
  buildSelect($('#equipHead'), headItems, equipped.head, 'Head: none');
  buildSelect($('#equipBody'), bodyItems, equipped.body, 'Body: none');
  buildSelect($('#equipEffect'), effectItems, equipped.effect, 'Effect: none');

  // settings side
  $('#sName').value = avatar.name;
  const sWrap = $('#sColorChips'); sWrap.innerHTML='';
  defaultColors.forEach(c=>{
    const b=el('button','ghost',c); b.style.borderColor=c;
    b.onclick=()=>{avatar.color=c; penguinApply($('#avatarPreview')); penguinApply($('#settingsAvatar')); saveAll();};
    sWrap.append(b);
  });
  buildSelect($('#sHead'), headItems, equipped.head);
  buildSelect($('#sBody'), bodyItems, equipped.body);
  buildSelect($('#sEffect'), effectItems, equipped.effect);
  penguinApply($('#avatarPreview')); penguinApply($('#settingsAvatar'));
  $('#avatarName').textContent=avatar.name;
}
function buildSelect(sel, arr, val, label){
  sel.innerHTML='';
  if(label){ sel.append(new Option(label,'')); }
  arr.forEach(x=>sel.append(new Option(x?x:'—',x)));
  sel.value = val||'';
}
$('#btnSaveAvatar').onclick = saveAvatarInline;
$('#btnSaveSettingsAvatar').onclick = saveAvatarInline;
function saveAvatarInline(){
  avatar.name = $('#nameInput').value || $('#sName').value || avatar.name;
  equipped.head = $('#equipHead').value || $('#sHead').value || '';
  equipped.body = $('#equipBody').value || $('#sBody').value || '';
  equipped.effect = $('#equipEffect').value || $('#sEffect').value || '';
  $('#avatarName').textContent = avatar.name;
  penguinApply($('#avatarPreview')); penguinApply($('#settingsAvatar')); penguinApply($('#miniPenguin'));
  saveAll();
  alert('Avatar updated!');
}

/* ======= Tasks / Rewards ======= */
function renderCategories(){
  const sel=$('#taskCat'); sel.innerHTML='';
  categories.forEach(c=> sel.append(new Option(c,c)));
}
$('#btnAddCat').onclick = ()=>{ const n=prompt('New category:'); if(n){ categories.push(n.trim()); saveAll(); renderCategories(); }};

function renderTasks(){
  const ul=$('#taskList'); ul.innerHTML='';
  tasks.forEach((t,i)=>{
    const li=el('li');
    const left=el('div'); left.style.display='flex'; left.style.flexDirection='column';
    const title=el('span',null,t.name); title.style.cursor='pointer';
    title.onclick=()=>{ const n=prompt('Edit task',t.name); if(n){ t.name=n; saveAll(); renderTasks();}};
    const meta=el('span','hint',`${t.category} • ${t.xp} XP`); left.append(title,meta);
    const right=el('div');
    const focusBtn=el('button','ghost','🎮 Focus'); focusBtn.onclick=()=>openPomodoro(i);
    const doneBtn=el('button','ok','✔'); doneBtn.onclick=()=>completeTask(i);
    const del=el('button','danger','🗑'); del.onclick=()=>{tasks.splice(i,1); saveAll(); renderTasks();};
    right.append(focusBtn,doneBtn,del);
    li.append(left,right); ul.append(li);
  });
}
function addTask(){
  const name=$('#taskName').value.trim(), xp=parseFloat($('#taskXP').value), cat=$('#taskCat').value;
  if(!name || isNaN(xp)) return alert('Enter task & XP');
  tasks.push({name,xp,category:cat});
  $('#taskName').value=''; $('#taskXP').value='';
  saveAll(); renderTasks(); renderRaceTaskSelect();
}
$('#btnAddTask').onclick = addTask;

function completeTask(i){
  const before=level();
  const g=parseFloat(tasks[i].xp);
  exp+=g;
  const cat=tasks[i].category;
  categoryCounts[cat]=(categoryCounts[cat]||0)+1;
  history[today].push({name:tasks[i].name,xp:g,pomodoros:0,category:cat});
  tasks.splice(i,1);
  const after=level();
  if(after>before){ const gain=(after-before)*5; coins+=gain; alert(`🏆 Level Up! ${after}! (+${gain} coins)`);}
  saveAll(); paintHeader(); renderTasks(); renderStats(); renderHistory(); renderRaceTaskSelect();
}

/* Rewards */
function renderRewards(){
  const ul=$('#rewardList'); ul.innerHTML='';
  rewards.forEach((r,i)=>{
    const li=el('li');
    const left=el('div'); left.style.display='flex'; left.style.flexDirection='column';
    const title=el('span',null,r.name); title.style.cursor='pointer';
    title.onclick=()=>{ const n=prompt('Edit reward',r.name); if(n){ r.name=n; saveAll(); renderRewards();}};
    const meta=el('span','hint',`Costs ${r.cost} XP`); left.append(title,meta);
    const right=el('div');
    const b=el('button','primary','Buy');
    b.onclick=()=>{ if(exp<r.cost) return alert('Not enough XP'); exp-=r.cost; saveAll(); paintHeader(); };
    const x=el('button','danger','🗑'); x.onclick=()=>{ rewards.splice(i,1); saveAll(); renderRewards(); };
    right.append(b,x); li.append(left,right); ul.append(li);
  });
}
function addReward(){
  const n=$('#rewardName').value.trim(), c=parseFloat($('#rewardCost').value);
  if(!n||isNaN(c)) return alert('Enter reward & cost');
  rewards.push({name:n,cost:c}); $('#rewardName').value=''; $('#rewardCost').value=''; saveAll(); renderRewards();
}
$('#btnAddReward').onclick = addReward;

/* ======= Stats ======= */
function renderStats(){
  const s=$('#statsChart'); s.innerHTML='';
  const cats=Object.keys(categoryCounts).length?categoryCounts:{Study:38,Work:27,"Self-Care":17,Other:18};
  const total=Object.values(cats).reduce((a,b)=>a+b,0)||1; let idx=0;
  Object.entries(cats).forEach(([k,v])=>{
    const pct=Math.round((v/total)*100);
    const row=el('div','statRow');
    row.innerHTML=`<div class="hint" style="display:flex;justify-content:space-between"><span>${k}</span><span>${pct}%</span></div><div class="statOuter"><div class="statBar"></div></div>`;
    s.append(row);
    setTimeout(()=>{ row.querySelector('.statBar').style.width=pct+'%'; row.querySelector('.statBar').style.background=`linear-gradient(90deg,hsl(${(idx*75)%360} 80% 60%),hsl(${(idx*75+45)%360} 80% 55%))`; idx++;}, 60*idx);
  });
}

/* ======= Planner ======= */
const labels=$('#timeLabels'),layer=$('#eventLayer'),marker=$('#nowMarker'),pMark=$('#nowPenguin');
function buildGrid(){
  labels.innerHTML='';
  document.querySelectorAll('.gridLine').forEach(n=>n.remove());
  const tl=$('#timeline');
  for(let m=0;m<=1440;m+=15){
    const hh=String(Math.floor(m/60)).padStart(2,'0'),mm=String(m%60).padStart(2,'0');
    const l=el('div','timeLabel',mm==='00'?`${hh}:00`:''); l.style.top=m+'px'; labels.append(l);
    const g=el('div','gridLine'+((mm==='15'||mm==='45')?' q':'')); g.style.top=m+'px'; tl.append(g);
  }
}
function renderSchedule(){
  layer.innerHTML='';
  daySchedule.forEach((b,i)=>{
    const s=strToMin(b.start), e=strToMin(b.end);
    const elv=el('div','eventBlock'); elv.style.top=s+'px'; elv.style.height=(e-s)+'px';
    elv.style.background=`linear-gradient(180deg,${b.color},${shade(b.color,-20)})`; elv.style.borderColor=shade(b.color,-35);
    elv.innerHTML=`<div class="eventTitle">${b.title}</div><div class="eventTime">${b.start}–${b.end}</div>`;
    elv.onclick=()=>openEdit(i);
    layer.append(elv);
  });
  updateMarker();
}
function openEdit(i){
  const b=daySchedule[i]; $('#mTitle').value=b.title; $('#mStart').value=b.start; $('#mEnd').value=b.end; $('#mColor').value=b.color;
  $('#editModal').classList.remove('hidden'); $('#mSave').onclick=()=>{ const t=$('#mTitle').value||'Task', s=$('#mStart').value, e=$('#mEnd').value, c=$('#mColor').value; if(strToMin(e)<=strToMin(s)) return alert('End after start'); daySchedule[i]={title:t,start:s,end:e,color:c}; saveAll(); renderSchedule(); closeEdit(); };
  $('#mDelete').onclick=()=>{ if(confirm('Delete block?')){ daySchedule.splice(i,1); saveAll(); renderSchedule(); closeEdit();}};
  $('#mCancel').onclick=closeEdit;
}
function closeEdit(){ $('#editModal').classList.add('hidden'); }
$('#btnAddBlock').onclick=()=>{ const t=$('#schedTitle').value||'Task', s=$('#schedStart').value, e=$('#schedEnd').value, c=$('#schedColor').value; if(!s||!e||strToMin(e)<=strToMin(s)) return alert('Set valid times'); daySchedule.push({title:t,start:s,end:e,color:c}); saveAll(); renderSchedule(); };
$('#btnAddFromTasks').onclick=()=>{ if(!tasks.length) return alert('No tasks'); let cur=strToMin('08:00'); tasks.forEach(t=>{ const s=cur-(cur%15), e=s+60; daySchedule.push({title:t.name,start:minToStr(Math.min(s,1425)),end:minToStr(Math.min(e,1440)),color:'#60a5fa'}); cur=e;}); saveAll(); renderSchedule(); };
$('#btnClearSchedule').onclick=()=>{ if(confirm('Clear schedule?')){ daySchedule=[]; saveAll(); renderSchedule(); } };
function updateMarker(){ const n=new Date(),y=n.getHours()*60+n.getMinutes(); marker.style.top=y+'px'; pMark.style.top=y+'px'; }
setInterval(updateMarker,60000);

/* ======= Shop ======= */
const items=[
  {key:'beanie',name:'Beanie',cost:15,lvl:1,slot:'head'},
  {key:'glasses',name:'Glasses',cost:20,lvl:3,slot:'head'},
  {key:'headphones',name:'Headphones',cost:25,lvl:5,slot:'head'},
  {key:'cap',name:'Cap',cost:30,lvl:6,slot:'head'},
  {key:'crown',name:'Crown',cost:50,lvl:10,slot:'head'},
  {key:'grad',name:'Graduation Cap',cost:34,lvl:8,slot:'head'},
  {key:'scarf',name:'Scarf',cost:10,lvl:1,slot:'body'},
  {key:'bow',name:'Bowtie',cost:12,lvl:1,slot:'body'},
  {key:'cape',name:'Cape',cost:60,lvl:12,slot:'body'},
  {key:'mittens',name:'Mittens',cost:18,lvl:2,slot:'body'},
  {key:'aura',name:'Aura',cost:80,lvl:12,slot:'effect'},
  {key:'rainbow',name:'Rainbow Aura',cost:110,lvl:16,slot:'effect'},
  {key:'frost',name:'Frost Aura',cost:130,lvl:18,slot:'effect'},
  {key:'theme_tech',name:'Theme: Tech Lab',cost:0,lvl:1,slot:'theme'},
  {key:'theme_arctic',name:'Theme: Arctic Base',cost:20,lvl:4,slot:'theme'},
  {key:'theme_sunset',name:'Theme: Sunset Beach',cost:24,lvl:6,slot:'theme'},
  {key:'theme_space',name:'Theme: Space',cost:28,lvl:8,slot:'theme'},
];
function themeFromKey(k){ if(k.endsWith('tech')) return 'tech'; if(k.endsWith('arctic')) return 'arctic'; if(k.endsWith('sunset')) return 'sunset'; return 'space'; }
function themePreviewCss(k){ const t=themeFromKey(k); if(t==='arctic') return 'linear-gradient(180deg,#e0f7ff,#bde9ff)'; if(t==='sunset') return 'linear-gradient(180deg,#ff9966,#8e54e9)'; if(t==='space') return 'radial-gradient(circle at 30% 30%, #3b246b, #0a0a1a)'; return 'linear-gradient(180deg,#031a2e,#083b62)'; }
function renderShop(){
  const grid=$('#shopGrid'); grid.innerHTML='';
  const lvl=level();
  items.forEach(it=>{
    const card=el('div','shop-card'+(lvl<it.lvl?' lock':'')); 
    const top=el('div','shop-top'); top.append(el('span','shop-lvl',`Lvl ${it.lvl}`), el('span',null,lvl<it.lvl?'🔒':'')); card.append(top);
    const thumb=el('div','shop-thumb');
    if(it.slot==='theme'){ const d=el('div'); d.style.width='100%'; d.style.height='86px'; d.style.borderRadius='12px'; d.style.border='1px solid #1e2e44'; d.style.boxShadow='inset 0 0 12px #00eaff22'; d.style.background=themePreviewCss(it.key); thumb.append(d);}
    else { const p=el('div','penguin tiny'); p.innerHTML='<div class="body"></div><div class="wing left"></div><div class="wing right"></div><div class="eye left"></div><div class="eye right"></div><div class="beak"></div>'; penguinApply(p); thumb.append(p); }
    card.append(thumb);
    card.append(el('div','shop-name',it.name));
    card.append(el('div','shop-meta',it.slot==='theme'?(ownedItems[it.key]?'Owned':`Theme • ${it.cost} coins`):`Cost: ${it.cost} • Slot: ${it.slot}`));
    const actions=el('div','shop-actions');
    const owned=!!ownedItems[it.key];
    if(it.slot==='theme'){
      if(!owned && it.cost>0) actions.append(btn('Buy',()=>buy(it)));
      if(owned || it.cost===0) actions.append(btn(theme===themeFromKey(it.key)?'Equipped':'Equip',()=>{ownedItems[it.key]=true; theme=themeFromKey(it.key); saveAll(); renderShop();}, theme===themeFromKey(it.key)?'ghost':'' ));
    }else{
      if(!owned) actions.append(btn('Buy',()=>buy(it)));
      else actions.append(btn((equipped[it.slot]===it.key)?'Equipped':'Equip',()=>{equipped[it.slot]=it.key; saveAll(); renderShop();}, (equipped[it.slot]===it.key)?'ghost':'' ));
    }
    if(owned) card.append(el('div','shop-owned','Owned'));
    card.append(actions); grid.append(card);
  });
}
function btn(t,fn,cls){const b=el('button',cls?cls:'primary',t); b.onclick=fn; return b;}
function buy(it){ if(level()<it.lvl) return alert('Level too low'); if(coins<it.cost) return alert('Not enough coins'); coins-=it.cost; ownedItems[it.key]=true; saveAll(); paintHeader(); renderShop(); }

/* ======= Pomodoro (independent popup) ======= */
let pomoIndex=null, pomoTimer=null, secLeft=0, paused=false, isBreak=false, cycle=0, running=false;
function openPomodoro(i){ pomoIndex=i??null; $('#pomoTitle').textContent = i!=null?`🍅 Focus: ${tasks[i].name}`:'🍅 Pomodoro'; startPomoFocus(); $('#pomodoroOverlay').classList.remove('hidden'); }
$('#btnOpenPomo').onclick = ()=>openPomodoro(null);
$('#pomoClose').onclick = exitPomodoro; $('#btnExit').onclick = exitPomodoro;
$('#btnPause').onclick = ()=>{ paused=!paused; };
$('#btnDone').onclick = completePomodoro;

function startPomoFocus(){ running=true; isBreak=false; secLeft=focusMinutes*60; cycle=cycle||0; $('#pomoPhase').textContent='Focus'; tickReset(); }
function startShort(){ running=true; isBreak=true; secLeft=breakMinutes*60; $('#pomoPhase').textContent='Short break'; tickReset(); }
function startLong(){ running=true; isBreak=true; secLeft=longBreakMinutes*60; $('#pomoPhase').textContent='Long break'; tickReset(); }
function tickReset(){ clearInterval(pomoTimer); pomoTimer=setInterval(tick,1000); }
function tick(){ if(!running||paused) return; secLeft--; updateTimerUI(); if(secLeft<=0){ clearInterval(pomoTimer); if(!isBreak){ cycle++; (cycle%4===0)?startLong():startShort(); } else { startPomoFocus(); } } }
function updateTimerUI(){ const m=Math.floor(secLeft/60), s=secLeft%60; $('#pomoTimer').textContent=`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`; updateMiniTimers(); }
function exitPomodoro(){ running=false; clearInterval(pomoTimer); $('#pomodoroOverlay').classList.add('hidden'); updateMiniTimers(); }
function completePomodoro(){ if(pomoIndex==null){exitPomodoro(); return;} const before=level(); const xp=parseFloat(tasks[pomoIndex].xp); exp+=xp; history[today].push({name:tasks[pomoIndex].name,xp:xp,pomodoros:1,category:tasks[pomoIndex].category}); categoryCounts[tasks[pomoIndex].category]=(categoryCounts[tasks[pomoIndex].category]||0)+1; tasks.splice(pomoIndex,1); const after=level(); if(after>before){const gain=(after-before)*5; coins+=gain; alert(`🏆 Level Up! ${after}! (+${gain} coins)`);} saveAll(); paintHeader(); renderTasks(); renderStats(); renderHistory(); exitPomodoro(); }

/* tiny timers in call overlay/mini */
function updateMiniTimers(){
  const text = running ? `Pomodoro: ${String(Math.floor(secLeft/60)).padStart(2,'0')}:${String(secLeft%60).padStart(2,'0')} left` : '';
  $('#callTiny').classList.toggle('hidden',!running);
  $('#miniTiny').classList.toggle('hidden',!running);
  $('#callTiny').textContent=text; $('#miniTiny').textContent=text;
}

/* ======= Calls ======= */
let callMode='Chill';
$('#btnCall').onclick = ()=>openCall('Chill');
document.querySelectorAll('[data-call]').forEach(b=> b.onclick=()=>openCall(b.getAttribute('data-call')));
$('#callClose').onclick = ()=>$('#callOverlay').classList.add('hidden');
$('#callMin').onclick = ()=>{ $('#callOverlay').classList.add('hidden'); $('#callMini').classList.remove('hidden'); $('#miniCaption').textContent=captionFor(callMode); penguinApply($('#miniPenguin')); };
$('#miniRestore').onclick = ()=>{ $('#callMini').classList.add('hidden'); $('#callOverlay').classList.remove('hidden'); };
$('#miniClose').onclick = ()=>$('#callMini').classList.add('hidden');
$('#btnMeet').onclick = ()=> window.open('https://meet.google.com/new','_blank');

function openCall(mode){ callMode = mode || 'Chill'; $('#callTitle').textContent=`📞 ${avatar.name} — ${callMode}`; $('#callOverlay').classList.remove('hidden'); buildCallScene(); penguinApply($('#miniPenguin')); }
function captionFor(m){return({Study:"Studying with you…",Exercise:"Let’s move! 💪",Eat:"Snack break 🍣",Bath:"Self-care 🛁",Sleep:"Resting 😴",Chill:"Chilling…"})[m]||"Chilling…"}
function buildCallScene(){ const sc=$('#callScene'); sc.innerHTML=''; sc.className=`scene ${theme}`; const p=el('div','penguin'); p.innerHTML='<div class="body"></div><div class="wing left"></div><div class="wing right"></div><div class="eye left"></div><div class="eye right"></div><div class="beak"></div>'; penguinApply(p); sc.append(p); }

/* ======= Tools ======= */
$('#btnCalc').onclick = ()=>{ openCalc(); };
$('#btnSearch').onclick = ()=>{ $('#searchModal').classList.remove('hidden'); $('#searchInput').focus(); };

function openCalc(){
  $('#calcModal').classList.remove('hidden');
  const pad=$('#calcPad'); pad.innerHTML='';
  const keys=['7','8','9','/','4','5','6','*','1','2','3','-','0','.','=','+','C','⌫'];
  keys.forEach(k=>{
    const b=el('button','ghost',k); b.onclick=()=>calcPress(k); pad.append(b);
  });
}
$('#calcClose').onclick=()=>$('#calcModal').classList.add('hidden');
let calcExpr=''; const calcDisp=$('#calcDisplay');
function calcPress(k){
  if(k==='C'){ calcExpr=''; }
  else if(k==='⌫'){ calcExpr=calcExpr.slice(0,-1); }
  else if(k==='='){ try{ const safe=calcExpr.replace(/[^0-9+\-*/().]/g,''); calcExpr=String(Function(`'use strict';return (${safe})`)()); }catch{ calcExpr='Error'; } }
  else { calcExpr+=k; }
  calcDisp.value=calcExpr;
}
$('#searchClose').onclick=()=>$('#searchModal').classList.add('hidden');
$('#searchGo').onclick=()=>{ const q=$('#searchInput').value.trim(); if(q) $('#searchFrame').src='https://www.google.com/search?q='+encodeURIComponent(q); };

/* ======= Alarms ======= */
let audioCtx=null; function ensureCtx(){ if(!audioCtx){ try{ audioCtx=new (window.AudioContext||window.webkitAudioContext)(); }catch{} } }
document.addEventListener('click',ensureCtx,{once:true});
function renderAlarms(){ const ul=$('#alarmList'); ul.innerHTML=''; alarms.forEach((a,i)=>{ const li=el('li',null,`<span class="badge">${a.enabled?'On':'Off'}</span> <span class="hint" style="margin-left:8px">${a.time}</span> ${a.label?('• '+a.label):''}`); const box=el('div'); const t=btn(a.enabled?'Disable':'Enable',()=>{a.enabled=!a.enabled; saveAll(); renderAlarms();}, a.enabled?'ghost':''); const e=btn('✎',()=>editAlarm(i),'ghost'); const x=btn('🗑',()=>{alarms.splice(i,1); saveAll(); renderAlarms();},'danger'); box.append(t,e,x); li.append(box); ul.append(li); });}
$('#btnAddAlarm').onclick = ()=>{ const t=$('#alarmTime').value, label=$('#alarmLabel').value.trim(), tone=$('#alarmTone').value; if(!t) return alert('Pick time'); alarms.push({time:t,label,tone,enabled:true,last:null}); saveAll(); renderAlarms(); };
function editAlarm(i){ const a=alarms[i]; const nt=prompt('Time (HH:MM)',a.time); if(!nt) return; const nl=prompt('Label',a.label||''); if(nl==null) return; const tn=prompt('Tone (soft|beep|ping)',a.tone); if(!tn) return; a.time=nt; a.label=nl; a.tone=tn; saveAll(); renderAlarms(); }
function checkAlarms(){ const now=new Date(); const cur=`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`; alarms.forEach(a=>{ if(!a.enabled) return; if(a.time===cur && a.last!==today+cur){ a.last=today+cur; fireAlarm(a); }}); }
setInterval(checkAlarms,60000);
let alarmOsc=null; function fireAlarm(a){ $('#alarmMsg').textContent=(a.label||'Alarm!')+' — '+a.time; $('#alarmPopup').classList.remove('hidden'); playTone(a.tone); }
function stopAlarm(){ $('#alarmPopup').classList.add('hidden'); if(alarmOsc){ alarmOsc.stop(); alarmOsc.disconnect(); alarmOsc=null; } }
function snoozeAlarm(){ stopAlarm(); const a=alarms.find(x=>x.last && x.last.startsWith(today)); if(!a) return; a.time=minToStr((strToMin(a.time)+5)%1440); a.last=null; saveAll(); renderAlarms(); }
$('#alarmOk').onclick=stopAlarm; $('#alarmSnooze').onclick=snoozeAlarm;
function playTone(type){ ensureCtx(); if(!audioCtx) return; const osc=audioCtx.createOscillator(); const gain=audioCtx.createGain(); osc.connect(gain); gain.connect(audioCtx.destination); osc.type='sine'; osc.frequency.value = type==='beep'?880: type==='ping'?1760:440; gain.gain.value=.2; osc.start(); alarmOsc=osc; }

/* ======= History + Export ======= */
function renderHistory(){
  const list=$('#historyList'); list.innerHTML=''; let p=0, xp=0;
  (history[today]||[]).forEach(e=>{ list.append(el('li',null,`${e.name} (${e.category||'Uncategorized'}) — ${e.pomodoros} Pomodoro(s) +${e.xp} XP`)); p+=e.pomodoros; xp+=e.xp; });
  $('#historySummary').textContent=`Total: ${p} Pomodoros • ${xp.toFixed(2)} XP earned`;
}
$('#btnClearToday').onclick=()=>{ if(confirm('Clear today’s history?')){ history[today]=[]; saveAll(); renderHistory(); } };

$('#btnExportJSON').onclick=()=>{ const data={exp,coins,tasks,rewards,categories,categoryCounts,daySchedule,alarms,ownedItems,equipped,theme,avatar,history,focusMinutes,breakMinutes,longBreakMinutes,autoNext,lang,soundPack}; const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='penguin_data.json'; a.click(); URL.revokeObjectURL(url); };
$('#btnExportCSV').onclick=()=>{ let csv='type,name,value\n'; tasks.forEach(t=>csv+=`task,${t.name},${t.xp}\n`); rewards.forEach(r=>csv+=`reward,${r.name},${r.cost}\n`); daySchedule.forEach(b=>csv+=`block,${b.title},${b.start}-${b.end}\n`); alarms.forEach(a=>csv+=`alarm,${a.label},${a.time}\n`); const blob=new Blob([csv],{type:'text/csv'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='penguin_data.csv'; a.click(); URL.revokeObjectURL(url); };
$('#btnImport').onclick=()=>$('#importFile').click();
$('#importFile').addEventListener('change',e=>{
  const f=e.target.files[0]; if(!f) return;
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      if(f.name.endsWith('.json')){
        const data=JSON.parse(reader.result);
        if($('#overwriteImport').checked) Object.assign(window,data);
        else{ tasks.push(...(data.tasks||[])); rewards.push(...(data.rewards||[])); alarms.push(...(data.alarms||[])); daySchedule.push(...(data.daySchedule||[])); }
        saveAll(); init(); alert('✅ Data imported.');
      }else alert('Use JSON for import (CSV import not supported).');
    }catch(err){ alert('Import failed: '+err); }
  };
  reader.readAsText(f);
});

/* ======= Settings ======= */
$('#btnSettings').onclick=()=>{ $('#settingsOverlay').classList.remove('hidden'); loadSettings(); };
$('#settingsClose').onclick=()=>$('#settingsOverlay').classList.add('hidden');
function loadSettings(){ $('#optLang').value=lang; $('#optTheme').value=theme; $('#optSound').value=soundPack; $('#setWork').value=focusMinutes; $('#setShort').value=breakMinutes; $('#setLong').value=longBreakMinutes; $('#setAuto').checked=autoNext; renderAvatarEditors(); }
$('#optLang').onchange=()=>{ lang=$('#optLang').value; saveAll(); applyLang(); };
$('#optTheme').onchange=()=>{ theme=$('#optTheme').value; saveAll(); buildCallScene(); };
$('#optSound').onchange=()=>{ soundPack=$('#optSound').value; saveAll(); };
$('#btnSaveDefaults').onclick=()=>{ focusMinutes=+$('#setWork').value||25; breakMinutes=+$('#setShort').value||5; longBreakMinutes=+$('#setLong').value||15; autoNext=$('#setAuto').checked; saveAll(); alert('Defaults saved'); };
$('#btnResetToday').onclick=()=>{ if(confirm('Reset today only?')){ history[today]=[]; categoryCounts={}; saveAll(); renderStats(); renderHistory(); } };
$('#btnClearAll').onclick=()=>{ if(confirm('Clear ALL data?')){ localStorage.clear(); location.reload(); } };

/* ======= Race Mode (offline sync via localStorage; Firebase-ready hooks) ======= */
let raceRoom=null, raceData=null, raceTick=null, raceLeft=0, racePhase='Focus', raceMembers={}, raceXP={};
function genCode(){ return Math.random().toString(36).slice(2,8).toUpperCase(); }

$('#btnRaceCreate').onclick=()=>{
  raceRoom = genCode();
  raceData = { room:raceRoom, phase:'Idle', left:0, owner:id(), members:{[id()]:avatar.name}, xp:{} };
  saveRoom(); attachRoom();
  $('#raceCodeBadge').textContent='Code: '+raceRoom;
  $('#raceRoom').textContent=raceRoom;
  $('#raceArea').classList.remove('hidden');
  renderLeaderboard();
};
$('#btnRaceJoin').onclick=()=>{
  const code = ($('#raceCodeInput').value||'').trim().toUpperCase();
  if(!code) return alert('Enter code');
  raceRoom=code; const d=loadRoom(); if(!d) return alert('Room not found (same browser tabs only).');
  d.members[id()]=avatar.name; raceData=d; saveRoom(); attachRoom();
  $('#raceCodeBadge').textContent='Joined: '+raceRoom;
  $('#raceRoom').textContent=raceRoom;
  $('#raceArea').classList.remove('hidden');
  renderLeaderboard();
};
$('#raceEnd').onclick=()=>{ if(!raceRoom) return; showPodium(); clearInterval(raceTick); };
$('#raceStartPomo').onclick=()=>{
  if(!raceRoom) return alert('Create or join a room first');
  raceData.phase='Focus'; raceData.left=focusMinutes*60; saveRoom();
};
$('#raceMarkDone').onclick=()=>{
  const sel=$('#raceTaskSelect'); const name=sel.value;
  const t=tasks.find(k=>k.name===name); if(!t) return alert('Pick a task');
  exp+=parseFloat(t.xp); history[today].push({name:t.name,xp:+t.xp,pomodoros:1,category:t.category}); categoryCounts[t.category]=(categoryCounts[t.category]||0)+1;
  raceData.xp[id()] = (raceData.xp[id()]||0) + parseFloat(t.xp);
  tasks = tasks.filter(k=>k!==t);
  saveAll(); renderTasks(); paintHeader(); renderHistory(); renderStats();
  saveRoom(); renderLeaderboard();
};
function renderRaceTaskSelect(){ const sel=$('#raceTaskSelect'); if(!sel) return; sel.innerHTML=''; tasks.forEach(t=>sel.append(new Option(`${t.name} (${t.xp} XP)`,t.name))); }
function id(){ let me=localStorage.getItem('pc_uid'); if(!me){ me=genCode(); localStorage.setItem('pc_uid',me); } return me; }
function saveRoom(){ localStorage.setItem('pc_room_'+raceRoom, JSON.stringify(raceData)); }
function loadRoom(){ const s=localStorage.getItem('pc_room_'+raceRoom); return s?JSON.parse(s):null; }
function attachRoom(){
  // localStorage "sync" across tabs
  window.addEventListener('storage', e=>{ if(e.key==='pc_room_'+raceRoom) refreshRoom(); });
  refreshRoom();
  if(raceTick) clearInterval(raceTick);
  raceTick=setInterval(()=>{ const d=loadRoom(); if(!d) return; if(d.phase==='Focus' || d.phase==='Break'){ d.left--; if(d.left<=0){ if(d.phase==='Focus'){ d.phase='Break'; d.left=breakMinutes*60; } else { d.phase='Focus'; d.left=focusMinutes*60; } saveRoom(); } updateRaceUI(d); },1000);
}
function refreshRoom(){ const d=loadRoom(); if(!d) return; raceData=d; updateRaceUI(d); }
function updateRaceUI(d){ $('#racePhase').textContent=d.phase; $('#raceTimer').textContent = d.left?`${String(Math.floor(d.left/60)).padStart(2,'0')}:${String(d.left%60).padStart(2,'0')}`:'--:--'; $('#raceMembers').textContent=Object.keys(d.members||{}).length; renderLeaderboard(); if(d.phase==='Break') maybeOpenMiniGames(d.left); else closeMiniGames(); }
function renderLeaderboard(){ const box=$('#raceLeaderboard'); if(!raceData) return; const xp=raceData.xp||{}; const entries=Object.entries(xp).map(([uid,val])=>({name:raceData.members[uid]||uid,xp:val||0})); if(entries.length===0) { box.innerHTML='<div class="hint">Leaderboard will appear after first completion</div>'; return; } entries.sort((a,b)=>b.xp-a.xp); box.innerHTML=entries.map((e,i)=>`<div>${i+1}. ${e.name} — ${e.xp.toFixed(2)} XP</div>`).join(''); }
function showPodium(){ const pod=$('#racePodium'); pod.classList.remove('hidden'); const xp=raceData.xp||{}; const entries=Object.entries(xp).map(([uid,val])=>({name:raceData.members[uid]||uid,xp:val||0})).sort((a,b)=>b.xp-a.xp); pod.innerHTML='<h3>🏆 Podium</h3>'+entries.slice(0,3).map((e,i)=>`<div>${['🥇','🥈','🥉'][i]||'🎖️'} ${e.name} — ${e.xp.toFixed(2)} XP</div>`).join(''); }

/* Firebase-ready hooks (no network here)
   - Later, swap saveRoom/loadRoom/attachRoom with Firestore listeners:
   saveRoom => await setDoc(doc(db,'rooms',raceRoom), raceData)
   attachRoom => onSnapshot(doc(db,'rooms',raceRoom), snap => { raceData=snap.data(); updateRaceUI(raceData); })
*/

/* ======= Break Minigames ======= */
let gameModal=null; function maybeOpenMiniGames(secondsLeft){ if(!gameModal){ openMiniGames(); setTimeout(closeMiniGames, secondsLeft*1000); } }
function openMiniGames(){ if(gameModal) return; gameModal=el('div','modal'); const box=el('div','modal-box'); box.innerHTML='<h3>🎮 Break Minigames</h3>'; const row=el('div','row wrap'); const b1=btn('Tic-Tac-Toe',openTTT,'primary'); const b2=btn('Connect-4',openC4,'ghost'); row.append(b1,b2); box.append(row, el('div','pad hint','Closes automatically when break ends.')); gameModal.append(box); document.body.append(gameModal); }
function closeMiniGames(){ if(gameModal){ gameModal.remove(); gameModal=null; } }

/* Tic-Tac-Toe */
function openTTT(){ const m=el('div','modal'); const b=el('div','modal-box'); b.innerHTML='<h3>Tic-Tac-Toe</h3>'; const g=el('div'); g.style.display='grid'; g.style.gridTemplateColumns='repeat(3,60px)'; g.style.gap='6px'; let turn='X', cells=Array(9).fill(''); const draw=()=>{ g.innerHTML=''; cells.forEach((v,i)=>{ const c=el('button','ghost',v||' '); c.style.width='60px'; c.style.height='60px'; c.onclick=()=>{ if(cells[i]) return; cells[i]=turn; turn=turn==='X'?'O':'X'; draw(); if(win(cells)) setTimeout(()=>{alert('Win!'); m.remove();},10); }; g.append(c); });}; const win=(c)=>{const L=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]; return L.some(l=>c[l[0]]&&c[l[0]]===c[l[1]]&&c[l[1]]===c[l[2]]);} ; draw(); b.append(g, el('div','row',null)); m.append(b); document.body.append(m); }
/* Connect-4 */
function openC4(){ const m=el('div','modal'); const b=el('div','modal-box'); b.innerHTML='<h3>Connect-4</h3>'; const rows=6, cols=7; const grid=[...Array(rows)].map(()=>Array(cols).fill(0)); let turn=1; const board=el('div'); board.style.display='grid'; board.style.gridTemplateColumns='repeat(7,40px)'; board.style.gap='4px'; function draw(){ board.innerHTML=''; for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){ const d=el('div'); d.style.width='40px'; d.style.height='40px'; d.style.borderRadius='50%'; d.style.background=grid[r][c]===0?'#334155':(grid[r][c]===1?'#60a5fa':'#a855f7'); d.style.cursor='pointer'; d.onclick=()=>drop(c); board.append(d);} } function drop(col){ for(let r=rows-1;r>=0;r--){ if(grid[r][col]===0){ grid[r][col]=turn; turn=turn===1?2:1; draw(); if(checkWin()) setTimeout(()=>{alert('Win!'); m.remove();},10); return; } } } function checkWin(){ const dirs=[[1,0],[0,1],[1,1],[1,-1]]; for(let r=0;r<rows;r++)for(let c=0;c<
