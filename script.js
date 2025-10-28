/* ==========================================================
   Penguin Companion — XP Planner (MVP Showcase)
   Part 3: script.js
   ========================================================== */

/* -------------------------
   Persistent App State
-------------------------- */
const LS = {
  xp:      "pc_xp",
  coins:   "pc_coins",
  tasks:   "pc_tasks",
  cats:    "pc_categories",
  avatar:  "pc_avatar",
  owned:   "pc_owned",
  shop:    "pc_shop_init"
};

let xp     = parseFloat(localStorage.getItem(LS.xp)   || "0");
let coins  = parseFloat(localStorage.getItem(LS.coins)|| "0");
let tasks  = JSON.parse(localStorage.getItem(LS.tasks)|| "[]");
let cats   = JSON.parse(localStorage.getItem(LS.cats) || '["Study","Self-Care","Work"]');

let avatar = JSON.parse(localStorage.getItem(LS.avatar) || JSON.stringify({
  name: "Pingu",
  color: "#3b82f6",
  head:  "",       // beanie, crown, gradcap, bunny, santa, headphones, glasses, bow
  body:  "",       // scarf, hoodie, backpack, cape
  effect:""        // aura, rainbow, frost, shadow
}));

let owned  = JSON.parse(localStorage.getItem(LS.owned) || "[]");

/* -------------------------
   Elements
-------------------------- */
const el = (id) => document.getElementById(id);

// Header
const xpBar        = el("xpBar");
const xpTotal      = el("xpTotal");
const levelEl      = el("level");
const coinsTotal   = el("coinsTotal");

// Tasks
const taskName     = el("taskName");
const taskCategory = el("taskCategory");
const taskXP       = el("taskXP");
const addTaskBtn   = el("addTask");
const taskList     = el("taskList");

// Calls / Meet
const callPenguinBtn = el("callPenguin");
const callModeBtns   = document.querySelectorAll(".callMode");
const meetBtn        = el("meetBtn");

// Avatar
const penguinPreview = el("penguinPreview");
const avatarNameText = el("avatarName");
const avatarInput    = el("avatarInput");
const headSelect     = el("headSelect");
const bodySelect     = el("bodySelect");
const effectSelect   = el("effectSelect");
const colorChips     = document.querySelectorAll("#colorChips .chip");
const saveAvatarBtn  = el("saveAvatar");

// Shop
const coinsShop   = el("coinsShop");
const shopGrid    = el("shopGrid");
const shopPenguin = el("shopPenguin");

// Overlay (Calls)
const callOverlay = el("callOverlay");
const callBg      = el("callBg");
const callPenguin = el("callPenguin");
const callAction  = el("callAction");
const closeCall   = el("closeCall");

// Toast
const toast       = el("toast");
const toastTitle  = el("toastTitle");
const toastMsg    = el("toastMsg");
const toastPenguin= el("toastPenguin");

// Sounds
const bell        = el("bell");

/* -------------------------
   Utilities
-------------------------- */
function saveAll(){
  localStorage.setItem(LS.xp, xp.toString());
  localStorage.setItem(LS.coins, coins.toString());
  localStorage.setItem(LS.tasks, JSON.stringify(tasks));
  localStorage.setItem(LS.cats, JSON.stringify(cats));
  localStorage.setItem(LS.avatar, JSON.stringify(avatar));
  localStorage.setItem(LS.owned, JSON.stringify(owned));
}

function level(){ return Math.floor(xp/100) + 1; }

function renderHeader(){
  xpTotal.textContent    = xp.toFixed(2);
  coinsTotal.textContent = Math.floor(coins);
  levelEl.textContent    = level();
  xpBar.style.width      = `${xp % 100}%`;
}

function showToast(title, msg){
  toastTitle.textContent = title;
  toastMsg.textContent   = msg;
  applyPenguin(toastPenguin, avatar); // keep avatar consistent
  toast.classList.remove("hidden");
  clearTimeout(toast._t);
  toast._t = setTimeout(()=>toast.classList.add("hidden"), 3000);
}

function ensurePenguinParts(container){
  // Build penguin parts if container is empty
  if(!container.querySelector(".body")){
    container.innerHTML = `
      <div class="body"></div>
      <div class="wing left"></div><div class="wing right"></div>
      <div class="eye left"></div><div class="eye right"></div>
      <div class="beak"></div>
    `;
  }
}

