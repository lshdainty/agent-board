import { useRef, useMemo, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Agent } from '@/types'
import { AgentNameLabel } from './AgentNameLabel'
import { AgentHair } from './AgentHair'
import { getAgentAppearance } from '@/lib/agentAppearance'
import { findPath, buildOccupancyGrid } from '@/lib/pathfinding'
import { DESK_SLOTS, MEETING_CENTER, ROOM_WIDTH, ROOM_DEPTH, GRID_CELL_SIZE, GRID_ORIGIN } from '@/constants/office'

interface AgentCharacterProps {
  agent: Agent
  targetPosition: [number, number, number]
  currentTaskTitle?: string
  theme?: 'light' | 'dark'
  onSelect?: (agentId: number) => void
}

const STATUS_COLORS: Record<string, string> = {
  working: '#3b82f6',
  idle: '#22c55e',
  offline: '#64748b',
}

// Build occupancy grid once (module-level cache)
const obstacles = DESK_SLOTS.map((slot) => ({
  center: [slot.position[0], slot.position[2]] as [number, number],
  halfSize: [0.6, 0.4] as [number, number],
}))
obstacles.push({ center: [MEETING_CENTER[0], MEETING_CENTER[2]], halfSize: [1.2, 1.2] })
const occupancyGrid = buildOccupancyGrid(ROOM_WIDTH, ROOM_DEPTH, GRID_CELL_SIZE, obstacles)

const MOVE_SPEED = 2 // units per second

export function AgentCharacter({
  agent,
  targetPosition,
  currentTaskTitle,
  theme = 'dark',
  onSelect,
}: AgentCharacterProps) {
  const groupRef = useRef<THREE.Group>(null)
  const labelGroupRef = useRef<THREE.Group>(null)
  const torsoRef = useRef<THREE.Mesh>(null)
  const hoveredRef = useRef(false)
  const targetVec = useMemo(() => new THREE.Vector3(...targetPosition), [targetPosition])

  // Pathfinding waypoints
  const waypointsRef = useRef<[number, number, number][]>([])
  const waypointIndexRef = useRef(0)
  const prevTargetRef = useRef<string>('')

  const appearance = useMemo(() => getAgentAppearance(agent.id), [agent.id])
  const statusColor = STATUS_COLORS[agent.status] || STATUS_COLORS.offline
  const isOffline = agent.status === 'offline'
  const opacity = isOffline ? 0.35 : 1

  const onPointerOver = useCallback((e: THREE.Event) => {
    e.stopPropagation()
    document.body.style.cursor = 'pointer'
    hoveredRef.current = true
    if (labelGroupRef.current) {
      labelGroupRef.current.traverse((child) => {
        if ((child as THREE.Mesh).material) {
          const mat = (child as THREE.Mesh).material as THREE.Material
          mat.opacity = 1
        }
      })
    }
  }, [])

  const onPointerOut = useCallback(() => {
    document.body.style.cursor = 'auto'
    hoveredRef.current = false
    if (labelGroupRef.current) {
      labelGroupRef.current.traverse((child) => {
        if ((child as THREE.Mesh).material) {
          const mat = (child as THREE.Mesh).material as THREE.Material
          mat.opacity = 0.7
        }
      })
    }
  }, [])

  // Pathfinding + smooth movement along waypoints
  useFrame((_, delta) => {
    if (!groupRef.current) return

    // Recompute path when target changes
    const targetKey = targetPosition.join(',')
    if (targetKey !== prevTargetRef.current) {
      prevTargetRef.current = targetKey
      const currentPos: [number, number, number] = [
        groupRef.current.position.x,
        groupRef.current.position.y,
        groupRef.current.position.z,
      ]
      const path = findPath(occupancyGrid, currentPos, targetPosition, GRID_CELL_SIZE, GRID_ORIGIN)
      if (path.length > 0) {
        waypointsRef.current = path
        waypointIndexRef.current = 0
      } else {
        // Fallback: direct lerp if no path found
        waypointsRef.current = [targetPosition]
        waypointIndexRef.current = 0
      }
    }

    const waypoints = waypointsRef.current
    const wpIdx = waypointIndexRef.current

    if (waypoints.length > 0 && wpIdx < waypoints.length) {
      const wp = waypoints[wpIdx]
      const wpVec = new THREE.Vector3(wp[0], wp[1], wp[2])
      const pos = groupRef.current.position
      const dir = wpVec.clone().sub(pos)
      dir.y = 0 // Keep on ground plane
      const dist = dir.length()

      if (dist < 0.05) {
        // Arrived at waypoint, move to next
        waypointIndexRef.current++
      } else {
        // Move toward waypoint at fixed speed
        const step = Math.min(MOVE_SPEED * delta, dist)
        dir.normalize().multiplyScalar(step)
        pos.add(dir)
      }
    } else {
      // Reached final waypoint — apply status animations at target
      groupRef.current.position.lerp(targetVec, Math.min(delta * 3, 0.08))
    }

    const time = Date.now() * 0.001

    // Only apply status animations when at destination
    const atDest = groupRef.current.position.distanceTo(targetVec) < 0.1
    if (atDest) {
      if (agent.status === 'working') {
        const bob = Math.sin(time * 3) * 0.02
        groupRef.current.position.y = targetVec.y + bob
      } else if (agent.status === 'idle') {
        const sway = Math.sin(time * 0.5) * 0.01
        groupRef.current.position.x = targetVec.x + sway
      }
    }
  })

  return (
    <group
      ref={groupRef}
      position={targetPosition}
      onClick={(e) => {
        e.stopPropagation()
        onSelect?.(agent.id)
      }}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
    >
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

      {/* Name label — opacity controlled by hover */}
      <group ref={labelGroupRef}>
        <AgentNameLabel
          name={agent.name}
          role={agent.role}
          status={agent.status}
          taskTitle={currentTaskTitle}
          theme={theme}
        />
      </group>
    </group>
  )
}
