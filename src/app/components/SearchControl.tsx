"use client"

import React, { useState, useEffect } from 'react';
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

interface SearchControlProps {
  className?: string;
  placeholder?: string;
  apiEndpoint?: string;
  onResult?: (results: SearchResult[]) => void;
}

// Loading state while dynamic import is in progress
function _SearchControlLoading({ className = '' }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <div className="flex gap-1">
        <Input
          type="text"
          placeholder="Loading search..."
          disabled
          className="bg-white rounded-md shadow-md h-9 border-gray-200"
        />
        <Button 
          variant="outline" 
          size="icon" 
          disabled
          className="bg-white shadow-md h-9 w-9 rounded-md border-gray-200"
        >
          <Spinner size="sm" />
        </Button>
      </div>
    </div>
  );
}

// Instead of using dynamic imports, we'll use a Portal approach
export function SearchControl(props: SearchControlProps) {
  const [mounted, setMounted] = useState(false);
  const [_leafletReady, setLeafletReady] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    
    // Force it to be ready after a short timeout
    setTimeout(() => {
      setLeafletReady(true);
      console.log('SearchControl: Force ready after timeout');
    }, 2000);
    
    return () => {};
  }, []);
  
  // Handle search when clicking the button or pressing Enter
  const handleSearch = () => {
    if (!searchTerm.trim()) return;
    
    setSearching(true);
    console.log('Searching for:', searchTerm);
    
    // Use Nominatim (OpenStreetMap) geocoding service
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchTerm)}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        if (data && data.length > 0) {
          // Use the first result
          const result = data[0];
          const lat = parseFloat(result.lat);
          const lng = parseFloat(result.lon);
          
          console.log('Found location:', result.display_name, lat, lng);
          
          // Create a search result object
          const searchResult = {
            id: result.place_id,
            name: result.display_name,
            lat: lat,
            lng: lng,
            address: result.display_name
          };
          
          // Fly to the result location
          if ((window as any).leafletMapInstance) {
            (window as any).leafletMapInstance.flyTo([lat, lng], 12);
          }
          
          // Call the onResult callback if provided
          if (props.onResult) {
            props.onResult([searchResult]);
          }
        } else {
          throw new Error('No results found');
        }
      })
      .catch(error => {
        console.error('Error searching location:', error);
        alert('Could not find the location. Please try a different search term.');
      })
      .finally(() => {
        setSearching(false);
      });
  };
  
  // Handle key press to trigger search on Enter
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  // Don't render on server
  if (!mounted) return null;
  
  // For the fixed search component, we'll render it directly
  return (
    <div className="flex gap-1 w-[250px]">
      <Input
        type="text"
        placeholder={props.placeholder || "Search location..."}
        className="bg-white rounded-md shadow-md h-9 px-3 border border-gray-200 w-full"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyPress={handleKeyPress}
        disabled={searching}
      />
      <Button 
        variant="outline" 
        size="icon" 
        className="bg-white shadow-md h-9 w-9 rounded-md border border-gray-200 flex items-center justify-center"
        onClick={handleSearch}
        disabled={searching}
      >
        {searching ? (
          <div className="w-4 h-4 border-2 border-b-transparent rounded-full animate-spin" />
        ) : (
          <Search className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
} 