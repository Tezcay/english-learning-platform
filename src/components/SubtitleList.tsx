'use client'

import { usePlayerStore } from '@/store/usePlayerStore'
import { Subtitle } from '@/types'
import { formatTime } from '@/lib/utils'

interface SubtitleListProps {
  subtitles: Subtitle[]
}

export function SubtitleList({ subtitles }: SubtitleListProps) {
  const { currentTime, displayMode, setCurrentTime, setPlaying } = usePlayerStore()

  const handleSubtitleClick = (startTime: number) => {
    setCurrentTime(startTime)
    setPlaying(true)
  }

  const isActive = (subtitle: Subtitle) => {
    return currentTime >= subtitle.startTime && currentTime <= subtitle.endTime
  }

  return (
    <div className="h-[600px] overflow-y-auto space-y-2 pr-2">
      {subtitles.map((subtitle) => (
        <button
          key={subtitle.id}
          onClick={() => handleSubtitleClick(subtitle.startTime)}
          className={`w-full text-left p-4 rounded-lg transition-colors ${
            isActive(subtitle)
              ? 'bg-primary text-primary-foreground'
              : 'bg-card hover:bg-accent'
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="text-xs text-muted-foreground font-mono shrink-0 mt-1">
              {formatTime(subtitle.startTime)}
            </span>
            <div className="flex-1 space-y-1">
              {(displayMode === 'bilingual' || displayMode === 'english') && (
                <p className="text-sm font-medium">{subtitle.textEn}</p>
              )}
              {(displayMode === 'bilingual' || displayMode === 'chinese') && (
                <p className="text-sm text-muted-foreground">{subtitle.textZh}</p>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
