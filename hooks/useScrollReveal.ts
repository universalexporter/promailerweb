'use client'

import { useEffect, RefObject } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * Wires GSAP scroll-triggered reveals inside a section.
 * Usage: Add data attributes to elements:
 *   data-reveal       → fade up
 *   data-reveal-left  → slide from left
 *   data-reveal-right → slide from right
 *   data-stagger      → stagger index (0,1,2…) on feature list items
 */
export function useScrollReveal(ref: RefObject<HTMLElement>) {
  useEffect(() => {
    if (!ref.current) return

    const ctx = gsap.context(() => {
      // ── fade up
      const reveals = ref.current!.querySelectorAll<HTMLElement>('[data-reveal]')
      if (reveals.length) {
        gsap.fromTo(reveals,
          { opacity: 0, y: 38 },
          {
            opacity: 1, y: 0,
            duration: 1.0,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: ref.current,
              start:   'top 82%',
              toggleActions: 'play none none none',
            },
          }
        )
      }

      // ── slide from left
      const lefts = ref.current!.querySelectorAll<HTMLElement>('[data-reveal-left]')
      if (lefts.length) {
        gsap.fromTo(lefts,
          { opacity: 0, x: -52 },
          {
            opacity: 1, x: 0,
            duration: 1.05,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: ref.current,
              start:   'top 82%',
              toggleActions: 'play none none none',
            },
          }
        )
      }

      // ── slide from right
      const rights = ref.current!.querySelectorAll<HTMLElement>('[data-reveal-right]')
      if (rights.length) {
        gsap.fromTo(rights,
          { opacity: 0, x: 52 },
          {
            opacity: 1, x: 0,
            duration: 1.05,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: ref.current,
              start:   'top 82%',
              toggleActions: 'play none none none',
            },
          }
        )
      }

      // ── stagger list items
      const items = ref.current!.querySelectorAll<HTMLElement>('[data-stagger]')
      if (items.length) {
        gsap.fromTo(items,
          { opacity: 0, x: -22, filter: 'blur(4px)' },
          {
            opacity: 1, x: 0,
            filter: 'blur(0px)',
            duration: 0.65,
            ease: 'power2.out',
            stagger: 0.13,
            scrollTrigger: {
              trigger: ref.current,
              start:   'top 78%',
              toggleActions: 'play none none none',
            },
          }
        )
      }
    }, ref)

    return () => ctx.revert()
  }, [ref])
}