import { Text } from '@react-three/drei'
import type { AgentStatus } from '@/types'

interface AgentNameLabelProps {
  name: string
  role: string
  status: AgentStatus
  taskTitle?: string
  theme: 'light' | 'dark'
}

const STATUS_COLORS: Record<AgentStatus, string> = {
  working: '#3b82f6',
  idle: '#22c55e',
  offline: '#64748b',
}

export function AgentNameLabel({ name, role, status, taskTitle, theme }: AgentNameLabelProps) {
  const isDark = theme === 'dark'
  const textColor = isDark ? '#e2e8f0' : '#0f172a'
  const subColor = isDark ? '#94a3b8' : '#64748b'

  return (
    <group position={[0, 1.25, 0]}>
      {/* Name */}
      <Text
        position={[0, 0.08, 0]}
        fontSize={0.12}
        color={textColor}
        anchorX="center"
        anchorY="middle"
        font={undefined}
      >
        {name}
      </Text>

      {/* Role + Status */}
      <Text
        position={[0, -0.04, 0]}
        fontSize={0.07}
        color={subColor}
        anchorX="center"
        anchorY="middle"
        font={undefined}
      >
        {role}
      </Text>

      {/* Status dot */}
      <mesh position={[-0.25, -0.04, 0]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshBasicMaterial color={STATUS_COLORS[status]} />
      </mesh>

      {/* Task title for working agents */}
      {status === 'working' && taskTitle && (
        <Text
          position={[0, -0.14, 0]}
          fontSize={0.06}
          color={isDark ? '#93c5fd' : '#2563eb'}
          anchorX="center"
          anchorY="middle"
          maxWidth={1.5}
          font={undefined}
        >
          {taskTitle}
        </Text>
      )}
    </group>
  )
}
