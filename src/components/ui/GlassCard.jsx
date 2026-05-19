import { motion } from 'framer-motion'

export function GlassCard({ className = '', contentClassName = '', children, ...props }) {
  return (
    <motion.div
      className={
        'relative rounded-2xl bg-white/6 border border-white/12 backdrop-blur-2xl ' +
        'shadow-[0_0_0_1px_rgba(255,255,255,0.05)] ' +
        'overflow-hidden ' +
        className
      }
      {...props}
    >
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -top-24 left-8 h-48 w-48 rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="absolute -bottom-28 right-8 h-52 w-52 rounded-full bg-sky-400/10 blur-3xl" />
      </div>
      <div className={'relative ' + contentClassName}>{children}</div>
    </motion.div>
  )
}
