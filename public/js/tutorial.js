/* =============================================================================
   tutorial.js — TRANSCEND WebGIS
   Guía de uso en 6 pasos (ventana con imágenes de la plataforma). Se abre sola
   en la primera visita; el botón «?» del encabezado la abre de nuevo.
   Imágenes: assets/tutorial/{es|en}-{1..6}.webp
   ========================================================================== */
(function () {
  'use strict';

  const APP = window.TRANSCEND_APP;
  const esc = APP.esc;
  const T = () => APP.T().tut;
  const K_VISTO = 'transcend-webgis:tutorial-visto';
  const N = 6;
  let passo = 0;

  const dlg = document.createElement('dialog');
  dlg.className = 'dlg dlg-tut';
  dlg.setAttribute('aria-labelledby', 'tut-tit');
  document.body.appendChild(dlg);
  const img = (i) => `assets/tutorial/${APP.lang()}-${i + 1}.webp`;

  function render() {
    const t = T(), s = t.steps[passo], ultimo = passo === N - 1;
    dlg.innerHTML = `
      <div class="tut">
        <button type="button" class="tut-x" data-t="fechar" title="${esc(t.close)}" aria-label="${esc(t.close)}">×</button>
        <figure class="tut-fig"><img src="${img(passo)}" alt="${esc(s.alt)}" width="1100" height="700"></figure>
        <div class="tut-corpo" aria-live="polite">
          <span class="tut-num">${esc(t.stepOf.replace('{n}', passo + 1).replace('{t}', N))}</span>
          <h3 id="tut-tit">${esc(s.t)}</h3>
          <p>${s.d}</p>
        </div>
        <div class="tut-pe">
          <div class="tut-pontos" role="group" aria-label="${esc(t.pages)}">${t.steps.map((x, i) => `
            <button type="button" class="tut-ponto${i === passo ? ' is-on' : ''}" data-t="ir" data-i="${i}"
              aria-label="${esc(t.stepOf.replace('{n}', i + 1).replace('{t}', N))}"${i === passo ? ' aria-current="step"' : ''}></button>`).join('')}
          </div>
          <div class="tut-botoes">
            ${passo > 0
              ? `<button type="button" class="btn btn-sec" data-t="voltar">${esc(t.back)}</button>`
              : `<button type="button" class="btn btn-sec" data-t="fechar">${esc(t.skip)}</button>`}
            <button type="button" class="btn" data-t="${ultimo ? 'fechar' : 'avancar'}">${esc(ultimo ? t.done : t.next)}</button>
          </div>
        </div>
      </div>`;
    if (!ultimo) new Image().src = img(passo + 1);   // precarga la próxima imagen
    const principal = dlg.querySelector('.tut-botoes .btn:last-child');
    if (principal) principal.focus();
  }

  function ir(i) { passo = Math.max(0, Math.min(N - 1, i)); render(); }
  function abrir(i = 0) { passo = i; render(); if (!dlg.open) dlg.showModal(); }

  dlg.addEventListener('click', (e) => {
    const b = e.target.closest('[data-t]');
    if (!b) { if (e.target === dlg) dlg.close(); return; }   // clic fuera de la ventana
    const a = b.dataset.t;
    if (a === 'avancar') ir(passo + 1);
    else if (a === 'voltar') ir(passo - 1);
    else if (a === 'ir') ir(+b.dataset.i);
    else if (a === 'fechar') dlg.close();
  });
  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); ir(passo + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); ir(passo - 1); }
  });
  dlg.addEventListener('close', () => { try { localStorage.setItem(K_VISTO, '1'); } catch (e) { /* */ } });

  document.getElementById('btn-ajuda').addEventListener('click', () => abrir(0));
  document.addEventListener('transcend:lang', () => { if (dlg.open) render(); });

  // Primera visita: se abre cuando el mapa terminó de cargar
  let visto = false;
  try { visto = localStorage.getItem(K_VISTO) === '1'; } catch (e) { /* */ }
  if (!visto) {
    if (document.getElementById('carregando-app').hidden) abrir();
    else document.addEventListener('transcend:pronto', () => abrir(), { once: true });
  }
  window.TRANSCEND_TUTORIAL = abrir;
}());
