import { memo } from 'react'

interface DeskPartitionProps {
  position: [number, number, number]
  width: number
  theme: 'light' | 'dark'
}

export const DeskPartition = memo(function DeskPartition({ position, width, theme }: DeskPartitionProps) {
  const isDark = theme === 'dark'
  const color = isDark ? '#3a4060' : '#b0b8c8'
  const opacity = isDark ? 0.6 : 0.5

  return (
    <mesh position={[position[0], position[1] + 0.8, position[2]]} castShadow>
      <boxGeometry args={[0.03, 0.5, width]} />
      <meshStandardMaterial color={color} transparent opacity={opacity} />
    </mesh>
  )
})
