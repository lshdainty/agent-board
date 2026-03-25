import { memo } from 'react'

interface CoffeeAreaProps {
  position: [number, number, number]
  theme: 'light' | 'dark'
}

export const CoffeeArea = memo(function CoffeeArea({ position, theme }: CoffeeAreaProps) {
  const isDark = theme === 'dark'
  const counterColor = isDark ? '#2a2f45' : '#8b7355'
  const machineColor = isDark ? '#1e2235' : '#4a4a5a'
  const tableColor = isDark ? '#3d4260' : '#b8956a'
  const chairColor = isDark ? '#2d3248' : '#6b7280'
  const cupColor = '#e8e8e8'

  return (
    <group position={position}>
      {/* Counter */}
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.9, 0.5]} />
        <meshStandardMaterial color={counterColor} />
      </mesh>

      {/* Coffee machine body */}
      <mesh position={[-0.2, 1.1, 0]} castShadow>
        <boxGeometry args={[0.3, 0.4, 0.25]} />
        <meshStandardMaterial color={machineColor} />
      </mesh>
      {/* Coffee machine top (cylinder) */}
      <mesh position={[-0.2, 1.35, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 0.1, 8]} />
        <meshStandardMaterial color={machineColor} />
      </mesh>

      {/* Cups */}
      {[0.15, 0.3, 0.45].map((x, i) => (
        <mesh key={i} position={[x, 0.95, 0]} castShadow>
          <cylinderGeometry args={[0.03, 0.025, 0.06, 8]} />
          <meshStandardMaterial color={cupColor} />
        </mesh>
      ))}

      {/* Small round table */}
      <group position={[0, 0, 1.2]}>
        <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.4, 0.4, 0.04, 16]} />
          <meshStandardMaterial color={tableColor} />
        </mesh>
        <mesh position={[0, 0.225, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.06, 0.45, 8]} />
          <meshStandardMaterial color={counterColor} />
        </mesh>

        {/* 2 chairs */}
        {[0, Math.PI].map((angle, i) => {
          const cx = Math.cos(angle) * 0.7
          const cz = Math.sin(angle) * 0.7
          return (
            <group key={i} position={[cx, 0, cz]} rotation={[0, angle + Math.PI, 0]}>
              <mesh position={[0, 0.35, 0]} castShadow>
                <cylinderGeometry args={[0.14, 0.14, 0.04, 10]} />
                <meshStandardMaterial color={chairColor} />
              </mesh>
              <mesh position={[0, 0.5, -0.1]} castShadow>
                <boxGeometry args={[0.22, 0.24, 0.03]} />
                <meshStandardMaterial color={chairColor} />
              </mesh>
              <mesh position={[0, 0.18, 0]} castShadow>
                <cylinderGeometry args={[0.02, 0.02, 0.3, 6]} />
                <meshStandardMaterial color={isDark ? '#1e2235' : '#4b5563'} />
              </mesh>
            </group>
          )
        })}
      </group>
    </group>
  )
})
