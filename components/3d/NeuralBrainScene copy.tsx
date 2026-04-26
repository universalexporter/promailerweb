/// <reference types="@react-three/fiber" />
'use client'

import { useRef, useEffect, useMemo, Suspense, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// ════════════════════════════════════════════════════════════════
//  SHARED GEOMETRY UTILS
// ════════════════════════════════════════════════════════════════
function makeLine(p1: THREE.Vector3, p2: THREE.Vector3, color: number, opacity: number) {
  const g = new THREE.BufferGeometry().setFromPoints([p1, p2])
  const m = new THREE.LineBasicMaterial({ color, transparent: true, opacity })
  return new THREE.Line(g, m)
}

// ════════════════════════════════════════════════════════════════
//  ENVELOPE LINES INSIDE GLOBE
//  Small envelope wireframes that float inside the liquid globe,
//  visible through the transparent glass layers
// ════════════════════════════════════════════════════════════════
function InnerEnvelopes() {
  const groupRef = useRef<THREE.Group>(null!)

  const envData = useMemo(() => Array.from({ length: 6 }, (_, i) => ({
    pos:   [
      (Math.random() - 0.5) * 2.0,
      (Math.random() - 0.5) * 2.0,
      (Math.random() - 0.5) * 2.0,
    ] as [number, number, number],
    rot:   [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI] as [number, number, number],
    scale: 0.22 + Math.random() * 0.18,
    speed: 0.18 + Math.random() * 0.22,
    orbitR: 0.5 + Math.random() * 0.8,
    phase:  (i / 6) * Math.PI * 2,
    tilt:   (Math.random() - 0.5) * 1.2,
    color:  i % 2 === 0 ? 0x10b981 : 0xc084fc,
    opacity: 0.55 + Math.random() * 0.35,
  })), [])

  const lines = useMemo(() => {
    return envData.map(d => {
      const s = d.scale, c = d.color, o = d.opacity
      return [
        makeLine(new THREE.Vector3(-0.8*s,-0.55*s,0), new THREE.Vector3( 0.8*s,-0.55*s,0), c, o*0.9),
        makeLine(new THREE.Vector3( 0.8*s,-0.55*s,0), new THREE.Vector3( 0.8*s, 0.55*s,0), c, o*0.9),
        makeLine(new THREE.Vector3( 0.8*s, 0.55*s,0), new THREE.Vector3(-0.8*s, 0.55*s,0), c, o*0.9),
        makeLine(new THREE.Vector3(-0.8*s, 0.55*s,0), new THREE.Vector3(-0.8*s,-0.55*s,0), c, o*0.9),
        makeLine(new THREE.Vector3(-0.8*s, 0.55*s,0), new THREE.Vector3(0, 0, 0),           c, o),
        makeLine(new THREE.Vector3( 0.8*s, 0.55*s,0), new THREE.Vector3(0, 0, 0),           c, o),
        makeLine(new THREE.Vector3(-0.8*s,-0.55*s,0), new THREE.Vector3(0,-0.1*s,0),        c, o*0.55),
        makeLine(new THREE.Vector3( 0.8*s,-0.55*s,0), new THREE.Vector3(0,-0.1*s,0),        c, o*0.55),
      ]
    })
  }, [envData])

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.getElapsedTime()
    groupRef.current.children.forEach((child, i) => {
      const d = envData[i]; if (!d) return
      const angle = d.phase + t * d.speed
      child.position.x = Math.cos(angle) * d.orbitR
      child.position.z = Math.sin(angle) * d.orbitR * Math.cos(d.tilt)
      child.position.y = Math.sin(angle) * d.orbitR * Math.sin(d.tilt)
      child.rotation.x += 0.012
      child.rotation.y = -angle
      // Opacity pulse in sync with globe heartbeat
      const pulse = Math.sin(t * 2.8 + d.phase) * 0.5 + 0.5
      child.children.forEach(ln => {
        const mat = (ln as THREE.Line).material as THREE.LineBasicMaterial
        if (mat) mat.opacity = d.opacity * (0.4 + pulse * 0.6)
      })
    })
  })

  return (
    <group ref={groupRef}>
      {envData.map((d, i) => (
        <group key={i} position={d.pos} rotation={d.rot}>
          {lines[i].map((l, j) => <primitive key={j} object={l} />)}
        </group>
      ))}
    </group>
  )
}

