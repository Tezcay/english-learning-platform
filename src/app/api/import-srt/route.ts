import { NextRequest, NextResponse } from 'next/server'
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

// Parse time string to seconds
function parseTimeToSeconds(timeStr: string): number {
  // Handle SRT format: 00:00:01,000 or 00:00:01.000
  if (timeStr.includes(':') && (timeStr.includes(',') || timeStr.includes('.'))) {
    const [time, ms] = timeStr.split(/[,.]/)
    const parts = time.split(':')
    let seconds = 0
    
    if (parts.length === 3) {
      // HH:MM:SS
      seconds = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2])
    } else if (parts.length === 2) {
      // MM:SS
      seconds = parseInt(parts[0]) * 60 + parseInt(parts[1])
    }
    
    return seconds
  }
  
  // Handle YouTube transcript format: 0:01 or 1:23:45
  const parts = timeStr.split(':')
  let seconds = 0
  
  if (parts.length === 3) {
    // H:MM:SS
    seconds = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2])
  } else if (parts.length === 2) {
    // M:SS
    seconds = parseInt(parts[0]) * 60 + parseInt(parts[1])
  } else if (parts.length === 1) {
    // SS
    seconds = parseInt(parts[0])
  }
  
  return seconds
}

// Parse SRT format
function parseSRT(content: string): Array<{ startTime: number; endTime: number; text: string }> {
  const subtitles: Array<{ startTime: number; endTime: number; text: string }> = []
  
  // Split by double newlines to get each subtitle block
  const blocks = content.split(/\n\s*\n/).filter(block => block.trim())
  
  for (const block of blocks) {
    const lines = block.split('\n').map(line => line.trim()).filter(line => line)
    
    // SRT format:
    // 1
    // 00:00:01,000 --> 00:00:03,000
    // Subtitle text
    
    if (lines.length < 2) continue
    
    // Find the line with -->
    let timelineIndex = -1
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('-->')) {
        timelineIndex = i
        break
      }
    }
    
    if (timelineIndex === -1) continue
    
    const timeline = lines[timelineIndex]
    const [startStr, endStr] = timeline.split('-->').map(s => s.trim())
    
    const startTime = parseTimeToSeconds(startStr)
    const endTime = parseTimeToSeconds(endStr)
    
    // Text is everything after the timeline
    const text = lines.slice(timelineIndex + 1).join(' ').trim()
    
    if (text) {
      subtitles.push({ startTime, endTime, text })
    }
  }
  
  return subtitles
}

// Parse YouTube transcript format
function parseYouTubeTranscript(content: string): Array<{ startTime: number; endTime: number; text: string }> {
  const subtitles: Array<{ startTime: number; endTime: number; text: string }> = []
  
  // YouTube transcript format:
  // 0:01 Text here
  // 0:05 Another text
  // 1:23 More text
  
  const lines = content.split('\n').filter(line => line.trim())
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Match timestamp at the beginning: 0:01, 1:23:45, etc.
    const match = line.match(/^(\d{1,2}:\d{2}(?::\d{2})?)\s+(.+)$/)
    
    if (match) {
      const timeStr = match[1]
      const text = match[2].trim()
      
      const startTime = parseTimeToSeconds(timeStr)
      
      // End time is the start of the next line, or start + 5 seconds if it's the last line
      let endTime = startTime + 5
      
      if (i < lines.length - 1) {
        const nextLine = lines[i + 1].trim()
        const nextMatch = nextLine.match(/^(\d{1,2}:\d{2}(?::\d{2})?)\s+/)
        
        if (nextMatch) {
          endTime = parseTimeToSeconds(nextMatch[1])
        }
      }
      
      subtitles.push({ startTime, endTime, text })
    }
  }
  
  return subtitles
}

// Detect format and parse
function parseSubtitles(content: string): Array<{ startTime: number; endTime: number; text: string }> {
  // Check if it's SRT format (contains -->)
  if (content.includes('-->')) {
    return parseSRT(content)
  }
  
  // Otherwise, try YouTube transcript format
  return parseYouTubeTranscript(content)
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
    const { url, title, subtitleContent } = await request.json()

    if (!url || !title || !subtitleContent) {
      return NextResponse.json(
        { error: '请提供 YouTube URL、课程标题和字幕内容' },
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

    console.log(`Parsing subtitles for video: ${videoId}`)

    // Parse subtitles
    const parsedSubtitles = parseSubtitles(subtitleContent)

    if (parsedSubtitles.length === 0) {
      return NextResponse.json(
        { error: '无法解析字幕。请确保格式正确（SRT 格式或 YouTube 文稿格式）' },
        { status: 400 }
      )
    }

    // Generate subtitles with translation
    const subtitles: Subtitle[] = []
    for (let i = 0; i < parsedSubtitles.length; i++) {
      const item = parsedSubtitles[i]
      
      // Translate with delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
      const textZh = await translateText(item.text)

      subtitles.push({
        id: `${videoId}-${i + 1}`,
        lessonId: videoId,
        startTime: item.startTime,
        endTime: item.endTime,
        textEn: item.text,
        textZh,
        order: i
      })
    }

    // Calculate total duration from last subtitle
    const duration = parsedSubtitles[parsedSubtitles.length - 1].endTime

    // Create lesson object
    const lesson: Lesson = {
      id: videoId,
      title: title,
      youtubeId: videoId,
      description: '从字幕文件导入的课程',
      duration,
      level: 'intermediate',
      tags: ['imported', 'youtube', 'manual'],
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
