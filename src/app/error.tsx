'use client'

import React, { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-background p-4">
      <div className="max-w-md text-center">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="relative h-20 w-20">
            <Image 
              src="/Circle_Green_TranspRoad.png" 
              alt="Planning Manager" 
              width={80} 
              height={80} 
              className="opacity-50"
            />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
        
        <div className="mb-6 bg-red-50 p-4 rounded-md text-red-800 border border-red-200">
          <p className="text-sm">{error.message || "An unexpected error occurred"}</p>
          {error.digest && (
            <p className="text-xs text-red-600 mt-2">Error ID: {error.digest}</p>
          )}
        </div>
        
        <div className="flex flex-col gap-4">
          <Button onClick={() => reset()} variant="default">
            Try again
          </Button>
          
          <Button onClick={() => window.location.href = '/homepage'} variant="outline">
            Return to homepage
          </Button>
        </div>
      </div>
    </div>
  )
} 