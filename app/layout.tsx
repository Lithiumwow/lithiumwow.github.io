import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SiteNav } from '@/components/site-nav'
import { ThemeProvider } from '@/components/theme-provider'
import { siteBasePath } from '@/lib/site-config'
import './globals.css'

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

const withBase = (path: string) => `${siteBasePath}${path}`

export const metadata: Metadata = {
  metadataBase: new URL('https://lithiumwow.github.io'),
  title: 'Trance 24x7 - Lithiumwow',
  description: 'Stream continuous trance music 24/7',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: withBase('/icon-light-32x32.png'),
        media: '(prefers-color-scheme: light)',
      },
      {
        url: withBase('/icon-dark-32x32.png'),
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: withBase('/icon.svg'),
        type: 'image/svg+xml',
      },
    ],
    apple: withBase('/apple-icon.png'),
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body className={`${geistSans.className} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <SiteNav />
          {children}
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
