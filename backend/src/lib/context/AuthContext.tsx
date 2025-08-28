'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface User {
  id: number;
  username: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (token: string, userData: User) => void;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
  checkTokenValidity: () => Promise<boolean>;
  apiCall: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const isAuthenticated = !!user;

  useEffect(() => {
    // Check for stored auth data on mount
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        // Invalid stored data, clear it
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
      }
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    // Redirect logic
    if (!loading) {
      const isLoginPage = pathname === '/login';
      const isPublicPage = pathname === '/' || pathname === '/login';

      if (!isAuthenticated && !isPublicPage) {
        router.push('/login');
      } else if (isAuthenticated && isLoginPage) {
        router.push('/admin');
      }
    }
  }, [isAuthenticated, loading, pathname, router]);

  const login = (token: string, userData: User) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    // Force redirect after login
    setTimeout(() => {
      router.push('/admin');
    }, 100);
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  const checkTokenValidity = async (): Promise<boolean> => {
    const token = localStorage.getItem('auth_token');
    if (!token) return false;

    try {
      const response = await fetch('/api/admin/users', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        // Token expired or invalid
        logout();
        return false;
      }

      return response.ok;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  };

  // Enhanced API call function that automatically handles token expiration
  const apiCall = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const token = localStorage.getItem('auth_token');
    
    // Add token to headers if available
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
      ...(token && { 'Authorization': `Bearer ${token}` })
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      // If token is expired/invalid, logout and redirect
      if (response.status === 401) {
        logout();
        return response;
      }

      return response;
    } catch (error) {
      console.error('API call error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    loading,
    isAuthenticated,
    checkTokenValidity,
    apiCall,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Higher-order component to protect pages
export function withAuth<T extends Record<string, any>>(
  WrappedComponent: React.ComponentType<T>
) {
  const AuthenticatedComponent = (props: T) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null; // AuthContext will handle redirect
    }

    return <WrappedComponent {...props} />;
  };

  AuthenticatedComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name})`;

  return AuthenticatedComponent;
}