import type { Metadata } from 'next';
import { Inter, Poppins, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const poppins = Poppins({ weight: ['400', '500', '600', '700', '800'], subsets: ['latin'], variable: '--font-poppins' });
const jetBrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono' });

export const metadata: Metadata = {
  title: 'SmartBiz Pro — AI-Powered Business Finance & Inventory Intelligence',
  description: 'The ultimate business intelligence system for growing enterprises. Manage sales, inventory, production, and team — all in one place.',
  keywords: 'business intelligence, inventory management, point of sale, POS, Kenya, SmartBiz',
  icons: {
    icon: '/favicon.svg',
    apple: '/logo.svg',
  },
};

import { ThemeProvider } from '@/components/ThemeProvider';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${poppins.variable} ${jetBrainsMono.variable} antialiased`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
