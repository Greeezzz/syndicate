import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SYNDICATE",
  description: "Autonomous Multi-Agent Brainstorming & War Room Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
      </head>
      <body className="bg-[#0B0B0D] text-[#E8E8EC] antialiased">
        {children}
      </body>
    </html>
  );
}
