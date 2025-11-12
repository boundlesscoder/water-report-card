import { Inter } from "next/font/google";
import "./globals.css";
import { UserProviderClient } from "@/context/UserProviderClient";
import { QueryProvider } from "@/context/QueryProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  title: "WRC-Admin Dashboard",
  description: "A modern, responsive admin dashboard built with Next.js and Tailwind CSS",
  keywords: "admin dashboard, admin panel, admin template, next.js, tailwind css",
  authors: [{ name: "Water Report Card Team" }],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
      </head>
      <body className="font-sans antialiased bg-gray-50">
        <QueryProvider>
          <UserProviderClient>
            {children}
          </UserProviderClient>
        </QueryProvider>
      </body>
    </html>
  );
}
