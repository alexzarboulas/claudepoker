import type { Metadata } from 'next';
import './globals.css';
import AuthSessionProvider from '@/components/SessionProvider';
import FriendsWidget from '@/components/FriendsWidget';

export const metadata: Metadata = {
  title: 'PokerIQ',
  description: 'Heads-up Texas Hold\'em — Play Live with Friends',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AuthSessionProvider>
          {children}
          <FriendsWidget />
        </AuthSessionProvider>
      </body>
    </html>
  );
}
