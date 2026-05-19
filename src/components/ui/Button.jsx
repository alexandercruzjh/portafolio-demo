import { motion } from 'framer-motion'

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-medium tracking-tight ' +
  'transition will-change-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400/60 '

const variants = {
  primary:
    'bg-white/10 text-white border border-white/15 backdrop-blur-xl ' +
    'shadow-[0_0_0_1px_rgba(255,255,255,0.06)] ' +
    'hover:bg-white/14 hover:border-white/25',
  neon:
    'bg-gradient-to-r from-fuchsia-500/20 via-violet-500/20 to-sky-400/18 ' +
    'text-white border border-white/10 backdrop-blur-xl ' +
    'shadow-[0_0_40px_rgba(168,85,247,0.20)] ' +
    'hover:shadow-[0_0_60px_rgba(56,189,248,0.22)]',
  ghost:
    'bg-transparent text-white/90 border border-white/10 ' +
    'hover:bg-white/8 hover:text-white',
}

export function Button({
  as: Comp = 'a',
  variant = 'primary',
  className = '',
  children,
  ...props
}) {
  const cls = `${base}${variants[variant] ?? variants.primary} ${className}`

  return (
    <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
      <Comp className={cls} {...props}>
        {children}
      </Comp>
    </motion.div>
  )
}
