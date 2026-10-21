'use strict';
(() => {
  const rain = document.getElementById('flower-rain');
  const rainContext = rain?.getContext('2d');
  const traveler = document.getElementById('roaming-giraffe');
  const walkCanvas = document.getElementById('giraffe-walk');
  const walkContext = walkCanvas?.getContext('2d');
  if (!rainContext || !walkContext || !traveler) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const flowerSprites = [];
  const footprints = [];
  const path = [[.08,.85],[.82,.67],[.72,.14],[.17,.32],[.06,.61],[.86,.35],[.52,.88],[.10,.08]];
  const walker = {x:0,y:0,targetX:0,targetY:0,direction:1,stride:0,rest:0,next:1,stepTime:0};
  let flowers = [];
  let paused = reducedMotion.matches;
  let quiet = false;
  let animation = 0;
  let lastTime = 0;
  let width = 0;
  let height = 0;
  let ratio = 1;
  let travelerSize = 140;
  let atlasReady = false;
  let firstSize = true;
  let paintedFrame = -1;
  let paintedDirection = 0;
  let resizeTimer = 0;
  let readingAreas = [];
  let readingFrame = 0;
  const atlas = new Image();

  const clamp = (value, min, max) => Math.min(Math.max(value, min), Math.max(min, max));
  const allowed = () => !paused && !quiet && !document.hidden;
  const xLimit = () => Math.max(12, width - travelerSize - 12);
  const yLimit = () => Math.max(12, height - travelerSize - 65);

  function refreshReadingAreas() {
    if (readingFrame) return;
    readingFrame = requestAnimationFrame(() => {
      readingFrame = 0;
      readingAreas = Array.from(document.querySelectorAll('[data-reading-area]'), element => {
        const rect = element.getBoundingClientRect();
        return {x:rect.left - 10, y:rect.top - 10, width:rect.width + 20, height:rect.height + 20, visible:rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < height};
      }).filter(area => area.visible);
    });
  }

  function chooseTarget() {
    const point = path[walker.next % path.length];
    walker.next += 1;
    walker.targetX = 12 + point[0] * Math.max(0, xLimit() - 12);
    walker.targetY = 12 + point[1] * Math.max(0, yLimit() - 12);
  }

  function makeFlower(initial = false) {
    const bloom = Math.random() < .45;
    return {
      x:Math.random() * width,
      y:initial ? Math.random() * height - 30 : -60 - Math.random() * 180,
      size:bloom ? 14 + Math.random() * (width < 700 ? 8 : 13) : 3 + Math.random() * 4,
      speed:bloom ? 16 + Math.random() * 20 : 24 + Math.random() * 22,
      angle:Math.random() * Math.PI * 2,
      spin:(Math.random() - .5) * .45,
      sway:Math.random() * Math.PI * 2,
      drift:8 + Math.random() * 15,
      opacity:bloom ? .34 + Math.random() * .22 : .3 + Math.random() * .18,
      color:['#dda3ac','#cf879c','#ecd2ad'][Math.floor(Math.random() * 3)],
      sprite:Math.floor(Math.random() * 3),
      bloom
    };
  }

  function paintWalker(frame) {
    if (!atlasReady) return;
    if (frame === paintedFrame && walker.direction === paintedDirection) return;
    paintedFrame = frame;
    paintedDirection = walker.direction;
    walkContext.setTransform(ratio, 0, 0, ratio, 0, 0);
    walkContext.clearRect(0, 0, travelerSize, travelerSize);
    walkContext.save();
    if (walker.direction < 0) {
      walkContext.translate(travelerSize, 0);
      walkContext.scale(-1, 1);
    }
    const cellWidth = atlas.naturalWidth / 4;
    const cellHeight = atlas.naturalHeight / 2;
    walkContext.drawImage(atlas,
      (frame % 4) * cellWidth, Math.floor(frame / 4) * cellHeight, cellWidth, cellHeight,
      0, 0, travelerSize, travelerSize);
    walkContext.restore();
  }

  function placeWalker() {
    traveler.style.transform = `translate3d(${walker.x.toFixed(1)}px,${walker.y.toFixed(1)}px,0)`;
  }

  function resize() {
    width = Math.max(1, window.innerWidth);
    height = Math.max(1, window.innerHeight);
    ratio = Math.min(window.devicePixelRatio || 1, 2);
    travelerSize = width < 600 ? 104 : 144;
    travelerSize = Math.min(travelerSize, Math.max(64, height * .28), width * .38);
    rain.width = Math.round(width * ratio);
    rain.height = Math.round(height * ratio);
    rainContext.setTransform(ratio, 0, 0, ratio, 0, 0);
    traveler.style.width = `${travelerSize}px`;
    traveler.style.height = `${travelerSize}px`;
    walkCanvas.width = Math.round(travelerSize * ratio);
    walkCanvas.height = Math.round(travelerSize * ratio);
    if (firstSize) {
      walker.x = 14;
      walker.y = yLimit() * .88;
      firstSize = false;
      chooseTarget();
    }
    walker.x = clamp(walker.x, 12, xLimit());
    walker.y = clamp(walker.y, 12, yLimit());
    walker.targetX = clamp(walker.targetX, 12, xLimit());
    walker.targetY = clamp(walker.targetY, 12, yLimit());
    flowers = Array.from({length:width < 700 ? 8 : 16}, () => makeFlower(true));
    footprints.length = 0;
    paintedFrame = -1;
    paintWalker(paused ? 0 : Math.floor(walker.stride) % 8);
    placeWalker();
    refreshReadingAreas();
  }

  function updateWalker(delta) {
    if (!atlasReady) return;
    if (walker.rest > 0) {
      walker.rest -= delta;
      paintWalker(0);
      return;
    }
    const dx = walker.targetX - walker.x;
    const dy = walker.targetY - walker.y;
    const distance = Math.hypot(dx, dy);
    const speed = width < 700 ? 35 : 47;
    const step = speed * delta;
    if (distance <= step + 1) {
      walker.x = walker.targetX;
      walker.y = walker.targetY;
      walker.rest = 1.1 + Math.random() * 1.5;
      chooseTarget();
    } else {
      walker.x += dx / distance * step;
      walker.y += dy / distance * step;
      if (Math.abs(dx) > 3) walker.direction = dx > 0 ? 1 : -1;
      walker.stride += delta * 8;
      walker.stepTime += delta;
      if (walker.stepTime > .75) {
        walker.stepTime = 0;
        footprints.push({x:walker.x + travelerSize * .5,y:walker.y + travelerSize * .97,life:3});
        if (footprints.length > 6) footprints.shift();
      }
    }
    walker.x = clamp(walker.x, 12, xLimit());
    walker.y = clamp(walker.y, 12, yLimit());
    placeWalker();
    paintWalker(Math.floor(walker.stride) % 8);
  }

  function paintFlowers(delta) {
    rainContext.clearRect(0, 0, width, height);
    for (let i = footprints.length - 1; i >= 0; i -= 1) {
      const mark = footprints[i];
      mark.life -= delta;
      if (mark.life <= 0) { footprints.splice(i, 1); continue; }
      rainContext.fillStyle = `rgba(130,91,65,${.12 * mark.life / 3})`;
      rainContext.beginPath();
      rainContext.ellipse(mark.x - 3, mark.y, 2, 3.2, -.35, 0, Math.PI * 2);
      rainContext.ellipse(mark.x + 3, mark.y + 1, 2, 3.2, .35, 0, Math.PI * 2);
      rainContext.fill();
    }
    for (let i = 0; i < flowers.length; i += 1) {
      let flower = flowers[i];
      flower.y += flower.speed * delta;
      flower.angle += flower.spin * delta;
      flower.sway += delta * .6;
      if (flower.y > height + flower.size) {
        flower = flowers[i] = makeFlower();
      }
      rainContext.save();
      rainContext.globalAlpha = flower.opacity;
      rainContext.translate(flower.x + Math.sin(flower.sway) * flower.drift, flower.y);
      rainContext.rotate(flower.angle);
      const sprite = flowerSprites[flower.sprite];
      if (flower.bloom && sprite) {
        rainContext.drawImage(sprite, -flower.size / 2, -flower.size / 2, flower.size, flower.size);
      } else {
        rainContext.fillStyle = flower.color;
        rainContext.beginPath();
        rainContext.ellipse(0, 0, flower.bloom ? 6 : flower.size, flower.bloom ? 3 : flower.size * .55, 0, 0, Math.PI * 2);
        rainContext.fill();
      }
      rainContext.restore();
    }
    // Las flores siguen cayendo alrededor de las zonas de lectura.
    for (const area of readingAreas) rainContext.clearRect(area.x, area.y, area.width, area.height);
  }

  function tick(now) {
    animation = 0;
    if (!allowed()) return;
    const delta = lastTime ? Math.min((now - lastTime) / 1000, .05) : 1 / 60;
    lastTime = now;
    paintFlowers(delta);
    updateWalker(delta);
    animation = requestAnimationFrame(tick);
  }
  function stop() {
    cancelAnimationFrame(animation);
    animation = 0;
    lastTime = 0;
    rainContext.clearRect(0, 0, width, height);
  }
  function start() {
    if (animation || !allowed()) return;
    lastTime = 0;
    animation = requestAnimationFrame(tick);
  }
  function setPaused(value) {
    paused = Boolean(value);
    if (paused) { stop(); paintWalker(0); }
    else start();
  }
  function setQuiet(value) {
    quiet = Boolean(value);
    traveler.hidden = quiet || !atlasReady;
    if (quiet) stop();
    else start();
  }

  window.AlphaGarden = {setPaused, setQuiet, refreshLayout:refreshReadingAreas};
  atlas.onload = () => {
    atlasReady = true;
    traveler.hidden = quiet;
    paintWalker(0);
    start();
  };
  atlas.src = 'assets/giraffe-walk-v4.png';
  ['blush','ivory','rose'].forEach((color, index) => {
    const image = new Image();
    image.onload = () => {
      const small = document.createElement('canvas');
      small.width = small.height = 112;
      const smallContext = small.getContext('2d');
      if (!smallContext) return;
      smallContext.drawImage(image, 0, 0, 112, 112);
      flowerSprites[index] = small;
    };
    image.src = `assets/peony-${color}-3d-v3.png`;
  });
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(resize, 80);
  }, {passive:true});
  window.addEventListener('scroll', refreshReadingAreas, {passive:true});
  if ('ResizeObserver' in window) new window.ResizeObserver(refreshReadingAreas).observe(document.body);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else start();
  });
  reducedMotion.addEventListener('change', (event) => setPaused(event.matches));
  window.addEventListener('pagehide', stop);
  window.addEventListener('pageshow', start);
  resize();
  start();
})();
