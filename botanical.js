'use strict';
(() => {
  const garden = document.getElementById('living-garden');
  if (!garden) return;
  // Posición, altura del tallo, tamaño de la flor, fondo, inclinación, color y visibilidad móvil.
  const hero = [
    [-1,225,65,86,-8,'ivory',1],[4,185,60,110,8,'blush',1],
    [8,260,61,110,-4,'rose',0],[12,164,54,80,7,'ivory',1],
    [17,220,56,100,-6,'blush',0],[23,132,48,52,4,'rose',0],
    [2,138,50,47,-10,'rose',1],[10,125,48,30,9,'blush',0],
    [98,230,64,92,7,'blush',1],[94,180,58,110,-7,'ivory',1],
    [89,265,62,100,5,'rose',0],[86,150,51,75,-9,'ivory',1],
    [81,210,56,95,6,'blush',0],[76,125,48,48,-4,'ivory',0],
    [99,139,49,42,10,'ivory',1],[91,128,48,25,-8,'blush',0]
  ];
  const border = [
    [-2,190,56,70,-6,'blush',1],[3,230,60,45,5,'ivory',0],
    [6,145,49,70,-5,'rose',1],[10,185,52,25,4,'blush',0],
    [100,215,59,60,5,'ivory',1],[96,168,53,35,-7,'blush',0],
    [91,145,49,65,5,'rose',1],[87,110,45,25,-4,'ivory',0]
  ];
  function plant([x,height,bloom,bottom,lean,color,mobile], index) {
    const node = document.createElement('span');
    node.className = 'garden-plant' + (mobile ? ' mobile-plant' : '');
    const values = {'--plant-x':x+'%','--plant-height':height+'px','--bloom-size':bloom+'px','--root-y':bottom+'px','--plant-lean':lean+'deg','--plant-time':(7+index%4)+'s','--plant-delay':(-index*.6)+'s'};
    Object.entries(values).forEach(([name,value]) => node.style.setProperty(name,value));
    const stem = document.createElement('span'); stem.className = 'plant-stem'; node.append(stem);
    for (let leaf=0;leaf<4;leaf++) {
      const blade = document.createElement('span');
      blade.className = 'plant-leaf ' + (leaf%2 ? 'right-leaf' : 'left-leaf');
      blade.style.setProperty('--leaf-y',(22+leaf*15)+'%');
      blade.style.setProperty('--leaf-size',(24+index%4*4)+'px');
      node.append(blade);
    }
    const head = document.createElement('img');
    head.className = 'plant-bloom';head.src='assets/peony-'+color+'-3d-v3.png';
    head.alt='';head.width=1254;head.height=1254;head.decoding='async';
    node.append(head);return node;
  }
  [[document.getElementById('hero-plants'),hero],[document.getElementById('border-plants'),border]].forEach(([container,plants]) => {
    if (!container) return;
    const fragment=document.createDocumentFragment();
    plants.forEach((data,index) => fragment.append(plant(data,index)));
    container.append(fragment);
  });
  garden.querySelectorAll('.garden-vine').forEach((vine,side) => {
    for(let i=0;i<10;i++) {
      const leaf=document.createElement('span');leaf.className='vine-leaf';
      leaf.style.setProperty('--vine-y',(i*9)+'%');
      leaf.style.setProperty('--vine-angle',((i%2 ? 35 : -50)*(side ? -1 : 1))+'deg');
      leaf.style.setProperty('--vine-size',(30+(i%3)*8)+'px');
      vine.append(leaf);
    }
  });
  if ('IntersectionObserver' in window) {
    const observer = new window.IntersectionObserver(([entry]) => {
      garden.classList.toggle('garden-is-visible',entry.isIntersecting);
    },{threshold:0});
    observer.observe(garden);
  } else garden.classList.add('garden-is-visible');
})();