// ════════════════════════════════════════════════════════════════
//  LIQUID GLOBE — improved with colour-cycling purple↔green lights,
//  stronger glow, envelope shapes visible inside the glass
// ════════════════════════════════════════════════════════════════
function LiquidGlobe({ sending }: { sending: boolean }) {
  const outerRef  = useRef<THREE.Mesh>(null!)
  const innerRef  = useRef<THREE.Mesh>(null!)
  const glowRef   = useRef<THREE.Mesh>(null!)
  const halo2Ref  = useRef<THREE.Mesh>(null!)
  const wire1Ref  = useRef<THREE.Mesh>(null!)
  const wire2Ref  = useRef<THREE.Mesh>(null!)
  const rimRef    = useRef<THREE.Mesh>(null!)
  const pLight1   = useRef<THREE.PointLight>(null!)
  const pLight2   = useRef<THREE.PointLight>(null!)
  const pLight3   = useRef<THREE.PointLight>(null!)
  // Colour-cycling lights — shift between purple and green over ~16s
  const pLight4   = useRef<THREE.PointLight>(null!)
  const pLight5   = useRef<THREE.PointLight>(null!)

  const origPos1  = useRef<Float32Array | null>(null)
  const origPos2  = useRef<Float32Array | null>(null)

  useEffect(() => {
    if (outerRef.current) origPos1.current = new Float32Array(outerRef.current.geometry.attributes.position.array)
    if (innerRef.current) origPos2.current = new Float32Array(innerRef.current.geometry.attributes.position.array)
  }, [])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const sendMult = sending ? 2.5 : 1.0

    // ── LIQUID MORPH outer — slightly stronger wave
    if (outerRef.current && origPos1.current) {
      const pos  = outerRef.current.geometry.attributes.position
      const arr  = pos.array as Float32Array
      const orig = origPos1.current
      for (let i = 0; i < arr.length; i += 3) {
        const nx = orig[i], ny = orig[i+1], nz = orig[i+2]
        const len = Math.sqrt(nx*nx + ny*ny + nz*nz)
        const wave = Math.sin(t * 1.4 * sendMult + nx * 2.1 + ny * 1.7 + nz * 1.9) * 0.17
                   + Math.sin(t * 0.9 * sendMult + nx * 3.3 + nz * 2.8) * 0.09
        const r = len + wave
        arr[i] = (nx/len)*r; arr[i+1] = (ny/len)*r; arr[i+2] = (nz/len)*r
      }
      pos.needsUpdate = true
      outerRef.current.geometry.computeVertexNormals()
    }

    // ── LIQUID MORPH inner
    if (innerRef.current && origPos2.current) {
      const pos  = innerRef.current.geometry.attributes.position
      const arr  = pos.array as Float32Array
      const orig = origPos2.current
      for (let i = 0; i < arr.length; i += 3) {
        const nx = orig[i], ny = orig[i+1], nz = orig[i+2]
        const len = Math.sqrt(nx*nx + ny*ny + nz*nz)
        const wave = Math.sin(t * 1.8 * sendMult + nx * 3.0 - ny * 2.2 + nz * 1.5) * 0.11
        const r = len + wave
        arr[i] = (nx/len)*r; arr[i+1] = (ny/len)*r; arr[i+2] = (nz/len)*r
      }
      pos.needsUpdate = true
      innerRef.current.geometry.computeVertexNormals()
    }

    const beat  = Math.sin(t * (sending ? 5.5 : 2.8)) * 0.5 + 0.5
    const beat2 = Math.sin(t * 1.4 + Math.PI) * 0.5 + 0.5

    // Fixed lights
    if (pLight1.current) pLight1.current.intensity = 14 + beat * 20 * sendMult
    if (pLight2.current) pLight2.current.intensity = 7   + beat2 * 11
    if (pLight3.current) pLight3.current.intensity = sending ? 9 + beat * 13 : 3

    // ── COLOUR-CYCLING LIGHTS — purple ↔ green over ~16 s
    if (pLight4.current) {
      const c4 = (Math.sin(t * 0.39) + 1) / 2          // 0→1
      pLight4.current.color.setRGB(0.43 - c4*0.37, c4*0.72, 0.61 - c4*0.41)
      pLight4.current.intensity = 11 + Math.sin(t*0.75 + 1.2) * 6
    }
    if (pLight5.current) {
      const c5 = (Math.sin(t * 0.39 + Math.PI) + 1) / 2 // opposite phase
      pLight5.current.color.setRGB(0.43 - c5*0.37, c5*0.72, 0.61 - c5*0.41)
      pLight5.current.intensity = 9 + Math.sin(t*0.65 + 2.5) * 5
    }

    // Glow halos breathe — bigger range
    if (glowRef.current) {
      glowRef.current.scale.setScalar(1.0 + Math.sin(t * 1.2) * 0.10)
      ;(glowRef.current.material as THREE.MeshBasicMaterial).opacity = 0.06 + beat * 0.09
    }
    if (halo2Ref.current) {
      ;(halo2Ref.current.material as THREE.MeshBasicMaterial).opacity = 0.025 + beat * 0.03
    }
    if (rimRef.current) {
      ;(rimRef.current.material as THREE.MeshBasicMaterial).opacity = 0.20 + beat * 0.18
    }

    // Wire opacity
    if (wire1Ref.current) (wire1Ref.current.material as THREE.MeshBasicMaterial).opacity = 0.50 + beat * 0.28
    if (wire2Ref.current) (wire2Ref.current.material as THREE.MeshBasicMaterial).opacity = 0.22 + beat2 * 0.15
  })

  return (
    <>
      {/* Fixed lights */}
      <pointLight ref={pLight1} color="#9b5de5" intensity={14} distance={40} />
      <pointLight ref={pLight2} color="#10b981" intensity={7}  distance={30} position={[4,3,3]} />
      <pointLight ref={pLight3} color="#c084fc" intensity={3}  distance={20} position={[-3,-2,4]} />
      {/* Colour-cycling lights — alternate purple ↔ green */}
      <pointLight ref={pLight4} color="#9b5de5" intensity={11} distance={36} position={[2,-1,3]} />
      <pointLight ref={pLight5} color="#10b981" intensity={9}  distance={30} position={[-2,2,-2]} />

      {/* Outer liquid surface */}
      <mesh ref={outerRef}>
        <icosahedronGeometry args={[2, 6]} />
        <meshPhongMaterial color="#5a2a8a" emissive="#3a1060" emissiveIntensity={0.9}
          transparent opacity={0.28} side={THREE.DoubleSide} shininess={140} />
      </mesh>

      {/* Primary wireframe */}
      <mesh ref={wire1Ref} scale={1.02}>
        <icosahedronGeometry args={[2, 5]} />
        <meshBasicMaterial color="#9b5de5" wireframe transparent opacity={0.52} />
      </mesh>

      {/* Secondary outer wireframe */}
      <mesh ref={wire2Ref} scale={1.16}>
        <icosahedronGeometry args={[2, 2]} />
        <meshBasicMaterial color="#6c3b9c" wireframe transparent opacity={0.22} />
      </mesh>

      {/* Inner glowing core */}
      <mesh ref={innerRef}>
        <icosahedronGeometry args={[1.5, 5]} />
        <meshPhongMaterial color="#7c3aed" emissive="#4c1d95" emissiveIntensity={1.4}
          transparent opacity={0.38} shininess={220} />
      </mesh>

      {/* Innermost solid glow ball */}
      <mesh>
        <sphereGeometry args={[0.9, 32, 32]} />
        <meshBasicMaterial color="#9b5de5" transparent opacity={0.58} />
      </mesh>

      {/* Rim backside glow */}
      <mesh ref={rimRef}>
        <icosahedronGeometry args={[2.08, 4]} />
        <meshBasicMaterial color="#9b5de5" transparent opacity={0.20} side={THREE.BackSide} />
      </mesh>

      {/* Primary atmospheric halo */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[3.5, 32, 32]} />
        <meshBasicMaterial color="#7c3aed" transparent opacity={0.06} side={THREE.BackSide} />
      </mesh>

      {/* Second wider halo — green tint */}
      <mesh ref={halo2Ref}>
        <sphereGeometry args={[4.2, 16, 16]} />
        <meshBasicMaterial color="#10b981" transparent opacity={0.025} side={THREE.BackSide} />
      </mesh>

      {/* Glass highlight spots */}
      <mesh position={[-0.65, 0.75, 1.7]}><sphereGeometry args={[0.20, 12, 12]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.14} /></mesh>
      <mesh position={[ 0.40,-0.50, 1.8]}><sphereGeometry args={[0.10,  8,  8]} /><meshBasicMaterial color="#c084fc" transparent opacity={0.22} /></mesh>
      <mesh position={[ 1.00, 0.30, 1.4]}><sphereGeometry args={[0.08,  8,  8]} /><meshBasicMaterial color="#10b981" transparent opacity={0.18} /></mesh>

      {/* Envelopes orbiting INSIDE the globe */}
      <InnerEnvelopes />
    </>
  )
}

