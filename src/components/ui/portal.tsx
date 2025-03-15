"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface PortalProps {
  children: React.ReactNode;
  container?: HTMLElement;
}

/**
 * Portal component to render children in a different part of the DOM
 * Useful for modals, tooltips, and other UI elements that need to break out of their parent's layout
 */
export function Portal({ children, container }: PortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // On the server or during initial mount we don't render anything
  if (!mounted) return null;

  // Use document.body as the default container
  const targetContainer = container || document.body;

  // Use React's createPortal to render the children in the targetContainer
  return createPortal(children, targetContainer);
} 