import { Space_Grotesk, Inter } from 'next/font/google'
import './globals.css'
import Providers from './providers'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata = {
  title: 'DIMS — Uganda Air Cargo Corporation',
  description: 'AI-Enhanced Digital Information and Management System for Uganda Air Cargo Corporation',
  icons: { icon: '/logo.png' },
}

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${inter.variable}`}
    >
      <body suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
