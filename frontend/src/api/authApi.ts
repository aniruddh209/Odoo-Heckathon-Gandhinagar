import { apiClient } from './client';
import type { AuthResponse, LoginRequest, RefreshTokenRequest, SignupRequest, UserDto } from '@/types/auth';

export const authApi = {
  login: (data: LoginRequest) => apiClient.post<AuthResponse>('/auth/login', data),
  signup: (data: SignupRequest) => apiClient.post<AuthResponse>('/auth/signup', data),
  refresh: (data: RefreshTokenRequest) => apiClient.post<AuthResponse>('/auth/refresh', data),
  logout: () => apiClient.post<{ message: string }>('/auth/logout'),
  me: () => apiClient.get<UserDto>('/auth/me'),
  getUsers: () => apiClient.get<UserDto[]>('/users'),
  getUserById: (id: number) => apiClient.get<UserDto>(`/users/${id}`),
  updateUser: (id: number, data: Partial<UserDto>) => apiClient.put<UserDto>(`/users/${id}`, data),
  updateUserStatus: (id: number, isActive: boolean) => apiClient.patch<UserDto>(`/users/${id}/status`, { isActive }),
};
