import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'

export const metadata: Metadata = {
  title: '주시다',
  description: '감정 감정 기반 투자 일지 서비스',
  generator: 'Stock Diary',
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: '주시다',
    description: '감정 감정 기반 투자 일지 서비스',
    images: ['/og-image.png'], // client/public/og-image.png 파일 필요
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  )
}
