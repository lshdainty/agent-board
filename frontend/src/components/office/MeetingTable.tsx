import { memo } from 'react'

interface MeetingTableProps {
  position: [number, number, number]
  chairCount?: number
  theme: 'light' | 'dark'
}

export const MeetingTable = memo(function MeetingTable({
  position,
  chairCount = 6,
  theme,
}: MeetingTableProps) {
  const isDark = theme === 'dark'
  const tableTop = isDark ? '#3d4260' : '#b8956a'
  const pillar = isDark ? '#2a2f45' : '#8b7355'
  const chair = isDark ? '#2d3248' : '#6b7280'
  const chairBase = isDark ? '#1e2235' : '#4b5563'

  const chairs = Array.from({ length: chairCount }, (_, i) => {
    const angle = (i / chairCount) * Math.PI * 2
    const radius = 2
    return {
      x: Math.cos(angle) * radius,
      z: Math.sin(angle) * radius,
      rotation: angle + Math.PI,
    }
  })

  return (
    <group position={position}>
      {/* Table top */}
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.3, 1.3, 0.06, 24]} />
        <meshStandardMaterial color={tableTop} />
      </mesh>

      {/* Table center pillar */}
      <mesh position={[0, 0.275, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.18, 0.55, 12]} />
        <meshStandardMaterial color={pillar} />
      </mesh>

      {/* Table base */}
      <mesh position={[0, 0.02, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.4, 0.03, 12]} />
        <meshStandardMaterial color={pillar} />
      </mesh>

      {/* Chairs */}
      {chairs.map((c, i) => (
        <group key={i} position={[c.x, 0, c.z]} rotation={[0, c.rotation, 0]}>
          <mesh position={[0, 0.38, 0]} castShadow>
            <cylinderGeometry args={[0.16, 0.16, 0.04, 10]} />
            <meshStandardMaterial color={chair} />
          </mesh>
          <mesh position={[0, 0.55, -0.12]} castShadow>
            <boxGeometry args={[0.26, 0.28, 0.03]} />
            <meshStandardMaterial color={chair} />
          </mesh>
          <mesh position={[0, 0.2, 0]} castShadow>
            <cylinderGeometry args={[0.025, 0.025, 0.36, 6]} />
            <meshStandardMaterial color={chairBase} />
          </mesh>
          <mesh position={[0, 0.03, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.12, 0.02, 10]} />
            <meshStandardMaterial color={chairBase} />
          </mesh>
        </group>
      ))}
    </group>
  )
})
