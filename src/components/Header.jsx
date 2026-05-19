import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'

const nav = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'sobre-mi', label: 'Sobre Mí' },
  { id: 'cv', label: 'CV' },
  { id: 'semanas', label: 'Semanas' },
  { id: 'contacto', label: 'Contacto' },
]

function scrollToId(id) {
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function Header({ activeId }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const items = useMemo(() => nav, [])

  return (
    <header
      className={
        'fixed top-0 left-0 right-0 z-40 ' +
        'border-b transition ' +
        (scrolled
          ? 'border-white/10 bg-zinc-950/55 backdrop-blur-2xl'
          : 'border-transparent bg-zinc-950/25 backdrop-blur-xl')
      }
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <button
          onClick={() => scrollToId('inicio')}
          className="group inline-flex items-center gap-3"
          aria-label="Ir al inicio"
        >
          <span className="relative grid h-10 w-10 place-items-center rounded-xl bg-white/6 border border-white/10 backdrop-blur-xl">
            <img
              src="/favicon.svg"
              alt=""
              aria-hidden="true"
              className="h-10 w-10"
            />
            <span className="pointer-events-none absolute inset-0 rounded-xl shadow-[0_0_24px_rgba(168,85,247,0.18)]" />
          </span>
          <span className="hidden sm:block text-sm text-white/80 group-hover:text-white transition">
            Alexander Cruz
          </span>
        </button>

        <nav className="flex items-center gap-1">
          {items.map((item) => {
            const isActive = item.id === activeId
            return (
              <button
                key={item.id}
                onClick={() => scrollToId(item.id)}
                className={
                  'relative px-3 py-2 text-sm transition ' +
                  (isActive ? 'text-white' : 'text-white/70 hover:text-white')
                }
              >
                {item.label}
                {isActive ? (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute left-3 right-3 -bottom-0.5 h-[2px] rounded-full bg-gradient-to-r from-fuchsia-500 via-violet-500 to-sky-400"
                  />
                ) : null}
              </button>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
