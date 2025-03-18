"use client"

import React from "react";
import { useRouter, usePathname } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { UserRole } from '@/types/organization';

interface AppLayoutProps {
  children: React.ReactNode;
  userRole?: UserRole;
  isAdmin?: boolean;
}

export function AppLayout({ children, userRole, _isAdmin }: AppLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-background">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <div className="p-4 flex items-center gap-3 cursor-pointer" onClick={() => router.push('/homepage')}>
            <div className="bg-blue-600 text-white w-10 h-10 rounded flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="14" x="2" y="5" rx="2" />
                <line x1="2" x2="22" y1="10" y2="10" />
              </svg>
            </div>
            <div>
              <div className="font-bold text-gray-800 dark:text-white">Planning Manager</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Transportation Planning</div>
            </div>
          </div>
          
          <nav className="mt-6">
            <div className="px-4">
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); router.push('/homepage'); }} 
                className={`flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-md dark:text-gray-400 dark:hover:bg-gray-700 ${pathname === '/homepage' ? 'text-gray-800 bg-gray-100 dark:bg-gray-700 dark:text-white font-medium' : ''}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="9" y1="21" x2="9" y2="9" />
                </svg>
                Dashboard
              </a>
            </div>
            
            <div className="px-4 mt-3">
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); router.push('/project-map'); }} 
                className={`flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-md dark:text-gray-400 dark:hover:bg-gray-700 ${pathname === '/project-map' ? 'text-gray-800 bg-gray-100 dark:bg-gray-700 dark:text-white font-medium' : ''}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3">
                  <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                  <line x1="8" y1="2" x2="8" y2="18" />
                  <line x1="16" y1="6" x2="16" y2="22" />
                </svg>
                Project Map
              </a>
            </div>
            
            <div className="px-4 mt-3">
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); router.push('/project-scoring'); }} 
                className={`flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-md dark:text-gray-400 dark:hover:bg-gray-700 ${pathname === '/project-scoring' ? 'text-gray-800 bg-gray-100 dark:bg-gray-700 dark:text-white' : ''}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3">
                  <path d="M12 20V10" />
                  <path d="M18 20V4" />
                  <path d="M6 20v-4" />
                </svg>
                Project Scoring
              </a>
            </div>

            <div className="px-4 mt-3">
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); router.push('/llm-assistant'); }} 
                className={`flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-md dark:text-gray-400 dark:hover:bg-gray-700 ${pathname === '/llm-assistant' ? 'text-gray-800 bg-gray-100 dark:bg-gray-700 dark:text-white' : ''}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                LLM Assistant
              </a>
            </div>

            <div className="px-4 mt-3">
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); router.push('/agent-tools'); }} 
                className={`flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-md dark:text-gray-400 dark:hover:bg-gray-700 ${pathname === '/agent-tools' ? 'text-gray-800 bg-gray-100 dark:bg-gray-700 dark:text-white' : ''}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
                Agent Tools
              </a>
            </div>

            <div className="px-4 mt-3">
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); router.push('/reports'); }} 
                className={`flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-md dark:text-gray-400 dark:hover:bg-gray-700 ${pathname === '/reports' ? 'text-gray-800 bg-gray-100 dark:bg-gray-700 dark:text-white' : ''}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3">
                  <rect x="4" y="4" width="16" height="16" rx="2" />
                  <rect x="9" y="9" width="6" height="6" />
                  <line x1="9" y1="2" x2="9" y2="4" />
                  <line x1="15" y1="2" x2="15" y2="4" />
                  <line x1="9" y1="20" x2="9" y2="22" />
                  <line x1="15" y1="20" x2="15" y2="22" />
                  <line x1="20" y1="9" x2="22" y2="9" />
                  <line x1="20" y1="15" x2="22" y2="15" />
                  <line x1="2" y1="9" x2="4" y2="9" />
                  <line x1="2" y1="15" x2="4" y2="15" />
                </svg>
                Reports
              </a>
            </div>

            <div className="px-4 mt-3">
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); router.push('/community'); }} 
                className={`flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-md dark:text-gray-400 dark:hover:bg-gray-700 ${pathname === '/community' ? 'text-gray-800 bg-gray-100 dark:bg-gray-700 dark:text-white' : ''}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                Community
              </a>
            </div>
          </nav>

          <div className="absolute bottom-0 w-64 p-4">
            {userRole === "global_admin" && (
              <div className="px-4 mt-3">
                <a 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); router.push('/admin-panel'); }} 
                  className={`flex items-center px-4 py-3 text-blue-600 hover:bg-blue-50 rounded-md dark:text-blue-400 dark:hover:bg-blue-900/20 ${pathname === '/admin-panel' ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3">
                    <path d="M12 4.5a2.5 2.5 0 0 0-4.96-.46 2.5 2.5 0 0 0-1.98 3 2.5 2.5 0 0 0 3 2 2.5 2.5 0 0 0 3.94-4.55" />
                    <path d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                    <path d="M19 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                    <path d="M12 12a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
                    <path d="M19 12a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
                    <path d="M12 12a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
                  </svg>
                  Admin Panel
                </a>
              </div>
            )}
            
            <div className="px-4 mt-3">
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); router.push('/settings'); }} 
                className={`flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-md dark:text-gray-400 dark:hover:bg-gray-700 ${pathname === '/settings' ? 'text-gray-800 bg-gray-100 dark:bg-gray-700 dark:text-white' : ''}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                Settings
              </a>
            </div>
            
            <div className="px-4 mt-3">
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); router.push('/help'); }} 
                className={`flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-md dark:text-gray-400 dark:hover:bg-gray-700 ${pathname === '/help' ? 'text-gray-800 bg-gray-100 dark:bg-gray-700 dark:text-white' : ''}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                Help & Support
              </a>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8 bg-gray-50 dark:bg-gray-900 overflow-y-auto">
          {children}
        </div>
      </div>
    </ProtectedRoute>
  );
} 