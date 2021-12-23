require('dotenv').config()

const app = require('express')();
const basicAuth = require('express-basic-auth');
const rateLimit = require('./utils/rate-limiter');
const ipGate = require('./utils/ip-gate');
const users = require('./consts/users');

const port = process.env.PORT || 3000;

app.use(ipGate);
app.use(basicAuth({users}));
app.use(rateLimit);

app.get('/', (req, res) => {
  res.send('Hello World!')
});

app.get('/light', (req, res) => {
  const user = req.auth.user;
  res.send(`Hello ${user}, I am a light endpoint!`);
});

app.get('/medium', (req, res) => {
  const user = req.auth.user;
  res.send(`Hello ${user}, I am a medium endpoint!`);
});

app.get('/heavy', (req, res) => {
  const user = req.auth.user;
  res.send(`Hello ${user}, I am a heavy endpoint!`);
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
});

