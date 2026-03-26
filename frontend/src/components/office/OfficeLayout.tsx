import { useMemo, memo } from 'react'
import { OfficeFloor } from './OfficeFloor'
import { OfficeWalls } from './OfficeWalls'
import { Desk } from './Desk'
import { DeskPartition } from './DeskPartition'
import { MeetingTable } from './MeetingTable'
import { Bookshelf } from './Bookshelf'
import { CoffeeArea } from './CoffeeArea'
import { AgentCharacter } from './AgentCharacter'
import { DESK_SLOTS, MEETING_CENTER, COFFEE_AREA } from '@/constants/office'
import { useSelectedAgent } from '@/hooks/useSelectedAgent'
import { useAgentPositions } from '@/hooks/useAgentPositions'
import type { Agent, Task } from '@/types'

interface OfficeLayoutProps {
  agents: Agent[]
  tasks: Task[]
  theme: 'light' | 'dark'
}

// Decorative plant
const Plant = memo(function Plant({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Pot */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.1, 0.3, 8]} />
        <meshStandardMaterial color="#5c4033" />
      </mesh>
      {/* Leaves */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <sphereGeometry args={[0.18, 8, 8]} />
        <meshStandardMaterial color="#2d7d46" />
      </mesh>
      <mesh position={[0.08, 0.5, 0.05]} castShadow>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial color="#3a9956" />
      </mesh>
    </group>
  )
})

// Whiteboard with post-it notes
const Whiteboard = memo(function Whiteboard({
  position,
  rotation = 0,
}: {
  position: [number, number, number]
  rotation?: number
}) {
  // Post-it colors
  const postItColors = ['#fef08a', '#fca5a5', '#86efac', '#93c5fd', '#fdba74', '#c4b5fd']

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Board */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <boxGeometry args={[1.6, 1.0, 0.04]} />
        <meshStandardMaterial color="#e8e8e8" />
      </mesh>
      {/* Frame */}
      <mesh position={[0, 1.2, -0.025]}>
        <boxGeometry args={[1.66, 1.06, 0.01]} />
        <meshStandardMaterial color="#4a4a5a" />
      </mesh>
      {/* Stand legs */}
      <mesh position={[-0.5, 0.6, 0]} castShadow>
        <boxGeometry args={[0.03, 1.2, 0.03]} />
        <meshStandardMaterial color="#4a4a5a" />
      </mesh>
      <mesh position={[0.5, 0.6, 0]} castShadow>
        <boxGeometry args={[0.03, 1.2, 0.03]} />
        <meshStandardMaterial color="#4a4a5a" />
      </mesh>

      {/* Post-it notes scattered on the board */}
      {postItColors.map((color, i) => {
        const col = i % 3
        const row = Math.floor(i / 3)
        const x = -0.45 + col * 0.4 + (i * 0.05 - 0.1)
        const y = 1.35 - row * 0.35 + (i * 0.02 - 0.04)
        const rotZ = (i * 0.12 - 0.3) * 0.3
        return (
          <mesh key={i} position={[x, y, 0.025]} rotation={[0, 0, rotZ]}>
            <boxGeometry args={[0.15, 0.15, 0.005]} />
            <meshStandardMaterial color={color} />
          </mesh>
        )
      })}
    </group>
  )
})

// Paper stack on desks
const PaperStack = memo(function PaperStack({
  position,
}: {
  position: [number, number, number]
}) {
  return (
    <group position={position}>
      {/* Stack of papers — 3 slightly offset sheets */}
      <mesh position={[0, 0.005, 0]} castShadow>
        <boxGeometry args={[0.18, 0.01, 0.24]} />
        <meshStandardMaterial color="#f5f5f5" />
      </mesh>
      <mesh position={[0.01, 0.015, -0.005]} castShadow>
        <boxGeometry args={[0.18, 0.01, 0.24]} />
        <meshStandardMaterial color="#ebebeb" />
      </mesh>
      <mesh position={[-0.005, 0.025, 0.003]} castShadow>
        <boxGeometry args={[0.18, 0.01, 0.24]} />
        <meshStandardMaterial color="#e0e0e0" />
      </mesh>
    </group>
  )
})

