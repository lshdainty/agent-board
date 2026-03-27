import { useRef } from 'react'
import { Text, Billboard, RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { AgentStatus } from '@/types'
import { useSettings } from '@/hooks/useSettings'

interface AgentNameLabelProps {
  name: string
  role: string
  status: AgentStatus
  taskTitle?: string
  currentComment?: string | null
  theme: 'light' | 'dark'
}

const STATUS_COLORS: Record<AgentStatus, string> = {
  working: '#f59e0b',
  idle: '#22c55e',
  offline: '#64748b',
}

const STATUS_TEXT: Record<AgentStatus, string> = {
  working: '● Working',
  idle: '● Idle',
  offline: '● Offline',
}

export function AgentNameLabel({ name, role, status, taskTitle, currentComment, theme }: AgentNameLabelProps) {
  const { settings } = useSettings()

  if (!settings.nameLabels) return null

  const isDark = theme === 'dark'

  const bgColor = isDark ? '#0f172a' : '#ffffff'
  const nameColor = isDark ? '#f8fafc' : '#020617'
  const roleColor = isDark ? '#94a3b8' : '#475569'
  const commentColor = isDark ? '#60a5fa' : '#2563eb'

  const typingDotsRef = useRef<THREE.Group>(null)

  useFrame(() => {
    const time = Date.now() * 0.001

    // Typing dots bounce
    if (typingDotsRef.current && status === 'working') {
      typingDotsRef.current.children.forEach((dot, i) => {
        const phase = (time * 3 + i * 0.8) % 3
        const bounce = phase < 1 ? Math.sin(phase * Math.PI) * 0.04 : 0
        dot.position.y = bounce
      })
    }
  })

  // Calculate bubble size — uniform width
  const displayText = status === 'working' && currentComment ? currentComment : role
  const statusLabel = STATUS_TEXT[status]
  // Use a generous fixed width so all bubbles look consistent
  const bgW = 1.2
  const bgH = 0.60

  return (
    <group position={[0, 1.85, 0]}>
      <Billboard follow lockX={false} lockY={false} lockZ={false}>
        {/* Main bubble */}
        <RoundedBox
          args={[bgW, bgH, 0.02]}
          radius={0.08}
          smoothness={4}
          position={[0, 0, -0.02]}
        >
          <meshBasicMaterial color={bgColor} transparent opacity={0.88} />
        </RoundedBox>

        {/* Tail */}
        <mesh position={[0, -(bgH / 2) - 0.04, -0.02]} rotation={[0, 0, Math.PI]}>
          <coneGeometry args={[0.06, 0.1, 3]} />
          <meshBasicMaterial color={bgColor} transparent opacity={0.88} />
        </mesh>

        {/* Name */}
        <Text
          position={[0, 0.15, 0]}
          fontSize={0.18}
          color={nameColor}
          anchorX="center"
          anchorY="middle"
          font={undefined}
        >
          {name}
        </Text>

        {/* Role or comment */}
        <Text
          position={[0, 0.01, 0]}
          fontSize={0.09}
          color={status === 'working' && currentComment ? commentColor : roleColor}
          anchorX="center"
          anchorY="middle"
          maxWidth={bgW - 0.15}
          font={undefined}
        >
          {displayText}
        </Text>

        {/* Status text with inline dot */}
        <Text
          position={status === 'working' ? [-0.08, -0.14, 0] : [0, -0.14, 0]}
          fontSize={0.09}
          color={STATUS_COLORS[status]}
          anchorX="center"
          anchorY="middle"
          font={undefined}
        >
          {statusLabel}
        </Text>

        {/* Typing dots for working — right after "● Working" text */}
        {status === 'working' && (
          <group ref={typingDotsRef} position={[0.22, -0.14, 0]}>
            {[0, 1, 2].map((i) => (
              <mesh key={i} position={[i * 0.05, 0, 0]}>
                <sphereGeometry args={[0.02, 6, 6]} />
                <meshBasicMaterial color={STATUS_COLORS.working} />
              </mesh>
            ))}
          </group>
        )}
      </Billboard>
    </group>
  )
}
