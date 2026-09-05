import type { ApiError, ApiResponse } from '@/types/common';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export class ApiClientError extends Error implements ApiError {
  success: false = false;
  code?: string;
  errors?: Record<string, string[]>;
  traceId?: string;
  status: number;

  constructor(status: number, message: string, code?: string, errors?: Record<string, string[]>, traceId?: string) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.errors = errors;
    this.traceId = traceId;
  }
}

class HttpClient {
  private getAuthToken(): string | null {
    return localStorage.getItem('dealflow_jwt_token');
  }

  private getPortalToken(): string | null {
    return localStorage.getItem('dealflow_portal_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const authToken = this.getAuthToken();
    if (authToken && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const portalToken = this.getPortalToken();
    if (portalToken && !headers['X-Portal-Token']) {
      headers['X-Portal-Token'] = portalToken;
    }

    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        headers,
      });
    } catch (err: unknown) {
      throw new ApiClientError(
        0,
        'Network error. Unable to communicate with the DealFlow360 server.',
        'NETWORK_ERROR'
      );
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    let json: any = null;
    try {
      json = await response.json();
    } catch {
      // Body might be empty or not JSON
    }

    if (!response.ok) {
      // 401 Unauthorized handling
      if (response.status === 401) {
        // If internal session is expired, clear token
        if (authToken && !endpoint.includes('/auth/login') && !endpoint.includes('/portal/auth')) {
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

    // If wrapped in standard envelope { success: true, data: ... }
    if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
      return (json as ApiResponse<T>).data;
    }

    return json as T;
  }

  get<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', headers });
  }

  post<T>(endpoint: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(endpoint: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', headers });
  }

  patch<T>(endpoint: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }
}

export const apiClient = new HttpClient();
