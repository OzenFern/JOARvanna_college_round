import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgentBreak — The Autonomous AI Red Team",
  description: "Autonomous security testing platform for AI agents with tools.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0B0D13] text-zinc-100 min-h-screen antialiased selection:bg-red-500/20 selection:text-red-300">
        {children}
      </body>
    </html>
  );
}
