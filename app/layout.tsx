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
      <body className="bg-syndicate-bg text-syndicate-text antialiased">
        {children}
      </body>
    </html>
  );
}
