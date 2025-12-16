import { CourseCard } from '@/components/CourseCard'
import { Lesson } from '@/types'

const mockLessons: Lesson[] = [
  {
    id: '1',
    title: '纽约日常 Vlog | 咖啡店工作日常',
    youtubeId: 'dQw4w9WgXcQ',
    bloggerName: 'Emma Wilson',
    difficulty: 3,
    durationMinutes: 20,
    tags: ['日常', '咖啡', '纽约'],
    thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    createdAt: new Date(),
  },
  {
    id: '2',
    title: '健身房晨练 | 我的健身routine',
    youtubeId: 'dQw4w9WgXcQ',
    bloggerName: 'Tom Dickinson',
    difficulty: 2,
    durationMinutes: 15,
    tags: ['健身', '运动', '日常'],
    thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    createdAt: new Date(),
  },
]

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">真实语料英语学习平台</h1>
        <p className="text-muted-foreground text-lg">
          200+ YouTube vlog 真实语料，通过影子跟读提升口语和听力
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockLessons.map((lesson) => (
          <CourseCard key={lesson.id} lesson={lesson} />
        ))}
      </div>
    </main>
  )
}