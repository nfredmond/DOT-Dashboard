"use client";

import React, { useEffect, useRef, useState } from 'react';
import { cleanupLeafletMapById } from './leaflet-cleanup';

/**
 * Special wrapper component for Leaflet maps to prevent
 * the "Map container is already initialized" error.
 * 
 * This component:
 * 1. Creates a unique container ID for each map
 * 2. Ensures proper cleanup on unmount
 * 3. Provides a stable reference that prevents reinitialization
 */
interface LeafletMapWrapperProps {
  children: React.ReactNode;
  id: string;
}

const LeafletMapWrapper: React.FC<LeafletMapWrapperProps> = ({ children, id }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mapMounted, setMapMounted] = useState(false);
  const mountedRef = useRef(false);
  
  // Load Leaflet JS if needed
  useEffect(() => {
    const loadLeafletJS = async () => {
      if (typeof window === 'undefined') return;
      
      if (!window.L) {
        console.log('LeafletMapWrapper: Loading Leaflet JS');
        try {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.async = false;
          
          // Create a promise that resolves when the script loads
          const loadPromise = new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
          });
          
          document.head.appendChild(script);
          await loadPromise;
          
          console.log('LeafletMapWrapper: Leaflet JS loaded successfully');
          return true;
        } catch (error) {
          console.error('LeafletMapWrapper: Error loading Leaflet JS:', error);
          return false;
        }
      } else {
        console.log('LeafletMapWrapper: Leaflet JS already loaded');
        return true;
      }
    };
    
    // Always check for Leaflet
    loadLeafletJS();
  }, []);
  
  // Only mount the map once to prevent double initialization
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      
      // Load Leaflet CSS immediately if not already loaded
      if (typeof window !== 'undefined' && !document.querySelector('link[href*="leaflet.css"]')) {
        try {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
          console.log('Added Leaflet CSS from LeafletMapWrapper');
        } catch (error) {
          console.error('Error adding Leaflet CSS:', error);
        }
      }
      
      // Longer delay to ensure DOM is fully ready before mounting the map
      const timer = setTimeout(() => {
        console.log(`LeafletMapWrapper: Mounting map with ID ${id}`);
        
        if (containerRef.current) {
          // Force any parent containers to have proper size
          let parent = containerRef.current.parentElement;
          while (parent) {
            if (parent.style) {
              if (!parent.style.height || parent.style.height === 'auto') {
                parent.style.height = '100%';
              }
            }
            parent = parent.parentElement;
          }
          
          console.log(`LeafletMapWrapper: Container exists:`, !!containerRef.current);
          console.log(`LeafletMapWrapper: Container size:`, 
            containerRef.current.clientWidth, 
            containerRef.current.clientHeight
          );
          
          // Ensure the container has enough size to render the map
          if (containerRef.current.clientWidth < 10 || containerRef.current.clientHeight < 10) {
            console.warn(`LeafletMapWrapper: Container size too small, forcing minimum size`);
            containerRef.current.style.minWidth = '600px';
            containerRef.current.style.minHeight = '600px';
            
            // Force layout recalculation
            containerRef.current.getBoundingClientRect();
          }
        }
        
        setMapMounted(true);
      }, 1000); // Increased from 800ms to 1000ms for better DOM readiness
      
      return () => clearTimeout(timer);
    }
  }, [id]);
  
  // Check container size after mount and force recalculation if needed
  useEffect(() => {
    if (!mapMounted || !containerRef.current) return;
    
    console.log(`LeafletMapWrapper: Map mounted, container size:`, 
      containerRef.current.clientWidth, 
      containerRef.current.clientHeight
    );
    
    // Force a resize event after mounting to help Leaflet recalculate dimensions
    const resizeTimer = setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('resize'));
        
        // Also try to invalidate map size if map instance exists
        if (window.leafletMapInstance) {
          try {
            window.leafletMapInstance.invalidateSize(true);
          } catch (e) {
            console.warn('Error invalidating map size:', e);
          }
        }
      }
    }, 400);
    
    return () => clearTimeout(resizeTimer);
  }, [mapMounted]);
  
  // Cleanup function to run when component unmounts
  useEffect(() => {
    // Store container ID for cleanup
    const currentId = id;
    
    return () => {
      console.log(`Cleaning up map with ID ${currentId}`);
      
      // Increase delay to ensure the map is fully initialized before cleanup
      setTimeout(() => {
        cleanupLeafletMapById(currentId);
      }, 300); // Increased from 200ms to 300ms
    };
  }, [id]);
  
  return (
    <div 
      ref={containerRef} 
      id={id} 
      className="w-full h-full relative"
      data-leaflet-container-id={id}
      style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        bottom: 0, 
        right: 0,
        zIndex: 1,
        minHeight: '600px', // Increased minimum height for visibility
        minWidth: '600px',   // Increased minimum width for visibility
        display: 'block',
        visibility: 'visible'
      }}
    >
      {mapMounted && children}
    </div>
  );
};

export default LeafletMapWrapper; 