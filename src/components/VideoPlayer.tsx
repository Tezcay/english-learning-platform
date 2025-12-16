'use client'

import { useEffect, useRef, useState } from 'react'
import ReactPlayer from 'react-player/youtube'
import { usePlayerStore } from '@/store/usePlayerStore'

interface VideoPlayerProps {
  youtubeId: string
}

export function VideoPlayer({ youtubeId }: VideoPlayerProps) {
  const playerRef = useRef<ReactPlayer>(null)
  const [isSeeking, setIsSeeking] = useState(false)
  const { 
    playing, 
    playbackRate, 
    currentTime,
    setPlaying, 
    setCurrentTime, 
    setDuration 
  } = usePlayerStore()

  const handleProgress = (state: { played: number; playedSeconds: number }) => {
    if (!isSeeking) {
      setCurrentTime(state.playedSeconds)
    }
  }

  const handleDuration = (duration: number) => {
    setDuration(duration)
  }

  // 外部控制播放位置
  useEffect(() => {
    if (playerRef.current && Math.abs(playerRef.current.getCurrentTime() - currentTime) > 1) {
      setIsSeeking(true)
      playerRef.current.seekTo(currentTime, 'seconds')
      setTimeout(() => setIsSeeking(false), 100)
    }
  }, [currentTime])

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
      <ReactPlayer
        ref={playerRef}
        url={`https://www.youtube.com/watch?v=${youtubeId}`}
        width="100%"
        height="100%"
        playing={playing}
        playbackRate={playbackRate}
        onProgress={handleProgress}
        onDuration={handleDuration}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        controls
        config={{
          playerVars: {
            modestbranding: 1,
            rel: 0,
          },
        }}
      />
    </div>
  )
}