// ════════════════════════════════════════════════════════════════
//  ORBITAL RINGS — unchanged
// ════════════════════════════════════════════════════════════════
function OrbitalRings({ sending }: { sending: boolean }) {
  const refs = [
    useRef<THREE.Mesh>(null!),
    useRef<THREE.Mesh>(null!),
    useRef<THREE.Mesh>(null!),
    useRef<THREE.Mesh>(null!),
  ]

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const mult = sending ? 3.0 : 1.0
    if (refs[0].current) refs[0].current.rotation.z = t * 0.25 * mult
    if (refs[1].current) refs[1].current.rotation.x = t * 0.18 * mult
    if (refs[2].current) { refs[2].current.rotation.z = -t * 0.12 * mult; refs[2].current.rotation.y = t * 0.08 * mult }
    if (refs[3].current) refs[3].current.rotation.x = -t * 0.09 * mult
    if (sending) {
      const p = Math.sin(t * 4) * 0.3 + 0.7
      if (refs[0].current) (refs[0].current.material as THREE.MeshBasicMaterial).opacity = 0.7 * p
      if (refs[1].current) (refs[1].current.material as THREE.MeshBasicMaterial).opacity = 0.55 * p
    }
  })

  return (
    <>
      <mesh ref={refs[0]} rotation={[Math.PI/2, 0, 0]}><torusGeometry args={[3.3, 0.045, 8, 128]} /><meshBasicMaterial color="#9b5de5" transparent opacity={0.65} /></mesh>
      <mesh ref={refs[1]} rotation={[Math.PI/4, 0, 0]}><torusGeometry args={[4.0, 0.028, 6, 128]} /><meshBasicMaterial color="#10b981" transparent opacity={0.42} /></mesh>
      <mesh ref={refs[2]} rotation={[0, Math.PI/6, Math.PI/3]}><torusGeometry args={[5.2, 0.02, 6, 160]} /><meshBasicMaterial color="#6c3b9c" transparent opacity={0.28} /></mesh>
      <mesh ref={refs[3]} rotation={[Math.PI/6, Math.PI/4, 0]}><torusGeometry args={[2.6, 0.036, 8, 80]} /><meshBasicMaterial color="#c084fc" transparent opacity={0.50} /></mesh>
    </>
  )
}

