import { useMemo } from 'react'
import { SpeechBubble } from './SpeechBubble'
import { StatusEffect } from './StatusEffect'
import type { Agent } from '@/types'
import { DESK_SLOTS, MEETING_CENTER, COFFEE_AREA } from '@/constants/office'

interface AgentEffectsLayerProps {
  agents: Agent[]
}

/**
 * Renders SpeechBubble and StatusEffect for each agent.
 * Computes approximate agent positions using the same logic as OfficeLayout,
 * so we can overlay effects without modifying OfficeLayout or AgentCharacter.
 */
export function AgentEffectsLayer({ agents }: AgentEffectsLayerProps) {
  const agentPositions = useMemo(() => {
    const positions = new Map<number, [number, number, number]>()

    const working: Agent[] = []
    const idle: Agent[] = []
    const offline: Agent[] = []

    for (const agent of agents) {
      if (agent.status === 'working') working.push(agent)
      else if (agent.status === 'idle') idle.push(agent)
      else offline.push(agent)
    }

    // Working agents at desks
    working.forEach((agent, i) => {
      if (i < DESK_SLOTS.length) {
        const slot = DESK_SLOTS[i]
        positions.set(agent.id, [slot.position[0], slot.position[1], slot.position[2] + 0.55])
      } else {
        const overflowIndex = i - DESK_SLOTS.length
        const angle = (overflowIndex / Math.max(working.length - DESK_SLOTS.length, 1)) * Math.PI * 2 - Math.PI / 2
        const radius = 1.4
        positions.set(agent.id, [
          COFFEE_AREA[0] + Math.cos(angle) * radius,
          0,
          COFFEE_AREA[2] + Math.sin(angle) * radius,
        ])
      }
    })

    // Idle agents at meeting table
    idle.forEach((agent, i) => {
      const angle = (i / Math.max(idle.length, 1)) * Math.PI * 2 - Math.PI / 2
      const radius = 1.6
      positions.set(agent.id, [
        MEETING_CENTER[0] + Math.cos(angle) * radius,
        0,
        MEETING_CENTER[2] + Math.sin(angle) * radius,
      ])
    })

    // Offline at remaining desks
    offline.forEach((agent, i) => {
      const slotIndex = (working.length + i) % DESK_SLOTS.length
      const slot = DESK_SLOTS[slotIndex]
      positions.set(agent.id, [slot.position[0], slot.position[1], slot.position[2] + 0.55])
    })

    return positions
  }, [agents])

  return (
    <group>
      {agents.map((agent) => {
        const pos = agentPositions.get(agent.id)
        if (!pos) return null
        return (
          <group key={agent.id} position={pos}>
            <SpeechBubble status={agent.status} position={[0, 1.6, 0]} />
            <StatusEffect status={agent.status} position={[0, 0, 0]} />
          </group>
        )
      })}
    </group>
  )
}
