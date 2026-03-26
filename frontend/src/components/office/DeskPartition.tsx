import { memo } from 'react'

interface DeskPartitionProps {
  position: [number, number, number]
  width: number
  theme: 'light' | 'dark'
}

export const DeskPartition = memo(function DeskPartition({ position, width, theme }: DeskPartitionProps) {
  const isDark = theme === 'dark'

  // Fabric/felt panel — dark blue-gray to contrast with light floor/desk
  const fabricColor = isDark ? '#3a4565' : '#4b5568'
  // Metal frame/trim — darker
  const trimColor = isDark ? '#8890a0' : '#374151'

  const panelThickness = 0.12
  const panelHeight = 0.75
  const baseY = 0.55 // desk surface level
  const centerY = baseY + panelHeight / 2

  return (
    <group>
      {/* Main fabric panel */}
      <mesh position={[position[0], centerY, position[2]]} castShadow receiveShadow>
        <boxGeometry args={[panelThickness, panelHeight, width]} />
        <meshStandardMaterial
          color={fabricColor}
          roughness={1.0}
          metalness={0}
        />
      </mesh>

      {/* Top metal trim */}
      <mesh position={[position[0], baseY + panelHeight + 0.015, position[2]]}>
        <boxGeometry args={[panelThickness + 0.02, 0.03, width + 0.01]} />
        <meshStandardMaterial color={trimColor} roughness={0.3} metalness={0.6} />
      </mesh>

      {/* Bottom metal trim (at desk level) */}
      <mesh position={[position[0], baseY - 0.015, position[2]]}>
        <boxGeometry args={[panelThickness + 0.02, 0.03, width + 0.01]} />
        <meshStandardMaterial color={trimColor} roughness={0.3} metalness={0.6} />
      </mesh>
    </group>
  )
})
