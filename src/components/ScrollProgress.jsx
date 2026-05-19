import { motion, useScroll, useSpring } from 'framer-motion'

export function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 160, damping: 30, mass: 0.2 })

  return (
    <motion.div
      aria-hidden="true"
      className="fixed left-0 top-0 z-50 h-[2px] w-full origin-left bg-gradient-to-r from-fuchsia-500 via-violet-500 to-sky-400 opacity-90"
      style={{ scaleX }}
    />
  )
}
