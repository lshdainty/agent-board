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
import type { Agent, Task } from '@/types'

interface OfficeLayoutProps {
  agents: Agent[]
  tasks: Task[]
  theme: 'light' | 'dark'
}

function getMeetingSeatPosition(
  index: number,
  total: number,
): [number, number, number] {
  const angle = (index / Math.max(total, 1)) * Math.PI * 2 - Math.PI / 2
  const radius = 1.6
  return [
    MEETING_CENTER[0] + Math.cos(angle) * radius,
    0,
    MEETING_CENTER[2] + Math.sin(angle) * radius,
  ]
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

// Whiteboard
const Whiteboard = memo(function Whiteboard({
  position,
  rotation = 0,
}: {
  position: [number, number, number]
  rotation?: number
}) {
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
    </group>
  )
})

export function OfficeLayout({ agents, tasks, theme }: OfficeLayoutProps) {
  const { toggleSelectedAgent } = useSelectedAgent()

  const { workingAgents, idleAgents, offlineAgents } = useMemo(() => {
    const working: Agent[] = []
    const idle: Agent[] = []
    const offline: Agent[] = []
    for (const agent of agents) {
      if (agent.status === 'working') working.push(agent)
      else if (agent.status === 'idle') idle.push(agent)
      else offline.push(agent)
    }
    return { workingAgents: working, idleAgents: idle, offlineAgents: offline }
  }, [agents])

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

      {/* Working agents → at desks */}
      {workingAgents.map((agent, i) => {
        const slotIndex = i % DESK_SLOTS.length
        const deskSlot = DESK_SLOTS[slotIndex]
        // Position agent at the chair (slightly behind desk)
        const agentPos: [number, number, number] = [
          deskSlot.position[0],
          deskSlot.position[1],
          deskSlot.position[2] + 0.55,
        ]
        return (
          <AgentCharacter
            key={agent.id}
            agent={agent}
            targetPosition={agentPos}
            currentTaskTitle={agentTaskMap.get(agent.id)}
            theme={theme}
            onSelect={toggleSelectedAgent}
          />
        )
      })}

      {/* Idle agents → around meeting table */}
      {idleAgents.map((agent, i) => (
        <AgentCharacter
          key={agent.id}
          agent={agent}
          targetPosition={getMeetingSeatPosition(i, idleAgents.length)}
          theme={theme}
          onSelect={toggleSelectedAgent}
        />
      ))}

      {/* Offline agents → at remaining desks, transparent */}
      {offlineAgents.map((agent, i) => {
        const slotIndex = (workingAgents.length + i) % DESK_SLOTS.length
        const deskSlot = DESK_SLOTS[slotIndex]
        const agentPos: [number, number, number] = [
          deskSlot.position[0],
          deskSlot.position[1],
          deskSlot.position[2] + 0.55,
        ]
        return (
          <AgentCharacter
            key={agent.id}
            agent={agent}
            targetPosition={agentPos}
            theme={theme}
            onSelect={toggleSelectedAgent}
          />
        )
      })}
    </group>
  )
}
