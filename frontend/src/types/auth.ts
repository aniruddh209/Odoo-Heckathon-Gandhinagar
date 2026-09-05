export const Role = {
  Admin: 'Admin',
  SalesRep: 'SalesRep',
  SalesManager: 'SalesManager',
  FinanceOperations: 'FinanceOperations',
  Customer: 'Customer',
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export interface UserDto {
  id: number;
  Id?: number;
  email: string;
  Email?: string;
  fullName: string;
  FullName?: string;
  role: Role;
  Role?: Role;
  salesTeamId?: number;
  teamName?: string;
  department?: string;
  Department?: string;
  historicalDiscountAvg: number;
  isActive: boolean;
  createdAt: string;
}

export interface LoginRequest {
  email?: string;
  Email?: string;
  password?: string;
  Password?: string;
}

export interface SignupRequest {
  email?: string;
  Email?: string;
  password?: string;
  Password?: string;
  fullName?: string;
  FullName?: string;
  role?: Role;
  Role?: Role;
  department?: string;
  Department?: string;
  salesTeamId?: number;
  SalesTeamId?: number;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  expiresAt: string;
  user: UserDto;
}

export interface RefreshTokenRequest {
  token: string;
  refreshToken: string;
}
