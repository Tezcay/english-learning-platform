import Link from 'next/link'
import Image from 'next/image'
import { Lesson } from '@/types'
import { Star, PlayCircle } from 'lucide-react'

interface CourseCardProps {
  lesson: Lesson
}

export function CourseCard({ lesson }: CourseCardProps) {
  // Convert level to difficulty number for star display
  const difficultyMap = {
    'beginner': 2,
    'intermediate': 3,
    'advanced': 4
  }
  const difficulty = lesson.level ? difficultyMap[lesson.level] : (lesson.difficulty || 3)
  
  // Handle both thumbnail and thumbnailUrl
  const thumbnail = lesson.thumbnail || lesson.thumbnailUrl
  
  // Handle both duration (seconds) and durationMinutes
  const durationMinutes = lesson.duration 
    ? Math.floor(lesson.duration / 60) 
    : lesson.durationMinutes || 0
  
  return (
    <Link href={`/lesson/${lesson.id}`}>
      <div className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-card">
        <div className="relative w-full h-48 bg-gradient-to-br from-blue-100 to-purple-100">
          {thumbnail ? (
            <Image
              src={thumbnail}
              alt={lesson.title}
              fill
              className="object-cover"
            />
          ) : (
            <div 
              className="w-full h-full flex items-center justify-center"
              aria-label="Video placeholder"
              role="img"
            >
              <PlayCircle className="w-16 h-16 text-gray-400" />
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-bold text-lg mb-2 line-clamp-2">{lesson.title}</h3>
          {lesson.description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{lesson.description}</p>
          )}
          {lesson.bloggerName && (
            <p className="text-sm text-muted-foreground mb-3">@{lesson.bloggerName}</p>
          )}
          
          <div className="flex items-center gap-1 mb-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < difficulty ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                }`}
              />
            ))}
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            {lesson.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded"
              >
                {tag}
              </span>
            ))}
          </div>

          {durationMinutes > 0 && (
            <p className="text-sm text-muted-foreground">
              建议学习时长: {durationMinutes} 分钟
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}