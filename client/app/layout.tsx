import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'

export const metadata: Metadata = {
  title: '시크릿 주주총회',
  description: '주식 투자 일기를 기록하고 AI 피드백을 받아보세요',
  generator: 'Stock Diary',
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: '시크릿 주주총회',
    description: '주식 투자 일기를 기록하고 AI 피드백을 받아보세요',
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
