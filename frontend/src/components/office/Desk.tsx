import { memo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { AgentStatus } from '@/types'

interface DeskProps {
  position: [number, number, number]
  rotation?: number
  theme: 'light' | 'dark'
  agentStatus?: AgentStatus
  hideChair?: boolean
}

export const Desk = memo(function Desk({ position, rotation = 0, theme, agentStatus, hideChair = false }: DeskProps) {
  const isDark = theme === 'dark'
  const surface = isDark ? '#3a3f55' : '#c8a882'
  const leg = isDark ? '#2a2f45' : '#9e8268'
  const chair = isDark ? '#2d3248' : '#6b7280'
  const chairBase = isDark ? '#1e2235' : '#4b5563'
  const monitorBezel = isDark ? '#1a1e30' : '#374151'
  const keyboard = isDark ? '#2d3248' : '#9ca3af'

  const monitorRef = useRef<THREE.Mesh>(null)

  // Monitor screen color and emissive based on agent status
  const monitorConfig = (() => {
    if (agentStatus === 'working') {
      return {
        color: isDark ? '#0a1628' : '#0f172a',
        emissive: isDark ? '#3b82f6' : '#60a5fa',
        baseIntensity: isDark ? 0.7 : 0.4,
      }
    }
    if (agentStatus === 'idle') {
      return {
        color: isDark ? '#111827' : '#1e293b',
        emissive: isDark ? '#1e3a5f' : '#334155',
        baseIntensity: isDark ? 0.15 : 0.08,
      }
    }
    // Default / offline — screen off
    return {
      color: isDark ? '#1a2040' : '#1e293b',
      emissive: isDark ? '#2255cc' : '#3b82f6',
      baseIntensity: isDark ? 0.4 : 0.2,
    }
  })()

  useFrame(() => {
    if (!monitorRef.current) return
    const mat = monitorRef.current.material as THREE.MeshStandardMaterial
    if (!mat) return

    const time = Date.now() * 0.001

    if (agentStatus === 'working') {
      // Active coding flicker
      const flicker = Math.sin(time * 6) * 0.08 + Math.sin(time * 13) * 0.04
      mat.emissiveIntensity = monitorConfig.baseIntensity + flicker

      // Subtle color shift between blue tones (simulating code scrolling)
      const r = 0.23 + Math.sin(time * 2) * 0.05
      const g = 0.51 + Math.sin(time * 3 + 1) * 0.05
      const b = 0.96
      mat.emissive.setRGB(r, g, b)
    } else if (agentStatus === 'idle') {
      // Dim screensaver-like slow pulse
      const pulse = Math.sin(time * 0.8) * 0.05
      mat.emissiveIntensity = monitorConfig.baseIntensity + pulse
    } else if (agentStatus === 'offline') {
      // Screen off, no emission
      mat.emissiveIntensity = 0.02
      mat.emissive.setHex(0x111111)
    } else {
      // No agent assigned — default gentle glow
      const gentle = Math.sin(time * 1.5) * 0.03
      mat.emissiveIntensity = monitorConfig.baseIntensity + gentle
    }
  })

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Desktop surface */}
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 0.05, 0.7]} />
        <meshStandardMaterial color={surface} />
      </mesh>

      {/* Legs */}
      {[
        [-0.62, 0.275, -0.28],
        [-0.62, 0.275, 0.28],
        [0.62, 0.275, -0.28],
        [0.62, 0.275, 0.28],
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} castShadow>
          <boxGeometry args={[0.04, 0.55, 0.04]} />
          <meshStandardMaterial color={leg} />
        </mesh>
      ))}

      {/* Monitor stand */}
      <mesh position={[0, 0.65, -0.2]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 0.15, 8]} />
        <meshStandardMaterial color={leg} />
      </mesh>

      {/* Monitor screen */}
      <mesh ref={monitorRef} position={[0, 0.85, -0.22]} castShadow>
        <boxGeometry args={[0.55, 0.38, 0.03]} />
        <meshStandardMaterial
          color={monitorConfig.color}
          emissive={monitorConfig.emissive}
          emissiveIntensity={monitorConfig.baseIntensity}
        />
      </mesh>

      {/* Monitor bezel */}
      <mesh position={[0, 0.85, -0.215]} castShadow>
        <boxGeometry args={[0.58, 0.41, 0.01]} />
        <meshStandardMaterial color={monitorBezel} />
      </mesh>

      {/* Keyboard */}
      <mesh position={[0, 0.58, 0.1]} castShadow>
        <boxGeometry args={[0.35, 0.02, 0.12]} />
        <meshStandardMaterial color={keyboard} />
      </mesh>

      {/* Chair — hidden when an agent is seated to prevent mesh clipping */}
      {!hideChair && (
        <group position={[0, 0, 0.55]}>
          <mesh position={[0, 0.38, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.18, 0.04, 12]} />
            <meshStandardMaterial color={chair} />
          </mesh>
          <mesh position={[0, 0.55, -0.14]} castShadow>
            <boxGeometry args={[0.3, 0.3, 0.03]} />
            <meshStandardMaterial color={chair} />
          </mesh>
          <mesh position={[0, 0.2, 0]} castShadow>
            <cylinderGeometry args={[0.03, 0.03, 0.36, 6]} />
            <meshStandardMaterial color={chairBase} />
          </mesh>
          <mesh position={[0, 0.03, 0]} castShadow>
            <cylinderGeometry args={[0.15, 0.15, 0.02, 12]} />
            <meshStandardMaterial color={chairBase} />
          </mesh>
        </group>
      )}
    </group>
  )
})