// ════════════════════════════════════════════════════════════════
//  PARTICLE NEBULA — unchanged
// ════════════════════════════════════════════════════════════════
function ParticleNebula() {
  const geoRef = useRef<THREE.BufferGeometry>(null!)

  const { positions, colors, speeds, phases } = useMemo(() => {
    const N = 3600
    const pos = new Float32Array(N * 3)
    const col = new Float32Array(N * 3)
    const spd = new Float32Array(N)
    const phs = new Float32Array(N)
    for (let i = 0; i < N; i++) {
      const r = 3.8 + Math.random() * 7.5
      const t = Math.random() * Math.PI * 2
      const p = Math.acos(2 * Math.random() - 1)
      pos[i*3]   = r * Math.sin(p) * Math.cos(t)
      pos[i*3+1] = r * Math.sin(p) * Math.sin(t)
      pos[i*3+2] = r * Math.cos(p)
      const tone = Math.random()
      if      (tone > 0.68) { col[i*3]=0.063;  col[i*3+1]=0.725; col[i*3+2]=0.506 }
      else if (tone > 0.38) { col[i*3]=0.609;  col[i*3+1]=0.365; col[i*3+2]=0.898 }
      else                  { col[i*3]=0.424;  col[i*3+1]=0.231; col[i*3+2]=0.612 }
      spd[i] = 0.04 + Math.random() * 0.18
      phs[i] = Math.random() * Math.PI * 2
    }
    return { positions: pos, colors: col, speeds: spd, phases: phs }
  }, [])

  useFrame(({ clock }) => {
    if (!geoRef.current) return
    const t   = clock.getElapsedTime()
    const arr = geoRef.current.attributes.position.array as Float32Array
    for (let i = 0; i < 900; i++) {
      arr[i*3]   += Math.sin(t * speeds[i] + phases[i]) * 0.003
      arr[i*3+1] += Math.cos(t * speeds[i] * 0.7 + phases[i]) * 0.003
      arr[i*3+2] += Math.sin(t * speeds[i] * 0.5 + phases[i] * 1.3) * 0.002
    }
    geoRef.current.attributes.position.needsUpdate = true
  })

  return (
    <points>
      <bufferGeometry ref={geoRef}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color"    args={[colors, 3]}    />
      </bufferGeometry>
      <pointsMaterial size={0.058} vertexColors transparent opacity={0.88}
        sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  )
}

