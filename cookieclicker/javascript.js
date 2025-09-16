// Score en click power
let score = localStorage.getItem('score') ? parseInt(localStorage.getItem('score')) : 0;
let clickPower = 1;
document.getElementById('score').textContent = score;

// Cookie klik animatie
const cookie = document.getElementById('cookie');
cookie.addEventListener('click', () => {
    score += clickPower;
    updateScore();
    animateScore();
});

// Score animatie
function animateScore() {
    const scoreEl = document.getElementById('score');
    scoreEl.classList.remove('animate');
    void scoreEl.offsetWidth; // trigger reflow
    scoreEl.classList.add('animate');
}

// Functie om score bij te werken
function updateScore() {
    document.getElementById('score').textContent = score;
    localStorage.setItem('score', score);
}

// Autoclickers
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

// Autoclicker knoppen
autoclickersData.forEach((auto, i) => {
    const btn = document.createElement('div');
    btn.className = 'autoclicker';
    btn.textContent = `${auto.name} - Cost: ${auto.cost} - CPS: ${auto.cps}`;
    btn.addEventListener('click', () => buyAutoclicker(i));
    autoclickersContainer.appendChild(btn);
});

function buyAutoclicker(i) {
    const auto = autoclickersData[i];
    if(score >= auto.cost){
        score -= auto.cost;
        ownedAutoclickers[i]++;
        auto.cost = Math.floor(auto.cost * 1.15);
        updateScore();
        autoclickersContainer.children[i].textContent = `${auto.name} - Cost: ${auto.cost} - CPS: ${auto.cps} - Owned: ${ownedAutoclickers[i]}`;
    }
}

// Upgrades
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
    btn.addEventListener('click', () => buyUpgrade(i));
    upgradesContainer.appendChild(btn);
});

function buyUpgrade(i){
    const up = upgradesData[i];
    if(score >= up.cost){
        score -= up.cost;
        up.effect();
        updateScore();
        upgradesContainer.children[i].style.display = 'none';
    }
}

// Themes / Skins
const themesData = [
    { name: "Chocolate", bg: "#d2691e" },
    { name: "Vanilla", bg: "#f3e5ab" },
    { name: "Strawberry", bg: "#ff6f91" },
    { name: "Mint", bg: "#a7f3d0" }
];

const themesContainer = document.getElementById('themes');
themesData.forEach((theme, i) => {
    const btn = document.createElement('div');
    btn.className = 'theme';
    btn.textContent = theme.name;
    btn.addEventListener('click', () => document.body.style.backgroundColor = theme.bg);
    themesContainer.appendChild(btn);
});

// Autoclicker productie
setInterval(() => {
    let totalCPS = ownedAutoclickers.reduce((sum, n, i) => sum + (n * autoclickersData[i].cps), 0);
    score += totalCPS;
    updateScore();
}, 1000);

// Reset knop
document.getElementById('reset-button').addEventListener('click', () => {
    score = 0;
    clickPower = 1;
    ownedAutoclickers = autoclickersData.map(() => 0);
    autoclickersData.forEach((a,i)=> a.cost = [10,50,200,1000,5000,10000,50000,100000][i]);
    upgradesContainer.querySelectorAll('.upgrade').forEach(btn => btn.style.display = 'block');
    updateScore();
});
