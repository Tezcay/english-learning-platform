'use client'

import { CourseCard } from '@/components/CourseCard'
import { useEffect, useState } from 'react'
import { getAllLessons } from '@/lib/lessons'
import type { Lesson } from '@/types'

export default function Home() {
  const [lessons, setLessons] = useState<Omit<Lesson, 'subtitles'>[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllLessons()
      .then(setLessons)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="text-center">加载中...</div>
      </main>
    )
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">英语口语学习平台</h1>
        <p className="text-muted-foreground mb-8">
          通过真实的 YouTube 视频学习地道英语表达
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lessons.map((lesson) => (
            <CourseCard key={lesson.id} lesson={lesson} />
          ))}
        </div>
      </div>
    </main>
  )
}