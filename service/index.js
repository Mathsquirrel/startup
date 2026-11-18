import express from 'express';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { getCollection } from './database.js';

const app = express();
const port = process.argv.length > 2 ? process.argv[2] : 4000;

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
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const scryfallResponse = await fetch(`https://api.scryfall.com${path}`, {
        headers: { Accept: 'application/json', 'User-Agent': 'PDFDecks/1.0' },
      });
      const body = await scryfallResponse.text();
      if (scryfallResponse.ok || (scryfallResponse.status < 500 && scryfallResponse.status !== 429) || attempt === 2) {
        response.status(scryfallResponse.status);
        response.type('application/json').send(body);
        return;
      }
    } catch (error) {
      if (attempt === 2) {
        response.status(502).json({ error: 'Scryfall is currently unavailable.' });
        return;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
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

app.post('/api/cards/collection', async (request, response) => {
  const names = Array.isArray(request.body?.names)
    ? [...new Set(request.body.names.filter((name) => typeof name === 'string').map((name) => name.trim()).filter(Boolean))]
    : [];
  if (!names.length || names.length > 75) {
    response.status(400).json({ error: 'Between one and 75 card names are required.' });
    return;
  }
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const scryfallResponse = await fetch('https://api.scryfall.com/cards/collection', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'PDFDecks/1.0',
        },
        body: JSON.stringify({ identifiers: names.map((name) => ({ name })) }),
      });
      const body = await scryfallResponse.text();
      if (scryfallResponse.ok || (scryfallResponse.status < 500 && scryfallResponse.status !== 429) || attempt === 2) {
        response.status(scryfallResponse.status).type('application/json').send(body);
        return;
      }
    } catch (error) {
      if (attempt === 2) {
        response.status(502).json({ error: 'Scryfall is currently unavailable.' });
        return;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
  }
});

function getToken(request) {
  const authorization = request.get('authorization') || '';
  return authorization.startsWith('Bearer ') ? authorization.slice(7) : null;
}

async function requireAuth(request, response, next) {
  const token = getToken(request);
  if (!token) {
    response.status(401).json({ error: 'A valid auth token is required.' });
    return;
  }
  const sessions = await getCollection('sessions');
  const session = await sessions.findOne({ token });
  const username = session?.username || null;
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
  const users = await getCollection('users');
  if (await users.findOne({ usernameLower: username.toLowerCase() })) {
    response.status(409).json({ error: 'That username is already registered.' });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  await users.insertOne({
    username,
    usernameLower: username.toLowerCase(),
    passwordHash,
    friends: [],
    incomingFriendRequests: [],
    outgoingFriendRequests: [],
    createdAt: new Date(),
  });
  response.status(201).json({ message: 'Account created.' });
});

app.post('/api/auth/login', async (request, response) => {
  const username = typeof request.body.username === 'string' ? request.body.username.trim() : '';
  const password = typeof request.body.password === 'string' ? request.body.password : '';
  if (!validateUsername(username) || !validatePassword(password)) {
    response.status(400).json({ error: 'Enter a valid username and password.' });
    return;
  }
  const users = await getCollection('users');
  const user = await users.findOne({ usernameLower: username.toLowerCase() });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    response.status(401).json({ error: 'Invalid username or password.' });
    return;
  }
  const token = randomUUID();
  const sessions = await getCollection('sessions');
  await sessions.insertOne({ token, username: user.username, createdAt: new Date() });
  response.json({ token, username: user.username });
});

app.post('/api/auth/logout', requireAuth, async (request, response) => {
  const sessions = await getCollection('sessions');
  await sessions.deleteOne({ token: getToken(request) });
  response.status(204).end();
});

app.get('/api/me', requireAuth, (request, response) => {
  response.json({ username: request.username });
});

app.get('/api/decks', requireAuth, async (request, response) => {
  const deckCollection = await getCollection('decks');
  const savedDecks = await deckCollection
    .find({ usernameLower: request.username.toLowerCase() })
    .sort({ updatedAt: -1 })
    .toArray();
  response.json({
    username: request.username,
    decks: savedDecks.map(({ id, name, cards }) => ({ id, name, cards })),
  });
});

