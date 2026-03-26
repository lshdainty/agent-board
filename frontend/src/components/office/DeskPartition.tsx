import { memo } from 'react'

interface DeskPartitionProps {
  position: [number, number, number]
  width: number
  theme: 'light' | 'dark'
  direction?: 'x' | 'z'  // x = left-right wall (along x), z = front-back wall (along z)
}

export const DeskPartition = memo(function DeskPartition({
  position,
  width,
  theme,
  direction = 'z',
}: DeskPartitionProps) {
  const isDark = theme === 'dark'

  const fabricColor = isDark ? '#3a4565' : '#4b5568'
  const trimColor = isDark ? '#8890a0' : '#374151'

  const panelThickness = 0.06
  const panelHeight = 0.85  // floor to just above desk surface
  const centerY = panelHeight / 2  // starts from floor (y=0)

  // Geometry dimensions based on direction
  const geoArgs: [number, number, number] = direction === 'z'
    ? [panelThickness, panelHeight, width]   // wall along z-axis
    : [width, panelHeight, panelThickness]   // wall along x-axis

  const trimTopArgs: [number, number, number] = direction === 'z'
    ? [panelThickness + 0.02, 0.025, width + 0.01]
    : [width + 0.01, 0.025, panelThickness + 0.02]

  return (
    <group>
      {/* Main fabric panel — from floor up */}
      <mesh position={[position[0], centerY, position[2]]} castShadow receiveShadow>
        <boxGeometry args={geoArgs} />
        <meshStandardMaterial color={fabricColor} roughness={1.0} metalness={0} />
      </mesh>

      {/* Top metal trim */}
      <mesh position={[position[0], panelHeight + 0.012, position[2]]}>
        <boxGeometry args={trimTopArgs} />
        <meshStandardMaterial color={trimColor} roughness={0.3} metalness={0.6} />
      </mesh>
    </group>
  )
})
