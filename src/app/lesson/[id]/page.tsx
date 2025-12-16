import { VideoPlayer } from '@/components/VideoPlayer'
import { SubtitleDisplay } from '@/components/SubtitleDisplay'
import { SubtitleList } from '@/components/SubtitleList'
import { PlayerControls } from '@/components/PlayerControls'
import { Subtitle } from '@/types'

// 模拟字幕数据
const mockSubtitles: Subtitle[] = [
  {
    id: '1',
    lessonId: '1',
    startTime: 0,
    endTime: 3,
    textEn: "Hey guys, welcome back to my channel!",
    textZh: "嘿大家好，欢迎回到我的频道！",
    textIpa: "heɪ gaɪz, ˈwɛlkəm bæk tuː maɪ ˈtʃænl!",
    order: 0,
  },
  {
    id: '2',
    lessonId: '1',
    startTime: 3,
    endTime: 7,
    textEn: "Today I'm going to show you my morning routine.",
    textZh: "今天我要给你们展示我的晨间例行事项。",
    textIpa: "təˈdeɪ aɪm ˈɡoʊɪŋ tuː ʃoʊ juː maɪ ˈmɔːrnɪŋ ruːˈtiːn.",
    order: 1,
  },
  {
    id: '3',
    lessonId: '1',
    startTime: 7,
    endTime: 11,
    textEn: "First thing I do is make myself a cup of coffee.",
    textZh: "我做的第一件事就是给自己冲一杯咖啡。",
    textIpa: "fɜːrst θɪŋ aɪ duː ɪz meɪk maɪˈsɛlf ə kʌp ʌv ˈkɑːfi.",
    order: 2,
  },
]

interface LessonPageProps {
  params: {
    id: string
  }
}

export default function LessonPage({ params }: LessonPageProps) {
  // 实际项目中这里会从数据库获取数据
  const youtubeId = 'jfKfPfyJRdk' // 示例视频 ID

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">纽约日常 Vlog | 咖啡店工作日常</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：视频和控制 */}
          <div className="lg:col-span-2 space-y-6">
            <VideoPlayer youtubeId={youtubeId} />
            <SubtitleDisplay subtitles={mockSubtitles} />
            <PlayerControls />
          </div>

          {/* 右侧：字幕列表 */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <h2 className="text-xl font-bold mb-4">字幕列表</h2>
              <SubtitleList subtitles={mockSubtitles} />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}