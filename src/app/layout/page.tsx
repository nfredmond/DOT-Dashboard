"use client"

import React from "react";
import { Header } from "../(components)/header";
import { Sidebar } from "../(components)/sidebar";

export default function Page() {
  // Define default values inside the component
  const setCurrentPage = () => {};
  const currentPage = "";
  
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
          {/* Content will go here */}
          <h1>Layout Page</h1>
        </main>
      </div>
    </div>
  );
}
