// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css"; // tu Tailwind base

export const metadata: Metadata = {
  title: "Project CopilotKit",
  description: "Next.js + Django auth con JWT",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-neutral-950 text-neutral-100 antialiased">
        {children}
      </body>
    </html>
  );
}
