import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { HandTracker } from './HandTracker'
import { useHandStore } from './store'

function AnimatedCube() {
  const cubeGroupRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  const pinchDistance = useHandStore((state) => state.pinchDistance)
  const cubeHue = useHandStore((state) => state.cubeHue)
  const leftHandPos = useHandStore((state) => state.leftHandPos)
  const isRockGesture = useHandStore((state) => state.isRockGesture)
  const isMoonwalkGesture = useHandStore((state) => state.isMoonwalkGesture)
  const batRef = useRef<THREE.Group>(null)
  const moonwalkRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    const cubeGroup = cubeGroupRef.current
    const mesh = meshRef.current
    if (!mesh || !cubeGroup) return

    const targetScale = 0.5 + pinchDistance * 1.5
    const nextScale = THREE.MathUtils.lerp(cubeGroup.scale.x, targetScale, 0.08)
    cubeGroup.scale.setScalar(nextScale)

    const material = mesh.material as THREE.MeshStandardMaterial
    material.color.setHSL(THREE.MathUtils.clamp(cubeHue, 0, 1), 1, 0.5)

    cubeGroup.rotation.x = THREE.MathUtils.lerp(
      cubeGroup.rotation.x,
      leftHandPos.y * Math.PI,
      0.08,
    )
    cubeGroup.rotation.y = THREE.MathUtils.lerp(
      cubeGroup.rotation.y,
      leftHandPos.x * Math.PI,
      0.08,
    )

    if (isRockGesture && batRef.current) {
      const t = state.clock.getElapsedTime()
      batRef.current.position.x = ((t * 4.8 + 4) % 8) - 4
      batRef.current.position.y = Math.sin(t * 10) * 1.2
      batRef.current.position.z = -0.2 + Math.cos(t * 7) * 0.6
      batRef.current.rotation.x += 0.24
      batRef.current.rotation.y += 0.32
      batRef.current.rotation.z += 0.4
    }

    if (isMoonwalkGesture && moonwalkRef.current) {
      const t = state.clock.getElapsedTime()
      moonwalkRef.current.position.x = Math.sin(t * 1.9) * 2.9
      moonwalkRef.current.position.y = -1.8 + Math.sin(t * 6.2) * 0.12
      moonwalkRef.current.position.z = 0.4
      moonwalkRef.current.rotation.y = Math.sin(t * 2.7) * 0.45
    }
  })

  return (
    <>
      <group ref={cubeGroupRef}>
        <mesh ref={meshRef}>
          <boxGeometry args={[1.4, 1.4, 1.4]} />
          <meshStandardMaterial
            color="hotpink"
            roughness={0.25}
            metalness={0.55}
            transparent
            opacity={0.42}
            side={THREE.DoubleSide}
          />
        </mesh>
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(1.4, 1.4, 1.4)]} />
          <lineBasicMaterial color="#d8f7ff" transparent opacity={0.65} />
        </lineSegments>
      </group>

      {isRockGesture && (
        <group ref={batRef} position={[-4, 0, 0]}>
          <Html
            sprite
            style={{
              fontSize: '110px',
              lineHeight: 1,
              filter: 'drop-shadow(0 0 12px rgba(255, 70, 190, 0.9))',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            🦇
          </Html>
        </group>
      )}

      {isMoonwalkGesture && (
        <group ref={moonwalkRef} position={[-2.8, -1.8, 0.4]}>
          <Html
            sprite
            style={{
              fontSize: '88px',
              lineHeight: 1,
              filter: 'drop-shadow(0 0 10px rgba(110, 208, 255, 0.9))',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            🕺
          </Html>
        </group>
      )}
    </>
  )
}

function App() {
  const isRockGesture = useHandStore((state) => state.isRockGesture)
  const isMoonwalkGesture = useHandStore((state) => state.isMoonwalkGesture)

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
        background: 'linear-gradient(135deg, #05070f 0%, #0b0e1e 55%, #090b16 100%)',
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 55 }}
        style={{ position: 'absolute', inset: 0 }}
      >
        <color attach="background" args={['#03040a']} />
        <ambientLight intensity={0.35} />
        <directionalLight position={[2, 5, 5]} intensity={1.1} />
        <AnimatedCube />
      </Canvas>

      <div
        style={{
          position: 'absolute',
          left: 24,
          top: 24,
          maxWidth: 340,
          padding: '24px 26px',
          borderRadius: 28,
          background: 'rgba(255,255,255,0.12)',
          border: '1px solid rgba(255,255,255,0.18)',
          backdropFilter: 'blur(24px)',
          color: '#f9f9ff',
          boxShadow: '0 32px 70px rgba(0,0,0,0.35)',
          zIndex: 15,
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: '1.35rem',
            letterSpacing: '0.03em',
            marginBottom: 16,
          }}
        >
          VIBE CODING: HAND CONTROLS
        </h1>
        <ul style={{ paddingLeft: 18, margin: 0, lineHeight: 1.9 }}>
          <li>🤏 Right Hand Pinch: Scale Cube</li>
          <li>👌 Right Hand Finger Snap: Switch Neon Color</li>
          <li>✋ Left Hand Move: Rotate Cube in 3D</li>
          <li>🤘 Left Hand Rock On: Bat Mode</li>
          <li>🕺 Left Hand Walk + Flip: Moonwalk Mode</li>
        </ul>
      </div>

      {isRockGesture && (
        <div
          style={{
            position: 'absolute',
            right: 24,
            top: 24,
            zIndex: 16,
            padding: '10px 14px',
            borderRadius: 12,
            background: 'rgba(255, 0, 136, 0.18)',
            border: '1px solid rgba(255, 0, 136, 0.55)',
            color: '#ff5dc8',
            fontWeight: 700,
            letterSpacing: '0.08em',
          }}
        >
          ROCK MODE
        </div>
      )}

      {isMoonwalkGesture && (
        <div
          style={{
            position: 'absolute',
            right: 24,
            top: 78,
            zIndex: 16,
            padding: '10px 14px',
            borderRadius: 12,
            background: 'rgba(68, 211, 255, 0.2)',
            border: '1px solid rgba(68, 211, 255, 0.6)',
            color: '#8ee8ff',
            fontWeight: 700,
            letterSpacing: '0.08em',
          }}
        >
          MOONWALK MODE
        </div>
      )}

      <HandTracker />
    </div>
  )
}

export default App
