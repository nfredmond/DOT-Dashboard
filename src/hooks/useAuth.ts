"use client"

import { useState, useEffect } from 'react'

// Types for our auth state
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
}

export function useAuth(): AuthState {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
  });

  useEffect(() => {
    // In a real app, this would check a token in localStorage
    // and validate it with your auth service
    const checkAuth = async () => {
      try {
        // Simulate a delay for API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // For demo purposes, we'll just consider the user authenticated
        // In a real app, you would check if there's a valid token and fetch user data
        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          user: {
            id: '123',
            name: 'Demo User',
            email: 'user@example.com',
            role: 'global_admin',
          },
        });
      } catch (error) {
        console.error('Auth check failed:', error);
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          user: null,
        });
      }
    };

    checkAuth();
  }, []);

  return authState;
} 