"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { createClient } from '@/utils/supabase/client'
import { UserRole } from '@/types/organization';

interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  role: UserRole
  isGlobalAdmin?: boolean
  organizationId: string
  organizationName?: string
  organizationRole?: UserRole
  profileImage?: string
  phoneNumber?: string
  department?: string
  position?: string
  bio?: string
  linkedIn?: string
  twitter?: string
  website?: string
  location?: string
  permissions?: string[]
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
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const supabase = createClient()

  // Check if the user is already logged in when the app loads
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true)
        
        // Check for demo user in localStorage first
        const demoUser = localStorage.getItem('planning_manager_demo_user');
        if (demoUser) {
          console.log('Found demo user in localStorage');
          setUser(JSON.parse(demoUser));
          setIsAuthenticated(true);
          
          // Set a cookie to indicate demo mode for server-side API routes
          document.cookie = "planning_manager_demo_mode=true; path=/; max-age=86400";
          
          setIsLoading(false);
          return;
        }
        
        // Get the session from Supabase
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          throw sessionError
        }
        
        if (session) {
          // Check if the email belongs to greendottransportation.com
          const isGreendotEmployee = session.user.email?.endsWith('@greendottransportation.com');
          
          // Get user profile data from the profiles table
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single()
            
          if (profileError && profileError.code !== 'PGRST116') {
            console.error("Error fetching profile:", profileError)
          }
          
          // If user is from greendottransportation.com but doesn't have global_admin role, update it
          if (isGreendotEmployee && profileData && 
              (profileData.role !== 'global_admin' || !profileData.isGlobalAdmin)) {
            
            // Update profile to have global admin privileges
            const { error: updateError } = await supabase
              .from('profiles')
              .update({
                role: 'global_admin',
                isGlobalAdmin: true,
                metadata: { ...profileData.metadata, isGlobalAdmin: true }
              })
              .eq('user_id', session.user.id);
              
            if (updateError) {
              console.error("Error updating profile to global admin:", updateError);
            } else {
              // Refresh profile data after update
              const { data: refreshedProfile } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', session.user.id)
                .single();
                
              if (refreshedProfile) {
                profileData.role = refreshedProfile.role;
                profileData.isGlobalAdmin = refreshedProfile.isGlobalAdmin;
                profileData.metadata = refreshedProfile.metadata;
              }
            }
            
            // Also update auth metadata
            await supabase.auth.updateUser({
              data: {
                isGlobalAdmin: true,
                role: 'global_admin'
              }
            });
          }
          
          const userData: User = {
            id: session.user.id,
            email: session.user.email || '',
            firstName: profileData?.first_name,
            lastName: profileData?.last_name,
            role: isGreendotEmployee ? 'global_admin' : (profileData?.role || 'user'),
            isGlobalAdmin: isGreendotEmployee ? true : (profileData?.isGlobalAdmin || false),
            organizationId: profileData?.organization_id || '',
            organizationName: profileData?.organization_name,
            organizationRole: isGreendotEmployee ? 'org_admin' : profileData?.organization_role,
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
          organizationId: profileData?.organization_id || '',
          organizationName: profileData?.organization_name,
          organizationRole: profileData?.organization_role,
          profileImage: profileData?.profile_image,
          // Add other profile fields as needed
        }
          
        setUser(userData)
        setIsAuthenticated(true)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setIsAuthenticated(false)
      }
    })
    
    // Cleanup on unmount
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // If user exists, we are authenticated - update isAuthenticated state when user changes
  useEffect(() => {
    setIsAuthenticated(!!user);
  }, [user]);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Special case for demo admin credentials
      if (email === 'admin@example.com' && password === 'password') {
        console.log('Using demo admin login credentials');
        
        // Create a mock admin user for demo purposes
        const demoAdminUser: User = {
          id: 'demo-admin-id',
          email: 'admin@example.com',
          firstName: 'Demo',
          lastName: 'Admin',
          role: 'global_admin',
          isGlobalAdmin: true,
          organizationId: 'demo-org-id',
          organizationName: 'Demo Organization'
        };
        
        // Save to localStorage to persist the session
        localStorage.setItem('planning_manager_demo_user', JSON.stringify(demoAdminUser));
        setUser(demoAdminUser);
        setIsAuthenticated(true);
        
        setIsLoading(false);
        return true;
      }
      
      // Special case for demo regular user credentials
      if (email === 'user@example.com' && password === 'password') {
        console.log('Using demo regular user login credentials');
        
        // Create a mock regular user for demo purposes
        const demoRegularUser: User = {
          id: 'demo-user-id',
          email: 'user@example.com',
          firstName: 'Demo',
          lastName: 'User',
          role: 'org_member',
          isGlobalAdmin: false,
          organizationId: 'demo-org-id',
          organizationName: 'Demo Organization'
        };
        
        // Save to localStorage to persist the session
        localStorage.setItem('planning_manager_demo_user', JSON.stringify(demoRegularUser));
        setUser(demoRegularUser);
        setIsAuthenticated(true);
        
        setIsLoading(false);
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
      
      if (data?.user) {
        // Check if the email belongs to greendottransportation.com again after sign-in
        const isGreendotEmployee = data.user.email?.endsWith('@greendottransportation.com');
        
        // Update user state with login data
        // Get user profile data from the profiles table
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', data.user.id)
          .single()
          
        if (profileError && profileError.code !== 'PGRST116') {
          console.error("Error fetching profile:", profileError)
        }
        
        const userData: User = {
          id: data.user.id,
          email: data.user.email || '',
          firstName: profileData?.first_name,
          lastName: profileData?.last_name,
          role: isGreendotEmployee ? 'global_admin' : (profileData?.role || 'user'),
          isGlobalAdmin: isGreendotEmployee ? true : (profileData?.isGlobalAdmin || false),
          organizationId: profileData?.organization_id || '',
          organizationName: profileData?.organization_name,
          organizationRole: isGreendotEmployee ? 'org_admin' : profileData?.organization_role,
          profileImage: profileData?.profile_image,
        }
        
        setUser(userData)
        setIsAuthenticated(true)
        return true
      }
      
      return false
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
    setError(null)
    
    try {
      // Check if we're using a demo user
      if (localStorage.getItem('planning_manager_demo_user')) {
        // Clear the demo user from localStorage
        localStorage.removeItem('planning_manager_demo_user');
        
        // Remove the demo mode cookie
        document.cookie = "planning_manager_demo_mode=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        
        // Reset user state
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }
      
      // Regular Supabase logout
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        throw error
      }
      
      setUser(null)
      setIsAuthenticated(false)
    } catch (error) {
      console.error("Logout error:", error)
      setError("Failed to log out")
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
        // Check if the email belongs to greendottransportation.com
        const isGreendotEmployee = data.user.email?.endsWith('@greendottransportation.com');
        
        // Create profile in the profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: data.user.id,
            first_name: userData.firstName,
            last_name: userData.lastName,
            role: isGreendotEmployee ? 'global_admin' : 'user',
            isGlobalAdmin: isGreendotEmployee,
            organizationId: userData.organizationId || null,
            organizationName: userData.organizationName,
            organizationRole: isGreendotEmployee ? 'org_admin' : userData.organizationRole,
            metadata: isGreendotEmployee ? { isGlobalAdmin: true } : {},
          })
          
        if (profileError) {
          console.error("Error creating profile:", profileError)
          // Still return true, as the user was created
        }
        
        // If the user is from greendottransportation.com, update their auth metadata as well
        if (isGreendotEmployee) {
          const { error: updateError } = await supabase.auth.updateUser({
            data: {
              isGlobalAdmin: true,
              role: 'global_admin'
            }
          });
          
          if (updateError) {
            console.error("Error updating user metadata:", updateError);
          }
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
        organizationId: profileData.organizationId,
        organizationName: profileData.organizationName,
        organizationRole: profileData.organizationRole,
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
      isAuthenticated,
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
        console.log('useAuth: Using demo user from localStorage when outside AuthProvider');
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
  console.warn('useAuth was used outside of AuthProvider - using fallback values');
  
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