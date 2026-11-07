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
  const result = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(result?.error || 'The service request failed.');
  return result;
}

export async function getCurrentUser(token) {
  const response = await fetch('/api/me', { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error('Your session has expired.');
  return response.json();
}

export function setAuthToken(token) {
  if (token) localStorage.setItem(tokenKey, token);
  else localStorage.removeItem(tokenKey);
}
