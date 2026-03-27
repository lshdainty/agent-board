import { Suspense, Component, type ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { OfficeScene } from './OfficeScene'
import { useAgents } from '@/hooks/useAgents'
import { useTasks } from '@/hooks/useTasks'
import { useSettings } from '@/hooks/useSettings'

interface OfficeViewProps {
  projectId: number
  theme: 'light' | 'dark'
}

const BG = { light: '#e8ecf4', dark: '#141828' } as const

// Loading spinner for 3D scene
function SceneLoadingFallback({ theme }: { theme: 'light' | 'dark' }) {
  const color = theme === 'dark' ? '#94a3b8' : '#64748b'
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
      color,
    }}>
      <div style={{
        width: '32px',
        height: '32px',
        border: `3px solid ${theme === 'dark' ? '#1e293b' : '#cbd5e1'}`,
        borderTopColor: '#3b82f6',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ fontSize: '13px', fontWeight: 500 }}>
        Loading 3D scene...
      </div>
    </div>
  )
}

// Error boundary to catch 3D rendering errors
class Scene3DErrorBoundary extends Component<
  { children: ReactNode; onRetry?: () => void },
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
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <div style={{ fontSize: '14px', fontWeight: 500 }}>
            3D rendering error
          </div>
          <button
            onClick={() => {
              this.setState({ error: null })
              window.location.reload()
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 16px',
              fontSize: '13px',
              borderRadius: '6px',
              border: '1px solid #334155',
              background: 'transparent',
              color: '#94a3b8',
              cursor: 'pointer',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            Retry
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export function OfficeView({ projectId, theme }: OfficeViewProps) {
  const { data: agents = [], isLoading: agentsLoading } = useAgents(projectId)
  const { data: tasks = [], isLoading: tasksLoading } = useTasks(projectId)
  const { settings } = useSettings()
  const bg = BG[theme]
  const isLoading = agentsLoading || tasksLoading

  return (
    <div style={{ width: '100%', height: '100%', background: bg, borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
      <Scene3DErrorBoundary>
        <Canvas
          shadows={settings.shadows}
          frameloop="always"
          orthographic
          camera={{ position: [15, 15, 15], zoom: 40, near: 0.1, far: 100 }}
          gl={{ antialias: true, alpha: false }}
          onCreated={({ gl }) => {
            gl.setClearColor(bg)
          }}
        >
          <Suspense fallback={null}>
            {!isLoading && <OfficeScene agents={agents} tasks={tasks} theme={theme} />}
          </Suspense>
        </Canvas>
      </Scene3DErrorBoundary>

      {/* Loading overlay */}
      {isLoading && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '12px',
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
          color: theme === 'dark' ? '#94a3b8' : '#64748b',
          zIndex: 10,
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: `3px solid ${theme === 'dark' ? '#1e293b' : '#cbd5e1'}`,
            borderTopColor: '#3b82f6',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{ fontSize: '13px', fontWeight: 500 }}>
            Loading...
          </div>
        </div>
      )}

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
          {'\u25CF'} {agents.filter((a) => a.status === 'working').length} Working
        </span>
        <span style={{ color: '#22c55e' }}>
          {'\u25CF'} {agents.filter((a) => a.status === 'idle').length} Idle
        </span>
        <span style={{ color: theme === 'dark' ? '#64748b' : '#94a3b8' }}>
          {'\u25CF'} {agents.filter((a) => a.status === 'offline').length} Offline
        </span>
      </div>
    </div>
  )
}
