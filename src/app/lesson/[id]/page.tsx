'use client'

import { VideoPlayer } from '@/components/VideoPlayer'
import { SubtitleDisplay } from '@/components/SubtitleDisplay'
import { SubtitleList } from '@/components/SubtitleList'
import { PlayerControls } from '@/components/PlayerControls'
import { getLessonById } from '@/lib/lessons'
import { useEffect, useState } from 'react'
import type { Lesson } from '@/types'

interface LessonPageProps {
  params: {
    id: string
  }
}

export default function LessonPage({ params }: LessonPageProps) {
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getLessonById(params.id)
      .then((data) => {
        if (!data) {
          setError('课程未找到')
        } else {
          setLesson(data)
        }
      })
      .catch((err) => {
        console.error(err)
        setError('加载课程失败')
      })
      .finally(() => setLoading(false))
  }, [params.id])

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="text-center">加载中...</div>
      </main>
    )
  }

  if (error || !lesson) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500">{error || '课程未找到'}</div>
      </main>
    )
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">{lesson.title}</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：视频和控制 */}
          <div className="lg:col-span-2 space-y-6">
            <VideoPlayer youtubeId={lesson.youtubeId} />
            <SubtitleDisplay subtitles={lesson.subtitles || []} />
            <PlayerControls />
          </div>

          {/* 右侧：字幕列表 */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <h2 className="text-xl font-bold mb-4">字幕列表</h2>
              <SubtitleList subtitles={lesson.subtitles || []} />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}