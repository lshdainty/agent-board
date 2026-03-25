import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Agent } from '@/types'
import { AgentNameLabel } from './AgentNameLabel'
import { AgentHair } from './AgentHair'
import { getAgentAppearance } from '@/lib/agentAppearance'

interface AgentCharacterProps {
  agent: Agent
  targetPosition: [number, number, number]
  currentTaskTitle?: string
  theme?: 'light' | 'dark'
}

const STATUS_COLORS: Record<string, string> = {
  working: '#3b82f6',
  idle: '#22c55e',
  offline: '#64748b',
}

export function AgentCharacter({
  agent,
  targetPosition,
  currentTaskTitle,
  theme = 'dark',
}: AgentCharacterProps) {
  const groupRef = useRef<THREE.Group>(null)
  const torsoRef = useRef<THREE.Mesh>(null)
  const targetVec = useMemo(() => new THREE.Vector3(...targetPosition), [targetPosition])

  const appearance = useMemo(() => getAgentAppearance(agent.id), [agent.id])
  const statusColor = STATUS_COLORS[agent.status] || STATUS_COLORS.offline
  const isOffline = agent.status === 'offline'
  const opacity = isOffline ? 0.35 : 1

  // Smooth position lerp + animations
  useFrame((_, delta) => {
    if (!groupRef.current) return
    groupRef.current.position.lerp(targetVec, Math.min(delta * 3, 0.08))

    const time = Date.now() * 0.001

    if (agent.status === 'working') {
      // Subtle torso bob for working agents
      const bob = Math.sin(time * 3) * 0.02
      groupRef.current.position.y = targetVec.y + bob
    } else if (agent.status === 'idle') {
      // Very slow sway for idle agents
      const sway = Math.sin(time * 0.5) * 0.01
      groupRef.current.position.x = targetVec.x + sway
    }
  })

  return (
    <group ref={groupRef} position={targetPosition}>
      {/* Head */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshStandardMaterial
          color="#e8d5c4"
          transparent={isOffline}
          opacity={opacity}
        />
      </mesh>

      {/* Eyes */}
      <mesh position={[-0.04, 0.72, 0.12]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial color="#000000" transparent={isOffline} opacity={opacity} />
      </mesh>
      <mesh position={[0.04, 0.72, 0.12]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial color="#000000" transparent={isOffline} opacity={opacity} />
      </mesh>

      {/* Hair */}
      <group position={[0, 0.84, 0]}>
        <AgentHair style={appearance.hairStyle} color={appearance.hairColor} opacity={opacity} />
      </group>

      {/* Torso */}
      <mesh ref={torsoRef} position={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[0.3, 0.35, 0.2]} />
        <meshStandardMaterial
          color={appearance.shirtColor}
          transparent={isOffline}
          opacity={opacity}
        />
      </mesh>

      {/* Arms */}
      <mesh position={[-0.22, 0.35, 0]} castShadow>
        <boxGeometry args={[0.08, 0.28, 0.1]} />
        <meshStandardMaterial
          color={appearance.shirtColor}
          transparent={isOffline}
          opacity={opacity}
        />
      </mesh>
      <mesh position={[0.22, 0.35, 0]} castShadow>
        <boxGeometry args={[0.08, 0.28, 0.1]} />
        <meshStandardMaterial
          color={appearance.shirtColor}
          transparent={isOffline}
          opacity={opacity}
        />
      </mesh>

      {/* Hands */}
      <mesh position={[-0.22, 0.18, 0]} castShadow>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#e8d5c4" transparent={isOffline} opacity={opacity} />
      </mesh>
      <mesh position={[0.22, 0.18, 0]} castShadow>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#e8d5c4" transparent={isOffline} opacity={opacity} />
      </mesh>

      {/* Legs */}
      <mesh position={[-0.07, 0.1, 0]} castShadow>
        <boxGeometry args={[0.1, 0.22, 0.12]} />
        <meshStandardMaterial
          color={appearance.pantsColor}
          transparent={isOffline}
          opacity={opacity}
        />
      </mesh>
      <mesh position={[0.07, 0.1, 0]} castShadow>
        <boxGeometry args={[0.1, 0.22, 0.12]} />
        <meshStandardMaterial
          color={appearance.pantsColor}
          transparent={isOffline}
          opacity={opacity}
        />
      </mesh>

      {/* Shoes */}
      <mesh position={[-0.07, 0.02, 0.01]} castShadow>
        <boxGeometry args={[0.1, 0.04, 0.14]} />
        <meshStandardMaterial color="#1a1a2e" transparent={isOffline} opacity={opacity} />
      </mesh>
      <mesh position={[0.07, 0.02, 0.01]} castShadow>
        <boxGeometry args={[0.1, 0.04, 0.14]} />
        <meshStandardMaterial color="#1a1a2e" transparent={isOffline} opacity={opacity} />
      </mesh>

      {/* Status indicator */}
      <mesh position={[0, 0.98, 0]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial
          color={statusColor}
          emissive={statusColor}
          emissiveIntensity={0.6}
          transparent={isOffline}
          opacity={opacity}
        />
      </mesh>

      {/* Name label */}
      <AgentNameLabel
        name={agent.name}
        role={agent.role}
        status={agent.status}
        taskTitle={currentTaskTitle}
        theme={theme}
      />
    </group>
  )
}
