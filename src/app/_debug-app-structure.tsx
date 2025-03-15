"use client";

import React, { useEffect } from 'react';

export default function DebugAppStructure() {
  useEffect(() => {
    // Log client-side mounting
    console.log("Debug component mounted");
    
    // Check if all required JS and CSS files are loaded
    const requiredFiles = [
      'layout.css',
      'page.js',
      'main-app.js',
      'app-pages-internals.js'
    ];
    
    // Check loaded scripts
    const loadedScripts = Array.from(document.scripts).map(script => 
      script.src.split('/').pop()
    );
    
    // Check loaded stylesheets
    const loadedStyles = Array.from(document.styleSheets).map(stylesheet => 
      stylesheet.href ? stylesheet.href.split('/').pop() : 'inline-style'
    );
    
    console.log("Loaded scripts:", loadedScripts);
    console.log("Loaded stylesheets:", loadedStyles);
    
    // Add this to document body to show the debugging info
    const debugDiv = document.createElement('div');
    debugDiv.style.padding = '20px';
    debugDiv.style.margin = '20px';
    debugDiv.style.border = '1px solid #ddd';
    debugDiv.style.borderRadius = '5px';
    debugDiv.style.backgroundColor = '#f9f9f9';
    
    debugDiv.innerHTML = `
      <h3>Next.js Debug Info</h3>
      <p>If you're seeing 404 errors for Next.js files, try:</p>
      <ol>
        <li>Clear browser cache and hard reload (Ctrl+Shift+R)</li>
        <li>Delete the .next folder and rebuild the application</li>
        <li>Check for mismatches between package.json dependencies and your Next.js version</li>
      </ol>
    `;
    
    document.body.appendChild(debugDiv);
  }, []);
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Next.js App Structure Debug</h1>
      <p>This page helps diagnose 404 errors with Next.js resources.</p>
      <p>Check the browser console for more information.</p>
    </div>
  );
} 