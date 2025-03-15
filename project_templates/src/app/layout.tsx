"use client"

import "./globals.css";

import React, { useState } from "react";
import { Inter } from "next/font/google";
import Layout from "./layout/page";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentPage, setCurrentPage] = useState("dashboard");

  return (
    <html lang="en">
      <body className={inter.className}>
        <Layout
          setCurrentPage={setCurrentPage}
          currentPage={currentPage}
        >
          {children}
        </Layout>
      </body>
    </html>
  );
}
