import { memo } from 'react'
import { ROOM_WIDTH, ROOM_DEPTH, WALL_HEIGHT, WALL_THICKNESS } from '@/constants/office'

interface OfficeWallsProps {
  theme: 'light' | 'dark'
}

export const OfficeWalls = memo(function OfficeWalls({ theme }: OfficeWallsProps) {
  const isDark = theme === 'dark'
  const wallColor = isDark ? '#2d3555' : '#d4d8e0'
  const edgeColor = isDark ? '#3a4268' : '#b8bcc4'

  return (
    <group>
      {/* Back wall */}
      <mesh position={[0, WALL_HEIGHT / 2, -ROOM_DEPTH / 2]} castShadow receiveShadow>
        <boxGeometry args={[ROOM_WIDTH, WALL_HEIGHT, WALL_THICKNESS]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>

      {/* Left wall */}
      <mesh position={[-ROOM_WIDTH / 2, WALL_HEIGHT / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, ROOM_DEPTH]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>

      {/* Right wall */}
      <mesh position={[ROOM_WIDTH / 2, WALL_HEIGHT / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, ROOM_DEPTH]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>

      {/* Ceiling edges */}
      {/* Back edge */}
      <mesh position={[0, WALL_HEIGHT, -ROOM_DEPTH / 2]}>
        <boxGeometry args={[ROOM_WIDTH + WALL_THICKNESS, 0.08, WALL_THICKNESS + 0.04]} />
        <meshStandardMaterial color={edgeColor} />
      </mesh>
      {/* Left edge */}
      <mesh position={[-ROOM_WIDTH / 2, WALL_HEIGHT, 0]}>
        <boxGeometry args={[WALL_THICKNESS + 0.04, 0.08, ROOM_DEPTH + WALL_THICKNESS]} />
        <meshStandardMaterial color={edgeColor} />
      </mesh>
      {/* Right edge */}
      <mesh position={[ROOM_WIDTH / 2, WALL_HEIGHT, 0]}>
        <boxGeometry args={[WALL_THICKNESS + 0.04, 0.08, ROOM_DEPTH + WALL_THICKNESS]} />
        <meshStandardMaterial color={edgeColor} />
      </mesh>
    </group>
  )
})
