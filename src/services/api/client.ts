import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { TokenStorage } from '../storage/tokenStorage';

const DEFAULT_API_URL = 'http://10.0.2.2:4000/api';
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL;
const REQUEST_TIMEOUT = Number(process.env.EXPO_PUBLIC_REQUEST_TIMEOUT) || 15000;

export class AppApiError extends Error {
  statusCode?: number;
  code?: string;
  isAuthError?: boolean;

  constructor(message: string, statusCode?: number, code?: string) {
    super(message);
    this.name = 'AppApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.isAuthError =
      statusCode === 401 ||
      message.toLowerCase().includes('not authorized') ||
      message.toLowerCase().includes('login again');
  }
}

/**
 * Pre-configured Axios instance for communicating with the Snazzyfit Node.js/Express backend.
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request Interceptor: Attach JWT token to headers as expected by backend (req.headers.token)
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await TokenStorage.getToken();
      if (token && config.headers) {
        // Backend middleware reads: const { token } = req.headers;
        config.headers['token'] = token;
        // Standard Authorization header attached as best practice
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('Could not read auth token from storage for request:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Normalize responses and catch backend errors wrapped in HTTP 200
apiClient.interceptors.response.use(
  (response) => {
    const data = response.data;
    // Backend returns { success: false, message: '...' } even with status 200 on validation/auth errors
    if (data && typeof data === 'object' && data.success === false) {
      const message = data.message || 'Request failed on server';
      return Promise.reject(new AppApiError(message, response.status));
    }
    return response;
  },
  (error: AxiosError<{ success?: boolean; message?: string }>) => {
    let message = 'An unexpected network error occurred';
    let statusCode = error.response?.status;

    if (error.response?.data?.message) {
      message = error.response.data.message;
    } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      message = 'Request timed out. Please check if your backend server is running.';
    } else if (error.message === 'Network Error' || !error.response) {
      message = `Cannot connect to server at ${API_BASE_URL}. Ensure backend is running.`;
    }

    return Promise.reject(new AppApiError(message, statusCode, error.code));
  }
);

export default apiClient;
