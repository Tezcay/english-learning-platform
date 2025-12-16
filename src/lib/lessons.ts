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
    const response = await fetch(`/lessons/lesson-${id}.json`)
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
