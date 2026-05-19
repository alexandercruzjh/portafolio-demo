import { useEffect, useRef } from 'react'

export function MouseGlow() {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let raf = 0
    let mx = window.innerWidth * 0.5
    let my = window.innerHeight * 0.35

    const onMove = (e) => {
      mx = e.clientX
      my = e.clientY
    }

    const loop = () => {
      el.style.transform = `translate(${mx - 250}px, ${my - 250}px)`
      raf = requestAnimationFrame(loop)
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    raf = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-10 h-[500px] w-[500px] rounded-full blur-3xl"
      style={{
        background:
          'radial-gradient(circle at 30% 30%, rgba(168, 85, 247, 0.22), transparent 55%),' +
          'radial-gradient(circle at 70% 60%, rgba(56, 189, 248, 0.14), transparent 55%),' +
          'radial-gradient(circle at 40% 80%, rgba(244, 114, 182, 0.10), transparent 60%)',
        opacity: 0.9,
      }}
    />
  )
}
