import express from 'express';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';

const app = express();
const port = process.argv.length > 2 ? process.argv[2] : 4000;
const users = new Map();
const sessions = new Map();
const friends = new Map();

app.use(express.json());

async function proxyScryfall(path, response) {
  try {
    const scryfallResponse = await fetch(`https://api.scryfall.com${path}`, {
      headers: { Accept: 'application/json', 'User-Agent': 'PDFDecks/1.0' },
    });
    const body = await scryfallResponse.text();
    response.status(scryfallResponse.status);
    response.type('application/json').send(body);
  } catch {
    response.status(502).json({ error: 'Scryfall is currently unavailable.' });
  }
}

app.get('/api/cards/search', (request, response) => {
  const query = typeof request.query.q === 'string' ? request.query.q.trim() : '';
  if (query.length < 2) {
    response.status(400).json({ error: 'A search query of at least two characters is required.' });
    return;
  }
  proxyScryfall(`/cards/autocomplete?q=${encodeURIComponent(query)}`, response);
});

app.get('/api/cards/named', (request, response) => {
  const name = typeof request.query.exact === 'string' ? request.query.exact.trim() : '';
  if (!name) {
    response.status(400).json({ error: 'A card name is required.' });
    return;
  }
  proxyScryfall(`/cards/named?exact=${encodeURIComponent(name)}`, response);
});

function getToken(request) {
  const authorization = request.get('authorization') || '';
  return authorization.startsWith('Bearer ') ? authorization.slice(7) : null;
}

function requireAuth(request, response, next) {
  const token = getToken(request);
  const username = token ? sessions.get(token) : null;
  if (!username) {
    response.status(401).json({ error: 'A valid auth token is required.' });
    return;
  }
  request.username = username;
  next();
}

app.post('/api/auth/register', async (request, response) => {
  const username = typeof request.body.username === 'string' ? request.body.username.trim() : '';
  const password = typeof request.body.password === 'string' ? request.body.password : '';
  if (username.length < 3 || password.length < 8) {
    response.status(400).json({ error: 'Username must be at least 3 characters and password at least 8 characters.' });
    return;
  }
  if (users.has(username.toLowerCase())) {
    response.status(409).json({ error: 'That username is already registered.' });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  users.set(username.toLowerCase(), { username, passwordHash });
  friends.set(username.toLowerCase(), new Set());
  response.status(201).json({ message: 'Account created.' });
});

app.post('/api/auth/login', async (request, response) => {
  const username = typeof request.body.username === 'string' ? request.body.username.trim() : '';
  const password = typeof request.body.password === 'string' ? request.body.password : '';
  const user = users.get(username.toLowerCase());
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    response.status(401).json({ error: 'Invalid username or password.' });
    return;
  }
  const token = randomUUID();
  sessions.set(token, user.username);
  response.json({ token, username: user.username });
});

app.post('/api/auth/logout', requireAuth, (request, response) => {
  sessions.delete(getToken(request));
  response.status(204).end();
});

app.get('/api/me', requireAuth, (request, response) => {
  response.json({ username: request.username });
});

app.get('/api/decks', requireAuth, (request, response) => {
  response.json({ username: request.username, decks: [] });
});

app.get('/api/friends', requireAuth, (request, response) => {
  const userFriends = friends.get(request.username.toLowerCase()) || new Set();
  response.json({ friends: [...userFriends].map((username) => ({ name: username, status: 'online' })) });
});

app.post('/api/friends', requireAuth, (request, response) => {
  const friendName = typeof request.body.username === 'string' ? request.body.username.trim() : '';
  const friend = users.get(friendName.toLowerCase());
  if (!friend) {
    response.status(404).json({ error: 'That player does not exist.' });
    return;
  }
  if (friend.username.toLowerCase() === request.username.toLowerCase()) {
    response.status(400).json({ error: 'You cannot add yourself as a friend.' });
    return;
  }
  const userFriends = friends.get(request.username.toLowerCase()) || new Set();
  if (userFriends.has(friend.username)) {
    response.status(409).json({ error: 'That player is already your friend.' });
    return;
  }
  userFriends.add(friend.username);
  friends.set(request.username.toLowerCase(), userFriends);
  response.status(201).json({ name: friend.username, status: 'online' });
});

app.use(express.static('public'));

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
