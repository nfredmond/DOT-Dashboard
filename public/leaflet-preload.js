/**
 * This script preloads Leaflet and its dependencies directly,
 * providing a fallback for the dynamic imports in the React components.
 */
(function() {
  // Skip in non-browser environments
  if (typeof window === 'undefined') return;
  
  // Load Leaflet CSS
  function loadLeafletCSS() {
    try {
      if (document.querySelector('link[href*="leaflet.css"]')) return;
      
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      link.crossOrigin = '';
      document.head.appendChild(link);
      console.log('Preloaded Leaflet CSS via script');
    } catch (error) {
      console.error('Error loading Leaflet CSS:', error);
    }
  }
  
  // Load Leaflet Draw CSS
  function loadLeafletDrawCSS() {
    try {
      if (document.querySelector('link[href*="leaflet.draw.css"]')) return;
      
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.css';
      document.head.appendChild(link);
      console.log('Preloaded Leaflet Draw CSS via script');
    } catch (error) {
      console.error('Error loading Leaflet Draw CSS:', error);
    }
  }
  
  // Load Leaflet JS
  function loadLeafletJS() {
    try {
      if (window.L) return Promise.resolve(window.L);
      
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
        script.crossOrigin = '';
        script.async = true;
        
        script.onload = function() {
          console.log('Preloaded Leaflet JS via script');
          resolve(window.L);
        };
        
        script.onerror = function(err) {
          console.error('Failed to preload Leaflet JS:', err);
          reject(err);
        };
        
        document.head.appendChild(script);
      });
    } catch (error) {
      console.error('Error in loadLeafletJS:', error);
      return Promise.reject(error);
    }
  }
  
  // Load Leaflet Draw JS
  function loadLeafletDrawJS() {
    try {
      if (window.L && window.L.Draw) return Promise.resolve(window.L.Draw);
      
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.js';
        script.async = true;
        
        script.onload = function() {
          console.log('Preloaded Leaflet Draw JS via script');
          resolve(window.L.Draw);
        };
        
        script.onerror = function(err) {
          console.error('Failed to preload Leaflet Draw JS:', err);
          reject(err);
        };
        
        document.head.appendChild(script);
      });
    } catch (error) {
      console.error('Error in loadLeafletDrawJS:', error);
      return Promise.reject(error);
    }
  }
  
  // Execute preloading
  function preloadAll() {
    try {
      // Load CSS immediately
      loadLeafletCSS();
      loadLeafletDrawCSS();
      
      // Load JavaScript sequentially
      loadLeafletJS()
        .then(function() { 
          return loadLeafletDrawJS();
        })
        .then(function() {
          console.log('All Leaflet components preloaded successfully');
          // Make this visible to the global scope
          window._leafletPreloaded = true;
        })
        .catch(function(err) {
          console.error('Error preloading Leaflet components:', err);
        });
    } catch (error) {
      console.error('Error in preloadAll:', error);
    }
  }
  
  // Run preloading
  try {
    preloadAll();
  } catch (error) {
    console.error('Error running preloadAll:', error);
  }
})(); 