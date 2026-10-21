'use strict';
(() => {
  const chapter = document.getElementById('living-savanna');
  if (!chapter) return;
  const svgNS = 'http://www.w3.org/2000/svg';

  // Cada acacia tiene tronco, ramas, copas y sombra propios.
  const treeLayer = document.getElementById('savanna-trees');
  ['acacia-left', 'acacia-distant', 'acacia-right', 'acacia-horizon'].forEach((variant, index) => {
    const tree = document.createElement('div');
    tree.className = 'savanna-acacia ' + variant;
    tree.style.setProperty('--tree-delay', (-index * 1.7) + 's');
    const shadow = document.createElement('span');
    shadow.className = 'acacia-shadow';
    const trunk = document.createElementNS(svgNS, 'svg');
    trunk.setAttribute('viewBox', '0 0 140 210');
    trunk.setAttribute('preserveAspectRatio', 'none');
    trunk.setAttribute('class', 'acacia-trunk');
    [
      ['trunk-body', 'M61 210L67 132L57 102L25 74L29 66L70 95L74 72L93 47L101 51L84 87L80 111L86 210Z'],
      ['trunk-branch', 'M73 118L104 87L124 81M66 102L49 66L18 56M80 89L69 60'],
      ['trunk-light', 'M66 206L72 131L65 108M79 84L97 51']
    ].forEach(([className, d]) => {
      const path = document.createElementNS(svgNS, 'path');
      path.setAttribute('class', className);
      path.setAttribute('d', d);
      trunk.append(path);
    });
    const crown = document.createElement('div');
    crown.className = 'acacia-crown';
    for (let n = 0; n < 4; n++) crown.append(document.createElement('span'));
    tree.append(shadow, trunk, crown);
    treeLayer.append(tree);
  });

  function grass(x, bottom, size, index) {
    const clump = document.createElement('span');
    clump.className = 'savanna-grass' + (index % 3 === 0 ? ' pale-grass' : '');
    clump.style.setProperty('--grass-x', x + '%');
    clump.style.setProperty('--grass-y', bottom + 'px');
    clump.style.setProperty('--grass-size', size + 'px');
    clump.style.setProperty('--grass-delay', (-index * .8) + 's');
    [-32, -17, 0, 19, 36].forEach((angle, bladeIndex) => {
      const blade = document.createElement('i');
      blade.style.setProperty('--blade-angle', angle + 'deg');
      blade.style.setProperty('--blade-length', (68 + (bladeIndex % 3) * 15) + '%');
      clump.append(blade);
    });
    return clump;
  }
  const grasses = [
    [1,57,42],[5,125,32],[9,44,45],[14,83,29],[20,55,38],
    [26,94,24],[32,32,31],[38,155,23],[48,238,19],[57,198,20],
    [64,62,30],[70,119,26],[77,54,42],[84,95,33],[90,40,43],
    [95,147,30],[99,70,46],[7,234,24],[27,276,20],[78,287,23]
  ];
  const detailLayer = document.getElementById('savanna-details');
  const fragment = document.createDocumentFragment();
  grasses.forEach(([x, y, size], index) => fragment.append(grass(x, y, size, index)));
  [[8,90,45],[31,67,32],[72,74,48],[94,203,29],[88,28,57]].forEach(([x, y, width], index) => {
    const rock = document.createElement('span');
    rock.className = 'savanna-rock';
    rock.style.setProperty('--rock-x', x + '%');
    rock.style.setProperty('--rock-y', y + 'px');
    rock.style.setProperty('--rock-width', width + 'px');
    rock.style.setProperty('--rock-turn', (index % 2 ? 8 : -7) + 'deg');
    fragment.append(rock);
  });
  detailLayer.append(fragment);

  ['letter-savanna', 'wish-savanna'].forEach((id) => {
    const border = document.getElementById(id);
    [[1,36,36],[3,70,23],[97,49,31],[99,22,42]].forEach(([x, y, size], index) => {
      border.append(grass(x, y, size, index));
    });
  });

  const greeting = document.getElementById('safari-greeting');
  const notes = {
    elephant: 'El elefantito también quería darte la bienvenida, Alpha.',
    zebra: 'La cebra ya está lista. ¿Seguimos el paseo?'
  };
  chapter.querySelectorAll('[data-animal]').forEach((button) => {
    let timer = 0;
    button.addEventListener('click', () => {
      greeting.textContent = notes[button.dataset.animal];
      button.classList.add('animal-greeting');
      window.AlphaGarden?.refreshLayout();
      window.clearTimeout(timer);
      timer = window.setTimeout(() => button.classList.remove('animal-greeting'), 1350);
    });
  });
})();
