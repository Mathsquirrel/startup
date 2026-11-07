const tokenKey = 'pdf-auth-token';

export function getAuthToken() {
  return localStorage.getItem(tokenKey);
}

export async function authRequest(path, body, token = null) {
  const response = await fetch(`/api${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  const text = response.status === 204 ? '' : await response.text();
  let result = null;
  if (text) {
    try {
      result = JSON.parse(text);
    } catch {
      throw new Error('The service returned an invalid response. Is the backend running on port 4000?');
    }
  }
  if (!response.ok) throw new Error(result?.error || 'The service request failed.');
  return result;
}

export async function getCurrentUser(token) {
  const response = await fetch('/api/me', { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error('Your session has expired.');
  return response.json();
}

export async function getFriends(token) {
  const response = await fetch('/api/friends', { headers: { Authorization: `Bearer ${token}` } });
  const result = await response.json();
  if (!response.ok) throw new Error(result?.error || 'Unable to load friends.');
  return result.friends;
}

export async function validateDeck(deck, token) {
  return authRequest('/decks/validate', deck, token);
}

export async function saveDeckToService(deck, token) {
  return authRequest('/decks', deck, token);
}

export function setAuthToken(token) {
  if (token) localStorage.setItem(tokenKey, token);
  else localStorage.removeItem(tokenKey);
}
