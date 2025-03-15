"use client"

import React, { useState } from 'react';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Layers, Map } from 'lucide-react';

export interface BaseMapOption {
  name: string;
  url: string;
  attribution: string;
  checked?: boolean;
}

export interface OverlayLayer {
  id: string;
  name: string;
  visible: boolean;
  url?: string;
  data?: any; // This would be GeoJSON data
}

interface LayerSelectorProps {
  baseMaps: BaseMapOption[];
  overlayLayers: OverlayLayer[];
  onBaseMapChange: (baseMap: BaseMapOption) => void;
  onOverlayToggle: (layerId: string, visible: boolean) => void;
  className?: string;
}

export function LayerSelector({
  baseMaps,
  overlayLayers,
  onBaseMapChange,
  onOverlayToggle,
  className = ''
}: LayerSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`${className} bg-white rounded-md shadow-md`}>
      <div className="p-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full flex items-center gap-2 justify-between"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            <span>Layers</span>
          </span>
        </Button>
      </div>
      
      {isOpen && (
        <div className="p-2 border-t">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="base-maps">
              <AccordionTrigger className="py-2 text-sm">Base Maps</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {baseMaps.map((baseMap) => (
                    <div key={baseMap.name} className="flex items-center gap-2">
                      <input
                        type="radio"
                        id={`baseMap-${baseMap.name}`}
                        name="baseMap"
                        checked={baseMap.checked}
                        onChange={() => onBaseMapChange(baseMap)}
                        className="rounded-full"
                      />
                      <label htmlFor={`baseMap-${baseMap.name}`} className="text-sm cursor-pointer">
                        {baseMap.name}
                      </label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="overlay-layers">
              <AccordionTrigger className="py-2 text-sm">Overlay Layers</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {overlayLayers.map((layer) => (
                    <div key={layer.id} className="flex items-center justify-between">
                      <label htmlFor={`overlay-${layer.id}`} className="text-sm cursor-pointer">
                        {layer.name}
                      </label>
                      <Switch
                        id={`overlay-${layer.id}`}
                        checked={layer.visible}
                        onCheckedChange={(checked) => onOverlayToggle(layer.id, checked)}
                      />
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}
    </div>
  );
} 