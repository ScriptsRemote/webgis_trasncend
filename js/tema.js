/* =============================================================================
   tema.js — claro (padrão) o escuro. Mismo patrón de la Plataforma AmbGEO:
   carga en el <head> para que la página nazca con el tema elegido, sin parpadeo.
   ========================================================================== */
(function () {
  const CHAVE = 'transcend-webgis:tema';
  function escolhido() {
    try { return localStorage.getItem(CHAVE) === 'escuro' ? 'escuro' : 'claro'; } catch (e) { return 'claro'; }
  }
  function aplicar(tema) {
    document.documentElement.dataset.tema = tema;
    document.querySelectorAll('[data-alternar-tema]').forEach((b) => b.setAttribute('aria-pressed', String(tema === 'escuro')));
  }
  aplicar(escolhido());
  document.addEventListener('DOMContentLoaded', () => {
    aplicar(escolhido());
    document.addEventListener('click', (e) => {
      if (!e.target.closest('[data-alternar-tema]')) return;
      const novo = document.documentElement.dataset.tema === 'escuro' ? 'claro' : 'escuro';
      try { localStorage.setItem(CHAVE, novo); } catch (err) { /* sin almacenamiento: vale solo en esta visita */ }
      aplicar(novo);
    });
  });
}());
