import { useRef, useState, useEffect, useMemo } from 'react'
import { Text, Billboard } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { AgentStatus } from '@/types'

const WORKING_MESSAGES = ['coding!', 'task received!', 'on it!', 'let me see...']
const IDLE_MESSAGES = ['coffee time~', 'taking a break', 'hmm...', 'stretching~']
const OFFLINE_MESSAGES = ['bye!', 'see you!', 'logging off', 'done for today']

function pickRandom(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)]
}

interface SpeechBubbleProps {
  status: AgentStatus
  position?: [number, number, number]
}

export function SpeechBubble({ status, position = [0, 1.6, 0] }: SpeechBubbleProps) {
  const groupRef = useRef<THREE.Group>(null)
  const opacityRef = useRef(0)
  const [visible, setVisible] = useState(false)
  const [message, setMessage] = useState('')
  const prevStatusRef = useRef<AgentStatus>(status)
  const timerRef = useRef(0)
  const fadePhase = useRef<'in' | 'hold' | 'out' | 'hidden'>('hidden')

  // Detect status change
  useEffect(() => {
    if (prevStatusRef.current !== status) {
      prevStatusRef.current = status

      let msg = ''
      if (status === 'working') msg = pickRandom(WORKING_MESSAGES)
      else if (status === 'idle') msg = pickRandom(IDLE_MESSAGES)
      else if (status === 'offline') msg = pickRandom(OFFLINE_MESSAGES)

      setMessage(msg)
      setVisible(true)
      opacityRef.current = 0
      timerRef.current = 0
      fadePhase.current = 'in'
    }
  }, [status])

  // Bubble dimensions based on message length
  const bubbleWidth = useMemo(() => {
    return Math.min(message.length * 0.055 + 0.2, 1.4)
  }, [message])

  useFrame((_, delta) => {
    if (!visible || !groupRef.current) return

    timerRef.current += delta

    switch (fadePhase.current) {
      case 'in':
        opacityRef.current = Math.min(opacityRef.current + delta * 4, 1)
        if (opacityRef.current >= 1) {
          fadePhase.current = 'hold'
          timerRef.current = 0
        }
        break
      case 'hold':
        if (timerRef.current > 2.5) {
          fadePhase.current = 'out'
        }
        break
      case 'out':
        opacityRef.current = Math.max(opacityRef.current - delta * 2, 0)
        if (opacityRef.current <= 0) {
          fadePhase.current = 'hidden'
          setVisible(false)
        }
        break
      default:
        break
    }

    // Apply opacity to all children
    groupRef.current.traverse((child) => {
      if ((child as THREE.Mesh).material) {
        const mat = (child as THREE.Mesh).material as THREE.Material
        mat.transparent = true
        mat.opacity = opacityRef.current
      }
    })

    // Gentle float animation
    if (groupRef.current) {
      const time = Date.now() * 0.001
      groupRef.current.position.y = position[1] + Math.sin(time * 2) * 0.02
    }
  })

  if (!visible) return null

  return (
    <group ref={groupRef} position={position}>
      <Billboard follow lockX={false} lockY={false} lockZ={false}>
        {/* Background plane (white bubble) */}
        <mesh position={[0, 0, -0.001]}>
          <planeGeometry args={[bubbleWidth, 0.14]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.92} />
        </mesh>

        {/* Border / shadow outline */}
        <mesh position={[0, 0, -0.002]}>
          <planeGeometry args={[bubbleWidth + 0.02, 0.16]} />
          <meshBasicMaterial color="#cbd5e1" transparent opacity={0.5} />
        </mesh>

        {/* Tail triangle (pointing down) */}
        <mesh position={[0, -0.1, -0.001]} rotation={[0, 0, Math.PI]}>
          <coneGeometry args={[0.04, 0.06, 3]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.92} />
        </mesh>

        {/* Message text */}
        <Text
          fontSize={0.065}
          color="#334155"
          anchorX="center"
          anchorY="middle"
          font={undefined}
        >
          {message}
        </Text>
      </Billboard>
    </group>
  )
}
