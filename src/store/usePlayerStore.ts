import { create } from 'zustand'
import { PlayerState, SubtitleDisplayMode, PlaybackMode } from '@/types'

interface PlayerStore extends PlayerState {
  setPlaying: (playing: boolean) => void
  setPlaybackRate: (rate: number) => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  setDisplayMode: (mode: SubtitleDisplayMode) => void
  setPlaybackMode: (mode: PlaybackMode) => void
  setCurrentSubtitleIndex: (index: number) => void
}

export const usePlayerStore = create<PlayerStore>((set) => ({
  playing: false,
  playbackRate: 1.0,
  currentTime: 0,
  duration: 0,
  displayMode: 'bilingual',
  playbackMode: 'normal',
  currentSubtitleIndex: 0,
  
  setPlaying: (playing) => set({ playing }),
  setPlaybackRate: (rate) => set({ playbackRate: rate }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setDisplayMode: (mode) => set({ displayMode: mode }),
  setPlaybackMode: (mode) => set({ playbackMode: mode }),
  setCurrentSubtitleIndex: (index) => set({ currentSubtitleIndex: index }),
}))