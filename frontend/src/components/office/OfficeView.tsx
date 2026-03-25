import { Suspense, Component, type ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { OfficeScene } from './OfficeScene'
import { useAgents } from '@/hooks/useAgents'
import { useTasks } from '@/hooks/useTasks'

interface OfficeViewProps {
  projectId: number
  theme: 'light' | 'dark'
}

const BG = { light: '#e8ecf4', dark: '#080c18' } as const

// Error boundary to catch 3D rendering errors
class Scene3DErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error('3D Scene Error:', error)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '12px',
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
          color: '#94a3b8',
        }}>
          <div style={{ fontSize: '14px', fontWeight: 500 }}>
            3D 렌더링 오류가 발생했습니다. 새로고침해주세요.
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '6px 16px',
              fontSize: '13px',
              borderRadius: '6px',
              border: '1px solid #334155',
              background: 'transparent',
              color: '#94a3b8',
              cursor: 'pointer',
            }}
          >
            새로고침
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export function OfficeView({ projectId, theme }: OfficeViewProps) {
  const { data: agents = [] } = useAgents(projectId)
  const { data: tasks = [] } = useTasks(projectId)
  const bg = BG[theme]

  return (
    <div style={{ width: '100%', height: '100%', background: bg, borderRadius: '12px', overflow: 'hidden' }}>
      <Scene3DErrorBoundary>
        <Canvas
          shadows
          frameloop="demand"
          orthographic
          camera={{ position: [15, 15, 15], zoom: 40, near: 0.1, far: 100 }}
          gl={{ antialias: true, alpha: false }}
          onCreated={({ gl }) => {
            gl.setClearColor(bg)
          }}
        >
          <Suspense fallback={null}>
            <OfficeScene agents={agents} tasks={tasks} theme={theme} />
          </Suspense>
        </Canvas>
      </Scene3DErrorBoundary>

      <div
        style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          display: 'flex',
          gap: '12px',
          fontSize: '11px',
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        }}
      >
        <span style={{ color: '#3b82f6' }}>
          ● {agents.filter((a) => a.status === 'working').length} Working
        </span>
        <span style={{ color: '#22c55e' }}>
          ● {agents.filter((a) => a.status === 'idle').length} Idle
        </span>
        <span style={{ color: theme === 'dark' ? '#64748b' : '#94a3b8' }}>
          ● {agents.filter((a) => a.status === 'offline').length} Offline
        </span>
      </div>
    </div>
  )
}
