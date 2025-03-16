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
    <div className={`${className} bg-white dark:bg-gray-800 rounded-md shadow-md`}>
      <div className="p-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full flex items-center gap-2 justify-between dark:text-gray-200 dark:border-gray-700"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            <span>Layers</span>
          </span>
        </Button>
      </div>
      
      {isOpen && (
        <div className="p-2 border-t dark:border-gray-700">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="base-maps" className="border-b-gray-200 dark:border-gray-700">
              <AccordionTrigger className="py-2 text-sm dark:text-gray-200">Base Maps</AccordionTrigger>
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
                      <label 
                        htmlFor={`baseMap-${baseMap.name}`} 
                        className="text-sm cursor-pointer dark:text-gray-200"
                      >
                        {baseMap.name}
                      </label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="overlay-layers" className="border-b-gray-200 dark:border-gray-700">
              <AccordionTrigger className="py-2 text-sm dark:text-gray-200">Overlay Layers</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {overlayLayers.map((layer) => (
                    <div key={layer.id} className="flex items-center justify-between">
                      <label 
                        htmlFor={`overlay-${layer.id}`} 
                        className="text-sm cursor-pointer dark:text-gray-200"
                      >
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