import { useRef, useMemo, useCallback, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Agent } from '@/types'
import { AgentNameLabel } from './AgentNameLabel'
import { AgentHair } from './AgentHair'
import { getAgentAppearance } from '@/lib/agentAppearance'
import { findPath, buildOccupancyGrid } from '@/lib/pathfinding'
import {
  DESK_SLOTS,
  MEETING_CENTER,
  ROOM_WIDTH,
  ROOM_DEPTH,
  GRID_CELL_SIZE,
  GRID_ORIGIN,
} from '@/constants/office'
import { useCharacterAnimation, type AnimState } from './useCharacterAnimation'

interface AgentCharacterProps {
  agent: Agent
  targetPosition: [number, number, number]
  currentTaskTitle?: string
  theme?: 'light' | 'dark'
  onSelect?: (agentId: number) => void
}

const STATUS_COLORS: Record<string, string> = {
  working: '#f59e0b',
  idle: '#22c55e',
  offline: '#64748b',
}

// Build occupancy grid once (module-level cache)
const obstacles: { center: [number, number]; halfSize: [number, number] }[] = []

// Desks
DESK_SLOTS.forEach((slot) => {
  obstacles.push({
    center: [slot.position[0], slot.position[2]],
    halfSize: [0.8, 0.5],
  })
})

// Meeting table
obstacles.push({
  center: [MEETING_CENTER[0], MEETING_CENTER[2]],
  halfSize: [1.2, 1.2],
})

// Side partitions (between desks in same row, direction="z")
for (let row = 0; row < 3; row++) {
  const rowSlots = DESK_SLOTS.slice(row * 4, row * 4 + 4)
  for (let i = 0; i < rowSlots.length - 1; i++) {
    const midX = (rowSlots[i].position[0] + rowSlots[i + 1].position[0]) / 2
    obstacles.push({
      center: [midX, rowSlots[i].position[2]],
      halfSize: [0.05, 0.7],  // thin wall along Z
    })
  }
}

// Back partitions (between rows, direction="x")
for (let row = 0; row < 2; row++) {
  const currentRow = DESK_SLOTS.slice(row * 4, row * 4 + 4)
  const nextRow = DESK_SLOTS.slice((row + 1) * 4, (row + 1) * 4 + 4)
  const midZ = (currentRow[0].position[2] + nextRow[0].position[2]) / 2
  for (let i = 0; i < currentRow.length; i++) {
    obstacles.push({
      center: [currentRow[i].position[0], midZ],
      halfSize: [0.7, 0.05],  // thin wall along X
    })
  }
}

const occupancyGrid = buildOccupancyGrid(
  ROOM_WIDTH,
  ROOM_DEPTH,
  GRID_CELL_SIZE,
  obstacles,
)

const MOVE_SPEED = 0.8 // units per second
const ARRIVE_THRESHOLD = 0.08
const TRANSITION_DURATION = 0.5 // seconds for sit/stand transitions

// Determine what zone an agent is in based on status
function getTargetAnimState(
  agentStatus: string,
  isAtDesk: boolean,
): AnimState {
  switch (agentStatus) {
    case 'working':
      return isAtDesk ? 'sitting_typing' : 'standing_idle'
    case 'idle':
      return 'standing_idle'
    case 'offline':
      return isAtDesk ? 'sitting_idle' : 'standing_idle'
    default:
      return 'standing_idle'
  }
}

// Check if a target position corresponds to a desk seat
function isTargetAtDesk(target: [number, number, number]): boolean {
  for (const slot of DESK_SLOTS) {
    const dx = Math.abs(target[0] - slot.position[0])
    const dz = Math.abs(target[2] - (slot.position[2] + 0.55))
    if (dx < 0.3 && dz < 0.3) return true
  }
  return false
}

