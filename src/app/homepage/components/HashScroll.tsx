'use client';

import { useEffect } from 'react';

/**
 * Ao chegar na home vindo de outra página (ex.: /homepage#orcamento), o navegador pula para a âncora
 * antes de a página terminar de montar (fotos e seções acima ainda mudam de altura) e a seção "anda" depois.
 * Este componente refaz o posicionamento enquanto o layout se acomoda (até ~3s) e para assim que
 * a pessoa rola, toca ou digita, para nunca "brigar" com ela.
 */
export default function HashScroll() {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.replace('#', ''));
    if (!id) return;

    const html = document.documentElement;
    const prevBehavior = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto'; // sem rolagem suave: a animação seria interrompida a cada ajuste

    let done = false;
    const place = () => {
      const el = document.getElementById(id);
      if (!el) return;
      const header = document.querySelector('header');
      const offset = header ? header.getBoundingClientRect().height + 8 : 96;
      const top = Math.max(0, el.getBoundingClientRect().top + window.scrollY - offset);
      if (Math.abs(window.scrollY - top) > 2) window.scrollTo(0, top);
    };

    const stop = () => {
      if (done) return;
      done = true;
      ro.disconnect();
      window.clearTimeout(timer);
      window.removeEventListener('load', place);
      ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach((t) => window.removeEventListener(t, stop));
      html.style.scrollBehavior = prevBehavior;
    };

    // Reposiciona sempre que a altura da página muda (imagens carregando, seções montando)
    const ro = new ResizeObserver(place);
    ro.observe(document.body);
    window.addEventListener('load', place);
    ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach((t) =>
      window.addEventListener(t, stop, { passive: true }),
    );
    const timer = window.setTimeout(stop, 3000);
    place();

    return stop;
  }, []);

  return null;
}
