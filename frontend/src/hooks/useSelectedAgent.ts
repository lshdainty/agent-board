import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import React from 'react'

interface SelectedAgentContextType {
  selectedAgentId: number | null
  setSelectedAgentId: (id: number | null) => void
  toggleSelectedAgent: (id: number) => void
}

const SelectedAgentContext = createContext<SelectedAgentContextType>({
  selectedAgentId: null,
  setSelectedAgentId: () => {},
  toggleSelectedAgent: () => {},
})

export function SelectedAgentProvider({ children }: { children: ReactNode }) {
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null)

  const toggleSelectedAgent = useCallback((id: number) => {
    setSelectedAgentId((prev) => (prev === id ? null : id))
  }, [])

  return React.createElement(
    SelectedAgentContext.Provider,
    { value: { selectedAgentId, setSelectedAgentId, toggleSelectedAgent } },
    children
  )
}

export function useSelectedAgent() {
  return useContext(SelectedAgentContext)
}
