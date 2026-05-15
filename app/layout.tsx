import type { Metadata } from 'next'
import { Syne, DM_Sans } from 'next/font/google'
import './globals.css'

// IMPORTANT: Import your global UI components!
import CustomCursor from '@/components/ui/CustomCursor' 
import SmoothScroll from '@/components/SmoothScroll' 

const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ProMail — The Ultimate Desktop-to-Cloud Sending Engine',
  description:
    'Enterprise-grade hybrid bulk email. Prepare offline. Dispatch in the cloud. Total data privacy meets elite deliverability.',
  keywords: ['bulk email', 'email marketing', 'enterprise email', 'SMTP', 'desktop app', 'offline email'],
  openGraph: {
    title: 'ProMail — Desktop-to-Cloud Sending Engine',
    description: 'Offline-first. Cloud-dispatched. Your data never leaves your machine.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${syne.variable} ${dmSans.variable}`}>
      <body className="bg-[#04030a] text-[#e8e4f0] font-body overflow-x-hidden antialiased">
        {/* We wrap the entire app in your smooth scroller */}
        <SmoothScroll>
          {/* Global custom cursor injection */}
          <CustomCursor />
          
          {/* This renders the actual pages (Landing, Login, Dashboard) */}
          {children}
        </SmoothScroll>
      </body>
    </html>
  )
}