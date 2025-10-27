// ---------- SCORE EN CLICK POWER ----------
let score = 0;
let clickPower = 1;
document.getElementById('score').textContent = score;

const cookie = document.getElementById('cookie');
cookie.addEventListener('click', () => {
  score += clickPower;
  updateScore();
  animateScore();
  saveGame();
});

function animateScore() {
  const scoreEl = document.getElementById('score');
  scoreEl.classList.remove('animate');
  void scoreEl.offsetWidth;
  scoreEl.classList.add('animate');
}

function updateScore() {
  document.getElementById('score').textContent = score;
}

// ---------- AUTOCLICKERS ----------
const autoclickersData = [
  { name: "Cursor", cost: 10, cps: 1 },
  { name: "Grandma", cost: 50, cps: 5 },
  { name: "Farm", cost: 200, cps: 20 },
  { name: "Mine", cost: 1000, cps: 100 },
  { name: "Factory", cost: 5000, cps: 500 },
  { name: "Bank", cost: 10000, cps: 1000 },
  { name: "Temple", cost: 50000, cps: 5000 },
  { name: "Wizard Tower", cost: 100000, cps: 10000 }
];
let ownedAutoclickers = autoclickersData.map(() => 0);
const autoclickersContainer = document.getElementById('autoclickers');

autoclickersData.forEach((auto, i) => {
  const btn = document.createElement('div');
  btn.className = 'autoclicker';
  btn.textContent = `${auto.name} - Cost: ${auto.cost} - CPS: ${auto.cps}`;
  btn.addEventListener('click', () => buyAutoclicker(i));
  autoclickersContainer.appendChild(btn);
});

function buyAutoclicker(i) {
  const auto = autoclickersData[i];
  if (score >= auto.cost) {
    score -= auto.cost;
    ownedAutoclickers[i]++;
    auto.cost = Math.floor(auto.cost * 1.15);
    updateAutoclickerButton(i);
    updateScore();
    saveGame();
  }
}

function updateAutoclickerButton(i) {
  const auto = autoclickersData[i];
  autoclickersContainer.children[i].textContent =
    `${auto.name} - Cost: ${auto.cost} - CPS: ${auto.cps} - Owned: ${ownedAutoclickers[i]}`;
}

// ---------- UPGRADES ----------
const upgradesData = [
  { name: "Double Click Power", cost: 100, effect: () => clickPower *= 2 },
  { name: "Autoclicker Boost", cost: 500, effect: () => autoclickersData.forEach(a => a.cps *= 2) },
  { name: "Mega Cursor", cost: 1000, effect: () => clickPower += 5 },
  { name: "Grandma Expertise", cost: 2000, effect: () => autoclickersData[1].cps += 10 },
  { name: "Factory Upgrade", cost: 5000, effect: () => autoclickersData[4].cps += 100 }
];

const upgradesContainer = document.getElementById('upgrades');
upgradesData.forEach((up, i) => {
  const btn = document.createElement('div');
  btn.className = 'upgrade';
  btn.textContent = `${up.name} - Cost: ${up.cost}`;
  btn.addEventListener('click', () => buyUpgrade(i, btn));
  upgradesContainer.appendChild(btn);
});

function buyUpgrade(i, btn) {
  const up = upgradesData[i];
  if (score >= up.cost && !btn.classList.contains('bought')) {
    score -= up.cost;
    up.effect();
    updateScore();
    btn.classList.add('bought');
    btn.textContent = `${up.name} ✓ Gekocht`;
    btn.style.opacity = "0.5";
    btn.style.pointerEvents = "none";
    saveGame();
  }
}

// ---------- AUTOCLICKER PRODUCTIE ----------
setInterval(() => {
  let totalCPS = ownedAutoclickers.reduce((sum, n, i) => sum + (n * autoclickersData[i].cps), 0);
  score += totalCPS;
  updateScore();
}, 1000);

// ---------- THEMES / SKINS ----------
const themesData = [
  {
    name: "Chocolate",
    bg: "linear-gradient(135deg, #d2691e, #8b4513)",
    textColor: "#3b1d0b",
    buttonColor: "#8b4513",
    cookieImg: "img/chocolate.webp"
  },
  {
    name: "Vanilla",
    bg: "linear-gradient(135deg, #fff4d6, #f3e5ab)",
    textColor: "#5e3d0c",
    buttonColor: "#d4a373",
    cookieImg: "img/cookie.jpg"
  },
  {
    name: "Strawberry",
    bg: "linear-gradient(135deg, #ff8fa3, #ff6f91)",
    textColor: "#fff",
    buttonColor: "#c9184a",
    cookieImg: "img/strawyberry.webp"
  },
  {
    name: "Mint",
    bg: "linear-gradient(135deg, #bdf4de, #a7f3d0)",
    textColor: "#064e3b",
    buttonColor: "#10b981",
    cookieImg: "img/mint.png"
  }
];

const themesContainer = document.getElementById('themes');
themesData.forEach(theme => {
  const btn = document.createElement('div');
  btn.className = 'theme';
  btn.textContent = theme.name;
  btn.addEventListener('click', () => applyTheme(theme));
  themesContainer.appendChild(btn);
});

function applyTheme(theme) {
  // background + text
  document.body.style.background = theme.bg;
  document.body.style.color = theme.textColor;
  document.getElementById('score').style.color = theme.textColor;
  // buttons
  document.querySelectorAll('.autoclicker, .upgrade, .theme, #reset-button').forEach(btn => {
    btn.style.background = theme.buttonColor;
    btn.style.color = theme.textColor === "#fff" ? "#fff" : "#fff";
  });
  // cookie image
  cookie.src = theme.cookieImg;
  document.body.dataset.theme = theme.name;
  saveGame();
}

// ---------- SAVE & LOAD ----------
function saveGame() {
  const saveData = {
    score,
    clickPower,
    ownedAutoclickers,
    autoclickerCosts: autoclickersData.map(a => a.cost),
    boughtUpgrades: Array.from(document.querySelectorAll('.upgrade')).map(btn => btn.classList.contains('bought')),
    selectedTheme: document.body.dataset.theme || null
  };
  localStorage.setItem('cookieClickerSave', JSON.stringify(saveData));
}

function loadGame() {
  const saved = JSON.parse(localStorage.getItem('cookieClickerSave'));
  if (!saved) return;

  score = saved.score || 0;
  clickPower = saved.clickPower || 1;
  ownedAutoclickers = saved.ownedAutoclickers || ownedAutoclickers;

  if (saved.autoclickerCosts) {
    autoclickersData.forEach((a, i) => a.cost = saved.autoclickerCosts[i]);
  }

  ownedAutoclickers.forEach((_, i) => updateAutoclickerButton(i));

  if (saved.boughtUpgrades) {
    document.querySelectorAll('.upgrade').forEach((btn, i) => {
      if (saved.boughtUpgrades[i]) {
        btn.classList.add('bought');
        btn.textContent = `${upgradesData[i].name} ✓ Gekocht`;
        btn.style.opacity = "0.5";
        btn.style.pointerEvents = "none";
        upgradesData[i].effect();
      }
    });
  }

  if (saved.selectedTheme) {
    const theme = themesData.find(t => t.name === saved.selectedTheme);
    if (theme) applyTheme(theme);
  }

  updateScore();
}

loadGame();
setInterval(saveGame, 1000);

// ---------- RESET ----------
document.getElementById('reset-button').addEventListener('click', () => {
  localStorage.removeItem('cookieClickerSave');
  location.reload();
});
