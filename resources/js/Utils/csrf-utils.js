/**
 * Lee el XSRF-TOKEN de la cookie (Laravel lo setea automáticamente)
 */
function getTokenFromCookie() {
  const match = document.cookie
    .split('; ')
    .find(row => row.startsWith('XSRF-TOKEN='));
  
  return match ? decodeURIComponent(match.split('=')[1]) : null;
}

/**
 * Obtiene el CSRF token - primero cookie, luego meta tag
 */
export function getCsrfToken() {
  return getTokenFromCookie() 
    || document.querySelector('meta[name="csrf-token"]')?.content 
    || '';
}

/**
 * Refresca el CSRF token
 */
export async function refreshCsrfToken() {
  await fetch('/sanctum/csrf-cookie', {
    method: 'GET',
    credentials: 'include',
  });
  
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const token = getCsrfToken();
  if (!token) throw new Error('No se pudo obtener CSRF token');
  return token;
}

/**
 * Fetch con CSRF automático
 */
export async function fetchWithCsrf(url, options = {}) {
  let token = getCsrfToken();
  
  if (!token) {
    token = await refreshCsrfToken();
  }

  const isFormData = options.body instanceof FormData;
  
  const headers = {
    'Accept': 'application/json',
    'X-XSRF-TOKEN': token,        // ← XSRF, no CSRF
    ...options.headers,
  };

  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const fetchOptions = {
    ...options,
    credentials: 'include',
    headers,
  };

  let response = await fetch(url, fetchOptions);

  if (response.status === 419) {
    token = await refreshCsrfToken();
    fetchOptions.headers['X-XSRF-TOKEN'] = token;
    response = await fetch(url, fetchOptions);
  }

  return response;
}

export async function deleteWithCsrf(url) {
  return fetchWithCsrf(url, { method: 'DELETE' });
}