'use client';

import { useState, useEffect } from 'react';
import { useMapbox } from '@/contexts/mapbox-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Layers } from 'lucide-react';
import logger from '@/lib/logger';

export interface StyleOption {
  id: string;
  name: string;
  url: string;
  thumbnail?: string;
  group?: string;
}

interface StyleGroup {
  name: string;
  styles: StyleOption[];
}

export interface MapboxStyleSwitcherProps {
  styles: StyleOption[];
  defaultStyle?: string;
  onChange?: (styleId: string) => void;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  className?: string;
}

export function MapboxStyleSwitcher({
  styles,
  defaultStyle,
  onChange,
  position = 'top-right',
  className = '',
}: MapboxStyleSwitcherProps) {
  const { map, mapInitialized } = useMapbox();
  const [currentStyle, setCurrentStyle] = useState<string>(defaultStyle || (styles.length > 0 ? styles[0].id : ''));
  
  // Set position class based on the position prop
  const positionClasses = {
    'top-left': 'absolute top-2 left-2',
    'top-right': 'absolute top-2 right-2',
    'bottom-left': 'absolute bottom-2 left-2',
    'bottom-right': 'absolute bottom-2 right-2',
  };

  // Group styles by their group property
  const groupedStyles: StyleGroup[] = [];
  const ungroupedStyles: StyleOption[] = [];

  styles.forEach(style => {
    if (style.group) {
      let group = groupedStyles.find(g => g.name === style.group);
      if (!group) {
        group = { name: style.group, styles: [] };
        groupedStyles.push(group);
      }
      group.styles.push(style);
    } else {
      ungroupedStyles.push(style);
    }
  });

  // Switch map style
  const switchStyle = (styleId: string) => {
    const style = styles.find(s => s.id === styleId);
    if (!style || !map) return;

    try {
      // Save current center and zoom before changing style
      const center = map.getCenter();
      const zoom = map.getZoom();
      const bearing = map.getBearing();
      const pitch = map.getPitch();

      // Keep track of current visible layers
      const visibleLayers: string[] = [];
      const currentStyle = map.getStyle();
      
      if (currentStyle && currentStyle.layers) {
        currentStyle.layers.forEach((layer) => {
          if (layer.id.includes('custom-') && map.getLayoutProperty(layer.id, 'visibility') !== 'none') {
            visibleLayers.push(layer.id);
          }
        });
      }

      // Change map style
      map.setStyle(style.url);

      // Re-apply center, zoom, and other view settings
      map.once('styledata', () => {
        map.setCenter(center);
        map.setZoom(zoom);
        map.setBearing(bearing);
        map.setPitch(pitch);

        // Wait for all sources and layers to load
        map.once('idle', () => {
          // Restore visibility of custom layers
          visibleLayers.forEach(layerId => {
            if (map.getLayer(layerId)) {
              map.setLayoutProperty(layerId, 'visibility', 'visible');
            }
          });
        });
      });

      // Update state and call onChange
      setCurrentStyle(styleId);
      if (onChange) {
        onChange(styleId);
      }
    } catch (error) {
      logger.error('Error changing map style:', error);
    }
  };

  // Set initial style when map is loaded
  useEffect(() => {
    if (!map || !mapInitialized || !defaultStyle) return;
    
    const style = styles.find(s => s.id === defaultStyle);
    if (style) {
      const currentStyle = map.getStyle();
      const currentStyleName = currentStyle && currentStyle.name ? currentStyle.name : '';
      
      if (currentStyleName !== style.name) {
        switchStyle(defaultStyle);
      }
    }
  }, [map, mapInitialized, defaultStyle, styles]);

  // Get the current style name for display
  const getCurrentStyleName = () => {
    const style = styles.find(s => s.id === currentStyle);
    return style ? style.name : 'Base Map';
  };

  return (
    <div className={`${positionClasses[position]} z-10 ${className}`}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="sm" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            <span className="hidden sm:inline">{getCurrentStyleName()}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Map Style</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Display ungrouped styles first */}
          {ungroupedStyles.map(style => (
            <DropdownMenuItem
              key={style.id}
              className={`flex items-center gap-2 ${currentStyle === style.id ? 'bg-accent' : ''}`}
              onClick={() => switchStyle(style.id)}
            >
              {style.thumbnail && (
                <div className="h-5 w-5 rounded-sm overflow-hidden">
                  <img src={style.thumbnail} alt={style.name} className="h-full w-full object-cover" />
                </div>
              )}
              <span>{style.name}</span>
            </DropdownMenuItem>
          ))}
          
          {/* Then display grouped styles with group headers */}
          {groupedStyles.map(group => (
            <div key={group.name}>
              {ungroupedStyles.length > 0 && <DropdownMenuSeparator />}
              <DropdownMenuLabel className="text-xs text-muted-foreground pt-2">{group.name}</DropdownMenuLabel>
              
              {group.styles.map(style => (
                <DropdownMenuItem
                  key={style.id}
                  className={`flex items-center gap-2 ${currentStyle === style.id ? 'bg-accent' : ''}`}
                  onClick={() => switchStyle(style.id)}
                >
                  {style.thumbnail && (
                    <div className="h-5 w-5 rounded-sm overflow-hidden">
                      <img src={style.thumbnail} alt={style.name} className="h-full w-full object-cover" />
                    </div>
                  )}
                  <span>{style.name}</span>
                </DropdownMenuItem>
              ))}
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default MapboxStyleSwitcher; 