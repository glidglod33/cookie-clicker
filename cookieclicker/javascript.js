// javascript.js - OOP versie compleet met events en save/load

document.addEventListener("DOMContentLoaded", () => {
  const cookieEl = document.getElementById('cookie');
  const scoreEl = document.getElementById('score');
  const autoclickersContainer = document.getElementById('autoclickers');
  const upgradesContainer = document.getElementById('upgrades');
  const themesContainer = document.getElementById('themes');
  const resetButton = document.getElementById('reset-button');

  // ======= Classes =======

  class Autoclicker {
    constructor(name, cost, cps) {
      this.name = name;
      this.baseCost = cost;
      this.cost = cost;
      this.cps = cps;
      this.owned = 0;
      this.btn = null;
    }

    buy(game) {
      if (game.score >= this.cost) {
        game.score -= this.cost;
        this.owned++;
        this.cost = Math.floor(this.cost * 1.15);
        game.updateUI();
        game.save();
        return true;
      }
      return false;
    }

    totalCPS() {
      return this.owned * this.cps;
    }

    createButton(game) {
      const btn = document.createElement('div');
      btn.className = 'autoclicker';
      btn.textContent = `${this.name} - Cost: ${this.cost} - CPS: ${this.cps}`;
      btn.addEventListener('click', () => {
        if (this.buy(game)) {
          this.updateButton();
        }
      });
      this.btn = btn;
      return btn;
    }

    updateButton() {
      if (!this.btn) return;
      this.btn.textContent = `${this.name} - Cost: ${this.cost} - CPS: ${this.cps} - Owned: ${this.owned}`;
    }

    toSave() {
      return { cost: this.cost, owned: this.owned };
    }

    fromSave(data) {
      if (!data) return;
      if (data.cost !== undefined) this.cost = data.cost;
      if (data.owned !== undefined) this.owned = data.owned;
      this.updateButton();
    }
  }

  class Upgrade {
    constructor(name, cost, effectFn) {
      this.name = name;
      this.cost = cost;
      this.effectFn = effectFn;
      this.bought = false;
      this.btn = null;
    }

    buy(game) {
      if (!this.bought && game.score >= this.cost) {
        game.score -= this.cost;
        this.bought = true;
        this.effectFn(game);
        this.updateButton();
        game.updateUI();
        game.save();
        return true;
      }
      return false;
    }

    createButton(game) {
      const btn = document.createElement('div');
      btn.className = 'upgrade';
      btn.textContent = `${this.name} - Cost: ${this.cost}`;
      btn.addEventListener('click', () => this.buy(game));
      this.btn = btn;
      return btn;
    }

    updateButton() {
      if (!this.btn) return;
      if (this.bought) {
        this.btn.classList.add('bought');
        this.btn.textContent = `${this.name} ✓ Gekocht`;
        this.btn.style.opacity = "0.5";
        this.btn.style.pointerEvents = "none";
      } else {
        this.btn.classList.remove('bought');
        this.btn.style.opacity = "1";
        this.btn.style.pointerEvents = "auto";
        this.btn.textContent = `${this.name} - Cost: ${this.cost}`;
      }
    }

    toSave() {
      return { bought: this.bought };
    }

    fromSave(data) {
      if (!data) return;
      if (data.bought) {
        this.bought = true;
        this.effectFn = this.effectFn || (() => {});
        this.effectFn(window.game); // apply again (if needed)
      }
      this.updateButton();
    }
  }

  class Theme {
    constructor(name, className, cookieImg) {
      this.name = name;
      this.className = className; // e.g. 'theme-chocolate'
      this.cookieImg = cookieImg;
      this.btn = null;
    }

    apply() {
      // remove other theme classes
      document.body.classList.remove(...['theme-chocolate','theme-vanilla','theme-strawberry','theme-mint']);
      if (this.className) document.body.classList.add(this.className);
      if (this.cookieImg) cookieEl.src = this.cookieImg;
      document.body.dataset.theme = this.className || '';
      window.game.save();
    }

    createButton() {
      const btn = document.createElement('div');
      btn.className = 'theme';
      btn.textContent = this.name;
      btn.addEventListener('click', () => this.apply());
      this.btn = btn;
      return btn;
    }

    toSave() {
      return this.className;
    }
  }

  // Event base class + three events
  class GameEvent {
    constructor(game) { this.game = game; this.active = false; }
    start() { this.active = true; }
    stop() { this.active = false; }
  }

  class GoldenCookieEvent extends GameEvent {
    constructor(game) { super(game); }
    spawn() {
      const img = document.createElement('img');
      img.src = 'img/golden-cookie.webp';
      img.style.position = 'absolute';
      img.style.width = '110px';
      img.style.left = `${Math.random() * (window.innerWidth - 140)}px`;
      img.style.top = `${Math.random() * (window.innerHeight - 200)}px`;
      img.style.cursor = 'pointer';
      img.style.zIndex = 9999;
      img.classList.add('golden-cookie');
      document.body.appendChild(img);

      const onClick = () => {
        // reward: +20% van score + 50 (maar min 50)
        const bonus = Math.floor((this.game.score * 0.2)) + 50;
        this.game.score += bonus;
        this.game.updateUI();
        this.game.save();
        img.removeEventListener('click', onClick);
        img.remove();
      };

      img.addEventListener('click', onClick);

      setTimeout(() => {
        if (img.parentElement) img.remove();
      }, 10000);
    }
  }

  class FrenzyEvent extends GameEvent {
    constructor(game) { super(game); this.originalPower = null; }
    start() {
      if (this.active) return;
      super.start();
      this.originalPower = this.game.clickPower;
      this.game.clickPower *= 10;
      document.body.classList.add('frenzy-active');
      // visual indicator: use border glow via inline style (temporary)
      document.body.style.boxShadow = 'inset 0 0 60px gold';
      setTimeout(() => this.stop(), 30000);
    }
    stop() {
      this.game.clickPower = this.originalPower;
      document.body.style.boxShadow = '';
      document.body.classList.remove('frenzy-active');
      super.stop();
    }
  }

  class WinterEvent extends GameEvent {
    constructor(game) { super(game); }
    start() {
      if (this.active) return;
      super.start();
      // darken screen and double autoclicker CPS
      document.body.classList.add('winter-active');
      document.body.style.filter = 'brightness(0.9)';
      this.game.autoclickers.forEach(a => a.cps *= 2);
      setTimeout(() => this.stop(), 60000);
    }
    stop() {
      this.game.autoclickers.forEach(a => a.cps /= 2);
      document.body.style.filter = '';
      document.body.classList.remove('winter-active');
      super.stop();
    }
  }

  // ======= Game class =======

  class Game {
    constructor() {
      this.score = 0;
      this.clickPower = 1;
      this.autoclickers = [];
      this.upgrades = [];
      this.themes = [];
      this.events = {
        golden: new GoldenCookieEvent(this),
        frenzy: new FrenzyEvent(this),
        winter: new WinterEvent(this)
      };

      window.game = this; // voor event classes that call game

      this.load();
      this.buildUI();
      this.startIntervals();
    }

    buildUI() {
      // build autoclickers UI
      autoclickersContainer.innerHTML = '';
      this.autoclickers.forEach(a => {
        autoclickersContainer.appendChild(a.createButton(this));
      });

      // build upgrades UI
      upgradesContainer.innerHTML = '';
      this.upgrades.forEach(u => {
        upgradesContainer.appendChild(u.createButton(this));
      });

      // build themes UI
      themesContainer.innerHTML = '';
      this.themes.forEach(t => {
        themesContainer.appendChild(t.createButton());
      });

      // cookie click
      cookieEl.addEventListener('click', () => {
        this.score += this.clickPower;
        this.updateUI();
        this.save();
      });

      // reset
      resetButton.addEventListener('click', () => {
        if (confirm('Weet je zeker dat je wilt resetten?')) {
          this.reset();
        }
      });

      this.updateUI();
    }

    updateUI() {
      scoreEl.textContent = this.score;
      // update autoclicker buttons
      this.autoclickers.forEach(a => a.updateButton());
      // update upgrades
      this.upgrades.forEach(u => u.updateButton());
    }

    addAutoclicker(autoclicker) { this.autoclickers.push(autoclicker); }
    addUpgrade(upgrade) { this.upgrades.push(upgrade); }
    addTheme(theme) { this.themes.push(theme); }

    startIntervals() {
      // CPS tick
      setInterval(() => {
        const total = this.autoclickers.reduce((s, a) => s + a.totalCPS(), 0);
        if (total > 0) {
          this.score += total;
          this.updateUI();
        }
      }, 1000);

      // autosave
      setInterval(() => this.save(), 1000);

      // events scheduling
      // golden cookie: every 30s 25% kans
      setInterval(() => {
        if (Math.random() < 0.25) this.events.golden.spawn();
      }, 30000);

      // frenzy: elke 60s 10% kans
      setInterval(() => {
        if (Math.random() < 0.10) this.events.frenzy.start();
      }, 60000);

      // winter: elke 5 minuten 20% kans
      setInterval(() => {
        if (Math.random() < 0.20) this.events.winter.start();
      }, 300000);
    }

    save() {
      const saveObj = {
        score: this.score,
        clickPower: this.clickPower,
        autoclickers: this.autoclickers.map(a => a.toSave()),
        upgrades: this.upgrades.map(u => u.toSave()),
        theme: document.body.dataset.theme || ''
      };
      localStorage.setItem('cookieOOPSave', JSON.stringify(saveObj));
    }

    load() {
      const raw = localStorage.getItem('cookieOOPSave');
      if (!raw) return;

      try {
        const data = JSON.parse(raw);
        this.score = data.score || 0;
        this.clickPower = data.clickPower || 1;
        // autoclickers and upgrades are restored after instances created
        this._loadedData = data;
      } catch (e) {
        console.error('Load failed', e);
      }
    }

    applyLoadedData() {
      const data = this._loadedData;
      if (!data) return;
      if (data.autoclickers && this.autoclickers.length === data.autoclickers.length) {
        this.autoclickers.forEach((a, i) => a.fromSave(data.autoclickers[i]));
      }
      if (data.upgrades && this.upgrades.length === data.upgrades.length) {
        this.upgrades.forEach((u, i) => u.fromSave(data.upgrades[i]));
      }
      if (data.theme) {
        // theme is classname
        document.body.classList.remove(...['theme-chocolate','theme-vanilla','theme-strawberry','theme-mint']);
        if (data.theme) document.body.classList.add(data.theme);
        document.body.dataset.theme = data.theme;
        // find theme and set cookie image 
        const t = this.themes.find(tt => tt.className === data.theme);
        if (t) cookieEl.src = t.cookieImg;
      }
      this.updateUI();
    }

    reset() {
      localStorage.removeItem('cookieOOPSave');
      // reset model
      this.score = 0;
      this.clickPower = 1;
      this.autoclickers.forEach(a => { a.cost = a.baseCost; a.owned = 0; });
      this.upgrades.forEach(u => { u.bought = false; u.updateButton(); });
      // remove theme classes and restore default cookie
      document.body.classList.remove(...['theme-chocolate','theme-vanilla','theme-strawberry','theme-mint']);
      cookieEl.src = './img/cookie.jpg';
      document.body.dataset.theme = '';
      this.updateUI();
      this.save();
    }
  }

  // ======= Instantiate game and add data =======

  const gameInstance = new Game();

  // Add autoclickers data 
  const autos = [
    ["Cursor", 10, 1],
    ["Grandma", 50, 5],
    ["Farm", 200, 20],
    ["Mine", 1000, 100],
    ["Factory", 5000, 500],
    ["Bank", 10000, 1000],
    ["Temple", 50000, 5000],
    ["Wizard Tower", 100000, 10000]
  ];

  autos.forEach(([name, cost, cps]) => {
    const a = new Autoclicker(name, cost, cps);
    gameInstance.addAutoclicker(a);
  });

  // Add upgrades
  const upList = [
    new Upgrade("Double Click Power", 100, (g) => { g.clickPower *= 2; }),
    new Upgrade("Autoclicker Boost", 500, (g) => { g.autoclickers.forEach(a => a.cps *= 2); }),
    new Upgrade("Mega Cursor", 1000, (g) => { g.clickPower += 5; }),
    new Upgrade("Grandma Expertise", 2000, (g) => { if (g.autoclickers[1]) g.autoclickers[1].cps += 10; }),
    new Upgrade("Factory Upgrade", 5000, (g) => { if (g.autoclickers[4]) g.autoclickers[4].cps += 100; })
  ];
  upList.forEach(u => gameInstance.addUpgrade(u));

  // Add themes 
  const themesList = [
    new Theme("Chocolate", "theme-chocolate", "img/chocolate.webp"),
    new Theme("Vanilla", "theme-vanilla", "img/cookie.jpg"),
    new Theme("Strawberry", "theme-strawberry", "img/strawyberry.webp"),
    new Theme("Mint", "theme-mint", "img/mint.png")
  ];
  themesList.forEach(t => gameInstance.addTheme(t));


  gameInstance.buildUI();


  gameInstance.applyLoadedData();
});
