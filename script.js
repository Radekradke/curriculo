/* =========================================================================
   Interações da página
   1. Revelação dos blocos conforme entram na tela
   2. Sombra do cabeçalho ao rolar
   3. Destaque do item de menu da seção visível
   Tudo respeita a preferência de movimento reduzido do sistema.
   ========================================================================= */

(function () {
  "use strict";

  var reduzirMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* 1. Revelação progressiva ------------------------------------------- */
  var blocos = document.querySelectorAll(
    ".apresentacao-etiqueta, .apresentacao-titulo, .apresentacao-texto, .retrato, " +
    ".indicador, .secao-cabecalho, .projeto, .projeto-extra, .area, .graduacao, .cursos, " +
    ".contato-chamada, .contato-lista li"
  );

  if (!reduzirMovimento && "IntersectionObserver" in window) {
    blocos.forEach(function (bloco, indice) {
      bloco.classList.add("revelar");
      bloco.style.transitionDelay = (indice % 4) * 70 + "ms";
    });

    var observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (entrada.isIntersecting) {
          entrada.target.classList.add("visivel");
          observador.unobserve(entrada.target);
        }
      });
    }, { threshold: 0, rootMargin: "0px 0px -6% 0px" });

    blocos.forEach(function (bloco) {
      observador.observe(bloco);
    });

    /* Rede de segurança: nada pode ficar invisível por falha do observador. */
    window.setTimeout(function () {
      blocos.forEach(function (bloco) {
        var caixa = bloco.getBoundingClientRect();
        if (caixa.top < window.innerHeight) {
          bloco.classList.add("visivel");
        }
      });
    }, 1200);
  }

  /* 2. Cabeçalho ao rolar ---------------------------------------------- */
  var cabecalho = document.querySelector(".cabecalho");

  function atualizarCabecalho() {
    if (!cabecalho) return;
    cabecalho.classList.toggle("fixado", window.scrollY > 24);
  }

  atualizarCabecalho();
  window.addEventListener("scroll", atualizarCabecalho, { passive: true });

  /* 3. Menu ativo conforme a seção ------------------------------------- */
  var links = Array.prototype.slice.call(document.querySelectorAll(".navegacao a[href^='#']"));
  var secoes = links
    .map(function (link) {
      return document.querySelector(link.getAttribute("href"));
    })
    .filter(Boolean);

  if (secoes.length && "IntersectionObserver" in window) {
    var observadorMenu = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (!entrada.isIntersecting) return;
        links.forEach(function (link) {
          link.classList.toggle(
            "ativo",
            link.getAttribute("href") === "#" + entrada.target.id
          );
        });
      });
    }, { threshold: 0, rootMargin: "-45% 0px -50% 0px" });

    secoes.forEach(function (secao) {
      observadorMenu.observe(secao);
    });
  }
})();
