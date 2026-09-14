/* ============================================================
   Animated Gradient
   Fundo animado em canvas 2D, leve e sem dependencias.

   Uso:
     <canvas class="animated-gradient" data-preset="Prism"></canvas>

   Presets: Lava | Prism | Plasma | Pulse | Vortex | Mist
   ============================================================ */

(function () {
  "use strict";

  const PRESETS = {
    Lava: {
      colors: ["#1E69D9", "#4BA7F7", "#A5E0FE"],
      count: 5, speed: 0.18, motion: "rise",
      size: [0.40, 0.75], alpha: 0.55
    },
    Prism: {
      colors: ["#1E69D9", "#7C5CFF", "#39D0D8", "#A5E0FE"],
      count: 6, speed: 0.30, motion: "drift",
      size: [0.32, 0.60], alpha: 0.45
    },
    Plasma: {
      colors: ["#0B3E91", "#1E69D9", "#A5E0FE"],
      count: 4, speed: 0.55, motion: "wobble",
      size: [0.45, 0.85], alpha: 0.50
    },
    Pulse: {
      colors: ["#1E69D9", "#A5E0FE", "#4BA7F7"],
      count: 3, speed: 0.40, motion: "pulse",
      size: [0.38, 0.70], alpha: 0.50
    },
    Vortex: {
      colors: ["#1E69D9", "#4BA7F7", "#A5E0FE", "#7C5CFF"],
      count: 6, speed: 0.45, motion: "orbit",
      size: [0.28, 0.55], alpha: 0.45
    },
    Mist: {
      colors: ["#A5E0FE", "#DCEEFF", "#1E69D9"],
      count: 5, speed: 0.12, motion: "drift",
      size: [0.50, 0.90], alpha: 0.32
    }
  };

  const reduceMotion =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function rgba(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  class AnimatedGradient {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");

      /* O canvas e renderizado em baixa resolucao e esticado por CSS
         com blur: fica suave e custa quase nada de GPU/CPU. */
      this.quality = 0.22;

      this.time = 0;
      this.lastTs = 0;
      this.rafId = null;
      this.visible = true;

      this.setPreset(canvas.dataset.preset || "Prism");
      this.resize();
      this.bind();
      this.start();
    }

    setPreset(name) {
      this.presetName = PRESETS[name] ? name : "Prism";
      this.preset = PRESETS[this.presetName];
      this.canvas.dataset.preset = this.presetName;
      this.buildBlobs();
      if (reduceMotion) this.draw();
    }

    buildBlobs() {
      const p = this.preset;
      this.blobs = [];

      for (let i = 0; i < p.count; i++) {
        this.blobs.push({
          bx: rand(0.05, 0.95),
          by: rand(0.05, 0.95),
          r: rand(p.size[0], p.size[1]),
          orbit: rand(0.15, 0.42),
          phase: rand(0, Math.PI * 2),
          freq: rand(0.7, 1.4),
          color: p.colors[i % p.colors.length]
        });
      }
    }

    resize() {
      const rect = this.canvas.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width * this.quality));
      const h = Math.max(1, Math.round(rect.height * this.quality));

      if (this.canvas.width !== w || this.canvas.height !== h) {
        this.canvas.width = w;
        this.canvas.height = h;
      }
      this.draw();
    }

    bind() {
      let t;
      this.onResize = () => {
        clearTimeout(t);
        t = setTimeout(() => this.resize(), 150);
      };
      window.addEventListener("resize", this.onResize);

      /* Pausa quando sai da tela ou quando a aba perde o foco. */
      if ("IntersectionObserver" in window) {
        this.io = new IntersectionObserver((entries) => {
          this.visible = entries[0].isIntersecting;
          this.visible ? this.start() : this.stop();
        }, { threshold: 0 });
        this.io.observe(this.canvas);
      }

      document.addEventListener("visibilitychange", () => {
        document.hidden || !this.visible ? this.stop() : this.start();
      });
    }

    position(blob, t) {
      const m = this.preset.motion;

      switch (m) {
        case "rise": {
          const y = (((blob.by - t * 0.09) % 1.4) + 1.4) % 1.4 - 0.2;
          return {
            x: blob.bx + Math.sin(t * 0.8 + blob.phase) * 0.12,
            y: y,
            r: blob.r
          };
        }
        case "wobble":
          return {
            x: blob.bx + Math.sin(t * 1.2 * blob.freq + blob.phase) * 0.30,
            y: blob.by + Math.sin(t * 0.9 * blob.freq + blob.phase * 2) * 0.30,
            r: blob.r * (1 + Math.sin(t * 1.1 + blob.phase) * 0.15)
          };
        case "pulse":
          return {
            x: blob.bx,
            y: blob.by,
            r: blob.r * (1 + Math.sin(t * 1.6 + blob.phase) * 0.35)
          };
        case "orbit": {
          const a = t * 0.6 * blob.freq + blob.phase;
          return {
            x: 0.5 + Math.cos(a) * blob.orbit,
            y: 0.5 + Math.sin(a) * blob.orbit * 0.7,
            r: blob.r
          };
        }
        default: /* drift */
          return {
            x: blob.bx + Math.sin(t * 0.50 * blob.freq + blob.phase) * 0.25,
            y: blob.by + Math.cos(t * 0.42 * blob.freq + blob.phase * 1.3) * 0.25,
            r: blob.r
          };
      }
    }

    draw() {
      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;
      const min = Math.min(w, h);
      const alpha = this.preset.alpha;

      ctx.clearRect(0, 0, w, h);

      for (const blob of this.blobs) {
        const p = this.position(blob, this.time);
        const x = p.x * w;
        const y = p.y * h;
        const r = Math.max(1, p.r * min);

        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, rgba(blob.color, alpha));
        g.addColorStop(0.55, rgba(blob.color, alpha * 0.45));
        g.addColorStop(1, rgba(blob.color, 0));

        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    start() {
      if (this.rafId !== null || reduceMotion || !this.visible) return;

      this.lastTs = 0;
      const loop = (ts) => {
        if (!this.lastTs) this.lastTs = ts;
        const dt = Math.min((ts - this.lastTs) / 1000, 0.05);
        this.lastTs = ts;

        this.time += dt * this.preset.speed;
        this.draw();

        this.rafId = requestAnimationFrame(loop);
      };
      this.rafId = requestAnimationFrame(loop);
    }

    stop() {
      if (this.rafId === null) return;
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  AnimatedGradient.presets = Object.keys(PRESETS);

  function init() {
    document.querySelectorAll("canvas.animated-gradient").forEach((el) => {
      el.__gradient = new AnimatedGradient(el);
    });
  }

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", init)
    : init();

  window.AnimatedGradient = AnimatedGradient;
})();
