'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function GlobeSequence() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const floatRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return

    canvas.width = 1920
    canvas.height = 1080

    const frameCount = 241
    const currentFrame = (index: number) => 
      `/hero-sequence/ezgif-frame-${String(index + 1).padStart(3, '0')}.jpg`

    const images: HTMLImageElement[] = []
    const globe = { frame: 0 }

    // Preload frames
    for (let i = 0; i < frameCount; i++) {
      const img = new Image()
      img.src = currentFrame(i)
      images.push(img)
    }

    images[0].onload = () => {
      context.drawImage(images[0], 0, 0, canvas.width, canvas.height)
    }

    // 1. SCROLL ANIMATION (The Morphing Engine)
    const tl = gsap.to(globe, {
      frame: frameCount - 1,
      snap: 'frame',
      ease: 'none',
      onUpdate: () => {
        const currentFrameIndex = Math.round(globe.frame)
        if (images[currentFrameIndex]) {
          context.clearRect(0, 0, canvas.width, canvas.height)
          context.drawImage(images[currentFrameIndex], 0, 0, canvas.width, canvas.height)
        }
      }
    })

    ScrollTrigger.create({
      trigger: document.documentElement, 
      start: 'top top',
      end: 'bottom bottom', 
      scrub: 1, 
      animation: tl,
    })

    // 2. CONTINUOUS "ALIVE" ANIMATION (Breathing/Floating)
    // This runs infinitely so the globe is never completely dead/static
    if (floatRef.current) {
      gsap.to(floatRef.current, {
        y: -15,           // Gently floats up
        scale: 1.02,      // Subtly expands like it's breathing
        duration: 3.5,    // Slow and expensive-looking
        repeat: -1,       // Infinite loop
        yoyo: true,       // Reverses back down smoothly
        ease: 'sine.inOut'
      })
    }

    return () => {
      tl.kill()
      ScrollTrigger.getAll().forEach(t => t.kill())
      gsap.killTweensOf(floatRef.current)
    }
  }, [])

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex items-center justify-end overflow-hidden">
      
      {/* Outer wrapper for positioning so GSAP doesn't break CSS transforms */}
      <div className="absolute top-1/2 right-[-5%] w-[120vw] md:w-[75vw] max-w-[1200px] -translate-y-1/2">
        
        {/* Inner wrapper that executes the continuous floating animation */}
        <div ref={floatRef} className="w-full h-auto">
          <canvas 
            ref={canvasRef} 
            className="w-full h-full object-contain mix-blend-screen opacity-95"
            style={{
              // Very subtle boost to make colors pop without deleting the image
              filter: 'contrast(1.15) brightness(1.05)', 
              
              // A much softer, wider mask so the globe stays highly visible but the hard edges fade out
              WebkitMaskImage: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 75%)',
              maskImage: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 75%)',
            }}
          />
        </div>

      </div>
    </div>
  )
}