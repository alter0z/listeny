import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AudioPlayerProvider } from '@/context/AudioPlayerContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Meld Web — Stream, Import & Download Music',
  description:
    'A high-fidelity modern web client for streaming music, importing Spotify & YouTube playlists, and downloading offline tracks.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full bg-[#070709] text-white antialiased selection:bg-emerald-500 selection:text-black">
      <body className={`${inter.className} h-full min-h-screen bg-[#070709] text-white flex flex-col overflow-hidden`}>
        <AudioPlayerProvider>{children}</AudioPlayerProvider>
      </body>
    </html>
  );
}
