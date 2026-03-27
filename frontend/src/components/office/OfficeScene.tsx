import { useEffect, useRef, useMemo } from 'react'
import { OrbitControls } from '@react-three/drei'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { OfficeLayout } from './OfficeLayout'
import { AgentEffectsLayer } from './AgentEffectsLayer'
import { useSelectedAgent } from '@/hooks/useSelectedAgent'
import { useAgentPositions } from '@/hooks/useAgentPositions'
import type { Agent, Task } from '@/types'

interface OfficeSceneProps {
  agents: Agent[]
  tasks: Task[]
  theme: 'light' | 'dark'
}

const BG = { light: '#e8ecf4', dark: '#080c18' } as const

function SceneSetup({ theme }: { theme: 'light' | 'dark' }) {
  const { camera, size, gl } = useThree()

  useEffect(() => {
    if (camera instanceof THREE.OrthographicCamera) {
      camera.position.set(15, 15, 15)
      camera.zoom = 40
      camera.lookAt(0, 0, 0)
      camera.updateProjectionMatrix()
    }
  }, [camera, size])

  useEffect(() => {
    gl.setClearColor(BG[theme])
  }, [gl, theme])

  return null
}

/**
 * Smoothly moves the OrbitControls target toward the selected agent's position.
 * When no agent is selected, smoothly returns to center [0,0,0].
 */
function CameraTracker({
  agents,
  tasks,
  controlsRef,
}: {
  agents: Agent[]
  tasks: Task[]
  controlsRef: React.RefObject<any>
}) {
  const { selectedAgentId } = useSelectedAgent()
  const agentPositions = useAgentPositions(agents, tasks)
  const targetVec = useRef(new THREE.Vector3(0, 0, 0))

  // Determine desired camera target based on selection
  const desiredTarget = useMemo(() => {
    if (selectedAgentId == null) return new THREE.Vector3(0, 0, 0)
    const pos = agentPositions.get(selectedAgentId)
    if (!pos) return new THREE.Vector3(0, 0, 0)
    return new THREE.Vector3(
      pos.targetPosition[0],
      pos.targetPosition[1] + 0.5,
      pos.targetPosition[2],
    )
  }, [selectedAgentId, agentPositions])

  useFrame(() => {
    if (!controlsRef.current) return

    // Lerp target toward desired position
    targetVec.current.lerp(desiredTarget, 0.04)
    controlsRef.current.target.copy(targetVec.current)
    controlsRef.current.update()
  })

  return null
}

export function OfficeScene({ agents, tasks, theme }: OfficeSceneProps) {
  const isDark = theme === 'dark'
  const controlsRef = useRef<any>(null)

  return (
    <>
      <SceneSetup theme={theme} />

      <OrbitControls
        ref={controlsRef}
        enableRotate={true}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 3}
        enablePan={true}
        enableZoom={true}
        minZoom={25}
        maxZoom={100}
        target={new THREE.Vector3(0, 0, 0)}
      />

      <CameraTracker agents={agents} tasks={tasks} controlsRef={controlsRef} />

      <ambientLight intensity={isDark ? 1.0 : 0.8} />
      <directionalLight
        position={[8, 15, 8]}
        intensity={isDark ? 1.2 : 1.0}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />
      <directionalLight position={[-5, 8, -5]} intensity={isDark ? 0.6 : 0.4} />

      {/* Overhead warm lights — brighter in dark mode */}
      <pointLight position={[-4.5, 3.5, -4.5]} color="#ffeedd" intensity={isDark ? 1.2 : 0.3} distance={12} />
      <pointLight position={[-4.5, 3.5, 0]} color="#ffeedd" intensity={isDark ? 1.2 : 0.3} distance={12} />
      <pointLight position={[-4.5, 3.5, 3]} color="#ffeedd" intensity={isDark ? 1.0 : 0.3} distance={12} />
      <pointLight position={[2, 3.5, -4.5]} color="#ffeedd" intensity={isDark ? 1.2 : 0.3} distance={12} />
      <pointLight position={[2, 3.5, 0]} color="#ffeedd" intensity={isDark ? 1.2 : 0.3} distance={12} />
      <pointLight position={[7, 3.5, -2]} color="#ffeedd" intensity={isDark ? 0.8 : 0.3} distance={12} />

      <OfficeLayout agents={agents} tasks={tasks} theme={theme} />
      <AgentEffectsLayer agents={agents} tasks={tasks} />
    </>
  )
}