// ════════════════════════════════════════════════════════════════
//  SYNAPSE WEB — unchanged
// ════════════════════════════════════════════════════════════════
function SynapseWeb({ positions }: { positions: Float32Array }) {
  const objects = useMemo(() => {
    const lines: THREE.Line[] = []
    const N = positions.length / 3
    for (let a = 0, found = 0; a < 6000 && found < 180; a++) {
      const i = Math.floor(Math.random() * N)
      const j = Math.floor(Math.random() * N)
      const p1 = new THREE.Vector3(positions[i*3], positions[i*3+1], positions[i*3+2])
      const p2 = new THREE.Vector3(positions[j*3], positions[j*3+1], positions[j*3+2])
      if (p1.distanceTo(p2) > 4.8) continue
      lines.push(makeLine(p1, p2, found%2===0 ? 0x6c3b9c : 0x10b981, 0.07 + Math.random()*0.16))
      found++
    }
    return lines
  }, [positions])
  return <>{objects.map((l,i) => <primitive key={i} object={l} />)}</>
}

// ════════════════════════════════════════════════════════════════
//  EMAIL ENVELOPE COMPONENT — unchanged
// ════════════════════════════════════════════════════════════════
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

// ════════════════════════════════════════════════════════════════
//  FLOATING EMAIL RAIN — unchanged
// ════════════════════════════════════════════════════════════════
function EmailRain() {
  const groupRef = useRef<THREE.Group>(null!)

  const data = useMemo(() => Array.from({ length: 24 }, (_, i) => ({
    pos:   [(Math.random()-0.5)*34, (Math.random()-0.5)*22, -10-Math.random()*14] as [number,number,number],
    rot:   [Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI] as [number,number,number],
    speed: 0.006 + Math.random()*0.01,
    spin:  (Math.random()-0.5)*0.007,
    scale: 0.24 + Math.random()*0.36,
    phase: Math.random()*Math.PI*2,
    color: i%3===0 ? 0x10b981 : i%3===1 ? 0x9b5de5 : 0xc084fc,
    opacity: 0.45 + Math.random()*0.45,
  })), [])

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.getElapsedTime()
    groupRef.current.children.forEach((child, i) => {
      const d = data[i]; if (!d) return
      child.position.y += d.speed
      child.rotation.x += 0.004
      child.rotation.y += d.spin
      child.rotation.z += 0.002
      if (child.position.y > 14) child.position.y = -14
      child.scale.setScalar(d.scale * (0.9 + Math.sin(t*1.3+d.phase)*0.1))
    })
  })

  return (
    <group ref={groupRef}>
      {data.map((d,i) => (
        <group key={i} position={d.pos} rotation={d.rot} scale={d.scale}>
          <EnvelopeGroup color={d.color} opacity={d.opacity} />
        </group>
      ))}
    </group>
  )
}

