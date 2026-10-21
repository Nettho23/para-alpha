'use strict';
(() => {
  const music = document.getElementById('birthday-music');
  const controls = Array.from(document.querySelectorAll('[data-music-control]'));
  const feedback = document.getElementById('music-feedback');
  if (!music || !controls.length) return;
  let request = 0;
  let pending = false;
  let started = false;
  let state = 'ready';
  music.volume = .8;

  function render(next) {
    state = next;
    const playing = next === 'playing';
    controls.forEach((button) => {
      const compact = button.id === 'music-toggle';
      let label = compact ? 'Las Mañanitas' : 'Escuchar Las Mañanitas';
      if (next === 'loading') label = 'Cargando música…';
      else if (playing) label = 'Pausar música';
      else if (next === 'paused' && started) label = 'Continuar música';
      else if (next === 'ended') label = compact ? 'Volver a escuchar' : 'Escuchar otra vez';
      else if (next === 'error') label = 'Reintentar música';
      button.dataset.state = next;
      button.setAttribute('aria-pressed', String(playing));
      button.setAttribute('aria-label', playing ? 'Pausar Las Mañanitas' : next === 'loading' ? 'Cancelar la carga de Las Mañanitas' : label + (compact ? ', Las Mañanitas' : ''));
      button.querySelector('[data-music-label]').textContent = label;
      button.querySelector('.music-symbol').textContent = playing ? 'Ⅱ' : '♪';
    });
  }

  function showError() {
    pending = false;
    feedback.textContent = 'No se pudo iniciar la música. Toca de nuevo para intentarlo.';
    feedback.hidden = false;
    render('error');
    window.AlphaGarden?.refreshLayout();
  }

  async function toggleMusic() {
    const current = ++request;
    feedback.hidden = true;
    if (pending || !music.paused) {
      pending = false;
      music.pause();
      render(started ? 'paused' : 'ready');
      return;
    }
    if (music.error) music.load();
    if (music.ended) music.currentTime = 0;
    pending = true;
    render('loading');
    try {
      // Se inicia directamente con el toque para funcionar también en móviles.
      await music.play();
      if (current !== request) return;
      pending = false;
      started = true;
      render('playing');
    } catch (error) {
      if (current !== request || error.name === 'AbortError') return;
      showError();
    }
  }

  controls.forEach((button) => {
    button.hidden = false;
    button.addEventListener('click', toggleMusic);
  });
  music.addEventListener('playing', () => { pending = false; started = true; feedback.hidden = true; render('playing'); });
  music.addEventListener('pause', () => { pending = false; if (state !== 'error' && !music.ended) render(started ? 'paused' : 'ready'); });
  music.addEventListener('ended', () => { pending = false; render('ended'); });
  music.addEventListener('error', showError);
  window.addEventListener('pagehide', () => { request++; pending = false; music.pause(); });
  music.hidden = true;
  render('ready');
  window.AlphaGarden?.refreshLayout();
})();
