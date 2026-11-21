import type { Metadata, Viewport } from "next";
import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/dm-sans";
import "./globals.css";
import { Toaster } from "@/components/ui/Toaster";

export const metadata: Metadata = {
  title: "Trip-to-Pay",
  description: "Business travel where nobody ever fills in a claim. Interactive MVP demo.",
};

export const viewport: Viewport = {
  themeColor: "#13202e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-ZA" className="h-full antialiased">
      <body className="min-h-full">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
