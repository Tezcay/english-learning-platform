import { Lesson, LessonIndex } from '@/types'

export async function getAllLessons(): Promise<Omit<Lesson, 'subtitles'>[]> {
  const response = await fetch('/lessons/index.json')
  if (!response.ok) {
    throw new Error('Failed to load lessons index')
  }
  const data: LessonIndex = await response.json()
  return data.lessons
}

export async function getLessonById(id: string): Promise<Lesson | null> {
  try {
    // Sanitize ID to prevent path traversal attacks
    const sanitizedId = id.replace(/[^a-zA-Z0-9-]/g, '')
    if (!sanitizedId) {
      return null
    }
    
    const response = await fetch(`/lessons/lesson-${sanitizedId}.json`)
    if (!response.ok) {
      return null
    }
    const lesson: Lesson = await response.json()
    return lesson
  } catch (error) {
    console.error(`Failed to load lesson ${id}:`, error)
    return null
  }
}
