require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const httpProxy = require('http-proxy');
const sequelize = require('./config/dbConfig'); // Importa la configuración de la base de datos
const Herramienta = require('./models/Herramienta');

const app = express();
const proxy = httpProxy.createProxyServer({
  target: 'https://elements.envato.com/',
  changeOrigin: true,
  secure: false
});

app.use(bodyParser.urlencoded({ extended: true }));

const TEN_SECONDS = 10 * 1000; // 10 segundos en milisegundos
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, expires: false } // Set to true if using https
}));

// Conexión a la base de datos
async function connectToDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Connection to database has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}
connectToDatabase();


app.get('/login', (req, res) => {
  res.send(`
  <!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Login</title>
<style>
  body {
    font-family: Arial, sans-serif;
    background-color: #f4f4f4;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    margin: 0;
  }
  .login-container {
    max-width: 500px;
    padding: 40px;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    text-align: center;
  }
  .login-container h2 {
    margin-bottom: 20px;
    color: #333;
  }
  .form-group {
    margin-bottom: 20px;
  }
  .form-group input {
    width: 100%;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-sizing: border-box;
    font-size: 16px;
  }
  .form-group button {
    width: 100%;
    padding: 10px;
    background-color: #007bff;
    border: none;
    border-radius: 4px;
    box-sizing: border-box;
    font-size: 16px;
    color: #fff;
    cursor: pointer;
  }
  .form-group button:hover {
    background-color: #0056b3;
  }
  .logo {
    margin-bottom: 20px;
  }
  .logo img {
    width: 300px;
  }
</style>
</head>
<body>

<div class="login-container">
  <div class="logo">
    <img src="https://conjuntaseoteam.com/public/img/logo.svg" alt="Logo">
  </div>
  <h2>Login Envato</h2>
  <form action="/login" method="post">
    <div class="form-group">
      <input type="text" name="username" placeholder="Username" required>
    </div>
    <div class="form-group">
      <input type="password" name="password" placeholder="Password" required>
    </div>
    <div class="form-group">
      <button type="submit">Login</button>
    </div>
  </form>
</div>

</body>
</html>

  
  `);
});

app.post('/login', async  (req, res) => {
  const { username, password } = req.body;

  const herramienta = await Herramienta.findByPk(125);

  if (username === herramienta.nombreUsuario && password === herramienta.password) {
    req.session.authenticated = true;
    req.session.cookies = herramienta.cookies;
    // Guardar otros headers necesarios en la sesión si son dinámicos
    res.redirect('/');
  } else {
    res.send('Invalid username or password');
  }
});

app.use((req, res, next) => {
  if (!req.session.authenticated) {
    res.redirect('/login');
  } else {
    next();
  }
});

app.all('*', (req, res) => {
  proxy.on('proxyReq', (proxyReq, req, res, options) => {
    // Uso de cookies y headers de la sesión
    proxyReq.setHeader('Cookie', req.session.cookies || manualCookies);
    proxyReq.setHeader('User-Agent', req.headers['user-agent']);
    proxyReq.setHeader('Referer', 'https://elements.envato.com');
    proxyReq.setHeader('Origin', 'https://elements.envato.com');
  });

  proxy.web(req, res);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
