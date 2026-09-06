/**
 * DealFlow360 Centralized API Client
 * Authoritative HTTP communications handler with automatic JWT Bearer injection,
 * RFC 7807 problem details parsing, and error normalization.
 */

const TOKEN_KEY = 'dealflow_token';
const USER_KEY = 'dealflow_user';

export const getStoredToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setStoredAuth = (token, user) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);

    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  } catch (err) {
    console.warn('Storage write error:', err);
  }
};

export const clearStoredAuth = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch (err) {
    console.warn('Storage clear error:', err);
  }
};

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export class ApiError extends Error {
  constructor(message, status = 500, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

async function handleResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  let data = null;
  if (isJson) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    if (response.status === 401) {
      window.dispatchEvent(new CustomEvent('dealflow:unauthorized'));
    }

    let errorMessage = `Request failed with status ${response.status}`;
    if (data) {
      if (typeof data === 'string' && data.length > 0) {
        errorMessage = data;
      } else if (typeof data === 'object') {
        errorMessage = data.detail || data.message || data.title || JSON.stringify(data);
      }
    }

    throw new ApiError(errorMessage, response.status, data);
  }

  return data;
}

export async function apiRequest(endpoint, options = {}) {
  const {
    method = 'GET',
    body,
    headers = {},
    token: overrideToken,
    ...restOptions
  } = options;

  const token = overrideToken !== undefined ? overrideToken : getStoredToken();

  const reqHeaders = {
    Accept: 'application/json',
    ...headers,
  };

  if (body !== undefined && !(body instanceof FormData)) {
    reqHeaders['Content-Type'] = 'application/json';
  }

  if (token) {
    reqHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers: reqHeaders,
    ...restOptions,
  };

  if (body !== undefined) {
    config.body = typeof body === 'string' || body instanceof FormData ? body : JSON.stringify(body);
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const url = cleanEndpoint.startsWith('api/') ? `/${cleanEndpoint}` : `/api/${cleanEndpoint}`;

  const response = await fetch(url, config);
  return handleResponse(response);
}

export async function downloadBlob(endpoint, filename, options = {}) {
  const token = options.token !== undefined ? options.token : getStoredToken();
  const reqHeaders = {
    Accept: 'application/pdf, application/octet-stream, */*',
    ...(options.headers || {}),
  };

  if (token) {
    reqHeaders['Authorization'] = `Bearer ${token}`;
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const url = cleanEndpoint.startsWith('api/') ? `/${cleanEndpoint}` : `/api/${cleanEndpoint}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: reqHeaders,
  });

  if (!response.ok) {
    let errMsg = `Failed to download file (Status ${response.status})`;
    try {
      const errData = await response.json();
      errMsg = errData.message || errData.title || errMsg;
    } catch {
      // ignore
    }
    throw new Error(errMsg);
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
  return true;
}

export const apiClient = {
  get: (url, options) => apiRequest(url, { method: 'GET', ...options }),
  post: (url, body, options) => apiRequest(url, { method: 'POST', body, ...options }),
  put: (url, body, options) => apiRequest(url, { method: 'PUT', body, ...options }),
  delete: (url, options) => apiRequest(url, { method: 'DELETE', ...options }),
  download: (url, filename, options) => downloadBlob(url, filename, options),
};

export default apiClient;