/* -------------------------
   Avatar Rendering
-------------------------- */
function applyPenguin(container, av){
  ensurePenguinParts(container);
  container.style.setProperty("--p", av.color || "#3b82f6");

  // Remove previous accessories/effects
  container.querySelectorAll(".acc").forEach(n=>n.remove());
  container.classList.remove("aura","rainbow","frost","shadow");

  // Head
  if(av.head){
    const h = document.createElement("div");
    h.className = `acc ${av.head}`;
    container.appendChild(h);
  }
  // Body
  if(av.body){
    const b = document.createElement("div");
    b.className = `acc ${av.body}`;
    container.appendChild(b);
  }
  // Effect (class on container)
  if(av.effect){
    container.classList.add(av.effect);
  }
}

function renderAvatarEditor(){
  avatarNameText.textContent = avatar.name;
  avatarInput.value          = avatar.name;
  // Populate selects once
  if(!headSelect.options.length){
    ["","beanie","crown","gradcap","bunny","santa","headphones","glasses","bow"]
      .forEach(v=>{
        const o=document.createElement("option");
        o.value=v; o.textContent=v || "none";
        headSelect.appendChild(o);
      });
  }
  if(!bodySelect.options.length){
    ["","scarf","hoodie","backpack","cape"]
      .forEach(v=>{
        const o=document.createElement("option");
        o.value=v; o.textContent=v || "none";
        bodySelect.appendChild(o);
      });
  }
  if(!effectSelect.options.length){
    ["","aura","rainbow","frost","shadow"]
      .forEach(v=>{
        const o=document.createElement("option");
        o.value=v; o.textContent=v || "none";
        effectSelect.appendChild(o);
      });
  }
  headSelect.value   = avatar.head || "";
  bodySelect.value   = avatar.body || "";
  effectSelect.value = avatar.effect || "";

  // chips active state
  colorChips.forEach(ch=>{
    ch.classList.toggle("active", ch.dataset.color === avatar.color);
  });

  applyPenguin(penguinPreview, avatar);
}

colorChips.forEach(ch=>{
  ch.addEventListener("click", ()=>{
    colorChips.forEach(c=>c.classList.remove("active"));
    ch.classList.add("active");
    avatar.color = ch.dataset.color;
    applyPenguin(penguinPreview, avatar);
  });
});

saveAvatarBtn.addEventListener("click", ()=>{
  avatar.name   = (avatarInput.value || avatar.name).trim();
  avatar.head   = headSelect.value;
  avatar.body   = bodySelect.value;
  avatar.effect = effectSelect.value;
  saveAll();
  renderAvatarEditor();
  applyPenguin(shopPenguin, avatar); // shop preview also follows user avatar
  showToast(avatar.name, "Avatar updated!");
});

/* -------------------------
   Tasks
-------------------------- */
function renderCategories(){
  taskCategory.innerHTML = "";
  cats.forEach(c=>{
    const o=document.createElement("option");
    o.value=c; o.textContent=c;
    taskCategory.appendChild(o);
  });
}

function renderTasks(){
  taskList.innerHTML = "";
  tasks.forEach((t, i)=>{
    const li = document.createElement("li");
    const left = document.createElement("div");
    left.innerHTML = `<b>${t.name}</b><br><span class="muted small">${t.category} • ${t.xp} XP</span>`;

    const right = document.createElement("div");
    const btnFocus = document.createElement("button");
    btnFocus.className = "btn ghost";
    btnFocus.textContent = "Focus";
    btnFocus.onclick = ()=> openCall("Study"); // opens Study-themed call

    const btnDone = document.createElement("button");
    btnDone.className = "btn";
    btnDone.textContent = "Complete";
    btnDone.onclick = ()=>{
      xp += parseFloat(t.xp);
      coins += Math.max(1, Math.floor(parseFloat(t.xp)/5)); // simple coin reward
      tasks.splice(i,1);
      saveAll();
      renderHeader();
      renderTasks();
      showToast(avatar.name, `+${t.xp} XP • +${Math.max(1, Math.floor(t.xp/5))} coins`);
      bell.play().catch(()=>{});
    };

    const btnDel = document.createElement("button");
    btnDel.className = "btn ghost";
    btnDel.textContent = "🗑";
    btnDel.onclick = ()=>{
      tasks.splice(i,1);
      saveAll();
      renderTasks();
    };

    right.append(btnFocus, btnDone, btnDel);
    li.append(left, right);
    taskList.appendChild(li);
  });
}

addTaskBtn.addEventListener("click", ()=>{
  const name = taskName.value.trim();
  const xpV  = parseFloat(taskXP.value);
  const cat  = taskCategory.value || "General";
  if(!name || isNaN(xpV)) return alert("Add a task name and XP");
  tasks.push({name, xp:xpV, category:cat});
  taskName.value = ""; taskXP.value = "";
  saveAll(); renderTasks();
});

