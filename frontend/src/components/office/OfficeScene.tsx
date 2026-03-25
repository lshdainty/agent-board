import { useEffect } from 'react'
import { OrbitControls } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { OfficeLayout } from './OfficeLayout'
import type { Agent, Task } from '@/types'

interface OfficeSceneProps {
  agents: Agent[]
  tasks: Task[]
  theme: 'light' | 'dark'
}

function CameraSetup() {
  const { camera, size } = useThree()

  useEffect(() => {
    if (camera instanceof THREE.OrthographicCamera) {
      camera.position.set(15, 15, 15)
      camera.zoom = 40
      camera.lookAt(0, 0, 0)
      camera.updateProjectionMatrix()
    }
  }, [camera, size])

  return null
}

export function OfficeScene({ agents, tasks, theme }: OfficeSceneProps) {
  const isDark = theme === 'dark'

  return (
    <>
      <CameraSetup />

      <OrbitControls
        enableRotate={true}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 3}
        enablePan={true}
        enableZoom={true}
        minZoom={25}
        maxZoom={100}
        target={new THREE.Vector3(0, 0, 0)}
      />

      <ambientLight intensity={isDark ? 0.6 : 0.8} />
      <directionalLight
        position={[8, 15, 8]}
        intensity={1.0}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />
      <directionalLight position={[-5, 8, -5]} intensity={0.4} />

      <pointLight position={[-1.5, 3.5, -4.5]} color="#fff5e6" intensity={isDark ? 0.6 : 0.3} />
      <pointLight position={[-1.5, 3.5, -1.5]} color="#fff5e6" intensity={isDark ? 0.6 : 0.3} />
      <pointLight position={[-1.5, 3.5, 1.5]} color="#fff5e6" intensity={isDark ? 0.6 : 0.3} />

      <OfficeLayout agents={agents} tasks={tasks} theme={theme} />
    </>
  )
}
