import { Grid } from '@react-three/drei'
import { memo } from 'react'
import { ROOM_WIDTH, ROOM_DEPTH } from '@/constants/office'

interface OfficeFloorProps {
  theme: 'light' | 'dark'
}

export const OfficeFloor = memo(function OfficeFloor({ theme }: OfficeFloorProps) {
  const isDark = theme === 'dark'

  return (
    <group>
      {/* Main floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[ROOM_WIDTH, ROOM_DEPTH]} />
        <meshStandardMaterial color={isDark ? '#1a1f35' : '#d4d8e0'} />
      </mesh>

      {/* Raised platform edge */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[ROOM_WIDTH + 0.2, ROOM_DEPTH + 0.2]} />
        <meshStandardMaterial color={isDark ? '#0d1117' : '#b8bcc4'} />
      </mesh>

      {/* Carpet zone under desk area */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-1.5, -0.005, -1.5]} receiveShadow>
        <planeGeometry args={[13, 9]} />
        <meshStandardMaterial color={isDark ? '#151a2e' : '#c8ccd4'} />
      </mesh>

      {/* Grid overlay */}
      <Grid
        args={[ROOM_WIDTH, ROOM_DEPTH]}
        position={[0, 0, 0]}
        cellSize={1}
        cellThickness={0.5}
        cellColor={isDark ? '#252b42' : '#c0c4cc'}
        sectionSize={4}
        sectionThickness={1}
        sectionColor={isDark ? '#2a3050' : '#aab0ba'}
        fadeDistance={30}
        fadeStrength={1}
        infiniteGrid={false}
      />
    </group>
  )
})
