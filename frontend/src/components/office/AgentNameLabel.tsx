import { useRef, useMemo } from 'react'
import { Text, Billboard } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
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
    <group position={[0, 1.6, 0]} ref={groupRef}>
      <Billboard follow lockX={false} lockY={false} lockZ={false}>
        {/* Name */}
        <Text
          position={[0, 0.15, 0]}
          fontSize={0.16}
          color={textColor}
          anchorX="center"
          anchorY="middle"
          font={undefined}
          fontWeight="bold"
        >
          {name}
        </Text>

        {/* Role + Status dot */}
        <Text
          position={[0.04, -0.05, 0]}
          fontSize={0.08}
          color={subColor}
          anchorX="center"
          anchorY="middle"
          font={undefined}
        >
          {role}
        </Text>

        {/* Status dot */}
        <mesh ref={dotRef} position={[-0.35, -0.05, 0]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshBasicMaterial color={STATUS_COLORS[status]} />
        </mesh>

        {/* Working: typing dots animation */}
        {status === 'working' && (
          <group ref={typingDotsRef} position={[0.30, -0.05, 0]}>
            {[0, 1, 2].map((i) => (
              <mesh key={i} position={[i * 0.05, 0, 0]}>
                <sphereGeometry args={[0.02, 6, 6]} />
                <meshBasicMaterial color={STATUS_COLORS.working} transparent opacity={0.5} />
              </mesh>
            ))}
          </group>
        )}

        {/* Idle/offline: emoji indicator */}
        {(status === 'idle' || status === 'offline') && (
          <Text
            position={[0.30, -0.05, 0]}
            fontSize={0.08}
            color={subColor}
            anchorX="center"
            anchorY="middle"
            font={undefined}
          >
            {statusEmoji === 'coffee' ? 'coffee' : 'zzz'}
          </Text>
        )}

        {/* Task title with pill background */}
        {status === 'working' && taskTitle && (
          <group position={[0, -0.18, 0]}>
            <mesh ref={pillRef} position={[0, 0, -0.001]}>
              <planeGeometry args={[Math.min(taskTitle.length * 0.06 + 0.2, 2.0), 0.14]} />
              <meshBasicMaterial
                color={isDark ? '#1e3a5f' : '#dbeafe'}
                transparent
                opacity={0.3}
              />
            </mesh>
            <Text
              fontSize={0.08}
              color={isDark ? '#93c5fd' : '#2563eb'}
              anchorX="center"
              anchorY="middle"
              maxWidth={2.0}
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
