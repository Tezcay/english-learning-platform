'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import Link from 'next/link'

interface ImportResult {
  success: boolean
  lessonId?: string
  title?: string
  subtitleCount?: number
  duration?: number
  translated?: boolean
  error?: string
}

type ImportStatus = 'idle' | 'extracting' | 'fetching' | 'translating' | 'saving' | 'success' | 'error'

export default function ImportPage() {
  const [activeTab, setActiveTab] = useState<'auto' | 'manual'>('auto')
  
  // Auto-fetch state
  const [autoUrl, setAutoUrl] = useState('')
  const [autoStatus, setAutoStatus] = useState<ImportStatus>('idle')
  const [autoResult, setAutoResult] = useState<ImportResult | null>(null)
  const [autoProgress, setAutoProgress] = useState('')
  
  // Manual upload state
  const [manualUrl, setManualUrl] = useState('')
  const [manualTitle, setManualTitle] = useState('')
  const [subtitleContent, setSubtitleContent] = useState('')
  const [skipTranslation, setSkipTranslation] = useState(false)
  const [manualStatus, setManualStatus] = useState<ImportStatus>('idle')
  const [manualResult, setManualResult] = useState<ImportResult | null>(null)
  const [manualProgress, setManualProgress] = useState('')

  const statusMessages: Record<ImportStatus, string> = {
    idle: '',
    extracting: '🔍 正在提取视频ID...',
    fetching: '📥 正在抓取字幕...',
    translating: '🌐 正在翻译字幕...',
    saving: '💾 正在生成文件...',
    success: '✅ 导入成功！',
    error: '❌ 导入失败'
  }

  const handleAutoImport = async () => {
    if (!autoUrl.trim()) {
      setAutoResult({ success: false, error: '请输入 YouTube URL' })
      setAutoStatus('error')
      return
    }

    setAutoStatus('extracting')
    setAutoProgress(statusMessages.extracting)
    setAutoResult(null)

    try {
      // Simulate progress updates
      setTimeout(() => {
        if (autoStatus !== 'error') {
          setAutoStatus('fetching')
          setAutoProgress(statusMessages.fetching)
        }
      }, 500)

      const response = await fetch('/api/import-youtube-v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: autoUrl }),
      })

      const data = await response.json()

      if (!response.ok) {
        setAutoStatus('error')
        setAutoResult({ success: false, error: data.error || '导入失败' })
        return
      }

      setAutoStatus('translating')
      setAutoProgress(statusMessages.translating)
      
      // Wait a bit for the UI to show translation status
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setAutoStatus('saving')
      setAutoProgress(statusMessages.saving)
      
      // Wait a bit for the UI to show saving status
      await new Promise(resolve => setTimeout(resolve, 500))

      setAutoStatus('success')
      setAutoResult(data)
    } catch (error) {
      console.error('Import error:', error)
      setAutoStatus('error')
      setAutoResult({ 
        success: false, 
        error: '网络错误，请检查连接后重试' 
      })
    }
  }

  const handleManualImport = async () => {
    if (!manualUrl.trim() || !manualTitle.trim() || !subtitleContent.trim()) {
      setManualResult({ success: false, error: '请填写所有必填项' })
      setManualStatus('error')
      return
    }

    setManualStatus('extracting')
    setManualProgress('🔍 正在解析字幕...')
    setManualResult(null)

    try {
      const response = await fetch('/api/import-srt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          url: manualUrl,
          title: manualTitle,
          subtitleContent,
          skipTranslation
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setManualStatus('error')
        setManualResult({ success: false, error: data.error || '导入失败' })
        return
      }

      setManualStatus('translating')
      setManualProgress('🌐 正在翻译字幕...')
      
      // Wait a bit for the UI to show translation status
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setManualStatus('saving')
      setManualProgress('💾 正在保存课程...')
      
      // Wait a bit for the UI to show saving status
      await new Promise(resolve => setTimeout(resolve, 500))

      setManualStatus('success')
      setManualResult(data)
    } catch (error) {
      console.error('Import error:', error)
      setManualStatus('error')
      setManualResult({ 
        success: false, 
        error: '网络错误，请检查连接后重试' 
      })
    }
  }

  const handleAutoKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && autoStatus === 'idle') {
      handleAutoImport()
    }
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/" className="text-blue-600 hover:underline">
            ← 返回首页
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>YouTube 字幕导入</CardTitle>
            <CardDescription>
              选择导入方式：自动抓取或手动上传字幕
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger
                  active={activeTab === 'auto'}
                  onClick={() => setActiveTab('auto')}
                >
                  🤖 自动抓取
                </TabsTrigger>
                <TabsTrigger
                  active={activeTab === 'manual'}
                  onClick={() => setActiveTab('manual')}
                >
                  📝 手动上传
                </TabsTrigger>
              </TabsList>

              {/* Auto-fetch Tab */}
              <TabsContent active={activeTab === 'auto'}>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <label htmlFor="auto-youtube-url" className="text-sm font-medium">
                      YouTube URL
                    </label>
                    <Input
                      id="auto-youtube-url"
                      type="text"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={autoUrl}
                      onChange={(e) => setAutoUrl(e.target.value)}
                      onKeyPress={handleAutoKeyPress}
                      disabled={autoStatus !== 'idle'}
                    />
                    <p className="text-xs text-gray-500">
                      支持 youtube.com/watch?v= 和 youtu.be/ 格式
                    </p>
                  </div>

                  <Button
                    onClick={handleAutoImport}
                    disabled={autoStatus !== 'idle' && autoStatus !== 'error' && autoStatus !== 'success'}
                    className="w-full"
                  >
                    {autoStatus === 'idle' || autoStatus === 'error' || autoStatus === 'success'
                      ? '一键导入'
                      : '导入中...'}
                  </Button>

                  {/* Progress Display */}
                  {autoStatus !== 'idle' && autoStatus !== 'error' && autoStatus !== 'success' && (
                    <Alert>
                      <AlertTitle>处理进度</AlertTitle>
                      <AlertDescription>
                        <div className="space-y-2 mt-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                            <span>{autoProgress}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                              style={{
                                width: `${
                                  autoStatus === 'extracting' ? 25 :
                                  autoStatus === 'fetching' ? 50 :
                                  autoStatus === 'translating' ? 75 :
                                  autoStatus === 'saving' ? 90 : 0
                                }%`
                              }}
                            />
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Success Message */}
                  {autoStatus === 'success' && autoResult?.success && (
                    <Alert variant="success">
                      <AlertTitle>✅ 导入成功！</AlertTitle>
                      <AlertDescription>
                        <div className="space-y-2 mt-2">
                          <p><strong>课程ID:</strong> {autoResult.lessonId}</p>
                          <p><strong>标题:</strong> {autoResult.title}</p>
                          <p><strong>字幕数量:</strong> {autoResult.subtitleCount} 条</p>
                          <p><strong>时长:</strong> {Math.floor((autoResult.duration || 0) / 60)} 分钟</p>
                          <div className="mt-4">
                            <Link
                              href={`/lesson/${autoResult.lessonId}`}
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
                  {autoStatus === 'error' && autoResult?.error && (
                    <Alert variant="destructive">
                      <AlertTitle>导入失败</AlertTitle>
                      <AlertDescription>
                        <div className="whitespace-pre-wrap">{autoResult.error}</div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Instructions */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium mb-2">使用说明：</h3>
                    <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                      <li>使用 youtubei.js 自动抓取字幕，更可靠稳定</li>
                      <li>输入完整的 YouTube 视频链接</li>
                      <li>视频必须有英文字幕（自动生成或手动上传）</li>
                      <li>系统会自动翻译成中文</li>
                      <li>翻译过程可能需要几分钟，请耐心等待</li>
                    </ul>
                  </div>
                </div>
              </TabsContent>

              {/* Manual Upload Tab */}
              <TabsContent active={activeTab === 'manual'}>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <label htmlFor="manual-youtube-url" className="text-sm font-medium">
                      YouTube URL <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="manual-youtube-url"
                      type="text"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={manualUrl}
                      onChange={(e) => setManualUrl(e.target.value)}
                      disabled={manualStatus !== 'idle'}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="manual-title" className="text-sm font-medium">
                      课程标题 <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="manual-title"
                      type="text"
                      placeholder="例如：纽约日常 Vlog"
                      value={manualTitle}
                      onChange={(e) => setManualTitle(e.target.value)}
                      disabled={manualStatus !== 'idle'}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="subtitle-content" className="text-sm font-medium">
                      字幕内容 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="subtitle-content"
                      className="w-full min-h-[300px] p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      placeholder="粘贴字幕内容...&#10;&#10;支持 SRT 格式：&#10;1&#10;00:00:01,000 --> 00:00:03,000&#10;Hello, this is a subtitle&#10;&#10;或 YouTube 文稿格式：&#10;0:01 Hello, this is the first line&#10;0:05 This is the second line"
                      value={subtitleContent}
                      onChange={(e) => setSubtitleContent(e.target.value)}
                      disabled={manualStatus !== 'idle'}
                    />
                    <p className="text-xs text-gray-500">
                      支持 SRT 格式和 YouTube 文稿格式
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 mt-4">
                    <input
                      type="checkbox"
                      id="skip-translation"
                      checked={skipTranslation}
                      onChange={(e) => setSkipTranslation(e.target.checked)}
                      className="w-4 h-4"
                      disabled={manualStatus !== 'idle'}
                    />
                    <label htmlFor="skip-translation" className="text-sm">
                      跳过翻译（仅导入英文字幕，适合翻译 API 限流时使用）
                    </label>
                  </div>

                  <Button
                    onClick={handleManualImport}
                    disabled={manualStatus !== 'idle' && manualStatus !== 'error' && manualStatus !== 'success'}
                    className="w-full"
                  >
                    {manualStatus === 'idle' || manualStatus === 'error' || manualStatus === 'success'
                      ? '开始导入'
                      : '导入中...'}
                  </Button>

                  {/* Progress Display */}
                  {manualStatus !== 'idle' && manualStatus !== 'error' && manualStatus !== 'success' && (
                    <Alert>
                      <AlertTitle>处理进度</AlertTitle>
                      <AlertDescription>
                        <div className="space-y-2 mt-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                            <span>{manualProgress}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                              style={{
                                width: `${
                                  manualStatus === 'extracting' ? 33 :
                                  manualStatus === 'translating' ? 66 :
                                  manualStatus === 'saving' ? 90 : 0
                                }%`
                              }}
                            />
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Success Message */}
                  {manualStatus === 'success' && manualResult?.success && (
                    <Alert variant="success">
                      <AlertTitle>✅ 导入成功！</AlertTitle>
                      <AlertDescription>
                        <div className="space-y-2 mt-2">
                          <p><strong>课程ID:</strong> {manualResult.lessonId}</p>
                          <p><strong>标题:</strong> {manualResult.title}</p>
                          <p><strong>字幕数量:</strong> {manualResult.subtitleCount} 条</p>
                          <p><strong>时长:</strong> {Math.floor((manualResult.duration || 0) / 60)} 分钟</p>
                          {!manualResult.translated && (
                            <p className="text-yellow-600">
                              ⚠️ 注意：此课程仅包含英文字幕，未进行翻译
                            </p>
                          )}
                          <div className="mt-4">
                            <Link
                              href={`/lesson/${manualResult.lessonId}`}
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
                  {manualStatus === 'error' && manualResult?.error && (
                    <Alert variant="destructive">
                      <AlertTitle>导入失败</AlertTitle>
                      <AlertDescription>
                        <div className="whitespace-pre-wrap">{manualResult.error}</div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Instructions */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium mb-2">使用说明：</h3>
                    <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                      <li>在 YouTube 视频页面点击 &quot;...&quot; → &quot;显示文稿&quot;</li>
                      <li>复制所有文稿内容并粘贴到上方文本框</li>
                      <li>或者上传 .srt 字幕文件的内容</li>
                      <li>系统会自动识别格式并翻译成中文</li>
                      <li>适合自动抓取失败时使用的备用方案</li>
                    </ul>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
