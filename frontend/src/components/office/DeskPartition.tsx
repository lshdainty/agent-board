import { memo } from 'react'

interface DeskPartitionProps {
  position: [number, number, number]
  width: number
  theme: 'light' | 'dark'
}

export const DeskPartition = memo(function DeskPartition({ position, width, theme }: DeskPartitionProps) {
  const isDark = theme === 'dark'

  // Fabric/felt panel colors (like real office cubicle walls)
  const fabricColor = isDark ? '#4a5580' : '#7a8599'
  // Metal frame/trim
  const trimColor = isDark ? '#666d80' : '#555b68'

  const panelThickness = 0.08
  const panelHeight = 0.6
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