/* -------------------------
   Calls (Context-Themed)
-------------------------- */
const ACTION_ICONS = {
  Study:    "✍️",
  Exercise: "🏋️",
  Eat:      "🍲",
  Bath:     "🫧",
  Sleep:    "💤"
};

const BG_CLASS = {
  Study:    "study",
  Exercise: "exercise",
  Eat:      "eat",
  Bath:     "bath",
  Sleep:    "sleep",
  Chill:    "study" // default fallback
};

function openCall(mode="Chill"){
  // Keep current avatar — do NOT change visuals; just apply saved avatar state
  callOverlay.classList.remove("hidden");

  // Background scene by mode
  callBg.className = "call-bg " + BG_CLASS[mode];

  // Action icon anim
  callAction.textContent = ACTION_ICONS[mode] || "";

  // Apply avatar to penguin in call
  ensurePenguinParts(callPenguin);
  applyPenguin(callPenguin, avatar);

  // Subtle motion per mode
  animatePenguinByMode(callPenguin, mode);
}

function animatePenguinByMode(container, mode){
  // We will gently animate wing transforms with JS (complementing CSS)
  const left  = container.querySelector(".wing.left");
  const right = container.querySelector(".wing.right");
  const body  = container.querySelector(".body");

  clearInterval(container._ani);
  let t=0;
  container._ani = setInterval(()=>{
    t++;
    switch(mode){
      case "Study":
        left.style.transform  = `rotate(${-8 + Math.sin(t/6)*4}deg)`;
        right.style.transform = `rotate(${8 - Math.sin(t/6)*4}deg)`;
        body.style.transform  = `translateY(${Math.sin(t/12)*1.5}px)`;
        break;
      case "Exercise":
        left.style.transform  = `rotate(${-20 + Math.sin(t/4)*18}deg)`;
        right.style.transform = `rotate(${20 - Math.sin(t/4)*18}deg)`;
        body.style.transform  = `translateY(${Math.abs(Math.sin(t/6))*6}px)`;
        break;
      case "Eat":
        left.style.transform  = `rotate(-6deg)`;
        right.style.transform = `rotate(6deg)`;
        body.style.transform  = `translateY(${Math.abs(Math.sin(t/8))*3}px)`;
        break;
      case "Bath":
        left.style.transform  = `rotate(${-14 + Math.sin(t/5)*10}deg)`;
        right.style.transform = `rotate(${14 - Math.sin(t/5)*10}deg)`;
        body.style.transform  = `translateY(${Math.sin(t/6)*2.5}px)`;
        break;
      case "Sleep":
        left.style.transform  = `rotate(-6deg)`;
        right.style.transform = `rotate(6deg)`;
        body.style.transform  = `translateY(${Math.sin(t/16)*1.4}px)`;
        break;
      default:
        left.style.transform  = `rotate(${-6 + Math.sin(t/10)*6}deg)`;
        right.style.transform = `rotate(${6 - Math.sin(t/10)*6}deg)`;
        body.style.transform  = `translateY(${Math.sin(t/10)*2}px)`;
    }
  }, 50);
}

closeCall.addEventListener("click", ()=>{
  callOverlay.classList.add("hidden");
  if(callPenguin._ani) clearInterval(callPenguin._ani);
});

// Buttons
callPenguinBtn.addEventListener("click", ()=>openCall("Chill"));
callModeBtns.forEach(b=>b.addEventListener("click", ()=>openCall(b.dataset.mode)));
meetBtn.addEventListener("click", ()=>window.open("https://meet.new","_blank"));

