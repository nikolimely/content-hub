import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Content Hub",
  description: "Internal content management dashboard",
  icons: {
    icon: [
      { url: "https://www.limely.co.uk/wp-content/uploads/limely-favicon-150x150.png", sizes: "32x32" },
      { url: "https://www.limely.co.uk/wp-content/uploads/limely-favicon-300x300.png", sizes: "192x192" },
      { url: "https://www.limely.co.uk/wp-content/uploads/limely-favicon.png", sizes: "512x512", type: "image/png" },
      { url: "https://www.limely.co.uk/wp-content/uploads/limely-favicon.svg", sizes: "any", type: "image/svg+xml" },
    ],
    apple: "https://www.limely.co.uk/wp-content/uploads/limely-favicon-300x300.png",
    other: {
      rel: "msapplication-TileImage",
      url: "https://www.limely.co.uk/wp-content/uploads/limely-favicon-300x300.png",
    },
  },
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
