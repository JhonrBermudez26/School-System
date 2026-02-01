/**
 * Utilidades para manejo de CSRF Token
 * Centraliza la lógica de obtención y refresco del token
 */

/**
 * Obtiene el CSRF token actual del meta tag
 * @returns {string|null}
 */
export function getCsrfToken() {
  const token = document.querySelector('meta[name="csrf-token"]')?.content;
  if (!token) {
    console.warn('CSRF token no encontrado en meta tag');
  }
  return token || '';
}

/**
 * Refresca el CSRF token haciendo una petición a /sanctum/csrf-cookie
 * @returns {Promise<string>} El nuevo token
 */
export async function refreshCsrfToken() {
  try {
    console.log('Refrescando CSRF token...');
    
    const response = await fetch('/sanctum/csrf-cookie', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error al obtener csrf-cookie: ${response.status}`);
    }

    // Esperar un momento para que el meta tag se actualice
    await new Promise(resolve => setTimeout(resolve, 300));

    const newToken = getCsrfToken();
    
    if (!newToken) {
      throw new Error('No se pudo obtener el token después de refrescar');
    }

    console.log('CSRF token refrescado exitosamente');
    return newToken;
  } catch (error) {
    console.error('Error al refrescar CSRF token:', error);
    throw error;
  }
}

/**
 * Obtiene headers comunes para peticiones fetch incluyendo CSRF
 * @param {boolean} includeContentType - Si incluir Content-Type (false para FormData)
 * @returns {Object}
 */
export function getCommonHeaders(includeContentType = true) {
  const headers = {
    'Accept': 'application/json',
    'X-CSRF-TOKEN': getCsrfToken(),
  };

  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
}

/**
 * Wrapper para fetch que maneja CSRF automáticamente
 * @param {string} url 
 * @param {Object} options 
 * @returns {Promise<Response>}
 */
export async function fetchWithCsrf(url, options = {}) {
  let token = getCsrfToken();

  // Si no hay token, intentar refrescarlo
  if (!token) {
    try {
      token = await refreshCsrfToken();
    } catch (error) {
      console.error('No se pudo obtener CSRF token');
      throw new Error('Token CSRF no disponible');
    }
  }

  // Preparar headers
  const headers = {
    'Accept': 'application/json',
    'X-CSRF-TOKEN': token,
    ...options.headers,
  };

  // No agregar Content-Type si es FormData (el navegador lo hace automáticamente)
  const isFormData = options.body instanceof FormData;
  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const fetchOptions = {
    ...options,
    credentials: 'include', // Importante para cookies
    headers,
  };

  try {
    const response = await fetch(url, fetchOptions);

    // Si hay error 419 (CSRF mismatch), intentar refrescar token y reintentar UNA vez
    if (response.status === 419) {
      console.warn('CSRF token expirado (419), refrescando y reintentando...');
      
      token = await refreshCsrfToken();
      
      // Reintentar con nuevo token
      fetchOptions.headers['X-CSRF-TOKEN'] = token;
      return await fetch(url, fetchOptions);
    }

    return response;
  } catch (error) {
    console.error('Error en fetchWithCsrf:', error);
    throw error;
  }
}

/**
 * Función específica para eliminar archivos con manejo de CSRF
 */
export async function deleteWithCsrf(url) {
  return fetchWithCsrf(url, { method: 'DELETE' });
}