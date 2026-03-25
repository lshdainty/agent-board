import { useMemo } from 'react'
import type { Agent, Task, AgentPosition } from '@/types'
import { DESK_SLOTS, MEETING_CENTER } from '@/constants/office'

export function useAgentPositions(
  agents: Agent[],
  _tasks: Task[],
): Map<number, AgentPosition> {
  return useMemo(() => {
    const positions = new Map<number, AgentPosition>()

    const working: Agent[] = []
    const idle: Agent[] = []
    const offline: Agent[] = []

    for (const agent of agents) {
      switch (agent.status) {
        case 'working':
          working.push(agent)
          break
        case 'idle':
          idle.push(agent)
          break
        case 'offline':
          offline.push(agent)
          break
      }
    }

    let deskIndex = 0

    // Working agents → desk slots (chair position = desk + z offset)
    for (const agent of working) {
      if (deskIndex >= DESK_SLOTS.length) break
      const slot = DESK_SLOTS[deskIndex]
      const target: [number, number, number] = [
        slot.position[0],
        slot.position[1],
        slot.position[2] + 0.55,
      ]
      positions.set(agent.id, {
        current: target,
        target,
        zone: 'desk',
        deskSlotIndex: deskIndex,
      })
      deskIndex++
    }

    // Idle agents → circular arrangement around meeting center
    const meetingRadius = 1.6
    for (let i = 0; i < idle.length; i++) {
      const angle = (i / idle.length) * Math.PI * 2
      const target: [number, number, number] = [
        MEETING_CENTER[0] + Math.cos(angle) * meetingRadius,
        MEETING_CENTER[1],
        MEETING_CENTER[2] + Math.sin(angle) * meetingRadius,
      ]
      positions.set(idle[i].id, {
        current: target,
        target,
        zone: 'meeting',
      })
    }

    // Offline agents → remaining desk slots
    for (const agent of offline) {
      if (deskIndex >= DESK_SLOTS.length) break
      const slot = DESK_SLOTS[deskIndex]
      const target: [number, number, number] = [
        slot.position[0],
        slot.position[1],
        slot.position[2] + 0.55,
      ]
      positions.set(agent.id, {
        current: target,
        target,
        zone: 'desk',
        deskSlotIndex: deskIndex,
      })
      deskIndex++
    }

    return positions
  }, [agents, _tasks])
}
