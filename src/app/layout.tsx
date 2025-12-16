import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'English Learning Platform - 真实语料英语学习',
  description: '基于真实 YouTube vlog 语料的英语学习平台',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <header className="border-b">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold">📚 English Learning Platform</h1>
          </div>
        </header>
        {children}
      </body>
    </html>
  )
}