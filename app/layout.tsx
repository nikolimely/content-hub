import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Content Hub",
  description: "Internal content management dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-[#0f0f0f] text-[#f0f0f0] antialiased">
        {children}
      </body>
    </html>
  );
}
