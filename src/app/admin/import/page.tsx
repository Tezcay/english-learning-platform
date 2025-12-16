'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import Link from 'next/link'

interface ImportResult {
  success: boolean
  lessonId?: string
  title?: string
  subtitleCount?: number
  duration?: number
  error?: string
}

type ImportStatus = 'idle' | 'extracting' | 'fetching' | 'translating' | 'saving' | 'success' | 'error'

export default function ImportPage() {
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState<ImportStatus>('idle')
  const [result, setResult] = useState<ImportResult | null>(null)
  const [progress, setProgress] = useState('')

  const statusMessages: Record<ImportStatus, string> = {
    idle: '',
    extracting: '🔍 正在提取视频ID...',
    fetching: '📥 正在抓取字幕...',
    translating: '🌐 正在翻译字幕...',
    saving: '💾 正在生成文件...',
    success: '✅ 导入成功！',
    error: '❌ 导入失败'
  }

  const handleImport = async () => {
    if (!url.trim()) {
      setResult({ success: false, error: '请输入 YouTube URL' })
      setStatus('error')
      return
    }

    setStatus('extracting')
    setProgress(statusMessages.extracting)
    setResult(null)

    try {
      // Simulate progress updates
      setTimeout(() => {
        if (status !== 'error') {
          setStatus('fetching')
          setProgress(statusMessages.fetching)
        }
      }, 500)

      const response = await fetch('/api/import-youtube', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      })

      const data = await response.json()

      if (!response.ok) {
        setStatus('error')
        setResult({ success: false, error: data.error || '导入失败' })
        return
      }

      setStatus('translating')
      setProgress(statusMessages.translating)
      
      // Wait a bit for the UI to show translation status
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setStatus('saving')
      setProgress(statusMessages.saving)
      
      // Wait a bit for the UI to show saving status
      await new Promise(resolve => setTimeout(resolve, 500))

      setStatus('success')
      setResult(data)
    } catch (error) {
      console.error('Import error:', error)
      setStatus('error')
      setResult({ 
        success: false, 
        error: '网络错误，请检查连接后重试' 
      })
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && status === 'idle') {
      handleImport()
    }
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href="/" className="text-blue-600 hover:underline">
            ← 返回首页
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>YouTube 字幕导入</CardTitle>
            <CardDescription>
              输入 YouTube 视频 URL，自动抓取英文字幕并翻译成中文
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="youtube-url" className="text-sm font-medium">
                YouTube URL
              </label>
              <Input
                id="youtube-url"
                type="text"
                placeholder="https://www.youtube.com/watch?v=... 或 https://youtu.be/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={status !== 'idle'}
              />
              <p className="text-xs text-gray-500">
                支持 youtube.com/watch?v= 和 youtu.be/ 格式
              </p>
            </div>

            <Button
              onClick={handleImport}
              disabled={status !== 'idle' && status !== 'error' && status !== 'success'}
              className="w-full"
            >
              {status === 'idle' || status === 'error' || status === 'success'
                ? '一键导入'
                : '导入中...'}
            </Button>

            {/* Progress Display */}
            {status !== 'idle' && status !== 'error' && status !== 'success' && (
              <Alert>
                <AlertTitle>处理进度</AlertTitle>
                <AlertDescription>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        ['extracting', 'fetching', 'translating', 'saving'].includes(status)
                          ? 'bg-blue-600 animate-pulse'
                          : 'bg-gray-300'
                      }`} />
                      <span>{progress}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${
                            status === 'extracting' ? 25 :
                            status === 'fetching' ? 50 :
                            status === 'translating' ? 75 :
                            status === 'saving' ? 90 : 0
                          }%`
                        }}
                      />
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Success Message */}
            {status === 'success' && result?.success && (
              <Alert variant="success">
                <AlertTitle>✅ 导入成功！</AlertTitle>
                <AlertDescription>
                  <div className="space-y-2 mt-2">
                    <p><strong>课程ID:</strong> {result.lessonId}</p>
                    <p><strong>标题:</strong> {result.title}</p>
                    <p><strong>字幕数量:</strong> {result.subtitleCount} 条</p>
                    <p><strong>时长:</strong> {Math.floor((result.duration || 0) / 60)} 分钟</p>
                    <div className="mt-4">
                      <Link
                        href={`/lesson/${result.lessonId}`}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        → 立即查看课程
                      </Link>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Error Message */}
            {status === 'error' && result?.error && (
              <Alert variant="destructive">
                <AlertTitle>导入失败</AlertTitle>
                <AlertDescription>
                  {result.error}
                </AlertDescription>
              </Alert>
            )}

            {/* Instructions */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-2">使用说明：</h3>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>输入完整的 YouTube 视频链接</li>
                <li>视频必须有英文字幕（自动生成或手动上传）</li>
                <li>系统会自动翻译成中文</li>
                <li>翻译过程可能需要几分钟，请耐心等待</li>
                <li>导入成功后可以立即查看课程</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
