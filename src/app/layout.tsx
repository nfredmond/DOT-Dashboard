"use client";

import "./globals.css";
import React, { useState, useEffect } from 'react';
import { AuthProvider } from "@/contexts/AuthContext";
import { SupabaseProvider } from '@/contexts/SupabaseContext';
import { ThemeProvider } from '@/components/ui/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/app/(components)/header';
import { Sidebar } from '@/app/(components)/sidebar';
import Loading from './loading';
import { geistSans, geistMono } from '@/lib/fonts';
import { LLMProvider } from '@/contexts/LLMContext';
import { OnboardingDialog } from '@/components/OnboardingDialog';
import { VoiceProvider } from "@/contexts/VoiceContext";
import { ModelProvider } from '@/lib/models/model-context';
import { ProjectsProvider } from '@/contexts/ProjectsContext';
import { MapboxProvider } from '@/contexts/mapbox-context';
import { MapboxScripts } from '@/components/MapboxScripts';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isClient, setIsClient] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [currentPage, setCurrentPage] = useState("dashboard");

  useEffect(() => {
    setIsClient(true);
    
    // Add a small delay to ensure smooth transition from loading state
    const timer = setTimeout(() => {
      setIsInitializing(false);
      console.log("Layout initialization complete");
    }, 800);
    
    console.log("Layout component mounted on client");
    
    return () => clearTimeout(timer);
  }, []);

  // If not yet client-rendered, show loading indicator
  if (!isClient || isInitializing) {
    return (
      <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable}`}>
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Transportation Planning Suite</title>
          
          {/* Favicon configuration */}
          <link rel="apple-touch-icon" sizes="180x180" href="/favicons/apple-touch-icon.png" />
          <link rel="icon" type="image/png" sizes="32x32" href="/favicons/favicon-32x32.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/favicons/favicon-16x16.png" />
          <link rel="manifest" href="/favicons/site.webmanifest" />
          <link rel="shortcut icon" href="/favicons/favicon.ico" />
          <meta name="theme-color" content="#ffffff" />
        </head>
        <body className={`font-sans bg-gray-50 dark:bg-gray-900 min-h-screen ${geistSans.className}`}>
          <Loading />
        </body>
      </html>
    );
  }

  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Transportation Planning Suite</title>
        <meta name="description" content="Project management application for transportation planning" />
        
        {/* Favicon configuration */}
        <link rel="apple-touch-icon" sizes="180x180" href="/favicons/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicons/favicon-16x16.png" />
        <link rel="manifest" href="/favicons/site.webmanifest" />
        <link rel="shortcut icon" href="/favicons/favicon.ico" />
        <meta name="theme-color" content="#ffffff" />
        
        {/* Mapbox GL CSS */}
        <link 
          href="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css" 
          rel="stylesheet" 
        />
      </head>
      <body className={`font-sans bg-gray-50 dark:bg-gray-900 min-h-screen ${geistSans.className}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ProjectsProvider>
            <SupabaseProvider>
              <AuthProvider>
                <ModelProvider>
                  <VoiceProvider>
                    <LLMProvider>
                      <MapboxProvider>
                        <div className="flex flex-col min-h-screen">
                          <Header />
                          <div className="flex flex-1">
                            <Sidebar setCurrentPage={setCurrentPage} currentPage={currentPage} />
                            <main className="flex-1 p-6 overflow-auto">
                              {children}
                            </main>
                          </div>
                        </div>
                        <Toaster />
                        <OnboardingDialog />
                        <MapboxScripts />
                      </MapboxProvider>
                    </LLMProvider>
                  </VoiceProvider>
                </ModelProvider>
              </AuthProvider>
            </SupabaseProvider>
          </ProjectsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
