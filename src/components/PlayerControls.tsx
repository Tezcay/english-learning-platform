'use client'

import { usePlayerStore } from '@/store/usePlayerStore'
import { Play, Pause, RotateCcw, Repeat1 } from 'lucide-react'
import { SubtitleDisplayMode, PlaybackMode } from '@/types'

export function PlayerControls() {
  const {
    playing,
    playbackRate,
    displayMode,
    playbackMode,
    setPlaying,
    setPlaybackRate,
    setDisplayMode,
    setPlaybackMode,
  } = usePlayerStore()

  const speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0]
  const displayModes: { value: SubtitleDisplayMode; label: string }[] = [
    { value: 'bilingual', label: '双语' },
    { value: 'english', label: '英文' },
    { value: 'chinese', label: '中文' },
    { value: 'ipa', label: 'IPA' },
  ]

  return (
    <div className="bg-card border rounded-lg p-4 space-y-4">
      {/* 播放控制 */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setPlaying(!playing)}
          className="p-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
        >
          {playing ? <Pause size={24} /> : <Play size={24} />}
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">播放模式:</span>
          <button
            onClick={() =>
              setPlaybackMode(playbackMode === 'normal' ? 'sentence-pause' : 'normal')
            }
            className={`px-3 py-1 rounded text-sm ${
              playbackMode === 'sentence-pause'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary'
            }`}
          >
            单句暂停
          </button>
          <button
            onClick={() =>
              setPlaybackMode(playbackMode === 'normal' ? 'sentence-loop' : 'normal')
            }
            className={`px-3 py-1 rounded text-sm flex items-center gap-1 ${
              playbackMode === 'sentence-loop'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary'
            }`}
          >
            <Repeat1 size={14} />
            单句循环
          </button>
        </div>
      </div>

      {/* 播放速度 */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">播放速度:</span>
        <div className="flex gap-1">
          {speeds.map((speed) => (
            <button
              key={speed}
              onClick={() => setPlaybackRate(speed)}
              className={`px-3 py-1 rounded text-sm ${
                playbackRate === speed
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary hover:bg-accent'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>

      {/* 字幕显示模式 */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">字幕模式:</span>
        <div className="flex gap-1">
          {displayModes.map((mode) => (
            <button
              key={mode.value}
              onClick={() => setDisplayMode(mode.value)}
              className={`px-3 py-1 rounded text-sm ${
                displayMode === mode.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary hover:bg-accent'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
