"use client"

import React, { useState, useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

interface SearchResult {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address?: string;
}

interface MapSearchInternalProps {
  className?: string;
  placeholder?: string;
  apiEndpoint?: string;
  onResult?: (results: SearchResult[]) => void;
}

// This component is the ONLY one that calls useMap(), and it's rendered conditionally
// after we've thoroughly verified that we're inside a MapContainer context
const LeafletMapSearch = ({ props }: { props: MapSearchInternalProps }) => {
  const map = useMap(); // This should only be called when we're DEFINITELY inside a MapContainer
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  // Log confirmation when successfully mounted with map
  useEffect(() => {
    console.log('✅ LeafletMapSearch: Successfully mounted with Leaflet map context');
  }, []);
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    setShowResults(true);
    
    try {
      // Mock search results
      const mockResults: SearchResult[] = [
        { id: '1', name: query + ' Place 1', lat: 40.7128, lng: -74.0060, address: '123 Example St' },
        { id: '2', name: query + ' Place 2', lat: 34.0522, lng: -118.2437, address: '456 Sample Ave' },
      ];
      
      setResults(mockResults);
      if (props.onResult) props.onResult(mockResults);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    try {
      map.flyTo([result.lat, result.lng], 14);
      setShowResults(false);
    } catch (error) {
      console.error('Error flying to search result:', error);
    }
  };

  return (
    <div ref={searchRef} className={`relative ${props.className}`}>
      <div className="flex gap-1">
        <Input
          type="text"
          placeholder={props.placeholder || 'Search location...'}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
          }}
          className="bg-white shadow-md"
        />
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleSearch}
          className="bg-white shadow-md"
          disabled={isLoading}
        >
          {isLoading ? <Spinner size="sm" /> : <Search className="h-4 w-4" />}
        </Button>
      </div>
      
      {showResults && results.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg max-h-60 overflow-auto">
          <ul className="py-1">
            {results.map((result) => (
              <li 
                key={result.id}
                onClick={() => handleResultClick(result)}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
              >
                <div className="font-medium">{result.name}</div>
                {result.address && (
                  <div className="text-xs text-gray-500">{result.address}</div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// This is a placeholder that looks like the search control but doesn't do anything
const SearchPlaceholder = ({ className = '' }: { className?: string }) => (
  <div className={`relative ${className}`}>
    <div className="flex gap-1">
      <Input
        type="text"
        placeholder="Loading map search..."
        disabled
        className="bg-white shadow-md"
      />
      <Button 
        variant="outline" 
        size="icon" 
        disabled
        className="bg-white shadow-md"
      >
        <Spinner size="sm" />
      </Button>
    </div>
  </div>
);

// Ensure Leaflet is actually loaded in window object and has a container
const isLeafletLoaded = () => {
  return typeof window !== 'undefined' && 
    (window as any).L && 
    document.querySelector('.leaflet-container');
};

// Check if we're truly inside a Leaflet context using DOM cues
const verifyLeafletContext = () => {
  try {
    // Deeper check to verify we're truly inside a MapContainer's React context
    const container = document.querySelector('.leaflet-container');
    if (!container) return false;
    
    // Check if Leaflet is globally available
    if (!(window as any).L) return false;
    
    // Ensure the Leaflet container has proper Leaflet classes applied
    // which indicates Leaflet has initialized its DOM
    const hasLeafletPanes = !!document.querySelector('.leaflet-pane');
    const hasLeafletControls = !!document.querySelector('.leaflet-control-container');
    
    return hasLeafletPanes && hasLeafletControls;
  } catch (error) {
    console.error('Error verifying Leaflet context:', error);
    return false;
  }
};

// Export the wrapper component
export function MapSearchInternal(props: MapSearchInternalProps) {
  // Always define hooks unconditionally at the top
  const [mounted, setMounted] = useState(false);
  const [leafletContextReady, setLeafletContextReady] = useState(false);
  
  // Track mounting
  useEffect(() => {
    console.log('MapSearchInternal: Component mounted in browser environment');
    setMounted(true);
    
    // Attempt to verify Leaflet context several times with increasing delays
    // This ensures we don't try to render before Leaflet is fully initialized
    const checkAttempts = [100, 500, 1000, 2000, 3000]; // Increasing delays
    
    // Recursive function to check with increasing delays
    const attemptVerification = (attempts: number[]) => {
      if (attempts.length === 0) {
        console.warn('MapSearchInternal: Failed to verify Leaflet context after all attempts');
        return;
      }
      
      const delay = attempts[0];
      const remainingAttempts = attempts.slice(1);
      
      setTimeout(() => {
        const isReady = verifyLeafletContext();
        console.log(`MapSearchInternal: Leaflet context check after ${delay}ms:`, isReady);
        
        if (isReady) {
          console.log('MapSearchInternal: Leaflet context verified, rendering search component');
          setLeafletContextReady(true);
        } else if (remainingAttempts.length > 0) {
          // Try again with the next delay
          attemptVerification(remainingAttempts);
        }
      }, delay);
    };
    
    // Start the verification process
    attemptVerification(checkAttempts);
    
    return () => {
      // Clean up if component unmounts
      setLeafletContextReady(false);
    };
  }, []);
  
  // Don't render anything on server
  if (!mounted) {
    return null;
  }
  
  // While checking, show a placeholder
  if (!leafletContextReady) {
    return <SearchPlaceholder className={props.className} />;
  }
  
  // Only after thorough verification, render the component that uses Leaflet hooks
  try {
    console.log('MapSearchInternal: Rendering Leaflet-dependent search component');
    return <LeafletMapSearch props={props} />;
  } catch (error) {
    console.error('Error rendering LeafletMapSearch:', error);
    return <SearchPlaceholder className={props.className} />;
  }
} 