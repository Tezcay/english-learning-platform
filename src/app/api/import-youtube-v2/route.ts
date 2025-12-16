import { NextRequest, NextResponse } from 'next/server'
import { Innertube } from 'youtubei.js'
import { translate } from '@vitalets/google-translate-api'
import { promises as fs } from 'fs'
import path from 'path'
import { HttpsProxyAgent } from 'https-proxy-agent'

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

// Translate text with retry logic and exponential backoff
async function translateText(text: string, retries = 3): Promise<string> {
  for (let i = 0; i < retries; i++) {
    try {
      // Exponential backoff: 1s, 3s, 9s
      if (i > 0) {
        const delay = 1000 * Math.pow(3, i)
        console.log(`Retry ${i}, waiting ${delay}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
      
      const result = await translate(text, { 
        from: 'en', 
        to: 'zh-CN',
        fetchOptions: {
          agent: process.env.HTTP_PROXY ? new HttpsProxyAgent(process.env.HTTP_PROXY) : undefined
        }
      })
      return result.text
    } catch (error: any) {
      const errorMessage = error?.message || String(error)
      
      // Check if it's a rate limit error
      if (errorMessage.includes('TooManyRequests') || errorMessage.includes('429')) {
        console.warn(`Rate limit hit, attempt ${i + 1}/${retries}`)
        
        if (i === retries - 1) {
          console.error('Translation failed after all retries due to rate limiting')
          return text // Return original text if all retries fail
        }
        // Continue to next retry with longer delay
        continue
      }
      
      // For other errors, fail faster
      if (i === retries - 1) {
        console.error('Translation failed:', error)
        return text
      }
    }
  }
  return text
}

export async function POST(request: NextRequest) {
  try {
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

    console.log(`Fetching transcript for video: ${videoId}`)

    // Initialize Innertube client
    const youtube = await Innertube.create()
    
    // Get video info
    const info = await youtube.getInfo(videoId)
    
    if (!info) {
      return NextResponse.json(
        { error: '无法获取视频信息。视频可能已被删除或设为私密' },
        { status: 404 }
      )
    }

    // Get video title
    const videoTitle = info.basic_info.title || `YouTube Video - ${videoId}`
    const videoDescription = info.basic_info.short_description || '从 YouTube 导入的课程'
    const videoDuration = info.basic_info.duration || 0

    // Get transcript
    let transcriptData
    try {
      transcriptData = await info.getTranscript()
    } catch (error) {
      console.error('Failed to get transcript:', error)
      return NextResponse.json(
        { error: '无法获取字幕。可能原因：\n1. 视频没有字幕\n2. 字幕被禁用\n\n请尝试使用"手动上传"功能。' },
        { status: 404 }
      )
    }

    if (!transcriptData?.transcript?.content?.body?.initial_segments) {
      return NextResponse.json(
        { error: '该视频没有可用的字幕' },
        { status: 404 }
      )
    }

    const segments = transcriptData.transcript.content.body.initial_segments as any[]

    if (!segments || segments.length === 0) {
      return NextResponse.json(
        { error: '该视频没有可用的字幕内容' },
        { status: 404 }
      )
    }

    // Generate subtitles with translation
    const subtitles: Subtitle[] = []
    console.log(`Starting translation of ${segments.length} subtitles...`)

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i] as any
      const text = segment.snippet?.text || ''
      const startTimeMs = Number(segment.start_ms || 0)
      const endTimeMs = Number(segment.end_ms || 0)
      
      const startTime = Math.floor(startTimeMs / 1000)
      const endTime = Math.floor(endTimeMs / 1000)
      
      // Add 1 second delay to respect rate limits (was 100ms)
      // This ensures max ~1 request per second to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const textZh = await translateText(text)

      subtitles.push({
        id: `${videoId}-${i + 1}`,
        lessonId: videoId,
        startTime,
        endTime,
        textEn: text,
        textZh,
        order: i
      })
      
      // Log progress every 10 items
      if ((i + 1) % 10 === 0 || i === segments.length - 1) {
        console.log(`翻译进度: ${i + 1}/${segments.length} (${Math.round((i + 1) / segments.length * 100)}%)`)
      }
    }

    console.log(`Translation completed: ${subtitles.length} subtitles`)

    // Use video duration from API or calculate from last segment
    const lastSegment = segments[segments.length - 1] as any
    const duration = videoDuration || Math.floor(Number(lastSegment?.end_ms || 0) / 1000)

    // Create lesson object
    const lesson: Lesson = {
      id: videoId,
      title: videoTitle,
      youtubeId: videoId,
      description: videoDescription,
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
    
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    return NextResponse.json(
      { error: '导入失败，请重试。错误：' + errorMessage },
      { status: 500 }
    )
  }
}

// Batch translation helper (for future optimization)
// This function can translate multiple subtitles at once to reduce API calls
async function translateBatch(texts: string[], batchSize = 3): Promise<string[]> {
  const results: string[] = []
  
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize)
    const combined = batch.join('\n###SEPARATOR###\n')
    
    // Translate combined text
    const translated = await translateText(combined)
    
    // Split back into individual translations
    const splitResults = translated.split('\n###SEPARATOR###\n')
    
    // Pad with original text if split fails
    for (let j = 0; j < batch.length; j++) {
      results.push(splitResults[j] || batch[j])
    }
    
    // Wait longer between batches
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
  
  return results
}
