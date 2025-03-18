import React, { Component, ReactNode, ErrorInfo } from 'react';
import logger from '../lib/logger';


interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * A specialized error boundary for Leaflet components
 * Catches common errors like context issues and provides helpful debugging
 */
class LeafletErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to the console
    logger.error('LeafletErrorBoundary caught an error:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Check for the specific MapContainer context error, safely handling undefined
      const errorMessage = this.state.error?.message || '';
      const isContextError = errorMessage.includes('useLeafletContext() can only be used in a descendant of <MapContainer>');
      
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <h2 className="text-red-800 font-semibold mb-2">Map Error</h2>
          <p className="text-red-600 text-sm">
            {isContextError 
              ? 'Map failed to initialize. Please try refreshing the page.'
              : 'An error occurred while loading the map. Please try again.'}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default LeafletErrorBoundary; 