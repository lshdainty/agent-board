import { useRef, useMemo } from 'react'
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

export function AgentNameLabel({ name, role, status, taskTitle, currentComment, theme }: AgentNameLabelProps) {
  const { settings } = useSettings()

  if (!settings.nameLabels) return null

  const isDark = theme === 'dark'
  const textColor = isDark ? '#e2e8f0' : '#0f172a'
  const subColor = isDark ? '#94a3b8' : '#64748b'

  const groupRef = useRef<THREE.Group>(null)
  const dotRef = useRef<THREE.Mesh>(null)
  const typingDotsRef = useRef<THREE.Group>(null)
  const pillRef = useRef<THREE.Mesh>(null)
  const prevStatusRef = useRef<AgentStatus>(status)
  const fadeRef = useRef(1)
  const fadeTargetRef = useRef(1)

  // Detect status change for fade
  if (prevStatusRef.current !== status) {
    fadeRef.current = 0
    fadeTargetRef.current = 1
    prevStatusRef.current = status
  }

  // Status emoji text
  const statusEmoji = useMemo(() => {
    if (status === 'idle') return 'coffee'
    if (status === 'offline') return 'zzz'
    return ''
  }, [status])

  useFrame((_, delta) => {
    // Fade animation
    if (fadeRef.current < fadeTargetRef.current) {
      fadeRef.current = Math.min(fadeRef.current + delta * 3, fadeTargetRef.current)
    }

    // Apply fade to the whole group
    if (groupRef.current) {
      groupRef.current.traverse((child) => {
        if ((child as THREE.Mesh).material && !(child as THREE.Mesh).material.length) {
          const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial
          if (mat.opacity !== undefined) {
            mat.transparent = true
            mat.opacity = fadeRef.current
          }
        }
      })
    }

    const time = Date.now() * 0.001

    // Working status: pulsing dot
    if (dotRef.current) {
      if (status === 'working') {
        const pulse = (Math.sin(time * 4) + 1) / 2
        dotRef.current.scale.setScalar(0.8 + pulse * 0.5)
      } else {
        dotRef.current.scale.setScalar(1)
      }
    }

    // Typing dots animation (3 dots blinking sequentially)
    if (typingDotsRef.current && status === 'working') {
      typingDotsRef.current.children.forEach((dot, i) => {
        const phase = (time * 3 + i * 0.8) % 3
        const bounce = phase < 1 ? Math.sin(phase * Math.PI) * 0.03 : 0
        dot.position.y = bounce
        const mat = (dot as THREE.Mesh).material as THREE.MeshBasicMaterial
        if (mat) {
          mat.opacity = phase < 1 ? 0.5 + Math.sin(phase * Math.PI) * 0.5 : 0.4
          mat.transparent = true
        }
      })
    }

    // Task pill subtle glow
    if (pillRef.current) {
      const mat = pillRef.current.material as THREE.MeshBasicMaterial
      if (mat) {
        const glow = (Math.sin(time * 2) + 1) / 2
        mat.opacity = 0.15 + glow * 0.1
        mat.transparent = true
      }
    }
  })

  return (
    <group position={[0, 1.8, 0]} ref={groupRef}>
      <Billboard follow lockX={false} lockY={false} lockZ={false}>
        {/* Background — rounded box */}
        {(() => {
          const displayText = status === 'working' && currentComment ? currentComment : role
          const bgW = Math.max(name.length * 0.12 + 0.15, Math.min(displayText.length * 0.065 + 0.15, 2.0), 0.6)
          return (
            <RoundedBox
              args={[bgW, 0.55, 0.02]}
              radius={0.06}
              smoothness={4}
              position={[0, 0.02, -0.01]}
            >
              <meshBasicMaterial
                color={isDark ? '#1e293b' : '#ffffff'}
                transparent
                opacity={isDark ? 0.92 : 0.95}
              />
            </RoundedBox>
          )
        })()}

        {/* Name — large and bold */}
        <Text
          position={[0, 0.15, 0]}
          fontSize={0.16}
          color={textColor}
          anchorX="center"
          anchorY="middle"
          font={undefined}
        >
          {name}
        </Text>

        {/* Role or current comment */}
        <Text
          position={[0, 0, 0]}
          fontSize={0.08}
          color={status === 'working' && currentComment ? (isDark ? '#93c5fd' : '#2563eb') : subColor}
          anchorX="center"
          anchorY="middle"
          maxWidth={1.8}
          font={undefined}
        >
          {status === 'working' && currentComment ? currentComment : role}
        </Text>

        {/* Status: dot + label — clearly visible */}
        <mesh ref={dotRef} position={[-0.14, -0.14, 0]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshBasicMaterial color={STATUS_COLORS[status]} />
        </mesh>
        <Text
          position={[0.05, -0.14, 0]}
          fontSize={0.08}
          color={STATUS_COLORS[status]}
          anchorX="center"
          anchorY="middle"
          font={undefined}
        >
          {status === 'working' ? 'Working' : status === 'idle' ? 'Idle' : 'Offline'}
        </Text>

        {/* Working: typing dots */}
        {status === 'working' && (
          <group ref={typingDotsRef} position={[0.28, -0.14, 0]}>
            {[0, 1, 2].map((i) => (
              <mesh key={i} position={[i * 0.045, 0, 0]}>
                <sphereGeometry args={[0.018, 6, 6]} />
                <meshBasicMaterial color={STATUS_COLORS.working} transparent opacity={0.6} />
              </mesh>
            ))}
          </group>
        )}

        {/* Task title */}
        {status === 'working' && taskTitle && (
          <group position={[0, -0.24, 0]}>
            <mesh ref={pillRef} position={[0, 0, -0.01]}>
              <planeGeometry args={[Math.min(taskTitle.length * 0.05 + 0.2, 1.4), 0.12]} />
              <meshBasicMaterial
                color={isDark ? '#1e3a5f' : '#dbeafe'}
                transparent
                opacity={0.4}
              />
            </mesh>
            <Text
              fontSize={0.06}
              color={isDark ? '#93c5fd' : '#2563eb'}
              anchorX="center"
              anchorY="middle"
              maxWidth={1.4}
              font={undefined}
            >
              {taskTitle}
            </Text>
          </group>
        )}
      </Billboard>
    </group>
  )
}
