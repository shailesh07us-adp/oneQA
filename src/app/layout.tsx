import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "OneAutomation Platform — OneQA",
  description: "Centralized test execution dashboard for the OneQA ecosystem. Track success rates, test runs, and performance metrics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        <Providers>{children}</Providers>
        <Toaster 
          theme="dark" 
          position="bottom-right" 
          richColors 
          expand={false}
          toastOptions={{
            style: {
              background: '#0f172a',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              color: '#f8fafc',
            },
            className: 'glass shadow-2xl shadow-indigo-500/10'
          }}
        />
      </body>
    </html>
  );
}