// ════════════════════════════════════════════════════════════════
//  MAIL BURST — unchanged
// ════════════════════════════════════════════════════════════════
type BurstItem = { pos: THREE.Vector3; vel: THREE.Vector3; life: number; maxLife: number; color: number; active: boolean }

function MailBurst({ sending }: { sending: boolean }) {
  const groupRef = useRef<THREE.Group>(null!)
  const items    = useRef<BurstItem[]>(
    Array.from({ length: 120 }, () => ({ pos: new THREE.Vector3(), vel: new THREE.Vector3(), life: 0, maxLife: 1, color: 0x10b981, active: false }))
  )
  const pool = useRef(0)

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.getElapsedTime()
    if (sending) {
      const count = Math.floor(Math.random()*3)+2
      for (let s=0; s<count; s++) {
        const slot = items.current[pool.current % 120]; pool.current++
        const angle = Math.random()*Math.PI*2, elev = (Math.random()-0.5)*Math.PI, speed = 0.05 + Math.random()*0.12
        slot.pos.set((Math.random()-0.5)*0.8, (Math.random()-0.5)*0.8, (Math.random()-0.5)*0.8)
        slot.vel.set(Math.cos(angle)*Math.cos(elev)*speed, Math.sin(elev)*speed, Math.sin(angle)*Math.cos(elev)*speed)
        slot.life = 0; slot.maxLife = 55 + Math.random()*70; slot.color = Math.random()>0.5 ? 0x10b981 : 0x9b5de5; slot.active = true
      }
    }
    items.current.forEach((item, i) => {
      const child = groupRef.current?.children[i]; if (!child) return
      if (!item.active) { child.visible = false; return }
      item.pos.add(item.vel); item.vel.multiplyScalar(0.97); item.life++
      if (item.life >= item.maxLife) { item.active = false; child.visible = false; return }
      const pct = item.life / item.maxLife, fade = pct < 0.15 ? pct/0.15 : 1-((pct-0.15)/0.85)
      child.visible = true; child.position.copy(item.pos)
      child.rotation.x = t * 3 + i; child.rotation.y = t * 2 + i * 0.5
      child.scale.setScalar(0.14 * fade + 0.04)
      child.children.forEach(line => { const mat = (line as THREE.Line).material as THREE.LineBasicMaterial; if (mat) { mat.opacity = fade * 0.9; mat.color.set(item.color) } })
    })
  })

  return (
    <group ref={groupRef}>
      {items.current.map((_,i) => (<group key={i} visible={false}><EnvelopeGroup color={0x10b981} opacity={0.9} /></group>))}
    </group>
  )
}

