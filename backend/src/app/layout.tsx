import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/context/AuthContext'

export const metadata: Metadata = {
  title: 'Bedayia School Ticketing Management System',
  description: 'Backend API for Bedayia School Ticketing Management System',
  icons: {
    icon: [
      {
        url: '/favicon.ico',
        sizes: '16x16',
        type: 'image/x-icon',
      },
      {
        url: '/favicon.svg',
        type: 'image/svg+xml',
      },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}