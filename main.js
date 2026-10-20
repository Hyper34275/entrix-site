// Entrix — entrix.uk. Two small things move on this page: the sign-in scene plays once when
// it comes into view, and the 2-step code card counts down like the one in the app.
(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------------------------------------------------------------- sign-in scene
  const stage = document.querySelector("[data-scene]");
  if (stage) {
    const expires = stage.querySelector("[data-expires]");
    const expiresBar = stage.querySelector("[data-expires-bar]");
    const faceLabel = stage.querySelector("[data-faceid-label]");
    const total = 90;
    let timers = [];
    let ticker = null;

    const clear = () => { timers.forEach(clearTimeout); timers = []; clearInterval(ticker); };
    const at = (ms, fn) => timers.push(setTimeout(fn, ms));
    const showLeft = (left) => {
      expires.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
      expiresBar.style.width = `${(left / total) * 100}%`;
    };
    const set = (state) => { stage.dataset.state = state; };

    // The laptop's screen: real Windows 11 screens painted by winscreen.js, driven by the same
    // clock as the phone. ms → the painter's progress value (see winscreen.js for what each shows).
    const winCanvas = stage.querySelector("[data-wincanvas]");
    let win = null, winRaf = 0, t0 = 0;
    const WIN_P = [[0, 17], [700, 17], [1200, 22], [1300, 22.4], [2600, 29.4], [2700, 31], [3000, 32.8], [6600, 34],
                   [6700, 85.4], [7200, 87.4], [7800, 89.4], [8300, 91.5]];
    const winP = (ms) => {
      if (ms <= WIN_P[0][0]) return WIN_P[0][1];
      for (let i = 1; i < WIN_P.length; i++) {
        const [b, vb] = WIN_P[i];
        if (ms <= b) { const [a2, va] = WIN_P[i - 1]; return va + (vb - va) * ((ms - a2) / (b - a2)); }
      }
      return WIN_P[WIN_P.length - 1][1];
    };
    const loadWin = () => (win ? Promise.resolve(win) : import("./winscreen.js").then((mod) => {
      win = mod.createWinScreen(winCanvas, { wall: "assets/win/win-wall.jpg", wallBlur: "assets/win/win-wall-blur.jpg", mark: "assets/entrix-mark-480.webp",
        onLoad: () => win && win.draw(t0 ? winP(performance.now() - t0) : 33) });
      return win;
    }));
    const runWin = () => {
      cancelAnimationFrame(winRaf);
      t0 = performance.now();
      const tick = () => {
        const ms = performance.now() - t0;
        if (win) win.draw(winP(ms));
        if (ms < 8400) winRaf = requestAnimationFrame(tick);
      };
      tick();
    };

    // One cycle: 8.4 s of story, then the open desktop holds for 2.6 s, and it starts over:
    // the PC locks again and the phone's button goes back to "Locked". It only runs while the
    // scene is on screen and the tab is visible, and the button pauses it (WCAG 2.2.2).
    const CYCLE = 11000;
    const pauseBtn = document.querySelector("[data-pause]");
    let paused = false, visible = false, loopTimer = 0;
    const play = () => {
      clear(); clearTimeout(loopTimer);
      let left = 88;
      showLeft(left);
      faceLabel.textContent = "Face ID";
      set("home");
      loadWin().then(runWin);
      at(3000, () => {
        set("wait");
        ticker = setInterval(() => { left = Math.max(0, left - 1); showLeft(left); }, 1000);
      });
      at(4000, () => set("press"));
      at(4300, () => set("scan"));
      at(5700, () => { set("ok"); faceLabel.textContent = "Approved"; });
      at(6700, () => { set("done"); clearInterval(ticker); });
      loopTimer = setTimeout(() => { if (visible && !paused && !document.hidden) play(); }, CYCLE);
    };
    const stop = () => { clear(); clearTimeout(loopTimer); cancelAnimationFrame(winRaf); };
    const setPaused = (v) => {
      paused = v;
      pauseBtn.textContent = v ? "Play" : "Pause";
      pauseBtn.setAttribute("aria-pressed", String(v));
      if (v) stop(); else if (visible) play();
    };
    pauseBtn.addEventListener("click", () => setPaused(!paused));

    const heroWatch = document.querySelector("[data-replay-hero]");
    if (heroWatch) heroWatch.addEventListener("click", () => {
      stage.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
      if (paused) setPaused(false); else setTimeout(play, reduceMotion ? 0 : 450);
    });

    if (reduceMotion) {
      showLeft(88);
      set("wait");
      pauseBtn.hidden = true;
      loadWin().then((w) => w.draw(33));
    } else {
      new IntersectionObserver((entries) => {
        const nowVisible = entries.some((e) => e.isIntersecting);
        if (nowVisible === visible) return;
        visible = nowVisible;
        if (visible && !paused) play(); else stop();
      }, { threshold: 0.6 }).observe(stage);
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) stop(); else if (visible && !paused) play();
      });
    }
  }

  // ---------------------------------------------------------------- highlights gallery
  const gallery = document.querySelector("[data-gallery]");
  if (gallery) {
    const cards = [...gallery.querySelectorAll(".hl")];
    const dotsBox = document.querySelector("[data-gallery-dots]");
    const prev = document.querySelector("[data-gallery-prev]");
    const next = document.querySelector("[data-gallery-next]");
    // Which card is "current" comes from the scroll position itself (the card whose start is
    // nearest the gallery's start edge). While a smooth scroll is still running after a click,
    // the next click counts from where that scroll is going, so a quick double click moves two
    // cards, never zero or three.
    const pad = () => parseFloat(getComputedStyle(gallery).scrollPaddingLeft) || 0;
    const startOf = (i) => cards[i].offsetLeft - pad();
    const nearest = () => {
      const x = gallery.scrollLeft;
      let best = 0;
      cards.forEach((_, i) => { if (Math.abs(startOf(i) - x) < Math.abs(startOf(best) - x)) best = i; });
      // at the far end the last card may not reach the start edge
      if (x >= gallery.scrollWidth - gallery.clientWidth - 2) best = cards.length - 1;
      return best;
    };
    let pending = null, settle = 0;
    const mark = (i) => {
      dots.forEach((d, k) => d.setAttribute("aria-selected", k === i ? "true" : "false"));
      prev.disabled = i === 0; next.disabled = i === cards.length - 1;
    };
    const go = (i) => {
      const k = Math.max(0, Math.min(cards.length - 1, i));
      pending = k; mark(k);
      gallery.scrollTo({ left: startOf(k), behavior: reduceMotion ? "auto" : "smooth" });
      clearTimeout(settle); settle = setTimeout(() => { pending = null; mark(nearest()); }, 900);
    };
    const dots = cards.map((card, i) => {
      const d = document.createElement("button");
      d.type = "button"; d.className = "gallery__dot"; d.setAttribute("role", "tab");
      d.setAttribute("aria-label", card.querySelector("h3 b").textContent.replace(/\.$/, ""));
      d.addEventListener("click", () => go(i));
      dotsBox.appendChild(d);
      return d;
    });
    let raf = 0;
    gallery.addEventListener("scroll", () => {
      if (pending !== null || raf) return;          // a button-driven scroll marks its own target
      raf = requestAnimationFrame(() => { raf = 0; mark(nearest()); });
    }, { passive: true });
    gallery.addEventListener("scrollend", () => { if (pending === null) mark(nearest()); });
    prev.addEventListener("click", () => go((pending ?? nearest()) - 1));
    next.addEventListener("click", () => go((pending ?? nearest()) + 1));
    mark(0);
  }

  // ---------------------------------------------------------------- how it works (pinned iPhone)
  const steps = [...document.querySelectorAll(".how__step")];
  const screens = [...document.querySelectorAll("[data-screen]")];
  if (steps.length && screens.length) {
    const show = (i) => {
      steps.forEach((s, k) => s.classList.toggle("is-active", k === i));
      screens.forEach((s, k) => s.classList.toggle("is-on", k === i));
    };
    show(0);
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) show(steps.indexOf(e.target)); });
    }, { rootMargin: "-45% 0px -45% 0px" });
    steps.forEach((s) => io.observe(s));
  }

  // A made-up QR pattern for the scan screen (it encodes nothing).
  const qr = document.querySelector("[data-qr]");
  if (qr) {
    const c = qr.getContext("2d"), n = 21;
    c.fillStyle = "#fff"; c.fillRect(0, 0, n, n); c.fillStyle = "#141413";
    let seed = 7;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (rnd() > 0.52) c.fillRect(x, y, 1, 1);
    const finder = (x, y) => {
      c.fillStyle = "#fff"; c.fillRect(x - 1, y - 1, 9, 9);
      c.fillStyle = "#141413"; c.fillRect(x, y, 7, 7);
      c.fillStyle = "#fff"; c.fillRect(x + 1, y + 1, 5, 5);
      c.fillStyle = "#141413"; c.fillRect(x + 2, y + 2, 3, 3);
    };
    finder(0, 0); finder(14, 0); finder(0, 14);
  }

  // ---------------------------------------------------------------- phone dock
  // On phones, a small bar with the main button appears once the hero's own button has
  // scrolled away, and steps aside again at the closing section, which has its own.
  const dock = document.querySelector("[data-dock]");
  const heroCta = document.querySelector("[data-hero-cta]");
  const band = document.querySelector("#download");
  if (dock && heroCta && band) {
    let heroVisible = true, bandVisible = false;
    const update = () => {
      const show = !heroVisible && !bandVisible;
      dock.toggleAttribute("data-show", show);
      dock.setAttribute("aria-hidden", show ? "false" : "true");
      dock.querySelector("a").tabIndex = show ? 0 : -1;
    };
    new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; update(); }).observe(heroCta);
    new IntersectionObserver(([e]) => { bandVisible = e.isIntersecting; update(); }).observe(band);
  }

  // ---------------------------------------------------------------- 2-step code card
  const digits = document.querySelector("[data-totp]");
  if (digits) {
    const secs = document.querySelector("[data-totp-secs]");
    const bar = document.querySelector("[data-totp-bar]");
    const period = 30;
    // Illustrative only: a fresh made-up code each period, not a real one-time code.
    const codeFor = (step) => {
      let x = (step * 2654435761) >>> 0;
      x ^= x >>> 15; x = Math.imul(x, 2246822519) >>> 0; x = (x ^ (x >>> 13)) >>> 0;
      const n = String(x % 1000000).padStart(6, "0");
      return `${n.slice(0, 3)} ${n.slice(3)}`;
    };
    const pDigits = document.querySelector("[data-phone-totp]");
    const pSecs = document.querySelector("[data-phone-secs]");
    const pLeft = document.querySelector("[data-phone-left]");
    const pBar = document.querySelector("[data-phone-bar]");
    let lastStep = -1;
    const tick = () => {
      const now = Date.now() / 1000;
      const step = Math.floor(now / period);
      const left = Math.ceil(period - (now % period));
      secs.textContent = `${left}s`;
      bar.style.width = `${(left / period) * 100}%`;
      if (pDigits) {
        pSecs.textContent = `${left}s`; pLeft.textContent = `${left}s`;
        pBar.style.width = `${(left / period) * 100}%`;
        // The phone shows the code a step ahead of the gallery card, so the two never match.
        const phoneCode = codeFor(step + 7);
        if (pDigits.textContent !== phoneCode) pDigits.textContent = phoneCode;
      }
      if (step !== lastStep) {
        lastStep = step;
        if (reduceMotion) { digits.textContent = codeFor(step); return; }
        digits.style.opacity = "0";
        setTimeout(() => { digits.textContent = codeFor(step); digits.style.opacity = "1"; }, 200);
      }
    };
    tick();
    setInterval(tick, 1000);
  }
})();
