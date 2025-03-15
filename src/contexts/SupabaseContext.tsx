'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { useAuth } from './AuthContext';
import { getClient } from '@/lib/supabase-service';
import { isOfflineDatabaseEnabled } from '@/lib/env-service';

// Define a User type for the auth context
interface Organization {
  id: string;
  name: string;
}

interface User {
  id: string;
  email: string;
  organization?: Organization;
}

// Create context for the Supabase client
interface SupabaseContextType {
  supabase: SupabaseClient | any; // We use 'any' to accommodate the offline client
  isOffline: boolean;
  isLoading: boolean;
  error: Error | null;
  refreshClient: () => void;
}

const SupabaseContext = createContext<SupabaseContextType>({
  supabase: null,
  isOffline: false,
  isLoading: true,
  error: null,
  refreshClient: () => {}
});

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [supabase, setSupabase] = useState<SupabaseClient | any>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const initClient = useCallback(async () => {
    setIsLoading(true);
    try {
      // Preferably use the server client if the app is running on the server
      const client = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      setSupabase(client);
      setError(null);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Initialize the client when the component mounts or when the user changes
  useEffect(() => {
    initClient();
  }, [user, initClient]);
  
  // Listen for online/offline changes
  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return;
    
    const handleOnline = () => {
      if (isOffline) {
        setIsOffline(false);
        initClient();
      }
    };
    
    const handleOffline = () => {
      setIsOffline(true);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOffline, initClient]);
  
  const value = {
    supabase,
    isOffline,
    isLoading,
    error,
    refreshClient: initClient
  };
  
  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
}

export const useSupabase = () => useContext(SupabaseContext); 