import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title:'FitTrack | Fitness Tracker', description:'Track workouts and progress.' };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body>{children}</body></html>; }
