import React, { createContext, useContext, useEffect, useState, PropsWithChildren } from 'react';
import { User, LoginCredentials, RegisterCredentials } from '../types/auth';
import { authService } from '../services/api/authService';
import { userService } from '../services/api/userService';
import { TokenStorage } from '../services/storage/tokenStorage';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore session on app boot from secure storage
  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        const savedToken = await TokenStorage.getToken();
        if (savedToken) {
          setToken(savedToken);
          try {
            const profile = await userService.getProfile();
            if (isMounted) {
              setUser(profile);
            }
          } catch (profileError) {
            console.warn('Saved token is invalid or expired. Clearing token.');
            await TokenStorage.removeToken();
            if (isMounted) {
              setToken(null);
              setUser(null);
            }
          }
        }
      } catch (error) {
        console.error('Session restoration error:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    restoreSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const authRes = await authService.login(credentials);
      if (authRes.token) {
        await TokenStorage.setToken(authRes.token);
        setToken(authRes.token);
        // Fetch full profile from backend
        const profile = await userService.getProfile();
        setUser(profile);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    setIsLoading(true);
    try {
      const authRes = await authService.register(credentials);
      if (authRes.token) {
        await TokenStorage.setToken(authRes.token);
        setToken(authRes.token);
        const profile = await userService.getProfile();
        setUser(profile);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await TokenStorage.removeToken();
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (!token) return;
    try {
      const updatedProfile = await userService.getProfile();
      setUser(updatedProfile);
    } catch (err) {
      console.warn('Could not refresh profile:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        logout,
        refreshProfile,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
