import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { AgentStatus } from '@/types'

interface Particle {
  position: THREE.Vector3
  velocity: THREE.Vector3
  life: number
  maxLife: number
  scale: number
  color: string
}

interface StatusEffectProps {
  status: AgentStatus
  position?: [number, number, number]
}

function createSparkleParticles(): Particle[] {
  const particles: Particle[] = []
  const count = 4 + Math.floor(Math.random() * 2)
  for (let i = 0; i < count; i++) {
    particles.push({
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 0.3,
        0.5 + Math.random() * 0.2,
        (Math.random() - 0.5) * 0.3,
      ),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.8,
        1.0 + Math.random() * 0.8,
        (Math.random() - 0.5) * 0.8,
      ),
      life: 0,
      maxLife: 0.8 + Math.random() * 0.4,
      scale: 0.02 + Math.random() * 0.02,
      color: ['#fbbf24', '#f59e0b', '#fcd34d', '#60a5fa', '#818cf8'][Math.floor(Math.random() * 5)],
    })
  }
  return particles
}

function createCheckParticles(): Particle[] {
  const particles: Particle[] = []
  // Central green burst
  const count = 5
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2
    particles.push({
      position: new THREE.Vector3(0, 0.7, 0),
      velocity: new THREE.Vector3(
        Math.cos(angle) * 0.6,
        1.2 + Math.random() * 0.5,
        Math.sin(angle) * 0.6,
      ),
      life: 0,
      maxLife: 0.9 + Math.random() * 0.3,
      scale: 0.025 + Math.random() * 0.015,
      color: ['#22c55e', '#4ade80', '#86efac'][Math.floor(Math.random() * 3)],
    })
  }
  return particles
}

export function StatusEffect({ status, position = [0, 0, 0] }: StatusEffectProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [particles, setParticles] = useState<Particle[]>([])
  const meshRefs = useRef<(THREE.Mesh | null)[]>([])
  const prevStatusRef = useRef<AgentStatus>(status)
  const activeRef = useRef(false)

  // Detect status changes and spawn particles
  useEffect(() => {
    if (prevStatusRef.current !== status) {
      const prevStatus = prevStatusRef.current
      prevStatusRef.current = status

      if (status === 'working') {
        // Starting work: sparkle burst
        setParticles(createSparkleParticles())
        activeRef.current = true
      } else if (prevStatus === 'working' && status === 'idle') {
        // Task completed (working -> idle): check effect
        setParticles(createCheckParticles())
        activeRef.current = true
      }
    }
  }, [status])

  useFrame((_, delta) => {
    if (!activeRef.current || particles.length === 0) return

    let allDead = true

    particles.forEach((p, i) => {
      p.life += delta
      if (p.life >= p.maxLife) return

      allDead = false

      // Apply velocity with gravity
      p.position.x += p.velocity.x * delta
      p.position.y += p.velocity.y * delta
      p.position.z += p.velocity.z * delta
      p.velocity.y -= 2.0 * delta // gravity

      const mesh = meshRefs.current[i]
      if (mesh) {
        mesh.position.copy(p.position)

        // Fade out and shrink
        const lifeRatio = p.life / p.maxLife
        const fade = 1 - lifeRatio * lifeRatio // quadratic fade
        mesh.scale.setScalar(p.scale * (1 + lifeRatio * 0.5) * fade * 40)

        const mat = mesh.material as THREE.MeshBasicMaterial
        if (mat) {
          mat.opacity = fade
          mat.transparent = true
        }
      }
    })

    if (allDead) {
      activeRef.current = false
      setParticles([])
    }
  })

  if (particles.length === 0) return null

  return (
    <group ref={groupRef} position={position}>
      {particles.map((p, i) => (
        <mesh
          key={i}
          ref={(el) => {
            meshRefs.current[i] = el
          }}
          position={p.position.toArray()}
        >
          <sphereGeometry args={[0.015, 6, 6]} />
          <meshBasicMaterial color={p.color} transparent opacity={1} />
        </mesh>
      ))}
    </group>
  )
}