/* -------------------------
   Shop (Preloaded Items)
-------------------------- */
const SHOP_ITEMS = [
  // accessories (head/body)
  { id:"headphones", type:"head",  name:"Headphones", price:10, icon:"🎧" },
  { id:"beanie",     type:"head",  name:"Beanie",     price:6,  icon:"🧢" },
  { id:"glasses",    type:"head",  name:"Glasses",    price:8,  icon:"👓" },
  { id:"crown",      type:"head",  name:"Crown",      price:14, icon:"👑" },
  { id:"bunny",      type:"head",  name:"Bunny Ears", price:9,  icon:"🐰" },
  { id:"scarf",      type:"body",  name:"Scarf",      price:7,  icon:"🧣" },
  { id:"gradcap",    type:"head",  name:"Grad Cap",   price:10, icon:"🎓" },
  { id:"hoodie",     type:"body",  name:"Hoodie",     price:12, icon:"🧥" },
  { id:"backpack",   type:"body",  name:"Backpack",   price:11, icon:"🎒" },
  { id:"santa",      type:"head",  name:"Santa Hat",  price:9,  icon:"🎅" },

  // themes (we treat as effects on background preferences; for now we just sell them)
  { id:"theme-tech",    type:"theme", name:"Tech Lab",     price: 0, icon:"🧪" },
  { id:"theme-arctic",  type:"theme", name:"Arctic Base",  price:18, icon:"❄️" },
  { id:"theme-sunset",  type:"theme", name:"Sunset Beach", price:20, icon:"🌅" },
  { id:"theme-nebula",  type:"theme", name:"Night Nebula", price:22, icon:"🌌" },

  // effects
  { id:"aura",     type:"effect", name:"Aura",        price:12, icon:"✨" },
  { id:"rainbow",  type:"effect", name:"Rainbow",     price:18, icon:"🌈" },
  { id:"frost",    type:"effect", name:"Frost Aura",  price:20, icon:"🧊" },
  { id:"shadow",   type:"effect", name:"Shadow Trail",price:16, icon:"🌙" }
];

function renderShop(){
  shopGrid.innerHTML = "";
  coinsShop.textContent = Math.floor(coins);
  applyPenguin(shopPenguin, avatar);

  SHOP_ITEMS.forEach(item=>{
    const tile = document.createElement("div");
    tile.className = "shop-item" + (owned.includes(item.id) ? " owned" : "");
    tile.innerHTML = `
      <div class="icon" style="font-size:20px">${item.icon}</div>
      <div class="name small">${item.name}</div>
      <div class="price">${item.price} coins</div>
    `;
    tile.title = owned.includes(item.id) ? `Owned — click to equip` : `Buy for ${item.price} coins`;
    tile.addEventListener("click", ()=> handleShopClick(item));
    shopGrid.appendChild(tile);
  });
}

function handleShopClick(item){
  // Already owned: equip directly
  if(owned.includes(item.id)){
    equipItem(item);
    showToast(avatar.name, `${item.name} equipped!`);
    return;
  }
  // Not owned: buy if enough coins
  if(coins < item.price){
    showToast(avatar.name, `Not enough coins for ${item.name}`);
    return;
  }
  coins -= item.price; owned.push(item.id);
  saveAll(); renderHeader(); renderShop();
  equipItem(item);
  showToast(avatar.name, `Bought & equipped ${item.name}!`);
}

function equipItem(item){
  if(item.type === "head")  avatar.head   = item.id;
  if(item.type === "body")  avatar.body   = item.id;
  if(item.type === "effect")avatar.effect = item.id;
  // themes would be stored to apply to app background later (MVP keeps call themes per mode)
  saveAll();
  renderAvatarEditor();
  applyPenguin(shopPenguin, avatar);
}

/* -------------------------
   Export / Import
-------------------------- */
el("exportJSON").addEventListener("click", ()=>{
  const data = { xp, coins, tasks, cats, avatar, owned };
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));
  a.download = "penguin-data.json";
  a.click();
});

el("exportCSV").addEventListener("click", ()=>{
  let csv = "Type,Name,Value\n";
  tasks.forEach(t => csv += `Task,${safe(t.name)},${t.xp}\n`);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
  a.download = "penguin-data.csv";
  a.click();
});

el("importFile").addEventListener("change", (e)=>{
  const file = e.target.files?.[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=>{
    try{
      const data = JSON.parse(reader.result);
      if(typeof data.xp === "number") xp = data.xp;
      if(typeof data.coins === "number") coins = data.coins;
      if(Array.isArray(data.tasks)) tasks = data.tasks;
      if(Array.isArray(data.cats))  cats  = data.cats;
      if(typeof data.avatar === "object") avatar = data.avatar;
      if(Array.isArray(data.owned)) owned = data.owned;
      saveAll();
      init(); // full re-render
      showToast(avatar.name, "Data imported!");
    }catch(err){
      alert("Invalid JSON file");
    }
  };
  reader.readAsText(file);
});

function safe(s){ return String(s).replace(/,/g," "); }

/* -------------------------
   Race (placeholder button)
-------------------------- */
el("raceBtn").addEventListener("click", ()=>{
  showToast(avatar.name, "Race lobby opens in the next build (Kahoot-style) ✅");
});

/* -------------------------
   Init
-------------------------- */
function init(){
  renderHeader();
  renderCategories();
  renderTasks();
  renderAvatarEditor();
  renderShop();
}
init();
