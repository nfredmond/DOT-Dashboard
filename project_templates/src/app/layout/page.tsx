"use client"

import React from "react";
import { Header } from "(components)/header";
import { Sidebar } from "(components)/sidebar";

interface LayoutProps {
  children: React.ReactNode;
  setCurrentPage: (page: string) => void;
  currentPage: string;
}

export default function Layout({
  children,
  setCurrentPage,
  currentPage,
}: LayoutProps) {
  return (
    <div
      className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100"
    >
      <Sidebar
        setCurrentPage={setCurrentPage}
        currentPage={currentPage}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
