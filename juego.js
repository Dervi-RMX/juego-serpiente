const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const TAM = 20;
const COLS = canvas.width / TAM;
const FILAS = canvas.height / TAM;

let serpiente, direccion, siguienteDireccion, manzana, puntos, intervalo, juegoActivo;
let record = localStorage.getItem('record') || 0;
document.getElementById('record').textContent = record;

function iniciar() {
  serpiente = [{x: 10, y: 10}];
  direccion = {x: 1, y: 0};
  siguienteDireccion = {x: 1, y: 0};
  puntos = 0;
  juegoActivo = true;
  document.getElementById('puntos').textContent = 0;
  colocarManzana();
  clearInterval(intervalo);
  intervalo = setInterval(loop, 120);
}

function colocarManzana() {
  do {
    manzana = {
      x: Math.floor(Math.random() * COLS),
      y: Math.floor(Math.random() * FILAS)
    };
  } while (serpiente.some(s => s.x === manzana.x && s.y === manzana.y));
}

function loop() {
  if (!juegoActivo) return;
  direccion = siguienteDireccion;
  const cabeza = {
    x: serpiente[0].x + direccion.x,
    y: serpiente[0].y + direccion.y
  };

  if (cabeza.x < 0 || cabeza.x >= COLS || cabeza.y < 0 || cabeza.y >= FILAS) return gameOver();
  if (serpiente.some(s => s.x === cabeza.x && s.y === cabeza.y)) return gameOver();

  serpiente.unshift(cabeza);

  if (cabeza.x === manzana.x && cabeza.y === manzana.y) {
    puntos++;
    document.getElementById('puntos').textContent = puntos;
    colocarManzana();
  } else {
    serpiente.pop();
  }

  dibujar();
}

function dibujar() {
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';

  for (let i = 0; i <= COLS; i++) {
    ctx.beginPath(); ctx.moveTo(i * TAM, 0); ctx.lineTo(i * TAM, canvas.height); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i * TAM); ctx.lineTo(canvas.width, i * TAM); ctx.stroke();
  }

  ctx.fillStyle = '#e94560';
  ctx.beginPath();
  ctx.arc(manzana.x * TAM + TAM / 2, manzana.y * TAM + TAM / 2, TAM / 2 - 2, 0, Math.PI * 2);
  ctx.fill();

  serpiente.forEach((seg, i) => {
    ctx.fillStyle = i === 0 ? '#4ecca3' : '#3a9d7c';
    ctx.fillRect(seg.x * TAM + 1, seg.y * TAM + 1, TAM - 2, TAM - 2);
  });
}

function gameOver() {
  juegoActivo = false;
  clearInterval(intervalo);

  if (puntos > record) {
    record = puntos;
    localStorage.setItem('record', record);
    document.getElementById('record').textContent = record;
  }

  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff';
  ctx.font = '28px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('¡Game Over!', canvas.width / 2, canvas.height / 2 - 10);
  ctx.font = '16px sans-serif';
  ctx.fillText('Pulsa Espacio para reiniciar', canvas.width / 2, canvas.height / 2 + 25);
}

document.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if ((k === 'arrowup' || k === 'w') && direccion.y === 0) siguienteDireccion = {x: 0, y: -1};
  if ((k === 'arrowdown' || k === 's') && direccion.y === 0) siguienteDireccion = {x: 0, y: 1};
  if ((k === 'arrowleft' || k === 'a') && direccion.x === 0) siguienteDireccion = {x: -1, y: 0};
  if ((k === 'arrowright' || k === 'd') && direccion.x === 0) siguienteDireccion = {x: 1, y: 0};
  if (k === ' ') { e.preventDefault(); iniciar(); }
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
});

iniciar();