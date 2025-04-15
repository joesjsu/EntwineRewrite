import type { Metadata } from "next";
import localFont from "next/font/local";
import { AppProviders } from "@/components/providers/AppProviders"; // Import the new provider component
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Entwine | AI-Powered Dating App",
  description: "Connect with compatible matches through AI-powered relationship coaching",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