// Small laptop on desk
const Laptop = memo(function Laptop({
  position,
}: {
  position: [number, number, number]
}) {
  return (
    <group position={position}>
      {/* Base */}
      <mesh position={[0, 0.01, 0]} castShadow>
        <boxGeometry args={[0.28, 0.015, 0.2]} />
        <meshStandardMaterial color="#333340" />
      </mesh>
      {/* Screen (angled up) */}
      <mesh position={[0, 0.1, -0.09]} rotation={[-0.25, 0, 0]} castShadow>
        <boxGeometry args={[0.26, 0.18, 0.008]} />
        <meshStandardMaterial color="#333340" />
      </mesh>
      {/* Screen display */}
      <mesh position={[0, 0.1, -0.085]} rotation={[-0.25, 0, 0]}>
        <boxGeometry args={[0.22, 0.14, 0.002]} />
        <meshStandardMaterial color="#1a73e8" emissive="#1a73e8" emissiveIntensity={0.15} />
      </mesh>
    </group>
  )
})

export function OfficeLayout({ agents, tasks, theme }: OfficeLayoutProps) {
  const { toggleSelectedAgent } = useSelectedAgent()
  const agentPositions = useAgentPositions(agents, tasks)

  // Map agent to their current in_progress task
  const agentTaskMap = useMemo(() => {
    const map = new Map<number, string>()
    for (const task of tasks) {
      if (task.assignee_id && task.status === 'in_progress') {
        map.set(task.assignee_id, task.title)
      }
    }
    return map
  }, [tasks])

  return (
    <group>
      <OfficeFloor theme={theme} />
      <OfficeWalls theme={theme} />

      {/* Desks — all 12 slots */}
      {DESK_SLOTS.map((slot, i) => (
        <Desk key={`desk-${i}`} position={slot.position} rotation={slot.rotation} theme={theme} />
      ))}

      {/* Desk decorations — paper stacks and laptops on alternating desks */}
      {DESK_SLOTS.map((slot, i) => (
        <group key={`desk-decor-${i}`}>
          {/* Paper stack on right side of desk */}
          <PaperStack
            position={[
              slot.position[0] + 0.35,
              slot.position[1] + 0.76,
              slot.position[2] - 0.05,
            ]}
          />
          {/* Laptop on center of desk */}
          <Laptop
            position={[
              slot.position[0] - 0.05,
              slot.position[1] + 0.76,
              slot.position[2] + 0.05,
            ]}
          />
        </group>
      ))}

      {/* Desk partitions between desks in the same row */}
      {[0, 1, 2].map((row) => {
        const rowSlots = DESK_SLOTS.slice(row * 4, row * 4 + 4)
        return rowSlots.slice(0, -1).map((slot, i) => {
          const nextSlot = rowSlots[i + 1]
          const midX = (slot.position[0] + nextSlot.position[0]) / 2
          return (
            <DeskPartition
              key={`partition-${row}-${i}`}
              position={[midX, 0, slot.position[2]]}
              width={0.7}
              theme={theme}
            />
          )
        })
      })}

      {/* Meeting table */}
      <MeetingTable position={MEETING_CENTER} chairCount={6} theme={theme} />

      {/* Bookshelves along back wall */}
      <Bookshelf position={[-8.5, 0, -6.2]} rotation={0} theme={theme} />
      <Bookshelf position={[8.5, 0, -6.2]} rotation={0} theme={theme} />

      {/* Coffee area */}
      <CoffeeArea position={COFFEE_AREA} theme={theme} />

      {/* Decorations */}
      <Plant position={[-9, 0, -6]} />
      <Plant position={[-9, 0, 5.5]} />
      <Plant position={[9, 0, -6]} />
      <Plant position={[9, 0, 5.5]} />
      <Whiteboard position={[4, 0, -5]} rotation={0} />

      {/* All agents — position driven by useAgentPositions hook */}
      {agents.map((agent) => {
        const pos = agentPositions.get(agent.id)
        if (!pos) return null

        return (
          <AgentCharacter
            key={agent.id}
            agent={agent}
            targetPosition={pos.targetPosition}
            currentTaskTitle={agentTaskMap.get(agent.id)}
            theme={theme}
            onSelect={toggleSelectedAgent}
          />
        )
      })}
    </group>
  )
}