// ════════════════════════════════════════════════════════════════
//  DATA STREAMS — unchanged
// ════════════════════════════════════════════════════════════════
function DataStreams() {
  const groupRef = useRef<THREE.Group>(null!)
  const streams = useMemo(() => Array.from({ length: 60 }, (_, i) => {
    const len = 2.0 + Math.random()*4.5, col = i%3===0 ? 0x10b981 : i%3===1 ? 0x9b5de5 : 0x6c3b9c
    const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0), new THREE.Vector3(len,0,0)])
    const m = new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.4 })
    return { obj: new THREE.Line(g, m), y:(Math.random()-0.5)*20, z:-5-Math.random()*12, x:(Math.random()-0.5)*36, speed:0.03+Math.random()*0.08, phase:Math.random()*Math.PI*2, baseOp:0.22+Math.random()*0.42 }
  }), [])

  useEffect(() => {
    const g = groupRef.current
    streams.forEach(s => { s.obj.position.set(s.x, s.y, s.z); g.add(s.obj) })
    return () => { streams.forEach(s => g.remove(s.obj)) }
  }, [streams])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    streams.forEach(s => {
      s.obj.position.x -= s.speed
      if (s.obj.position.x < -22) s.obj.position.x = 22
      ;(s.obj.material as THREE.LineBasicMaterial).opacity = s.baseOp * (0.4 + Math.sin(t*2.8+s.phase)*0.6)
    })
  })

  return <group ref={groupRef} />
}

// ════════════════════════════════════════════════════════════════
//  BACKGROUND GRID — unchanged
// ════════════════════════════════════════════════════════════════
function BackGrid() {
  const grid = useMemo(() => {
    const g = new THREE.GridHelper(90, 60, 0x4a1f6e, 0x2a0f45)
    ;(g.material as THREE.LineBasicMaterial).transparent = true
    ;(g.material as THREE.LineBasicMaterial).opacity     = 0.1
    g.position.y = -9
    return g
  }, [])
  return <primitive object={grid} />
}

// ════════════════════════════════════════════════════════════════
//  ORB CONTAINER — GSAP scroll timeline, mobile scale fix
// ════════════════════════════════════════════════════════════════
function OrbContainer({ sending, isMobile }: { sending: boolean; isMobile: boolean }) {
  const groupRef = useRef<THREE.Group>(null!)

  const particlePos = useMemo(() => {
    const N = 3600; const pos = new Float32Array(N*3)
    for (let i=0; i<N; i++) {
      const r=3.8+Math.random()*7.5, t=Math.random()*Math.PI*2, p=Math.acos(2*Math.random()-1)
      pos[i*3]=r*Math.sin(p)*Math.cos(t); pos[i*3+1]=r*Math.sin(p)*Math.sin(t); pos[i*3+2]=r*Math.cos(p)
    }
    return pos
  }, [])

  useEffect(() => {
    if (!groupRef.current) return
    const g = groupRef.current

    // ── MOBILE: smaller scale, right-side start so text is visible
    if (isMobile) {
      g.position.set(2.5, -0.3, 0)
      g.scale.setScalar(0.42)   // significantly smaller on mobile
    } else {
      g.position.set(5.5, -0.5, 0)
      g.scale.setScalar(1.0)
    }

    const tl = gsap.timeline({
      scrollTrigger: { trigger: 'body', start: 'top top', end: 'bottom bottom', scrub: 2.5 },
    })

    if (isMobile) {
      // Mobile: gentle movement, stays visible and small
      tl.to(g.position, { x:-2.2, y:1.0, z:0, duration:1 }, 0)
        .to(g.rotation,  { y:Math.PI*0.75, x:0.3, z:0.1, duration:1 }, 0)
        .to(g.scale,     { x:0.36, y:0.36, z:0.36, duration:0.35 }, 1)
        .to(g.position,  { x:2.2,  y:-0.7, z:0, duration:1 }, 1)
        .to(g.rotation,  { y:Math.PI*1.75, x:-0.25, z:0.4, duration:1 }, 1)
        .to(g.scale,     { x:0.42, y:0.42, z:0.42, duration:0.7 }, 2)
        .to(g.position,  { x:2.0,  y:0,    z:0, duration:1 }, 2)
        .to(g.rotation,  { y:Math.PI*2.6,  x:0,    z:0, duration:1 }, 2)
        .to(g.position,  { x:0,    y:0,    z:0, duration:1 }, 3)
        .to(g.scale,     { x:0.55, y:0.55, z:0.55, duration:1 }, 3)
        .to(g.rotation,  { y:Math.PI*3.5,  x:0.1,  z:0, duration:1 }, 3)
    } else {
      tl.to(g.position, { x:-5.8, y:1.2, z:0, duration:1 }, 0)
        .to(g.rotation,  { y:Math.PI*0.75, x:0.35, z:0.1, duration:1 }, 0)
        .to(g.scale,     { x:1.05, y:1.05, z:1.05, duration:0.8 }, 0)
        .to(g.scale,     { x:0.68, y:0.68, z:0.68, duration:0.35 }, 1)
        .to(g.position,  { x:5.2,  y:-0.9, z:0, duration:1 }, 1)
        .to(g.rotation,  { y:Math.PI*1.75, x:-0.3, z:0.45, duration:1 }, 1)
        .to(g.scale,     { x:1.2,  y:1.2,  z:1.2,  duration:0.7 }, 2)
        .to(g.position,  { x:4.8,  y:0,    z:0, duration:1 }, 2)
        .to(g.rotation,  { y:Math.PI*2.6,  x:0,    z:0, duration:1 }, 2)
        .to(g.position,  { x:0,    y:0,    z:-1, duration:1 }, 3)
        .to(g.scale,     { x:1.7,  y:1.7,  z:1.7,  duration:1 }, 3)
        .to(g.rotation,  { y:Math.PI*3.5,  x:0.1,  z:0, duration:1 }, 3)
    }

    return () => { tl.kill(); ScrollTrigger.getAll().forEach(s => s.kill()) }
  }, [isMobile])

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.x += 0.0005
      groupRef.current.rotation.y += 0.0012
    }
  })

  return (
    <group ref={groupRef}>
      <LiquidGlobe sending={sending} />
      <OrbitalRings sending={sending} />
      <ParticleNebula />
      <SynapseWeb positions={particlePos} />
      <MailBurst sending={sending} />
    </group>
  )
}

