'use client'

import dynamic from 'next/dynamic'
import Navbar             from '@/components/Navbar'
import Hero               from '@/components/Hero'
import SubAccountSection  from '@/components/sections/SubAccountSection'
import LedgerSection      from '@/components/sections/LedgerSection'
import LaunchPad          from '@/components/sections/LaunchPad'
import Footer             from '@/components/Footer'
import CustomCursor       from '@/components/ui/CustomCursor'
import SmoothScroll       from '@/components/SmoothScroll'

// Dynamically import the pure 3D WebGL scene
const NeuralBrainScene = dynamic(() => import('@/components/3d/NeuralBrainScene'), { ssr: false })
const FortressSection = dynamic(() => import('@/components/sections/FortressSection'), { ssr: false })

export default function Home() {
  return (
    <SmoothScroll>
      <CustomCursor />
      
      <Navbar />

      {/* LAYER 1: The True 3D Engine (Sits in the deep background, z-index managed inside the component) */}
      <NeuralBrainScene />

      {/* LAYER 2: Your Website Content (Sits in the foreground so it's clickable) */}
      <main style={{ position: 'relative', zIndex: 10 }}>
        <Hero />
        <FortressSection />
        <SubAccountSection />
        <LedgerSection />
        <LaunchPad />
      </main>

      <Footer />
    </SmoothScroll>
  )
}