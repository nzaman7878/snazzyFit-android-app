import { apiClient } from './client';
import { AuthResponse, LoginCredentials, RegisterCredentials } from '../../types/auth';

export const authService = {
  /**
   * Log in an existing user with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/user/login', {
      email: credentials.email.trim(),
      password: credentials.password,
    });
    return response.data;
  },

  /**
   * Register a new user with name, email, and password (min 8 chars)
   */
  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/user/register', {
      name: credentials.name.trim(),
      email: credentials.email.trim(),
      password: credentials.password,
    });
    return response.data;
  },

  /**
   * Request password reset instructions email
   */
  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post('/user/forgot-password', {
      email: email.trim(),
    });
    return response.data;
  },

  /**
   * Reset password using token sent to user's email
   */
  async resetPassword(token: string, password: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post('/user/reset-password', {
      token,
      password,
    });
    return response.data;
  },
};

export default authService;
