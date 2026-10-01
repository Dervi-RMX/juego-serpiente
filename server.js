const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

// Necesario para que las cookies funcionen detrás de un proxy (Render, Railway, Heroku...)
app.set('trust proxy', 1);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'cambia-esto-en-produccion',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60, // 1 hora
    secure: IS_PROD,        // true solo si hay HTTPS
    sameSite: 'lax',
    httpOnly: true
  }
}));

// ⚠️ En producción usa una base de datos. Esto es solo demo.
const usuarios = [
  { usuario: 'admin', passwordHash: bcrypt.hashSync('1234', 10) }
];

function requiereLogin(req, res, next) {
  if (req.session.usuario) return next();
  res.redirect('/login');
}

const LOGIN_HTML = `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Login - Juego Serpiente</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Segoe UI', sans-serif;
    background: #16213e; color: #fff;
    min-height: 100vh; display: flex;
    align-items: center; justify-content: center;
  }
  .login-box {
    background: #0f3460; padding: 40px;
    border-radius: 12px; width: 340px;
    text-align: center;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  }
  .login-box h1 { margin-bottom: 25px; font-size: 22px; }
  .login-box input {
    width: 100%; padding: 12px; margin-bottom: 15px;
    border: none; border-radius: 6px; font-size: 15px;
  }
  .login-box button {
    width: 100%; padding: 12px; background: #4ecca3;
    color: #16213e; border: none; border-radius: 6px;
    font-weight: bold; font-size: 16px; cursor: pointer;
  }
  .login-box button:hover { background: #3fb890; }
  .hint { margin-top: 15px; font-size: 13px; color: #aaa; }
  .error { color: #e94560; margin-top: 10px; font-size: 14px; }
</style>
</head>
<body>
  <div class="login-box">
    <h1>🐍 Juego de la Serpiente</h1>
    <form action="/login" method="POST">
      <input type="text" name="usuario" placeholder="Usuario" required>
      <input type="password" name="password" placeholder="Contraseña" required>
      <button type="submit">Entrar</button>
    </form>
    <p class="hint">Usuario: <b>admin</b> / Contraseña: <b>1234</b></p>
    <p class="error">__ERROR__</p>
  </div>
</body>
</html>
`;

const JUEGO_HTML = `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Juego de la Serpiente</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Segoe UI', sans-serif;
    background: #16213e; color: #fff;
    min-height: 100vh; display: flex;
    align-items: center; justify-content: center;
  }
  .game-container { text-align: center; }
  .game-container h1 { margin-bottom: 15px; }
  .hud {
    display: flex; justify-content: space-between;
    margin-bottom: 10px; font-size: 16px;
  }
  .logout { color: #e94560; text-decoration: none; font-weight: bold; }
  canvas {
    border-radius: 10px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    display: block;
  }
  .controls { margin-top: 12px; font-size: 13px; color: #aaa; }
</style>
</head>
<body>
  <div class="game-container">
    <h1>🐍 Come manzanas 🍎</h1>
    <div class="hud">
      <span>Puntos: <b id="puntos">0</b></span>
      <span>Récord: <b id="record">0</b></span>
      <a href="/logout" class="logout">Salir</a>
    </div>
    <canvas id="canvas" width="400" height="400"></canvas>
    <p class="controls">Usa las <b>flechas</b> o <b>WASD</b>. Pulsa <b>Espacio</b> para reiniciar.</p>
  </div>

  <script>
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
        ctx.beginPath();
        ctx.moveTo(i * TAM, 0);
        ctx.lineTo(i * TAM, canvas.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * TAM);
        ctx.lineTo(canvas.width, i * TAM);
        ctx.stroke();
      }

      ctx.fillStyle = '#e94560';
      ctx.beginPath();
      ctx.arc(
        manzana.x * TAM + TAM / 2,
        manzana.y * TAM + TAM / 2,
        TAM / 2 - 2,
        0,
        Math.PI * 2
      );
      ctx.fill();

      serpiente.forEach((seg, i) => {
        ctx.fillStyle = i === 0 ? '#4ecca3' : '#3a9d7c';
        ctx.fillRect(
          seg.x * TAM + 1,
          seg.y * TAM + 1,
          TAM - 2,
          TAM - 2
        );
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
      ctx.fillText(
        'Pulsa Espacio para reiniciar',
        canvas.width / 2,
        canvas.height / 2 + 25
      );
    }

    document.addEventListener('keydown', e => {
      const k = e.key.toLowerCase();

      if ((k === 'arrowup' || k === 'w') && direccion.y === 0)
        siguienteDireccion = {x: 0, y: -1};

      if ((k === 'arrowdown' || k === 's') && direccion.y === 0)
        siguienteDireccion = {x: 0, y: 1};

      if ((k === 'arrowleft' || k === 'a') && direccion.x === 0)
        siguienteDireccion = {x: -1, y: 0};

      if ((k === 'arrowright' || k === 'd') && direccion.x === 0)
        siguienteDireccion = {x: 1, y: 0};

      if (k === ' ') {
        e.preventDefault();
        iniciar();
      }

      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k))
        e.preventDefault();
    });

    iniciar();
  </script>
</body>
</html>
`;

app.get('/login', (req, res) => {
  const error = req.query.error ? 'Credenciales incorrectas' : '';
  res.send(LOGIN_HTML.replace('__ERROR__', error));
});

app.post('/login', async (req, res) => {
  const { usuario, password } = req.body;
  const user = usuarios.find(u => u.usuario === usuario);

  if (user && await bcrypt.compare(password, user.passwordHash)) {
    req.session.usuario = usuario;
    return res.redirect('/');
  }

  res.redirect('/login?error=1');
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

app.get('/', requiereLogin, (req, res) => {
  res.send(JUEGO_HTML);
});

app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
  console.log(`Login: admin / 1234`);
});