app.post('/api/decks', requireAuth, async (request, response) => {
  const validationError = validateDeck(request.body);
  if (validationError) {
    response.status(400).json({ error: validationError });
    return;
  }
  const deck = {
    id: typeof request.body.id === 'string' && request.body.id.trim() ? request.body.id : randomUUID(),
    name: request.body.name.trim(),
    cards: request.body.cards.map((card) => ({
      name: card.name.trim(),
      count: card.count,
      ...(typeof card.type === 'string' ? { type: card.type } : {}),
      ...(typeof card.mana === 'number' ? { mana: card.mana } : {}),
      ...(typeof card.color === 'string' ? { color: card.color } : {}),
    })),
  };
  const deckCollection = await getCollection('decks');
  await deckCollection.updateOne(
    { usernameLower: request.username.toLowerCase(), id: deck.id },
    {
      $set: {
        username: request.username,
        usernameLower: request.username.toLowerCase(),
        id: deck.id,
        name: deck.name,
        cards: deck.cards,
        updatedAt: new Date(),
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true },
  );
  response.status(201).json(deck);
});

app.delete('/api/decks/:id', requireAuth, async (request, response) => {
  const deckCollection = await getCollection('decks');
  const result = await deckCollection.deleteOne({
    usernameLower: request.username.toLowerCase(),
    id: request.params.id,
  });
  if (!result.deletedCount) {
    response.status(404).json({ error: 'Deck not found.' });
    return;
  }
  response.status(204).end();
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

app.get('/api/friends', requireAuth, async (request, response) => {
  const users = await getCollection('users');
  const user = await users.findOne({ usernameLower: request.username.toLowerCase() });
  response.json({
    friends: (user?.friends || []).map((username) => ({ name: username, status: 'online' })),
    incomingRequests: user?.incomingFriendRequests || [],
    outgoingRequests: user?.outgoingFriendRequests || [],
  });
});

app.post('/api/friends', requireAuth, async (request, response) => {
  const friendName = typeof request.body.username === 'string' ? request.body.username.trim() : '';
  if (!validateUsername(friendName)) {
    response.status(400).json({ error: 'Friend usernames must be 3-24 characters using only letters, numbers, or underscores.' });
    return;
  }
  const users = await getCollection('users');
  const friend = await users.findOne({ usernameLower: friendName.toLowerCase() });
  if (!friend) {
    response.status(404).json({ error: 'That player does not exist.' });
    return;
  }
  if (friend.username.toLowerCase() === request.username.toLowerCase()) {
    response.status(400).json({ error: 'You cannot add yourself as a friend.' });
    return;
  }
  const user = await users.findOne({ usernameLower: request.username.toLowerCase() });
  const userFriends = user?.friends || [];
  if (userFriends.includes(friend.username)) {
    response.status(409).json({ error: 'That player is already your friend.' });
    return;
  }
  const incomingRequests = user?.incomingFriendRequests || [];
  const outgoingRequests = user?.outgoingFriendRequests || [];
  if (incomingRequests.includes(friend.username)) {
    response.status(409).json({ error: 'This player has already sent you a friend request.' });
    return;
  }
  if (outgoingRequests.includes(friend.username)) {
    response.status(409).json({ error: 'A friend request is already pending.' });
    return;
  }
  await users.updateOne(
    { usernameLower: request.username.toLowerCase() },
    { $addToSet: { outgoingFriendRequests: friend.username } },
  );
  await users.updateOne(
    { usernameLower: friend.username.toLowerCase() },
    { $addToSet: { incomingFriendRequests: request.username } },
  );
  response.status(201).json({ name: friend.username, status: 'pending' });
});

app.post('/api/friends/respond', requireAuth, async (request, response) => {
  const requesterName = typeof request.body.username === 'string' ? request.body.username.trim() : '';
  const action = request.body.action;
  if (!validateUsername(requesterName) || !['accept', 'deny'].includes(action)) {
    response.status(400).json({ error: 'A valid username and friend request action are required.' });
    return;
  }
  const users = await getCollection('users');
  const user = await users.findOne({ usernameLower: request.username.toLowerCase() });
  if (!(user?.incomingFriendRequests || []).includes(requesterName)) {
    response.status(404).json({ error: 'That friend request was not found.' });
    return;
  }
  const requester = await users.findOne({ usernameLower: requesterName.toLowerCase() });
  if (!requester) {
    response.status(404).json({ error: 'That player does not exist.' });
    return;
  }
  await users.updateOne(
    { usernameLower: request.username.toLowerCase() },
    {
      $pull: { incomingFriendRequests: requester.username },
      ...(action === 'accept' ? { $addToSet: { friends: requester.username } } : {}),
    },
  );
  await users.updateOne(
    { usernameLower: requester.username.toLowerCase() },
    {
      $pull: { outgoingFriendRequests: request.username },
      ...(action === 'accept' ? { $addToSet: { friends: request.username } } : {}),
    },
  );
  response.json({ action, username: requester.username });
});

app.get('/api/public-decks', async (request, response) => {
  const publishedDecks = await getCollection('publishedDecks');
  const deckRows = await publishedDecks.find({}).sort({ date: -1 }).toArray();
  response.json({
    decks: deckRows.map(({ id, name, author, date, cards }) => ({ id, name, author, date, cards })),
  });
});

app.post('/api/public-decks', requireAuth, async (request, response) => {
  const validationError = validateDeck(request.body);
  if (validationError) {
    response.status(400).json({ error: validationError });
    return;
  }
  const deck = {
    id: typeof request.body.id === 'string' && request.body.id.trim() ? request.body.id : randomUUID(),
    name: request.body.name.trim(),
    author: request.username,
    date: new Date().toISOString(),
    cards: request.body.cards.map((card) => ({
      name: card.name.trim(),
      count: card.count,
    })),
  };
  const publishedDecks = await getCollection('publishedDecks');
  await publishedDecks.updateOne(
    { id: deck.id },
    { $set: deck },
    { upsert: true },
  );
  response.status(201).json(deck);
});

app.get('/api/public-deck-views', async (request, response) => {
  const views = await getCollection('deckViewCounts');
  const counts = await views.find({}).toArray();
  response.json({
    counts: Object.fromEntries(counts.map((item) => [item.deckName, item.count])),
  });
});

app.post('/api/public-deck-views/:name', async (request, response) => {
  const deckName = request.params.name;
  const views = await getCollection('deckViewCounts');
  await views.updateOne(
    { deckName },
    { $inc: { count: 1 }, $set: { updatedAt: new Date() } },
    { upsert: true },
  );
  const result = await views.findOne({ deckName });
  response.json({ deckName, count: result?.count || 1 });
});

app.use(express.static('public'));

app.use((request, response) => {
  response.status(404).json({ error: 'Route not found.' });
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
