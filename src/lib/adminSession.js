import { PAYMENTS_URL } from '../config/env';

let csrfToken = '';

const parseResponse = async (response) => {
  const raw = await response.text();
  let data;
  try { data = JSON.parse(raw); }
  catch { throw new Error(`Respuesta no válida del servidor (status ${response.status}).`); }
  if (!response.ok || data?.ok === false) throw new Error(data?.error || `Error ${response.status}`);
  return data;
};

const endpoint = (action) => `${PAYMENTS_URL}?action=${action}`;

export async function fetchAdminSession() {
  const response = await fetch(endpoint('admin_session'), { credentials: 'include' });
  const data = await parseResponse(response);
  csrfToken = data.csrf_token || '';
  return data;
}

export async function loginAdmin(username, password) {
  const response = await fetch(endpoint('admin_login'), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
    body: JSON.stringify({ username, password }),
  });
  const data = await parseResponse(response);
  csrfToken = data.csrf_token || '';
  return data;
}

export async function logoutAdmin() {
  try {
    const response = await fetch(endpoint('admin_logout'), {
      method: 'POST',
      credentials: 'include',
      headers: { 'X-CSRF-Token': csrfToken },
    });
    await parseResponse(response);
  } finally {
    csrfToken = '';
  }
}

export async function adminFetch(url, options = {}) {
  const headers = new Headers(options.headers || {});
  if ((options.method || 'GET').toUpperCase() !== 'GET') {
    if (csrfToken) headers.set('X-CSRF-Token', csrfToken);
  }
  const response = await fetch(url, { ...options, headers, credentials: 'include' });
  if (response.status === 401) {
    csrfToken = '';
    window.dispatchEvent(new Event('clubhuella-admin-session-expired'));
  }
  return response;
}
