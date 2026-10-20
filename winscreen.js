// The Windows 11 screens for the film, drawn on a 1600×1000 canvas that main.js maps onto the laptop
// display in the photo: lock screen → (Enter) → sign-in with the Entrix tile → PIN → "Waiting for
// iPhone approval..." → Welcome → desktop. draw(p) repaints only when what is visible changes.
const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const seg = (p, a, b, e = ease) => e(clamp((p - a) / (b - a)));

const W = 1600, H = 1000;
const FONT = '"Segoe UI Variable Display", "Segoe UI Variable", "Segoe UI", Inter, system-ui, sans-serif';
const font = (w, s) => `${w} ${s}px ${FONT}`;

export function createWinScreen(scr, { wall, wallBlur, mark, onLoad }) {
  scr.width = W; scr.height = H;
  const ctx = scr.getContext("2d");
  const imgs = {};
  let lastKey = "", ready = 0;
  const load = (k, src) => { const i = new Image(); i.onload = () => { ready++; lastKey = ""; if (onLoad) onLoad(); }; i.src = src; imgs[k] = i; };
  load("wall", wall); load("blur", wallBlur); load("mark", mark);
  const ok = (k) => imgs[k] && imgs[k].complete && imgs[k].naturalWidth > 0;

  const rr = (x, y, w, h, r) => { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); };
  const cover = (k) => { if (ok(k)) ctx.drawImage(imgs[k], 0, 0, W, H); else { ctx.fillStyle = "#0b1a4a"; ctx.fillRect(0, 0, W, H); } };

  // Windows' progress ring: five dots running round a circle
  const ring = (x, y, r, phase) => {
    ctx.fillStyle = "#fff";
    for (let i = 0; i < 5; i++) {
      const a = phase * 2.4 - i * 0.32;
      ctx.globalAlpha *= 1; ctx.beginPath(); ctx.arc(x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.16, 0, Math.PI * 2); ctx.fill();
    }
  };
  // the account picture: the Entrix mark on a warm sand disc
  const avatar = (x, y, r) => {
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.clip();
    const g = ctx.createLinearGradient(x, y - r, x, y + r); g.addColorStop(0, "#FBFAF7"); g.addColorStop(1, "#ECE7DD");
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    if (ok("mark")) { const mw = r * 1.02, mh = mw * 1.22; ctx.drawImage(imgs.mark, x - mw / 2, y - mh / 2 + r * 0.04, mw, mh); }
    ctx.restore();
  };
  const icon = {
    wifi: (x, y, s = 1) => { ctx.strokeStyle = "#fff"; ctx.lineWidth = 2.2 * s; ctx.lineCap = "round"; [14, 9, 4].forEach((r) => { ctx.beginPath(); ctx.arc(x, y + 6 * s, r * s, Math.PI * 1.25, Math.PI * 1.75); ctx.stroke(); }); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(x, y + 6 * s, 1.8 * s, 0, 7); ctx.fill(); },
    battery: (x, y, s = 1) => { ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.6 * s; rr(x - 13 * s, y - 6 * s, 24 * s, 13 * s, 3 * s); ctx.stroke(); ctx.fillStyle = "#fff"; ctx.fillRect(x + 12 * s, y - 2 * s, 2.2 * s, 5 * s); rr(x - 11 * s, y - 4 * s, 16 * s, 9 * s, 1.6 * s); ctx.fill(); },
    power: (x, y) => { ctx.strokeStyle = "#fff"; ctx.lineWidth = 2.2; ctx.lineCap = "round"; ctx.beginPath(); ctx.arc(x, y, 10, -Math.PI * 0.32, Math.PI * 1.32); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, y - 13); ctx.lineTo(x, y - 2); ctx.stroke(); },
    access: (x, y) => { ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 12, 0, 7); ctx.stroke(); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(x, y - 6, 2.2, 0, 7); ctx.fill(); ctx.beginPath(); ctx.moveTo(x - 7, y - 2); ctx.lineTo(x + 7, y - 2); ctx.moveTo(x, y - 2); ctx.lineTo(x, y + 3); ctx.lineTo(x - 4, y + 8); ctx.moveTo(x, y + 3); ctx.lineTo(x + 4, y + 8); ctx.stroke(); },
    speaker: (x, y) => { ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.moveTo(x - 8, y - 3); ctx.lineTo(x - 4, y - 3); ctx.lineTo(x + 1, y - 8); ctx.lineTo(x + 1, y + 8); ctx.lineTo(x - 4, y + 3); ctx.lineTo(x - 8, y + 3); ctx.fill(); ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(x + 2, y, 6, -0.8, 0.8); ctx.stroke(); },
  };

  function lockScreen(a, slide) {
    ctx.save(); ctx.globalAlpha = a; ctx.translate(0, -slide * H);
    cover("wall");
    const g = ctx.createLinearGradient(0, 0, 0, H * 0.45); g.addColorStop(0, "rgba(0,0,0,0.18)"); g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.font = font(600, 168); ctx.fillText("9:41", W / 2, 262);
    ctx.font = font(500, 34); ctx.fillText("Monday, October 19", W / 2, 322);
    icon.wifi(1490, 948, 1.1); icon.battery(1544, 956, 1.1);
    ctx.restore();
  }

  function signIn(a, st) {
    ctx.save(); ctx.globalAlpha = a;
    cover("blur");
    ctx.fillStyle = "rgba(0,0,0,0.12)"; ctx.fillRect(0, 0, W, H);
    avatar(W / 2, 330, 104);
    ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.font = font(600, 38); ctx.fillText("Alex", W / 2, 488);
    const fieldA = 1 - st.entered;
    if (fieldA > 0) {
      ctx.globalAlpha = a * fieldA;
      const fx = W / 2 - 170, fy = 520, fw = 340, fh = 44;
      ctx.fillStyle = "rgba(255,255,255,0.09)"; rr(fx, fy, fw, fh, 5); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.32)"; ctx.lineWidth = 1.2; rr(fx, fy, fw, fh, 5); ctx.stroke();
      ctx.fillStyle = "#fff"; ctx.fillRect(fx + 2, fy + fh - 2.5, fw - 4, 2.5);
      if (st.dots === 0) { ctx.textAlign = "left"; ctx.fillStyle = "rgba(255,255,255,0.62)"; ctx.font = font(400, 19); ctx.fillText("Entrix PIN", fx + 14, fy + 29); }
      ctx.fillStyle = "#fff";
      for (let d = 0; d < st.dots; d++) { ctx.beginPath(); ctx.arc(fx + 22 + d * 22, fy + fh / 2, 5.5, 0, 7); ctx.fill(); }
      ctx.fillStyle = st.dots >= 6 ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.1)"; rr(fx + fw - 40, fy + 6, 32, 32, 4); ctx.fill();
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(fx + fw - 32, fy + 22); ctx.lineTo(fx + fw - 16, fy + 22); ctx.moveTo(fx + fw - 22, fy + 16); ctx.lineTo(fx + fw - 16, fy + 22); ctx.lineTo(fx + fw - 22, fy + 28); ctx.stroke();
      ctx.textAlign = "center"; ctx.fillStyle = "rgba(255,255,255,0.88)"; ctx.font = font(400, 18); ctx.fillText("Sign-in options", W / 2, 606);
    }
    if (st.entered > 0) {
      ctx.globalAlpha = a * st.entered;
      ctx.textAlign = "left"; ctx.font = font(400, 22); ctx.fillStyle = "#fff";
      const msg = `Waiting for iPhone approval... (${st.secs}s)`;
      const tw = ctx.measureText(msg).width, x0 = W / 2 - (tw + 44) / 2;
      ring(x0 + 12, 542, 13, st.phase);
      ctx.fillText(msg, x0 + 44, 550);
    }
    // the accounts on this PC, bottom left
    ctx.globalAlpha = a; ctx.textAlign = "left";
    ctx.fillStyle = "rgba(255,255,255,0.16)"; rr(36, 846, 250, 58, 6); ctx.fill();
    avatar(68, 875, 19);
    ctx.fillStyle = "#fff"; ctx.font = font(500, 19); ctx.fillText("Alex", 98, 882);
    ctx.beginPath(); ctx.fillStyle = "rgba(255,255,255,0.32)"; ctx.arc(68, 935, 19, 0, 7); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.font = font(400, 19); ctx.fillText("Other user", 98, 942);
    // bottom right: network, accessibility, power
    icon.wifi(1446, 942); icon.access(1500, 946); icon.power(1552, 948);
    ctx.restore();
  }

  function welcome(a, st) {
    ctx.save(); ctx.globalAlpha = a;
    cover("blur"); ctx.fillStyle = "rgba(0,0,0,0.12)"; ctx.fillRect(0, 0, W, H);
    avatar(W / 2, 360, 104);
    ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.font = font(600, 38); ctx.fillText("Alex", W / 2, 518);
    ctx.font = font(400, 24); ctx.textAlign = "left";
    ring(W / 2 - 62, 572, 12, st.phase); ctx.fillText("Welcome", W / 2 - 36, 580);
    ctx.restore();
  }

  function desktop(a) {
    ctx.save(); ctx.globalAlpha = a;
    cover("wall");
    // desktop icons
    const deskIcon = (y, label, draw) => {
      draw(70, y);
      ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.font = font(400, 15);
      ctx.shadowColor = "rgba(0,0,0,0.6)"; ctx.shadowBlur = 4; ctx.fillText(label, 70, y + 52); ctx.shadowBlur = 0;
    };
    deskIcon(60, "Recycle Bin", (x, y) => { ctx.fillStyle = "rgba(220,235,255,0.92)"; rr(x - 17, y + 2, 34, 36, 4); ctx.fill(); ctx.fillStyle = "rgba(160,190,230,1)"; ctx.fillRect(x - 21, y - 4, 42, 6); });
    deskIcon(150, "This PC", (x, y) => { ctx.fillStyle = "#3a8ee6"; rr(x - 22, y, 44, 30, 3); ctx.fill(); ctx.fillStyle = "#cfe6ff"; ctx.fillRect(x - 6, y + 32, 12, 5); ctx.fillRect(x - 13, y + 37, 26, 3); });
    // taskbar
    const tb = 64, ty = H - tb;
    ctx.fillStyle = "rgba(28,30,40,0.82)"; ctx.fillRect(0, ty, W, tb);
    ctx.fillStyle = "rgba(255,255,255,0.08)"; ctx.fillRect(0, ty, W, 1);
    const cy = ty + tb / 2;
    const items = ["start", "search", "files", "browser", "store", "settings"];
    const widths = { start: 48, search: 190, files: 48, browser: 48, store: 48, settings: 48 };
    const total = items.reduce((s, k) => s + widths[k] + 6, 0);
    let x = W / 2 - total / 2;
    for (const k of items) {
      const w = widths[k], mx = x + w / 2;
      if (k === "start") { const s = 9.5, gp = 2; [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([i, j]) => { const gr = ctx.createLinearGradient(mx - 11, cy - 11, mx + 11, cy + 11); gr.addColorStop(0, "#5fc3ff"); gr.addColorStop(1, "#1a74e8"); ctx.fillStyle = gr; ctx.fillRect(mx + (i < 0 ? -s - gp / 2 : gp / 2), cy + (j < 0 ? -s - gp / 2 : gp / 2), s, s); }); }
      if (k === "search") { ctx.fillStyle = "rgba(255,255,255,0.1)"; rr(x, cy - 18, w, 36, 18); ctx.fill(); ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x + 24, cy - 2, 7, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x + 29, cy + 3); ctx.lineTo(x + 34, cy + 8); ctx.stroke(); ctx.fillStyle = "rgba(255,255,255,0.8)"; ctx.font = font(400, 16); ctx.textAlign = "left"; ctx.fillText("Search", x + 46, cy + 6); }
      if (k === "files") { ctx.fillStyle = "#f6c343"; rr(mx - 14, cy - 9, 28, 20, 3); ctx.fill(); ctx.fillStyle = "#e9a91f"; rr(mx - 14, cy - 13, 12, 6, 2); ctx.fill(); }
      if (k === "browser") { const gr = ctx.createLinearGradient(mx - 13, cy - 13, mx + 13, cy + 13); gr.addColorStop(0, "#35c46b"); gr.addColorStop(0.5, "#1fa1e8"); gr.addColorStop(1, "#1557d6"); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(mx, cy, 13, 0, 7); ctx.fill(); ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.beginPath(); ctx.arc(mx + 3, cy + 2, 5, 0, 7); ctx.fill(); }
      if (k === "store") { ctx.fillStyle = "#2b2b33"; rr(mx - 13, cy - 8, 26, 21, 3); ctx.fill(); [["#f35325", -6, -2], ["#81bc06", 1, -2], ["#05a6f0", -6, 5], ["#ffba08", 1, 5]].forEach(([c, dx, dy]) => { ctx.fillStyle = c; ctx.fillRect(mx + dx, cy + dy, 5.5, 5.5); }); ctx.strokeStyle = "#cfd2da"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(mx, cy - 9, 5, Math.PI, 0); ctx.stroke(); }
      if (k === "settings") { ctx.strokeStyle = "#c8ccd6"; ctx.lineWidth = 4.5; ctx.setLineDash([3.2, 2.6]); ctx.beginPath(); ctx.arc(mx, cy, 10, 0, 7); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = "#c8ccd6"; ctx.beginPath(); ctx.arc(mx, cy, 4.5, 0, 7); ctx.fill(); }
      x += w + 6;
    }
    // system tray: Entrix in the tray, network, sound, battery, clock
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(1268, cy + 3); ctx.lineTo(1274, cy - 3); ctx.lineTo(1280, cy + 3); ctx.stroke();
    if (ok("mark")) ctx.drawImage(imgs.mark, 1296, cy - 11, 18, 22);
    icon.wifi(1348, cy - 4, 0.9); icon.speaker(1384, cy); icon.battery(1420, cy, 0.9);
    ctx.fillStyle = "#fff"; ctx.textAlign = "right"; ctx.font = font(400, 15);
    ctx.fillText("9:42 AM", 1556, cy - 3); ctx.fillText("10/19/2026", 1556, cy + 17);
    ctx.restore();
  }

  function draw(p) {
    const st = {
      lock: 1 - seg(p, 20.5, 22),
      dots: [22.6, 23.8, 24.9, 26.4, 27.7, 29.0].filter((s) => p >= s).length,
      entered: seg(p, 31.2, 32.6),
      secs: Math.round(88 - 28 * clamp((p - 32) / 48)),
      phase: p * 3,
      welcome: seg(p, 85.5, 86.5) * (1 - seg(p, 89.5, 90.8)),
      desk: seg(p, 89.5, 90.8),
    };
    const key = JSON.stringify(st, (k, v) => (typeof v === "number" ? Math.round(v * 40) / 40 : v)) + ready;
    if (key === lastKey) return false;
    lastKey = key;
    ctx.globalAlpha = 1; ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    if (st.desk < 1 && st.welcome < 1) {
      if (st.lock < 1) signIn(1, st);
      if (st.lock > 0) lockScreen(1, 1 - st.lock);
    }
    if (st.welcome > 0) welcome(st.welcome, st);
    if (st.desk > 0) desktop(st.desk);
    // a faint glass sheen
    ctx.globalAlpha = 1;
    const gl = ctx.createLinearGradient(0, 0, W, H); gl.addColorStop(0, "rgba(255,255,255,0.05)"); gl.addColorStop(0.4, "rgba(255,255,255,0)");
    ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);
    return true;
  }
  return { draw };
}
