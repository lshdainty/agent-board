import { useRef, useMemo, useCallback } from 'react'
import type { Agent, Task, AgentPosition } from '@/types'
import { DESK_SLOTS, MEETING_CENTER, COFFEE_SEATS, BOOKSHELF_POSITIONS } from '@/constants/office'

/**
 * Deterministic desk index for an agent. Once assigned, never changes.
 * Uses agent.id modulo desk count so it's stable across renders.
 */
function getDeskIndex(agentId: number): number {
  return agentId % DESK_SLOTS.length
}

/**
 * Chair position for a given desk slot (offset from desk toward the agent's seat).
 */
function deskChairPosition(slotIndex: number): [number, number, number] {
  const slot = DESK_SLOTS[slotIndex]
  return [slot.position[0], slot.position[1], slot.position[2] + 0.55]
}

/**
 * Pick a random idle destination: meeting table seat, coffee seat, or bookshelf.
 * Uses a seeded pseudo-random based on agentId + changeCount so each agent
 * gets a stable-but-varied destination that changes when status changes.
 */
function pickIdleDestination(
  agentId: number,
  idleIndex: number,
  totalIdle: number,
  changeCount: number,
): { position: [number, number, number]; zone: 'meeting' | 'coffee' | 'bookshelf' } {
  // Simple hash from agentId + changeCount
  const seed = (agentId * 7919 + changeCount * 1301) % 100

  if (seed < 50) {
    // Meeting table — circular arrangement
    const angle = (idleIndex / Math.max(totalIdle, 1)) * Math.PI * 2 - Math.PI / 2
    const radius = 1.6
    return {
      position: [
        MEETING_CENTER[0] + Math.cos(angle) * radius,
        0,
        MEETING_CENTER[2] + Math.sin(angle) * radius,
      ],
      zone: 'meeting',
    }
  } else if (seed < 80) {
    // Coffee area seats
    const seatIdx = idleIndex % COFFEE_SEATS.length
    return { position: [...COFFEE_SEATS[seatIdx]], zone: 'coffee' }
  } else {
    // Bookshelf browsing
    const shelfIdx = idleIndex % BOOKSHELF_POSITIONS.length
    return { position: [...BOOKSHELF_POSITIONS[shelfIdx]], zone: 'bookshelf' }
  }
}

/**
 * Manages agent positions with:
 * - Fixed desk assignment per agent (agentId % DESK_SLOTS.length)
 * - previousPosition tracking for movement animation start points
 * - Idle agents randomly go to meeting table, coffee area, or bookshelves
 * - Animation state based on zone and agent status
 */
export function useAgentPositions(
  agents: Agent[],
  _tasks: Task[],
): Map<number, AgentPosition> {
  // Track how many times each agent's status has changed for idle randomization
  const statusChangeCountRef = useRef<Map<number, number>>(new Map())
  const prevStatusRef = useRef<Map<number, string>>(new Map())
  // Track last known positions so we can set previousPosition on state change
  const lastKnownPositionRef = useRef<Map<number, [number, number, number]>>(new Map())

  // Detect status changes and increment counters
  const updateStatusChanges = useCallback((currentAgents: Agent[]) => {
    for (const agent of currentAgents) {
      const prevStatus = prevStatusRef.current.get(agent.id)
      if (prevStatus !== undefined && prevStatus !== agent.status) {
        const count = statusChangeCountRef.current.get(agent.id) || 0
        statusChangeCountRef.current.set(agent.id, count + 1)
      }
      prevStatusRef.current.set(agent.id, agent.status)
    }
  }, [])

  return useMemo(() => {
    updateStatusChanges(agents)

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

    // Working agents -> fixed desk assignment
    for (const agent of working) {
      const deskIdx = getDeskIndex(agent.id)
      const target = deskChairPosition(deskIdx)
      const prev = lastKnownPositionRef.current.get(agent.id) || target

      positions.set(agent.id, {
        targetPosition: target,
        previousPosition: prev,
        zone: 'desk',
        deskIndex: deskIdx,
        animation: 'sitting_typing',
      })

      lastKnownPositionRef.current.set(agent.id, target)
    }

    // Idle agents -> randomized between meeting, coffee, bookshelf
    for (let i = 0; i < idle.length; i++) {
      const agent = idle[i]
      const changeCount = statusChangeCountRef.current.get(agent.id) || 0
      const { position: target, zone } = pickIdleDestination(
        agent.id,
        i,
        idle.length,
        changeCount,
      )
      const prev = lastKnownPositionRef.current.get(agent.id) || target

      positions.set(agent.id, {
        targetPosition: target,
        previousPosition: prev,
        zone,
        animation: zone === 'meeting' ? 'sitting_idle' : 'standing_idle',
      })

      lastKnownPositionRef.current.set(agent.id, target)
    }

    // Offline agents -> their assigned desk (faded out)
    for (const agent of offline) {
      const deskIdx = getDeskIndex(agent.id)
      const target = deskChairPosition(deskIdx)
      const prev = lastKnownPositionRef.current.get(agent.id) || target

      positions.set(agent.id, {
        targetPosition: target,
        previousPosition: prev,
        zone: 'desk',
        deskIndex: deskIdx,
        animation: 'sitting_idle',
      })

      lastKnownPositionRef.current.set(agent.id, target)
    }

    return positions
  }, [agents, _tasks, updateStatusChanges])
}
