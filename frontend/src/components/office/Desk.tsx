import { memo } from 'react'

interface DeskProps {
  position: [number, number, number]
  rotation?: number
  theme: 'light' | 'dark'
}

export const Desk = memo(function Desk({ position, rotation = 0, theme }: DeskProps) {
  const isDark = theme === 'dark'
  const surface = isDark ? '#3a3f55' : '#c8a882'
  const leg = isDark ? '#2a2f45' : '#9e8268'
  const chair = isDark ? '#2d3248' : '#6b7280'
  const chairBase = isDark ? '#1e2235' : '#4b5563'
  const monitorBezel = isDark ? '#1a1e30' : '#374151'
  const keyboard = isDark ? '#2d3248' : '#9ca3af'

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Desktop surface */}
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 0.05, 0.7]} />
        <meshStandardMaterial color={surface} />
      </mesh>

      {/* Legs */}
      {[
        [-0.62, 0.275, -0.28],
        [-0.62, 0.275, 0.28],
        [0.62, 0.275, -0.28],
        [0.62, 0.275, 0.28],
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} castShadow>
          <boxGeometry args={[0.04, 0.55, 0.04]} />
          <meshStandardMaterial color={leg} />
        </mesh>
      ))}

      {/* Monitor stand */}
      <mesh position={[0, 0.65, -0.2]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 0.15, 8]} />
        <meshStandardMaterial color={leg} />
      </mesh>

      {/* Monitor screen */}
      <mesh position={[0, 0.85, -0.22]} castShadow>
        <boxGeometry args={[0.55, 0.38, 0.03]} />
        <meshStandardMaterial
          color={isDark ? '#1a2040' : '#1e293b'}
          emissive={isDark ? '#2255cc' : '#3b82f6'}
          emissiveIntensity={isDark ? 0.4 : 0.2}
        />
      </mesh>

      {/* Monitor bezel */}
      <mesh position={[0, 0.85, -0.215]} castShadow>
        <boxGeometry args={[0.58, 0.41, 0.01]} />
        <meshStandardMaterial color={monitorBezel} />
      </mesh>

      {/* Keyboard */}
      <mesh position={[0, 0.58, 0.1]} castShadow>
        <boxGeometry args={[0.35, 0.02, 0.12]} />
        <meshStandardMaterial color={keyboard} />
      </mesh>

      {/* Chair */}
      <group position={[0, 0, 0.55]}>
        <mesh position={[0, 0.38, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.18, 0.04, 12]} />
          <meshStandardMaterial color={chair} />
        </mesh>
        <mesh position={[0, 0.55, -0.14]} castShadow>
          <boxGeometry args={[0.3, 0.3, 0.03]} />
          <meshStandardMaterial color={chair} />
        </mesh>
        <mesh position={[0, 0.2, 0]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.36, 6]} />
          <meshStandardMaterial color={chairBase} />
        </mesh>
        <mesh position={[0, 0.03, 0]} castShadow>
          <cylinderGeometry args={[0.15, 0.15, 0.02, 12]} />
          <meshStandardMaterial color={chairBase} />
        </mesh>
      </group>
    </group>
  )
})
