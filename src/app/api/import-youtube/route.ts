import { NextRequest, NextResponse } from 'next/server'
import { YoutubeTranscript } from 'youtube-transcript'
import { translate } from '@vitalets/google-translate-api'
import { promises as fs } from 'fs'
import path from 'path'
import { HttpsProxyAgent } from 'https-proxy-agent'

interface TranscriptItem {
  text: string
  duration: number
  offset: number
}

interface Subtitle {
  id: string
  lessonId: string
  startTime: number
  endTime: number
  textEn: string
  textZh: string
  order: number
}

interface Lesson {
  id: string
  title: string
  youtubeId: string
  description: string
  duration: number
  level: string
  tags: string[]
  thumbnail: string
  subtitles: Subtitle[]
}

interface LessonIndex {
  lessons: Array<{
    id: string
    title: string
    description: string
    thumbnail: string
    duration: number
    level: string
    tags: string[]
  }>
}

// Extract YouTube video ID from URL
function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      return match[1]
    }
  }

  // Check if it's already just an ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return url
  }

  return null
}

// Translate text with retry logic
async function translateText(text: string, retries = 3): Promise<string> {
  for (let i = 0; i < retries; i++) {
    try {
      // Add delay to avoid rate limiting
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000 * i))
      }
      
      const result = await translate(text, { 
        from: 'en', 
        to: 'zh-CN',
        fetchOptions: {
          agent: process.env.HTTP_PROXY ? new HttpsProxyAgent(process.env.HTTP_PROXY) : undefined
        }
      })
      return result.text
    } catch (error) {
      if (i === retries - 1) {
        console.error('Translation failed:', error)
        return text // Return original text if translation fails
      }
    }
  }
  return text
}

