import { notFound } from 'next/navigation'

interface LessonPageProps {
  params: {
    id: string
  }
}

export default function LessonPage({ params }: LessonPageProps) {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">课程学习页面</h1>
        <p className="text-muted-foreground">课程 ID: {params.id}</p>
        <div className="mt-8 p-6 border rounded-lg bg-muted/50">
          <h2 className="text-xl font-semibold mb-4">🎬 视频播放器</h2>
          <p className="mb-4">视频播放器组件将在下一阶段开发</p>
          <h2 className="text-xl font-semibold mb-4 mt-6">📝 功能预览</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>动态字幕显示</li>
            <li>单句暂停/循环</li>
            <li>听写模式</li>
            <li>知识点标注</li>
            <li>播放速度调节 (0.3x - 2.0x)</li>
          </ul>
        </div>
      </div>
    </main>
  )
}