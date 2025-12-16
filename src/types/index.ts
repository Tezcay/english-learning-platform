export interface Lesson {
  id: string;
  title: string;
  youtubeId: string;
  bloggerName?: string;
  difficulty?: number;
  durationMinutes?: number; // Legacy field - prefer using 'duration' in seconds
  description?: string;
  duration?: number; // Duration in seconds - standardized format
  level?: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  thumbnailUrl?: string; // Legacy field - prefer using 'thumbnail'
  thumbnail?: string; // Thumbnail image URL
  createdAt?: Date;
  subtitles?: Subtitle[];
}

export interface LessonIndex {
  lessons: Omit<Lesson, 'subtitles'>[]
}

export interface Subtitle {
  id: string;
  lessonId: string;
  startTime: number;
  endTime: number;
  textEn: string;
  textZh: string;
  textIpa?: string;
  order: number;
  knowledgePoints?: KnowledgePoint[];
}

export interface KnowledgePoint {
  id: string;
  subtitleId: string;
  type: KnowledgePointType;
  text: string;
  definitionEn: string;
  definitionCn: string;
  pronunciation?: string;
  difficulty?: string;
  usageNotes?: string;
  examples: Example[];
}

export type KnowledgePointType = 
  | 'word' 
  | 'phrase' 
  | 'phrasal_verb' 
  | 'collocation' 
  | 'idiom' 
  | 'discourse_marker';

export interface Example {
  en: string;
  cn: string;
}

export type SubtitleDisplayMode = 
  | 'bilingual' 
  | 'english' 
  | 'chinese' 
  | 'ipa' 
  | 'dictation';

export type PlaybackMode = 
  | 'normal' 
  | 'sentence-pause' 
  | 'sentence-loop';

export interface PlayerState {
  playing: boolean;
  playbackRate: number;
  currentTime: number;
  duration: number;
  displayMode: SubtitleDisplayMode;
  playbackMode: PlaybackMode;
  currentSubtitleIndex: number;
}