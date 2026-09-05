const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Custom Error class for API network and HTTP failures
 */
export class ApiClientError extends Error {
  constructor(status, message, code, errors, traceId) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.errors = errors;
    this.traceId = traceId;
  }
}

/**
 * Centralized HTTP client built using native browser fetch()
 */
class HttpClient {
  getAuthToken() {
    return localStorage.getItem('dealflow_jwt_token');
  }

  getPortalToken() {
    return localStorage.getItem('dealflow_portal_token');
  }

  async request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers || {}),
    };

    const isPortalEndpoint = endpoint.includes('/portal/');
    const portalToken = this.getPortalToken();
    const authToken = this.getAuthToken();

    // Attach proper bearer token based on context
    if (isPortalEndpoint && portalToken && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${portalToken}`;
    } else if (authToken && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    let response;
    try {
      response = await fetch(url, {
        ...options,
        headers,
      });
    } catch (err) {
      throw new ApiClientError(
        0,
        'Network error. Unable to communicate with the DealFlow360 server.',
        'NETWORK_ERROR'
      );
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {};
    }

    // Check if response is a binary blob (e.g. PDF download)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/pdf')) {
      if (!response.ok) {
        throw new ApiClientError(response.status, 'Failed to download PDF document.');
      }
      return await response.blob();
    }

    let json = null;
    try {
      json = await response.json();
    } catch {
      // Response body might be empty or non-JSON
    }

    if (!response.ok) {
      // 401 Unauthorized handling
      if (response.status === 401) {
        if (!endpoint.includes('/auth/login') && !endpoint.includes('/portal/auth')) {
          localStorage.removeItem('dealflow_jwt_token');
          localStorage.removeItem('dealflow_user');
          window.dispatchEvent(new Event('dealflow_auth_expired'));
        }
      }

      const errorMessage = json?.message || `Request failed with status ${response.status}`;
      const code = json?.code;
      const errors = json?.errors;
      const traceId = json?.traceId;

      throw new ApiClientError(response.status, errorMessage, code, errors, traceId);
    }

    // If backend returns standard envelope { success: true, data: ... }
    if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
      return json.data;
    }

    return json;
  }

  get(endpoint, headers) {
    return this.request(endpoint, { method: 'GET', headers });
  }

  post(endpoint, body, headers) {
    return this.request(endpoint, {
      method: 'POST',
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  put(endpoint, body, headers) {
    return this.request(endpoint, {
      method: 'PUT',
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  delete(endpoint, headers) {
    return this.request(endpoint, { method: 'DELETE', headers });
  }

  patch(endpoint, body, headers) {
    return this.request(endpoint, {
      method: 'PATCH',
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }
}

export const apiClient = new HttpClient();
export default apiClient;
