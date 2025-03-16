"use client"

import { useContext } from 'react'
import { AuthContext } from '@/contexts/AuthContext'

export const useAuth = () => {
  const context = useContext(AuthContext)
  
  // If context is defined, return it immediately
  if (context !== undefined) {
    return context;
  }
  
  // If we're on the client and there's a demo user, create a valid context with the demo user
  if (typeof window !== 'undefined') {
    // Check for demo user in localStorage
    const demoUserString = localStorage.getItem('planning_manager_demo_user');
    if (demoUserString) {
      try {
        const demoUser = JSON.parse(demoUserString);
        console.log('useAuth (hook): Using demo user from localStorage when outside AuthProvider');
        // Return a context with the demo user, similar to what AuthProvider would provide
        return {
          user: demoUser,
          isAuthenticated: true,
          isLoading: false,
          login: async () => false,
          logout: async () => {},
          register: async () => false,
          updateUserProfile: async () => false,
          error: null
        };
      } catch (e) {
        console.warn('Error parsing demo user from localStorage:', e);
      }
    }
  }
  
  // Only log a warning if we didn't find a demo user
  console.warn('useAuth (hook) was used outside of AuthProvider - using fallback values');
  
  // Return a fallback/default auth context instead of throwing an error
  return {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: async () => false,
    logout: async () => {},
    register: async () => false,
    updateUserProfile: async () => false,
    error: null
  }
} 