export async function POST(request: NextRequest) {
  try {
    // Configure proxy for network requests
    // This is essential for users in regions where YouTube is blocked (e.g., China)
    const proxyUrl = process.env.HTTP_PROXY || 
                     process.env.HTTPS_PROXY || 
                     process.env.http_proxy || 
                     process.env.https_proxy

    // Common Clash/V2Ray default ports
    const defaultProxies = [
      'http://127.0.0.1:7890',  // Clash default
      'http://127.0.0.1:7897',  // Clash mixed port
      'http://127.0.0.1:10809', // V2Ray default
    ]

    let proxyConfigured = false

    // Try environment variable first
    if (proxyUrl) {
      try {
        const { ProxyAgent, setGlobalDispatcher } = await import('undici')
        setGlobalDispatcher(new ProxyAgent(proxyUrl))
        console.log(`✅ Using proxy from environment: ${proxyUrl}`)
        proxyConfigured = true
      } catch (error) {
        console.warn(`⚠️ Failed to configure proxy from environment: ${proxyUrl}`)
      }
    }

    // If no environment proxy, try common default ports
    if (!proxyConfigured) {
      for (const proxy of defaultProxies) {
        try {
          const { ProxyAgent, setGlobalDispatcher } = await import('undici')
          setGlobalDispatcher(new ProxyAgent(proxy))
          console.log(`✅ Using default proxy: ${proxy}`)
          proxyConfigured = true
          break
        } catch (error) {
          console.log(`⏭️ Skipping proxy ${proxy}`)
        }
      }
    }

    if (!proxyConfigured) {
      console.warn('⚠️ No proxy configured. YouTube access may fail in restricted regions.')
    }

    const { url } = await request.json()

    if (!url) {
      return NextResponse.json(
        { error: '请提供 YouTube URL' },
        { status: 400 }
      )
    }

    // Extract video ID
    const videoId = extractVideoId(url)
    if (!videoId) {
      return NextResponse.json(
        { error: '无效的 YouTube URL。请使用 youtube.com/watch?v= 或 youtu.be/ 格式' },
        { status: 400 }
      )
    }

    // Fetch transcript - try multiple language variants
    let transcriptItems: TranscriptItem[] = []
    const languageCodes = ['en', 'en-US', 'en-GB', 'en-CA', 'en-AU']

    // First, try specific English language codes
    for (const lang of languageCodes) {
      try {
        console.log(`Attempting to fetch transcript with lang: ${lang}`)
        transcriptItems = await YoutubeTranscript.fetchTranscript(videoId, {
          lang: lang
        })
        console.log(`Successfully fetched transcript with lang: ${lang}`)
        break // Success - exit loop
      } catch (error) {
        console.log(`Failed to fetch with lang ${lang}, trying next...`)
        continue
      }
    }

    // If all specific language attempts failed, try without language specification
    // This will get auto-generated or default subtitles
    if (transcriptItems.length === 0) {
      try {
        console.log('Attempting to fetch transcript without language specification')
        transcriptItems = await YoutubeTranscript.fetchTranscript(videoId)
        console.log('Successfully fetched transcript without language specification')
      } catch (error) {
        console.error('All transcript fetch attempts failed:', error)
        return NextResponse.json(
          { 
            error: '无法获取字幕。可能原因：\n1. 视频没有英文字幕\n2. 视频已被删除或设为私密\n3. 字幕被禁用\n\n请尝试其他有英文字幕的视频。' 
          },
          { status: 404 }
        )
      }
    }

    if (!transcriptItems || transcriptItems.length === 0) {
      return NextResponse.json(
        { error: '该视频没有可用的英文字幕' },
        { status: 404 }
      )
    }

    // Validate that we got English content
    if (transcriptItems.length > 0) {
      const sampleText = transcriptItems[0].text
      // Basic check - English text should contain common English characters
      if (!/[a-zA-Z]/.test(sampleText)) {
        console.warn('Warning: Fetched subtitles may not be in English')
      }
    }

    // Generate subtitles with translation
    const subtitles: Subtitle[] = []
    for (let i = 0; i < transcriptItems.length; i++) {
      const item = transcriptItems[i]
      const startTime = Math.floor(item.offset / 1000)
      const endTime = Math.floor((item.offset + item.duration) / 1000)
      
      // Translate with delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
      const textZh = await translateText(item.text)

      subtitles.push({
        id: `${videoId}-${i + 1}`,
        lessonId: videoId,
        startTime,
        endTime,
        textEn: item.text,
        textZh,
        order: i
      })
    }

    // Calculate total duration
    const lastItem = transcriptItems[transcriptItems.length - 1]
    const duration = Math.floor((lastItem.offset + lastItem.duration) / 1000)

    // Create lesson object
    const lesson: Lesson = {
      id: videoId,
      title: `YouTube Video - ${videoId}`,
      youtubeId: videoId,
      description: '从 YouTube 导入的课程',
      duration,
      level: 'intermediate',
      tags: ['imported', 'youtube'],
      thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      subtitles
    }

    // Save lesson file
    const lessonsDir = path.join(process.cwd(), 'public', 'lessons')
    const lessonFilePath = path.join(lessonsDir, `lesson-${videoId}.json`)
    
    try {
      await fs.writeFile(lessonFilePath, JSON.stringify(lesson, null, 2))
    } catch (error) {
      console.error('Failed to write lesson file:', error)
      return NextResponse.json(
        { error: '保存课程文件失败' },
        { status: 500 }
      )
    }

    // Update index.json
    const indexPath = path.join(lessonsDir, 'index.json')
    let indexData: LessonIndex
    
    try {
      const indexContent = await fs.readFile(indexPath, 'utf-8')
      indexData = JSON.parse(indexContent)
    } catch (error) {
      // If index doesn't exist, create new one
      indexData = { lessons: [] }
    }

    // Check if lesson already exists in index
    const existingIndex = indexData.lessons.findIndex(l => l.id === videoId)
    const lessonIndexEntry = {
      id: videoId,
      title: lesson.title,
      description: lesson.description,
      thumbnail: lesson.thumbnail,
      duration: lesson.duration,
      level: lesson.level,
      tags: lesson.tags
    }

    if (existingIndex >= 0) {
      // Update existing lesson
      indexData.lessons[existingIndex] = lessonIndexEntry
    } else {
      // Add new lesson
      indexData.lessons.push(lessonIndexEntry)
    }

    try {
      await fs.writeFile(indexPath, JSON.stringify(indexData, null, 2))
    } catch (error) {
      console.error('Failed to update index:', error)
      return NextResponse.json(
        { error: '更新索引文件失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      lessonId: videoId,
      title: lesson.title,
      subtitleCount: subtitles.length,
      duration
    })

  } catch (error) {
    console.error('Import error:', error)
    
    // Check if it's a network error
    const errorMessage = error instanceof Error ? error.message : String(error)
    const isNetworkError = errorMessage.includes('timeout') || 
                           errorMessage.includes('ECONNREFUSED') ||
                           errorMessage.includes('fetch failed')
    
    if (isNetworkError) {
      return NextResponse.json(
        { 
          error: '网络连接失败。如果您在中国大陆，请确保：\n' +
                 '1. Clash/V2Ray 代理正在运行\n' +
                 '2. 代理端口为 7890/7897/10809\n' +
                 '3. 或设置环境变量 HTTP_PROXY\n\n' +
                 '详细错误：' + errorMessage 
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: '导入失败，请重试。错误：' + errorMessage },
      { status: 500 }
    )
  }
}
