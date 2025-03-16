"use client"

import React from "react";

export default function HelpDebug() {
  return (
    <div className="p-8 bg-white">
      <h1 className="text-3xl font-bold">Help Debug Page</h1>
      <p className="mt-4">This is a test page to debug layout issues.</p>
      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h2 className="text-xl font-semibold">Current component tree:</h2>
        <ul className="mt-2 list-disc pl-8">
          <li>RootLayout (layout.tsx in root)</li>
          <li>AppLayout (imported in layout.tsx)</li>
          <li>HelpDebug (this page)</li>
        </ul>
      </div>
    </div>
  );
} 