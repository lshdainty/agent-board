import { AGENT_APPEARANCES } from '@/constants/office'
import type { AgentAppearance } from '@/types'

export function getAgentAppearance(agentId: number): AgentAppearance {
  return AGENT_APPEARANCES[agentId % AGENT_APPEARANCES.length]
}
