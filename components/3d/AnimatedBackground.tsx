'use client'

import { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// 1. Line generator
function makeLine(p1: THREE.Vector3, p2: THREE.Vector3, color: number, opacity: number) {
  const g = new THREE.BufferGeometry().setFromPoints([p1, p2])
  const m = new THREE.LineBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending })
  return new THREE.Line(g, m)
}

// 2. The Envelope Shape
function EnvelopeGroup({ color, opacity }: { color: number; opacity: number }) {
  const lines = useMemo(() => {
    const c = color, o = opacity
    return [
      makeLine(new THREE.Vector3(-0.8,-0.55,0), new THREE.Vector3( 0.8,-0.55,0), c, o*0.9),
      makeLine(new THREE.Vector3( 0.8,-0.55,0), new THREE.Vector3( 0.8, 0.55,0), c, o*0.9),
      makeLine(new THREE.Vector3( 0.8, 0.55,0), new THREE.Vector3(-0.8, 0.55,0), c, o*0.9),
      makeLine(new THREE.Vector3(-0.8, 0.55,0), new THREE.Vector3(-0.8,-0.55,0), c, o*0.9),
      makeLine(new THREE.Vector3(-0.8, 0.55,0), new THREE.Vector3( 0,   0,    0), c, o),
      makeLine(new THREE.Vector3( 0.8, 0.55,0), new THREE.Vector3( 0,   0,    0), c, o),
      makeLine(new THREE.Vector3(-0.8,-0.55,0), new THREE.Vector3( 0,  -0.1,  0), c, o*0.6),
      makeLine(new THREE.Vector3( 0.8,-0.55,0), new THREE.Vector3( 0,  -0.1,  0), c, o*0.6),
    ]
  }, [color, opacity])
  return <>{lines.map((l,i) => <primitive key={i} object={l} />)}</>
}

// 3. Falling Envelopes
function EmailRain() {
  const groupRef = useRef<THREE.Group>(null!)
  const data = useMemo(() => Array.from({ length: 30 }, (_, i) => ({
    pos:   [(Math.random()-0.5)*40, (Math.random()-0.5)*30, -10-Math.random()*15] as [number,number,number],
    rot:   [Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI] as [number,number,number],
    speed: 0.01 + Math.random()*0.02,
    spin:  (Math.random()-0.5)*0.01,
    scale: 0.3 + Math.random()*0.4,
    color: i%3===0 ? 0x10b981 : i%3===1 ? 0x9b5de5 : 0xc084fc,
  })), [])

  useFrame(() => {
    if (!groupRef.current) return
    groupRef.current.children.forEach((child, i) => {
      const d = data[i]; if (!d) return
      child.position.y += d.speed
      child.rotation.x += d.spin
      child.rotation.y += d.spin
      if (child.position.y > 15) child.position.y = -15
    })
  })

  return (
    <group ref={groupRef}>
      {data.map((d,i) => (
        <group key={i} position={d.pos} rotation={d.rot} scale={d.scale}>
          <EnvelopeGroup color={d.color} opacity={0.6} />
        </group>
      ))}
    </group>
  )
}

// 4. Stardust Particles
function ParticleNebula() {
  const geoRef = useRef<THREE.BufferGeometry>(null!)
  const { positions, colors } = useMemo(() => {
    const N = 2000
    const pos = new Float32Array(N * 3)
    const col = new Float32Array(N * 3)
    for (let i = 0; i < N; i++) {
      pos[i*3]   = (Math.random() - 0.5) * 50
      pos[i*3+1] = (Math.random() - 0.5) * 50
      pos[i*3+2] = (Math.random() - 0.5) * 30 - 5
      col[i*3]=0.609; col[i*3+1]=0.365; col[i*3+2]=0.898 // Purple
    }
    return { positions: pos, colors: col }
  }, [])

  useFrame(({ clock }) => {
    if (!geoRef.current) return
    const t = clock.getElapsedTime()
    // A subtle floating effect instead of trying to move the whole buffer
    if (geoRef.current) {
        // Need to cast it to any here to bypass the strict type error you might get, 
        // or wrap the bufferGeometry in a mesh/points group to move it cleanly.
        (geoRef.current as any).position = new THREE.Vector3(0, Math.sin(t * 0.1) * 2, 0);
    }
  })

  return (
    <points>
      <bufferGeometry ref={geoRef}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color"    args={[colors, 3]}    />
      </bufferGeometry>
      <pointsMaterial size={0.06} vertexColors transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  )
}

// MAIN EXPORT
export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none bg-bg">
      <Canvas camera={{ position:[0, 0, 15], fov: 55, near:0.1, far:100 }} gl={{ antialias:true, alpha:true }}>
        <Suspense fallback={null}>
          <EmailRain />
          <ParticleNebula />
        </Suspense>
      </Canvas>
    </div>
  )
}