import express from 'express';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';

const app = express();
const port = process.argv.length > 2 ? process.argv[2] : 4000;
const users = new Map();
const sessions = new Map();
const friends = new Map();
const decks = new Map();

app.use(express.json());

function validateUsername(value) {
  return typeof value === 'string' && /^[A-Za-z0-9_]{3,24}$/.test(value.trim());
}

function validatePassword(value) {
  return typeof value === 'string' && value.length >= 8 && value.length <= 128;
}

function validateDeck(value) {
  if (!value || typeof value !== 'object' || typeof value.name !== 'string' || value.name.trim().length < 1 || value.name.trim().length > 80) {
    return 'Deck name must be between 1 and 80 characters.';
  }
  if (!Array.isArray(value.cards) || value.cards.length > 500) {
    return 'A deck must contain a valid card list.';
  }
  if (value.cards.some((card) => !card || typeof card.name !== 'string' || card.name.trim().length < 1 || card.name.trim().length > 120 || !Number.isInteger(card.count) || card.count < 1 || card.count > 99)) {
    return 'Each card must have a name and an integer count from 1 to 99.';
  }
  return null;
}

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
  if (!validateUsername(username)) {
    response.status(400).json({ error: 'Username must be 3-24 characters using only letters, numbers, or underscores.' });
    return;
  }
  if (!validatePassword(password)) {
    response.status(400).json({ error: 'Password must be between 8 and 128 characters.' });
    return;
  }
  if (users.has(username.toLowerCase())) {
    response.status(409).json({ error: 'That username is already registered.' });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  users.set(username.toLowerCase(), { username, passwordHash });
  friends.set(username.toLowerCase(), new Set());
  decks.set(username.toLowerCase(), new Map());
  response.status(201).json({ message: 'Account created.' });
});

app.post('/api/auth/login', async (request, response) => {
  const username = typeof request.body.username === 'string' ? request.body.username.trim() : '';
  const password = typeof request.body.password === 'string' ? request.body.password : '';
  if (!validateUsername(username) || !validatePassword(password)) {
    response.status(400).json({ error: 'Enter a valid username and password.' });
    return;
  }
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
  const userDecks = decks.get(request.username.toLowerCase()) || new Map();
  response.json({ username: request.username, decks: [...userDecks.values()] });
});

app.post('/api/decks', requireAuth, (request, response) => {
  const validationError = validateDeck(request.body);
  if (validationError) {
    response.status(400).json({ error: validationError });
    return;
  }
  const userDecks = decks.get(request.username.toLowerCase()) || new Map();
  const deck = {
    id: typeof request.body.id === 'string' && request.body.id.trim() ? request.body.id : randomUUID(),
    name: request.body.name.trim(),
    cards: request.body.cards.map((card) => ({ name: card.name.trim(), count: card.count })),
  };
  userDecks.set(deck.id, deck);
  decks.set(request.username.toLowerCase(), userDecks);
  response.status(201).json(deck);
});

app.post('/api/decks/validate', requireAuth, (request, response) => {
  const validationError = validateDeck(request.body);
  if (validationError) {
    response.status(400).json({ error: validationError });
    return;
  }
  const totalCards = request.body.cards.reduce((total, card) => total + card.count, 0);
  response.json({ valid: true, totalCards });
});

app.post('/api/decks/stats', requireAuth, (request, response) => {
  const validationError = validateDeck(request.body);
  if (validationError) {
    response.status(400).json({ error: validationError });
    return;
  }
  const totalCards = request.body.cards.reduce((total, card) => total + card.count, 0);
  response.json({ totalCards, uniqueCards: request.body.cards.length });
});

app.get('/api/friends', requireAuth, (request, response) => {
  const userFriends = friends.get(request.username.toLowerCase()) || new Set();
  response.json({ friends: [...userFriends].map((username) => ({ name: username, status: 'online' })) });
});

app.post('/api/friends', requireAuth, (request, response) => {
  const friendName = typeof request.body.username === 'string' ? request.body.username.trim() : '';
  if (!validateUsername(friendName)) {
    response.status(400).json({ error: 'Friend usernames must be 3-24 characters using only letters, numbers, or underscores.' });
    return;
  }
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
