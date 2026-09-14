/* ============================================================
   Efeitos de texto — Randomized Text + Signature
   Sem dependencias. Dispara quando o elemento entra na tela.
   ============================================================ */

(function () {
  "use strict";

  const reduceMotion =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Randomized Text ----------
     Quebra o texto em palavras e revela cada uma numa ordem
     embaralhada, em vez da esquerda pra direita.

     Uso: <p class="randomized-text" data-delay="0.2">...</p>
     ------------------------------------------------------- */

  function splitWords(element) {
    const words = [];

    /* percorre os filhos pra nao destruir <br>, <strong> etc. */
    Array.from(element.childNodes).forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();

        node.textContent.split(/(\s+)/).forEach((part) => {
          if (part === "") return;

          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(part));
            return;
          }

          const span = document.createElement("span");
          span.className = "rt-word";
          span.textContent = part;

          frag.appendChild(span);
          words.push(span);
        });

        element.replaceChild(frag, node);
        return;
      }

      if (node.nodeType === Node.ELEMENT_NODE && node.tagName !== "BR") {
        /* elementos com texto dentro (ex: <strong>) viram uma palavra so */
        node.classList.add("rt-word");
        words.push(node);
      }
    });

    return words;
  }

  function shuffle(list) {
    const out = list.slice();

    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = out[i];
      out[i] = out[j];
      out[j] = tmp;
    }
    return out;
  }

  function setupRandomizedText(element) {
    const words = splitWords(element);
    if (!words.length) return;

    const base = parseFloat(element.dataset.delay) || 0.2;
    const step = parseFloat(element.dataset.step) || 0.055;

    /* o atraso e sorteado, o texto nao aparece em ordem de leitura */
    shuffle(words).forEach((word, i) => {
      word.style.transitionDelay = (base + i * step).toFixed(3) + "s";
    });

    if (reduceMotion) {
      words.forEach((w) => w.classList.add("is-in"));
      return;
    }

    onceInView(element, 0.35, () => {
      words.forEach((w) => w.classList.add("is-in"));
    });
  }


  /* ---------- Signature ---------- */

  function setupSignature(element) {
    if (reduceMotion) {
      element.classList.add("is-in");
      return;
    }
    onceInView(element, 0.5, () => element.classList.add("is-in"));
  }


  /* ---------- Helper ---------- */

  function onceInView(element, threshold, callback) {
    if (!("IntersectionObserver" in window)) {
      callback();
      return;
    }

    let pronto = false;

    function revelar() {
      if (pronto) return;
      pronto = true;

      io.disconnect();
      window.removeEventListener("load", checarSePassou);
      callback();
    }

    /* O observer so avisa quando o estado muda. Se a pagina abrir ja abaixo
       da secao (link de ancora, ex: #contato), ela nunca entra na tela e o
       texto ficaria invisivel pra sempre — entao checamos na mao tambem.
       Vale checar de novo depois do load: antes disso as imagens ainda nao
       tem altura e a posicao da secao muda. */
    function checarSePassou() {
      if (element.getBoundingClientRect().bottom < 0) revelar();
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) revelar();
      });
    }, { threshold: threshold });

    io.observe(element);

    checarSePassou();

    if (document.readyState === "complete") {
      setTimeout(checarSePassou, 300);
    } else {
      window.addEventListener("load", () => setTimeout(checarSePassou, 300));
      window.addEventListener("load", checarSePassou);
    }
  }


  /* ---------- Init ---------- */

  function init() {
    document.querySelectorAll(".randomized-text").forEach(setupRandomizedText);
    document.querySelectorAll(".signature").forEach(setupSignature);
  }

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", init)
    : init();
})();
