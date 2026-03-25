import { memo } from 'react'
import type { HairStyle } from '@/types'

interface AgentHairProps {
  style: HairStyle
  color: string
  opacity: number
}

function AgentHairInner({ style, color, opacity }: AgentHairProps) {
  const transparent = opacity < 1

  switch (style) {
    case 'short':
      return (
        <mesh position={[0, 0.04, -0.02]} castShadow>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshStandardMaterial color={color} transparent={transparent} opacity={opacity} />
        </mesh>
      )

    case 'long':
      return (
        <group>
          <mesh position={[0, 0.04, -0.02]} castShadow>
            <sphereGeometry args={[0.12, 8, 8]} />
            <meshStandardMaterial color={color} transparent={transparent} opacity={opacity} />
          </mesh>
          <mesh position={[0, -0.05, -0.08]} castShadow>
            <boxGeometry args={[0.1, 0.15, 0.06]} />
            <meshStandardMaterial color={color} transparent={transparent} opacity={opacity} />
          </mesh>
        </group>
      )

    case 'buzz':
      return (
        <mesh position={[0, 0.02, 0]} castShadow>
          <sphereGeometry args={[0.135, 8, 8]} />
          <meshStandardMaterial color={color} transparent={transparent} opacity={opacity} />
        </mesh>
      )

    case 'hat':
      return (
        <group>
          {/* Hat top */}
          <mesh position={[0, 0.04, 0]} castShadow>
            <cylinderGeometry args={[0.1, 0.1, 0.08, 8]} />
            <meshStandardMaterial color={color} transparent={transparent} opacity={opacity} />
          </mesh>
          {/* Brim */}
          <mesh position={[0, 0, 0]} castShadow>
            <cylinderGeometry args={[0.15, 0.15, 0.02, 8]} />
            <meshStandardMaterial color={color} transparent={transparent} opacity={opacity} />
          </mesh>
        </group>
      )

    case 'ponytail':
      return (
        <group>
          <mesh position={[0, 0.04, -0.02]} castShadow>
            <sphereGeometry args={[0.12, 8, 8]} />
            <meshStandardMaterial color={color} transparent={transparent} opacity={opacity} />
          </mesh>
          <mesh position={[0, -0.05, -0.12]} castShadow>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial color={color} transparent={transparent} opacity={opacity} />
          </mesh>
        </group>
      )

    case 'mohawk':
      return (
        <mesh position={[0, 0.08, 0]} castShadow>
          <boxGeometry args={[0.04, 0.1, 0.12]} />
          <meshStandardMaterial color={color} transparent={transparent} opacity={opacity} />
        </mesh>
      )

    case 'afro':
      return (
        <mesh position={[0, 0.03, 0]} castShadow>
          <sphereGeometry args={[0.18, 8, 8]} />
          <meshStandardMaterial color={color} transparent={transparent} opacity={opacity} />
        </mesh>
      )
  }
}

export const AgentHair = memo(AgentHairInner)
