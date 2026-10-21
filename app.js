'use strict';
(() => {
  const $ = (selector) => document.querySelector(selector);
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let motionPaused = motionPreference.matches;
  let letterOpening = false;
  let flowerSelection = -1;
  let animationFrame = 0;
  let depthFrame = 0;
  const canvas = $('#petals');
  const context = canvas.getContext('2d');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const scenes = [
    {surface:$('#inicio'), stage:$('#garden-scene')},
    {surface:$('#safari'), stage:$('.safari-scene')}
  ];

  function resetStage() {
    cancelAnimationFrame(depthFrame);
    depthFrame = 0;
    scenes.forEach(({stage}) => {
      stage?.style.setProperty('--turn-x', '0deg');
      stage?.style.setProperty('--turn-y', '0deg');
      stage?.style.setProperty('--scene-shift', '0px');
    });
  }
  function queueDepth() {
    if (motionPaused || document.hidden || depthFrame) return;
    depthFrame = requestAnimationFrame(() => {
      depthFrame = 0;
      scenes.forEach(({surface,stage}) => {
        if (!surface || !stage) return;
        const bounds = surface.getBoundingClientRect();
        if (bounds.bottom < 0 || bounds.top > window.innerHeight) return;
        const distance = window.innerHeight / 2 - (bounds.top + bounds.height / 2);
        stage.style.setProperty('--scene-shift', Math.max(-10,Math.min(10,distance * .025)).toFixed(1) + 'px');
      });
    });
  }
  window.addEventListener('scroll', queueDepth, {passive:true});
  scenes.forEach(({surface,stage}) => {
    if (!surface || !stage) return;
    surface.addEventListener('pointermove', (event) => {
      if (motionPaused || !finePointer.matches || event.pointerType !== 'mouse') return;
      const bounds = surface.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
      stage.style.setProperty('--turn-x', (-y * 2).toFixed(2) + 'deg');
      stage.style.setProperty('--turn-y', (x * 3).toFixed(2) + 'deg');
    });
    surface.addEventListener('pointerleave', resetStage);
  });
  finePointer.addEventListener('change', resetStage);

  const safariSection = $('#safari');
  if ('IntersectionObserver' in window) {
    const safariObserver = new window.IntersectionObserver(([entry]) => {
      safariSection.classList.toggle('animals-active', entry.isIntersecting);
    }, {threshold:.1});
    safariObserver.observe(safariSection);
  } else safariSection.classList.add('animals-active');

  function applyMotion() {
    document.documentElement.classList.toggle('reduce-motion', motionPaused);
    $('#motion-toggle').setAttribute('aria-pressed', String(motionPaused));
    $('#motion-toggle').setAttribute('aria-label', motionPaused ? 'Activar las animaciones' : 'Pausar las animaciones');
    $('#motion-label').textContent = motionPaused ? 'Activar movimiento' : 'Pausar movimiento';
    $('#motion-toggle').firstElementChild.textContent = motionPaused ? '▷' : 'Ⅱ';
    window.AlphaGarden?.setPaused(motionPaused);
    if (motionPaused) { clearPetals(); resetStage(); }
    else queueDepth();
  }
  $('#motion-toggle').addEventListener('click', () => { motionPaused = !motionPaused; applyMotion(); });
  motionPreference.addEventListener('change', (event) => { motionPaused = event.matches; applyMotion(); });
  applyMotion();

  const envelope = $('#envelope');
  const letter = $('#letter-content');
  function openLetter() {
    if (letterOpening || !letter.hidden) return;
    letterOpening = true;
    envelope.disabled = true;
    envelope.setAttribute('aria-expanded', 'true');
    envelope.classList.add('opening');
    window.setTimeout(() => {
      envelope.hidden = true;
      letter.hidden = false;
      document.body.classList.add('letter-is-open');
      window.AlphaGarden?.refreshLayout();
      letter.focus({preventScroll:true});
      letter.scrollIntoView({block:'start', behavior:motionPaused ? 'auto' : 'smooth'});
      letterOpening = false;
      envelope.disabled = false;
    }, motionPaused ? 0 : 560);
  }
  envelope.addEventListener('click', openLetter);
  $('#open-surprise').addEventListener('click', () => {
    window.setTimeout(openLetter, motionPaused ? 0 : 350);
  });
  $('#close-letter').addEventListener('click', () => {
    letter.hidden = true;
    document.body.classList.remove('letter-is-open');
    envelope.hidden = false;
    envelope.classList.remove('opening');
    envelope.setAttribute('aria-expanded', 'false');
    window.AlphaGarden?.refreshLayout();
    envelope.focus({preventScroll:true});
    $('#carta').scrollIntoView({block:'start',behavior:motionPaused ? 'auto' : 'smooth'});
  });

  const wishes = [
    'Alpha, soy muy feliz de haberte conocido. Hoy me hacía ilusión que tuvieras algo mío para guardar. — Jaf',
    'Eres muy linda. Y esa sonrisa tuya fue una de las razones por las que me dieron tantas ganas de prepararte esto. — Jaf',
    'Me gusta pensar que todavía me quedan muchas cosas por conocer de ti. Ojalá también me toque acompañarte en más cumpleaños. — Jaf'
  ];
  document.querySelectorAll('[data-wish]').forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.wish);
      if (flowerSelection === index) return;
      flowerSelection = index;
      document.querySelectorAll('[data-wish]').forEach((other) => other.setAttribute('aria-pressed', String(other === button)));
      const message = $('#flower-message');
      message.classList.remove('changed');
      message.querySelector('p').textContent = wishes[index];
      void message.offsetWidth;
      message.classList.add('changed');
      window.AlphaGarden?.refreshLayout();
    });
  });

  const photos = Array.isArray(window.ALPHA_PHOTOS) ? window.ALPHA_PHOTOS.filter((photo) => photo && typeof photo.src === 'string' && photo.src) : [];
  const dialog = $('#photo-dialog');
  let photoIndex = 0;
  function displayPhoto(index) {
    if (!photos.length) return;
    photoIndex = (index + photos.length) % photos.length;
    const photo = photos[photoIndex];
    $('#large-photo').src = photo.src;
    $('#large-photo').alt = photo.alt || 'Una fotografía de Alpha';
    $('#photo-caption').textContent = photo.caption || 'Un momento para guardar';
    $('#photo-count').textContent = String(photoIndex + 1).padStart(2,'0') + ' / ' + String(photos.length).padStart(2,'0');
  }
  if (photos.length) {
    $('#recuerdos').hidden = false;
    $('#photos-link').hidden = false;
    const fragment = document.createDocumentFragment();
    photos.forEach((photo,index) => {
      const button = document.createElement('button');
      button.className = 'photo-card';
      button.setAttribute('aria-label', 'Ampliar fotografía ' + (index + 1) + ': ' + (photo.caption || 'Un momento para guardar'));
      const image = document.createElement('img');
      image.src = photo.src;
      image.alt = photo.alt || 'Una fotografía de Alpha';
      image.loading = 'lazy';
      image.decoding = 'async';
      if (photo.width && photo.height) {
        image.width = photo.width;
        image.height = photo.height;
      }
      const caption = document.createElement('span');
      caption.textContent = photo.caption || 'Un momento para guardar';
      button.append(image, caption);
      button.addEventListener('click', () => {
        displayPhoto(index);
        dialog.showModal();
        document.body.style.overflow = 'hidden';
        window.AlphaGarden?.setQuiet(true);
      });
      fragment.append(button);
    });
    $('#photo-grid').append(fragment);
  }
  $('#previous-photo').addEventListener('click', () => displayPhoto(photoIndex - 1));
  $('#next-photo').addEventListener('click', () => displayPhoto(photoIndex + 1));
  $('#close-photo').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { document.body.style.overflow = ''; window.AlphaGarden?.setQuiet(false); });
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') {event.preventDefault(); displayPhoto(photoIndex + 1);}
    if (event.key === 'ArrowLeft') {event.preventDefault(); displayPhoto(photoIndex - 1);}
  });
  let touchStart = null;
  $('#large-photo').addEventListener('touchstart', (event) => {
    touchStart = event.touches.length === 1 ? {x:event.touches[0].clientX,y:event.touches[0].clientY} : null;
  }, {passive:true});
  $('#large-photo').addEventListener('touchend', (event) => {
    if (!touchStart || !event.changedTouches.length) return;
    const dx = event.changedTouches[0].clientX - touchStart.x;
    const dy = event.changedTouches[0].clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      displayPhoto(photoIndex + (dx < 0 ? 1 : -1));
    }
  }, {passive:true});
  $('#large-photo').addEventListener('touchcancel', () => { touchStart = null; }, {passive:true});

  function clearPetals() {
    cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    if (context) context.clearRect(0,0,canvas.width,canvas.height);
  }
  function scatterPetals() {
    clearPetals();
    if (motionPaused || !context) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * scale;
    canvas.height = height * scale;
    context.setTransform(scale,0,0,scale,0,0);
    const colors = ['#d5a0a1','#a86679','#efd1bc','#b4b89c','#e7b6b8'];
    const petals = Array.from({length:width < 700 ? 60 : 100}, () => ({
      x:Math.random()*width,y:-Math.random()*height-20,
      speed:45+Math.random()*100,sway:15+Math.random()*35,
      angle:Math.random()*Math.PI*2,turn:(Math.random()-.5)*2,
      size:5+Math.random()*7,color:colors[Math.floor(Math.random()*colors.length)]
    }));
    const start = performance.now();
    let last = start;
    function frame(now) {
      const delta = Math.min((now-last)/1000,.05);
      last = now;
      context.clearRect(0,0,width,height);
      const elapsed = (now-start)/1000;
      for (const petal of petals) {
        petal.y += petal.speed*delta;
        petal.angle += petal.turn*delta;
        context.save();
        context.globalAlpha = Math.max(0,Math.min(.85,(8-elapsed)/2));
        context.translate(petal.x+Math.sin(elapsed+petal.angle)*petal.sway,petal.y);
        context.rotate(petal.angle);
        context.fillStyle = petal.color;
        context.beginPath();
        context.ellipse(0,0,petal.size,petal.size*.5,0,0,Math.PI*2);
        context.fill();
        context.restore();
      }
      if (elapsed < 8 && !motionPaused) animationFrame = requestAnimationFrame(frame);
      else clearPetals();
    }
    animationFrame = requestAnimationFrame(frame);
  }
  $('#make-wish').addEventListener('click', () => {
    $('#birthday-message').hidden = false;
    $('#wish-instruction').textContent = 'Guárdalo para ti. Yo te deseo de corazón que se te cumpla.';
    $('#make-wish').hidden = true;
    $('#celebrate-again').focus({preventScroll:true});
    window.AlphaGarden?.refreshLayout();
    scatterPetals();
  });
  $('#celebrate-again').addEventListener('click', scatterPetals);
  document.addEventListener('visibilitychange', () => {
    document.documentElement.classList.toggle('page-hidden', document.hidden);
    if(document.hidden) {clearPetals(); resetStage();}
  });
  window.addEventListener('resize', clearPetals, {passive:true});
})();
