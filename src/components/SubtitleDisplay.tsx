'use client'

import { usePlayerStore } from '@/store/usePlayerStore'
import { Subtitle } from '@/types'
import { useMemo } from 'react'

interface SubtitleDisplayProps {
  subtitles: Subtitle[]
}

export function SubtitleDisplay({ subtitles }: SubtitleDisplayProps) {
  const { currentTime, displayMode } = usePlayerStore()

  const currentSubtitle = useMemo(() => {
    return subtitles.find(
      (sub) => currentTime >= sub.startTime && currentTime <= sub.endTime
    )
  }, [currentTime, subtitles])

  if (!currentSubtitle) {
    return (
      <div className="h-32 flex items-center justify-center text-muted-foreground">
        等待字幕...
      </div>
    )
  }

  return (
    <div className="bg-black/80 text-white p-6 rounded-lg space-y-3">
      {(displayMode === 'bilingual' || displayMode === 'english') && (
        <p className="text-xl font-medium text-center">
          {currentSubtitle.textEn}
        </p>
      )}
      
      {(displayMode === 'bilingual' || displayMode === 'chinese') && (
        <p className="text-lg text-gray-300 text-center">
          {currentSubtitle.textZh}
        </p>
      )}
      
      {displayMode === 'ipa' && currentSubtitle.textIpa && (
        <p className="text-lg text-blue-300 text-center font-mono">
          {currentSubtitle.textIpa}
        </p>
      )}
    </div>
  )
}
