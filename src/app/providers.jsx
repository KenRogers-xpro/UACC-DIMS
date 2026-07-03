'use client'
import { ThemeProvider } from 'next-themes'
import { AuthProvider } from '@/lib/auth-context'

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <ThemeProvider
        attribute="data-theme"
        defaultTheme="dark"
        enableSystem={false}
        themes={['dark', 'light']}
        storageKey="dims-theme"
      >
        {children}
      </ThemeProvider>
    </AuthProvider>
  )
}