export function AgentCharacter({
  agent,
  targetPosition,
  currentTaskTitle,
  theme = 'dark',
  onSelect,
}: AgentCharacterProps) {
  const groupRef = useRef<THREE.Group>(null)
  const labelGroupRef = useRef<THREE.Group>(null)
  const hoveredRef = useRef(false)

  // Animation system
  const { refs, animStateRef, animate } = useCharacterAnimation()

  // Pathfinding state
  const waypointsRef = useRef<[number, number, number][]>([])
  const waypointIndexRef = useRef(0)
  const prevTargetRef = useRef<string>('')
  const isMovingRef = useRef(false)
  const initializedRef = useRef(false)

  // Transition timer for sit/stand
  const transitionTimerRef = useRef(0)

  // Previous status for detecting status changes
  const prevStatusRef = useRef(agent.status)

  const appearance = useMemo(() => getAgentAppearance(agent.id), [agent.id])
  const statusColor = STATUS_COLORS[agent.status] || STATUS_COLORS.offline
  const isOffline = agent.status === 'offline'
  const opacity = isOffline ? 0.35 : 1
  const atDesk = useMemo(() => isTargetAtDesk(targetPosition), [targetPosition])

  // Set initial position only on first mount — never via JSX position prop
  // which would reset position on every re-render and break walk animation
  useEffect(() => {
    if (groupRef.current && !initializedRef.current) {
      groupRef.current.position.set(targetPosition[0], targetPosition[1], targetPosition[2])
      prevTargetRef.current = targetPosition.join(',')
      initializedRef.current = true
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const onPointerOver = useCallback((e: { stopPropagation: () => void }) => {
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

  useFrame((state, delta) => {
    if (!groupRef.current) return

    // Clamp delta to avoid jumps on tab switch
    const dt = Math.min(delta, 0.1)
    const time = state.clock.getElapsedTime()

    // Always request next frame for continuous animation
    state.invalidate()

    // ------ STATUS CHANGE DETECTION ------
    if (prevStatusRef.current !== agent.status) {
      prevStatusRef.current = agent.status
      // Status changed — will be handled by target position change below
    }

    // ------ PATHFINDING: recompute when target changes ------
    const targetKey = targetPosition.join(',')
    if (targetKey !== prevTargetRef.current) {
      prevTargetRef.current = targetKey

      // If currently sitting, stand up first before walking
      const currentAnim = animStateRef.current
      if (
        currentAnim === 'sitting_typing' ||
        currentAnim === 'sitting_idle'
      ) {
        animStateRef.current = 'standing_up'
        transitionTimerRef.current = 0
      }

      const currentPos: [number, number, number] = [
        groupRef.current.position.x,
        0,
        groupRef.current.position.z,
      ]

      const dist = Math.hypot(
        targetPosition[0] - currentPos[0],
        targetPosition[2] - currentPos[2],
      )

      // Only pathfind if distance is meaningful
      if (dist > 0.2) {
        const path = findPath(
          occupancyGrid,
          currentPos,
          targetPosition,
          GRID_CELL_SIZE,
          GRID_ORIGIN,
        )
        if (path.length > 0) {
          waypointsRef.current = path
        } else {
          waypointsRef.current = [targetPosition]
        }
        waypointIndexRef.current = 0
        isMovingRef.current = true
      } else {
        waypointsRef.current = [targetPosition]
        waypointIndexRef.current = 0
        isMovingRef.current = false
      }
    }

    // ------ MOVEMENT ------
    const pos = groupRef.current.position
    const waypoints = waypointsRef.current
    const wpIdx = waypointIndexRef.current

    // Raise group when sitting so character sits ON the chair seat (top = 0.40)
    const isSitting = animStateRef.current === 'sitting_typing' ||
      animStateRef.current === 'sitting_idle' ||
      animStateRef.current === 'sitting_down'
    const targetY = isSitting ? 0.05 : 0
    pos.y = THREE.MathUtils.lerp(pos.y, targetY, Math.min(dt * 6, 0.2))

    // Handle standing_up transition before walking
    if (animStateRef.current === 'standing_up') {
      transitionTimerRef.current += dt
      if (transitionTimerRef.current >= TRANSITION_DURATION) {
        // Transition complete — start walking if we need to move
        if (isMovingRef.current) {
          animStateRef.current = 'walking'
        } else {
          animStateRef.current = getTargetAnimState(agent.status, atDesk)
        }
        transitionTimerRef.current = 0
      }
      animate('standing_up', time, dt)
      return
    }

    // Handle sitting_down transition
    if (animStateRef.current === 'sitting_down') {
      transitionTimerRef.current += dt
      if (transitionTimerRef.current >= TRANSITION_DURATION) {
        // Transition complete — go to final seated state
        animStateRef.current = getTargetAnimState(agent.status, atDesk)
        transitionTimerRef.current = 0
      }
      animate('sitting_down', time, dt)
      return
    }

    if (isMovingRef.current && waypoints.length > 0 && wpIdx < waypoints.length) {
      const wp = waypoints[wpIdx]
      const wpVec = new THREE.Vector3(wp[0], 0, wp[2])
      const dir = wpVec.clone().sub(new THREE.Vector3(pos.x, 0, pos.z))
      const dist = dir.length()

      if (dist < ARRIVE_THRESHOLD) {
        // Arrived at waypoint
        waypointIndexRef.current++
        if (waypointIndexRef.current >= waypoints.length) {
          // Arrived at final destination
          isMovingRef.current = false
          pos.set(wp[0], 0, wp[2])

          // Start sitting down if destination is a desk
          if (atDesk) {
            animStateRef.current = 'sitting_down'
            transitionTimerRef.current = 0
          } else {
            animStateRef.current = getTargetAnimState(agent.status, false)
          }
        }
      } else {
        // Move toward waypoint
        const step = Math.min(MOVE_SPEED * dt, dist)
        dir.normalize().multiplyScalar(step)
        pos.x += dir.x
        pos.z += dir.z
        pos.y = 0 // stay on ground while walking

        // Rotate character toward movement direction
        const targetAngle = Math.atan2(dir.x, dir.z)
        groupRef.current.rotation.y = THREE.MathUtils.lerp(
          groupRef.current.rotation.y,
          targetAngle,
          Math.min(dt * 8, 0.3),
        )

        animStateRef.current = 'walking'
      }

      animate(animStateRef.current, time, dt)
    } else {
      // Not moving — at destination
      isMovingRef.current = false

      // Snap to target xz position smoothly (y handled by chair height logic)
      const dx = targetPosition[0] - pos.x
      const dz = targetPosition[2] - pos.z
      if (Math.abs(dx) > 0.01 || Math.abs(dz) > 0.01) {
        pos.x = THREE.MathUtils.lerp(pos.x, targetPosition[0], Math.min(dt * 4, 0.1))
        pos.z = THREE.MathUtils.lerp(pos.z, targetPosition[2], Math.min(dt * 4, 0.1))
      }

      // Face forward (reset rotation) when idle at destination
      // eslint-disable-next-line -- ref is mutated in multiple branches
      const currentAnim = animStateRef.current as AnimState
      if (
        currentAnim !== ('sitting_down' as AnimState) &&
        currentAnim !== ('standing_up' as AnimState)
      ) {
        // Determine target animation
        const targetAnim = getTargetAnimState(agent.status, atDesk)
        if (
          currentAnim === 'walking' &&
          atDesk &&
          (targetAnim === 'sitting_typing' || targetAnim === 'sitting_idle')
        ) {
          // Need to sit down first
          animStateRef.current = 'sitting_down'
          transitionTimerRef.current = 0
        } else if (currentAnim !== targetAnim) {
          animStateRef.current = targetAnim
        }

        // Face toward monitor (-z direction) when at desk
        if (atDesk) {
          groupRef.current.rotation.y = THREE.MathUtils.lerp(
            groupRef.current.rotation.y,
            Math.PI,
            Math.min(dt * 3, 0.1),
          )
        } else {
          // Slowly return to neutral rotation
          groupRef.current.rotation.y = THREE.MathUtils.lerp(
            groupRef.current.rotation.y,
            0,
            Math.min(dt * 1.5, 0.05),
          )
        }
      }

      animate(animStateRef.current, time, dt)
    }
  })

  return (
    <group
      ref={groupRef}
      onClick={(e) => {
        e.stopPropagation()
        onSelect?.(agent.id)
      }}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
    >
      {/* Head */}
      <mesh ref={refs.head} position={[0, 0.7, 0]} castShadow>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshStandardMaterial
          color="#e8d5c4"
          transparent={isOffline}
          opacity={opacity}
        />
      </mesh>

      {/* Eyes */}
      <mesh ref={refs.eyeL} position={[-0.04, 0.72, 0.12]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial
          color="#000000"
          transparent={isOffline}
          opacity={opacity}
        />
      </mesh>
      <mesh ref={refs.eyeR} position={[0.04, 0.72, 0.12]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial
          color="#000000"
          transparent={isOffline}
          opacity={opacity}
        />
      </mesh>

      {/* Hair */}
      <group ref={refs.hairGroup} position={[0, 0.84, 0]}>
        <AgentHair
          style={appearance.hairStyle}
          color={appearance.hairColor}
          opacity={opacity}
        />
      </group>

      {/* Torso */}
      <mesh ref={refs.torso} position={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[0.3, 0.35, 0.2]} />
        <meshStandardMaterial
          color={appearance.shirtColor}
          transparent={isOffline}
          opacity={opacity}
        />
      </mesh>

      {/* Left Arm */}
      <mesh ref={refs.armL} position={[-0.22, 0.35, 0]} castShadow>
        <boxGeometry args={[0.08, 0.28, 0.1]} />
        <meshStandardMaterial
          color={appearance.shirtColor}
          transparent={isOffline}
          opacity={opacity}
        />
      </mesh>
      {/* Right Arm */}
      <mesh ref={refs.armR} position={[0.22, 0.35, 0]} castShadow>
        <boxGeometry args={[0.08, 0.28, 0.1]} />
        <meshStandardMaterial
          color={appearance.shirtColor}
          transparent={isOffline}
          opacity={opacity}
        />
      </mesh>

      {/* Left Hand */}
      <mesh ref={refs.handL} position={[-0.22, 0.18, 0]} castShadow>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial
          color="#e8d5c4"
          transparent={isOffline}
          opacity={opacity}
        />
      </mesh>
      {/* Right Hand */}
      <mesh ref={refs.handR} position={[0.22, 0.18, 0]} castShadow>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial
          color="#e8d5c4"
          transparent={isOffline}
          opacity={opacity}
        />
      </mesh>

      {/* Left Leg */}
      <mesh ref={refs.legL} position={[-0.07, 0.1, 0]} castShadow>
        <boxGeometry args={[0.1, 0.22, 0.12]} />
        <meshStandardMaterial
          color={appearance.pantsColor}
          transparent={isOffline}
          opacity={opacity}
        />
      </mesh>
      {/* Right Leg */}
      <mesh ref={refs.legR} position={[0.07, 0.1, 0]} castShadow>
        <boxGeometry args={[0.1, 0.22, 0.12]} />
        <meshStandardMaterial
          color={appearance.pantsColor}
          transparent={isOffline}
          opacity={opacity}
        />
      </mesh>

      {/* Left Shoe */}
      <mesh ref={refs.shoeL} position={[-0.07, 0.02, 0.01]} castShadow>
        <boxGeometry args={[0.1, 0.04, 0.14]} />
        <meshStandardMaterial
          color="#1a1a2e"
          transparent={isOffline}
          opacity={opacity}
        />
      </mesh>
      {/* Right Shoe */}
      <mesh ref={refs.shoeR} position={[0.07, 0.02, 0.01]} castShadow>
        <boxGeometry args={[0.1, 0.04, 0.14]} />
        <meshStandardMaterial
          color="#1a1a2e"
          transparent={isOffline}
          opacity={opacity}
        />
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
      <group ref={labelGroupRef}>
        <AgentNameLabel
          name={agent.name}
          role={agent.role}
          status={agent.status}
          taskTitle={currentTaskTitle}
          currentComment={agent.current_comment}
          theme={theme}
        />
      </group>
    </group>
  )
}
