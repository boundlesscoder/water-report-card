import { Geist, Geist_Mono } from "next/font/google";
import "../style/globals.css";
import GATracker from "../GooleAnalytics/GATracker.js";
import RouteChangeTracker from "../GooleAnalytics/RouteChangeTracker.js";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Water Report Card",
  description: "Developed by Alex Li",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <GATracker /> {/* 👈 Inject GA */}
        <RouteChangeTracker />  {/* Tracks route changes */}
        {children}
      </body>
    </html>
  );
}
