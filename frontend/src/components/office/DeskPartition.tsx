import { memo } from 'react'

interface DeskPartitionProps {
  position: [number, number, number]
  width: number
  theme: 'light' | 'dark'
}

export const DeskPartition = memo(function DeskPartition({ position, width, theme }: DeskPartitionProps) {
  const isDark = theme === 'dark'

  // Frame colors
  const frameColor = isDark ? '#4a5068' : '#9ca3af'
  // Panel colors
  const panelColor = isDark ? '#2d3348' : '#cbd5e1'
  const panelOpacity = isDark ? 0.7 : 0.6

  const frameThickness = 0.04
  const partitionHeight = 0.55
  const baseY = position[1] + 0.55 // starts at desk surface level
  const centerY = baseY + partitionHeight / 2

  return (
    <group>
      {/* Main panel — frosted glass look */}
      <mesh position={[position[0], centerY, position[2]]} castShadow receiveShadow>
        <boxGeometry args={[frameThickness, partitionHeight, width]} />
        <meshStandardMaterial
          color={panelColor}
          transparent
          opacity={panelOpacity}
          roughness={0.9}
        />
      </mesh>

      {/* Top frame bar */}
      <mesh position={[position[0], baseY + partitionHeight, position[2]]}>
        <boxGeometry args={[frameThickness + 0.02, 0.03, width + 0.02]} />
        <meshStandardMaterial color={frameColor} />
      </mesh>

      {/* Bottom frame bar */}
      <mesh position={[position[0], baseY, position[2]]}>
        <boxGeometry args={[frameThickness + 0.02, 0.03, width + 0.02]} />
        <meshStandardMaterial color={frameColor} />
      </mesh>

      {/* Left vertical frame */}
      <mesh position={[position[0], centerY, position[2] - width / 2]}>
        <boxGeometry args={[frameThickness + 0.02, partitionHeight + 0.03, 0.03]} />
        <meshStandardMaterial color={frameColor} />
      </mesh>

      {/* Right vertical frame */}
      <mesh position={[position[0], centerY, position[2] + width / 2]}>
        <boxGeometry args={[frameThickness + 0.02, partitionHeight + 0.03, 0.03]} />
        <meshStandardMaterial color={frameColor} />
      </mesh>
    </group>
  )
})
