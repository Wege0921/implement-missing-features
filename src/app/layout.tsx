import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono, Noto_Sans_Ethiopic } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Toaster } from '@/components/ui/toaster'
import { TRPCProvider } from '@/components/providers/trpc-provider'
import '@/lib/translations'
import { ServiceWorkerRegistration } from '@/components/pwa/ServiceWorkerRegistration'
import { InstallBanner } from '@/components/pwa/InstallBanner'
import { UpdateBanner } from '@/components/pwa/UpdateBanner'
import './globals.css'

const geistSans = Geist({ 
  subsets: ['latin'],
  variable: '--font-geist-sans',
})

const geistMono = Geist_Mono({ 
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

const notoSansEthiopic = Noto_Sans_Ethiopic({
  subsets: ['ethiopic'],
  variable: '--font-ethiopic',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: {
    default: 'Kingdom Family',
    template: '%s | Kingdom Family',
  },
  description: 'Grow in faith through sermons, learning paths, and community engagement',
  keywords: ['church', 'sermons', 'bible study', 'learning', 'faith', 'christian'],
  authors: [{ name: 'Kingdom Family' }],
  creator: 'Kingdom Family',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://kingdom-learning.vercel.app',
    title: 'Kingdom Family',
    description: 'Grow in faith through sermons, learning paths, and community engagement',
    siteName: 'Kingdom Family',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f0e8' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1612' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${notoSansEthiopic.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased bg-background">
        <TRPCProvider>
          <ServiceWorkerRegistration />
          <UpdateBanner />
          {children}
          <InstallBanner />
          <Toaster />
        </TRPCProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
