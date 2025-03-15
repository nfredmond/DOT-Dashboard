"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { createClient } from '@/utils/supabase/client'

interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  role?: "admin" | "user" | "manager"
  organization?: string
  agencyId?: string
  profileImage?: string
  phoneNumber?: string
  department?: string
  position?: string
  bio?: string
  linkedIn?: string
  twitter?: string
  website?: string
  location?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>
  logout: () => Promise<void>
  register: (userData: any) => Promise<boolean>
  updateUserProfile: (profileData: Partial<User>) => Promise<boolean>
  error: string | null
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  // Check if the user is already logged in when the app loads
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true)
        
        // Check for demo user in localStorage first
        const demoUser = localStorage.getItem('rtpa_demo_user');
        if (demoUser) {
          console.log('Found demo user in localStorage');
          setUser(JSON.parse(demoUser));
          setIsLoading(false);
          return;
        }
        
        // Get the session from Supabase
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          throw sessionError
        }
        
        if (session) {
          // Get user profile data from the profiles table
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single()
            
          if (profileError && profileError.code !== 'PGRST116') {
            console.error("Error fetching profile:", profileError)
          }
            
          const userData: User = {
            id: session.user.id,
            email: session.user.email || '',
            firstName: profileData?.first_name,
            lastName: profileData?.last_name,
            role: profileData?.role || 'user',
            organization: profileData?.organization,
            profileImage: profileData?.profile_image,
            // Add other profile fields as needed
          }
            
          setUser(userData)
        }
      } catch (error) {
        console.error("Authentication error:", error)
        setError("Failed to authenticate")
      } finally {
        setIsLoading(false)
      }
    }

    // Initial auth check
    checkAuth()
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Get user profile when signed in
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single()
          
        const userData: User = {
          id: session.user.id,
          email: session.user.email || '',
          firstName: profileData?.first_name,
          lastName: profileData?.last_name,
          role: profileData?.role || 'user',
          organization: profileData?.organization,
          profileImage: profileData?.profile_image,
          // Add other profile fields as needed
        }
          
        setUser(userData)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
      }
    })
    
    // Cleanup on unmount
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Special case for demo credentials
      if (email === 'admin@example.com' && password === 'password') {
        console.log('Using demo login credentials');
        
        // Create a mock user for demo purposes
        const mockUser: User = {
          id: 'demo-user-id',
          email: 'admin@example.com',
          firstName: 'Admin',
          lastName: 'User',
          role: 'admin',
          organization: 'RTPA'
        };
        
        // Set the user in state
        setUser(mockUser);
        
        // Save to localStorage to persist the session
        localStorage.setItem('rtpa_demo_user', JSON.stringify(mockUser));
        
        return true;
      }
      
      // Regular Supabase authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        throw error
      }
      
      return true
    } catch (error: any) {
      console.error("Login error:", error)
      setError(error.message || "Failed to login")
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async (): Promise<void> => {
    setIsLoading(true)
    
    try {
      // Clear demo user from localStorage if it exists
      if (localStorage.getItem('rtpa_demo_user')) {
        localStorage.removeItem('rtpa_demo_user');
        setUser(null);
        setIsLoading(false);
        return;
      }
      
      // Regular Supabase logout
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        throw error
      }
      
      setUser(null)
    } catch (error: any) {
      console.error("Logout error:", error)
      setError(error.message || "Failed to logout")
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (userData: any): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Register with Supabase
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
          }
        }
      })
      
      if (error) {
        throw error
      }
      
      if (data.user) {
        // Create profile in the profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: data.user.id,
            first_name: userData.firstName,
            last_name: userData.lastName,
            role: 'user',
            organization: userData.organization || null,
          })
          
        if (profileError) {
          console.error("Error creating profile:", profileError)
          // Still return true, as the user was created
        }
      }
      
      return true
    } catch (error: any) {
      console.error("Registration error:", error)
      setError(error.message || "Failed to register")
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const updateUserProfile = async (profileData: Partial<User>): Promise<boolean> => {
    if (!user) return false
    
    setIsLoading(true)
    setError(null)
    
    try {
      // Map the profile data to database field names
      const dbProfileData = {
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        organization: profileData.organization,
        profile_image: profileData.profileImage,
        // Add more fields as needed
      }
      
      // Remove undefined values
      Object.keys(dbProfileData).forEach(key => 
        (dbProfileData as any)[key] === undefined && delete (dbProfileData as any)[key]
      )
      
      const { error } = await supabase
        .from('profiles')
        .update(dbProfileData)
        .eq('user_id', user.id)
        
      if (error) {
        throw error
      }
      
      // Update local user state
      setUser({ ...user, ...profileData })
      return true
    } catch (error: any) {
      console.error("Profile update error:", error)
      setError(error.message || "Failed to update profile")
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      register,
      updateUserProfile,
      error
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 