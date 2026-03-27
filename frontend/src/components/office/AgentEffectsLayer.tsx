import { SpeechBubble } from './SpeechBubble'
import { StatusEffect } from './StatusEffect'
import type { Agent, Task } from '@/types'
import { useAgentPositions } from '@/hooks/useAgentPositions'

interface AgentEffectsLayerProps {
  agents: Agent[]
  tasks: Task[]
}

/**
 * Renders SpeechBubble and StatusEffect for each agent.
 * Uses the same useAgentPositions hook as OfficeLayout so positions match.
 */
export function AgentEffectsLayer({ agents, tasks }: AgentEffectsLayerProps) {
  const agentPositions = useAgentPositions(agents, tasks)

  return (
    <group>
      {agents.map((agent) => {
        const pos = agentPositions.get(agent.id)
        if (!pos) return null
        return (
          <group key={agent.id} position={pos.targetPosition}>
            <SpeechBubble status={agent.status} position={[0, 1.6, 0]} />
            <StatusEffect status={agent.status} position={[0, 0, 0]} />
          </group>
        )
      })}
    </group>
  )
}
