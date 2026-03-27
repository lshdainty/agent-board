import { memo } from 'react'
import type { HairStyle } from '@/types'

interface AgentHairProps {
  style: HairStyle
  color: string
  opacity: number
}

/**
 * Hair is a CHILD of the head group (center [0,0.7,0]).
 * So all coords here are relative to head center.
 * Head is a box 0.24x0.24x0.24.
 * Head local top = +0.12, bottom = -0.12, front = +0.12, back = -0.12.
 * Hair sits ON TOP of head: bottom of hair = local y 0.12.
 */
function AgentHairInner({ style, color, opacity }: AgentHairProps) {
  const transparent = opacity < 1
  const matProps = { color, transparent, opacity }
  // Head surface positions (local)
  const TOP = 0.12
  const BACK = -0.12
  const SIDE = 0.12

  switch (style) {
    case 'short': {
      // Thin slab sitting on head top
      const h = 0.05
      return (
        <mesh position={[0, TOP + h / 2, 0]} castShadow>
          <boxGeometry args={[0.245, h, 0.245]} />
          <meshStandardMaterial {...matProps} />
        </mesh>
      )
    }

    case 'long': {
      const h = 0.06
      return (
        <group>
          {/* Top slab — slightly wider to overlap sides */}
          <mesh position={[0, TOP + h / 2, 0]} castShadow>
            <boxGeometry args={[0.3, h, 0.3]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
          {/* Back curtain — extends up into top slab to eliminate gap */}
          <mesh position={[0, 0.01, BACK - 0.015]} castShadow>
            <boxGeometry args={[0.3, 0.28, 0.04]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
          {/* Side L — extends up into top slab */}
          <mesh position={[-(SIDE + 0.015), 0.01, -0.02]} castShadow>
            <boxGeometry args={[0.04, 0.28, 0.28]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
          {/* Side R — extends up into top slab */}
          <mesh position={[SIDE + 0.015, 0.01, -0.02]} castShadow>
            <boxGeometry args={[0.04, 0.28, 0.28]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
        </group>
      )
    }

    case 'buzz': {
      const h = 0.025
      return (
        <mesh position={[0, TOP + h / 2, 0]} castShadow>
          <boxGeometry args={[0.243, h, 0.243]} />
          <meshStandardMaterial {...matProps} />
        </mesh>
      )
    }

    case 'hat': {
      const brimH = 0.025
      const bodyH = 0.09
      return (
        <group>
          {/* Brim flush on head */}
          <mesh position={[0, TOP + brimH / 2, 0]} castShadow>
            <boxGeometry args={[0.32, brimH, 0.32]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
          {/* Body on brim */}
          <mesh position={[0, TOP + brimH + bodyH / 2, 0]} castShadow>
            <boxGeometry args={[0.24, bodyH, 0.24]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
        </group>
      )
    }

    case 'ponytail': {
      const h = 0.05
      return (
        <group>
          {/* Top */}
          <mesh position={[0, TOP + h / 2, 0]} castShadow>
            <boxGeometry args={[0.245, h, 0.245]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
          {/* Ponytail behind head */}
          <mesh position={[0, -0.06, BACK - 0.04]} castShadow>
            <boxGeometry args={[0.06, 0.1, 0.05]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
        </group>
      )
    }

    case 'mohawk': {
      const h = 0.1
      return (
        <mesh position={[0, TOP + h / 2, 0]} castShadow>
          <boxGeometry args={[0.05, h, 0.16]} />
          <meshStandardMaterial {...matProps} />
        </mesh>
      )
    }

    case 'afro':
      // Bigger box wrapping head
      return (
        <mesh position={[0, 0.04, 0]} castShadow>
          <boxGeometry args={[0.3, 0.3, 0.3]} />
          <meshStandardMaterial {...matProps} />
        </mesh>
      )
  }
}

export const AgentHair = memo(AgentHairInner)
