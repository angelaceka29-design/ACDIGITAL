/**
 * Champ de cubes isométriques animé (canvas 2D).
 * - Sert de fond génératif quand la vidéo du hero n'est pas disponible.
 * - Sert aussi à produire la vidéo/poster de marque (scripts/render-hero.mjs) :
 *   l'animation est parfaitement périodique (PERIOD secondes) pour une boucle sans couture.
 */

const TAU = Math.PI * 2;

const PALETTE = {
  top: [41, 41, 50],
  left: [13, 13, 18],
  right: [23, 23, 30],
  glow: [124, 108, 255],
  cool: [61, 123, 255],
};

function mix(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

function rgb(c) {
  return `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
}

export function createCubeField(canvas, options = {}) {
  const ctx = canvas.getContext('2d', { alpha: false });
  const cfg = {
    grid: 26,
    period: 8,
    resolution: 1,
    fps: 60,
    interactive: false,
    ...options,
  };

  let width = 0;
  let height = 0;
  let tile = 0;
  let originX = 0;
  let originY = 0;
  let raf = 0;
  let running = false;
  let lastFrame = 0;
  let startTime = 0;
  const focus = { x: 0.62, y: 0.46, tx: 0.62, ty: 0.46 };

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const cssW = Math.max(1, rect.width || canvas.width);
    const cssH = Math.max(1, rect.height || canvas.height);
    width = Math.round(cssW * cfg.resolution);
    height = Math.round(cssH * cfg.resolution);
    canvas.width = width;
    canvas.height = height;
    // Le losange de la grille doit contenir tout le rectangle : n·W ≥ w + 2h
    tile = ((width + height * 2) * 1.28) / cfg.grid;
    originX = width / 2;
    originY = height / 2 - ((cfg.grid - 1) * tile) / 4;
  }

  function draw(seconds) {
    const n = cfg.grid;
    const h2 = tile / 2;
    const q = tile / 4;
    const phase = (seconds / cfg.period) * TAU;
    const amp = tile * 1.35;
    const cx = (n - 1) * focus.x;
    const cy = (n - 1) * (1 - focus.y);

    ctx.fillStyle = '#080808';
    ctx.fillRect(0, 0, width, height);

    // Du fond vers l'avant : somme i + j croissante
    for (let s = 0; s <= (n - 1) * 2; s++) {
      const iStart = Math.max(0, s - (n - 1));
      const iEnd = Math.min(n - 1, s);
      for (let i = iStart; i <= iEnd; i++) {
        const j = s - i;
        const dx = i - cx;
        const dy = j - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const ripple = 0.5 + 0.5 * Math.sin(phase - dist * 0.55);
        const sweep = 0.5 + 0.5 * Math.sin(phase * 2 + (i - j) * 0.35);
        const f = ripple * 0.75 + sweep * 0.25;
        const lift = f * f * amp;

        const sx = originX + (i - j) * h2;
        const sy = originY + (i + j) * q - lift;
        const depth = lift + tile * 1.2;

        if (sx + h2 < 0 || sx - h2 > width || sy - q > height || sy + q + depth < 0) continue;

        const glow = Math.pow(f, 7);
        const shade = 0.55 + f * 0.45;
        const base = [PALETTE.top[0] * shade, PALETTE.top[1] * shade, PALETTE.top[2] * shade];
        const top = mix(mix(base, PALETTE.cool, glow * 0.3), PALETTE.glow, glow * 0.8);
        const left = mix(PALETTE.left, PALETTE.glow, glow * 0.16);
        const right = mix(PALETTE.right, PALETTE.cool, glow * 0.1);

        // Face gauche
        ctx.fillStyle = rgb(left);
        ctx.beginPath();
        ctx.moveTo(sx - h2, sy);
        ctx.lineTo(sx, sy + q);
        ctx.lineTo(sx, sy + q + depth);
        ctx.lineTo(sx - h2, sy + depth);
        ctx.closePath();
        ctx.fill();

        // Face droite
        ctx.fillStyle = rgb(right);
        ctx.beginPath();
        ctx.moveTo(sx, sy + q);
        ctx.lineTo(sx + h2, sy);
        ctx.lineTo(sx + h2, sy + depth);
        ctx.lineTo(sx, sy + q + depth);
        ctx.closePath();
        ctx.fill();

        // Face supérieure
        ctx.fillStyle = rgb(top);
        ctx.beginPath();
        ctx.moveTo(sx, sy - q);
        ctx.lineTo(sx + h2, sy);
        ctx.lineTo(sx, sy + q);
        ctx.lineTo(sx - h2, sy);
        ctx.closePath();
        ctx.fill();

        // Arête lumineuse sur les cubes les plus hauts
        if (glow > 0.2) {
          ctx.strokeStyle = `rgba(183,174,255,${(glow - 0.2) * 0.45})`;
          ctx.lineWidth = Math.max(1, tile * 0.012);
          ctx.beginPath();
          ctx.moveTo(sx - h2, sy);
          ctx.lineTo(sx, sy - q);
          ctx.lineTo(sx + h2, sy);
          ctx.stroke();
        }
      }
    }
  }

  function loop(now) {
    if (!running) return;
    raf = requestAnimationFrame(loop);
    const minDelta = 1000 / cfg.fps;
    if (now - lastFrame < minDelta - 1) return;
    lastFrame = now;
    focus.x += (focus.tx - focus.x) * 0.04;
    focus.y += (focus.ty - focus.y) * 0.04;
    draw((now - startTime) / 1000);
  }

  function onPointer(event) {
    focus.tx = 0.5 + (event.clientX / window.innerWidth - 0.5) * 0.35;
    focus.ty = 0.5 + (event.clientY / window.innerHeight - 0.5) * 0.35;
  }

  resize();

  return {
    renderAt(seconds) {
      draw(seconds);
    },
    resize() {
      resize();
      if (!running) draw(0);
    },
    start() {
      if (running) return;
      running = true;
      if (!startTime) startTime = performance.now();
      if (cfg.interactive) window.addEventListener('pointermove', onPointer, { passive: true });
      raf = requestAnimationFrame(loop);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onPointer);
    },
    get running() {
      return running;
    },
  };
}