// ════════════════════════════════════════════════════════════════
//  CAMERA RIG
// ════════════════════════════════════════════════════════════════
function CameraRig({ isMobile }: { isMobile: boolean }) {
  const { camera } = useThree()
  useEffect(() => { camera.position.set(0, 0, isMobile ? 15 : 14) }, [camera, isMobile])
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    camera.position.x += (Math.sin(t*0.11)*0.55 - camera.position.x*0.005)*0.025
    camera.position.y += (Math.cos(t*0.08)*0.35 - camera.position.y*0.005)*0.025
    camera.lookAt(0, 0, 0)
  })
  return null
}

// ════════════════════════════════════════════════════════════════
//  MAIN EXPORT
// ════════════════════════════════════════════════════════════════
export default function NeuralBrainScene() {
  const [sending,  setSending]  = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 680)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const handler = (e: Event) => setSending((e as CustomEvent).detail.active)
    window.addEventListener('promail:sending', handler)
    return () => window.removeEventListener('promail:sending', handler)
  }, [])

  return (
    <div style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none' }}>
      <Canvas
        camera={{ position:[0, 0, isMobile ? 15 : 14], fov: isMobile ? 44 : 55, near:0.1, far:400 }}
        gl={{ antialias:true, alpha:true, powerPreference:'high-performance' }}
        style={{ background:'transparent', width:'100%', height:'100%' }}
        dpr={[1, isMobile ? 1.2 : 2]}
      >
        <Suspense fallback={null}>
          <ambientLight color="#0a0515" intensity={2.0} />
          <pointLight color="#10b981" intensity={3.5} distance={55} position={[12, 7, 4]} />
          <pointLight color="#9b5de5" intensity={2.5} distance={50} position={[-10,-6, 7]} />
          <pointLight color="#ffffff" intensity={1.0} distance={35} position={[0,  10, 6]} />

          <EmailRain />
          <DataStreams />
          <OrbContainer sending={sending} isMobile={isMobile} />
          <BackGrid />
          <CameraRig isMobile={isMobile} />
        </Suspense>
      </Canvas>
    </div>
  )
}