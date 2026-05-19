import { motion } from 'framer-motion'
import { FiExternalLink } from 'react-icons/fi'
import { GlassCard } from '../components/ui/GlassCard'

const weeks = [
  {
    title: 'Semana 1',
    desc: 'Introducción, fundamentos y contexto del curso.',
    href: 'https://github.com/',
  },
  {
    title: 'Semana 2',
    desc: 'Prácticas iniciales y primeros entregables.',
    href: 'https://github.com/',
  },
  {
    title: 'Semana 3',
    desc: 'Análisis, evidencias y documentación técnica.',
    href: 'https://github.com/',
  },
  {
    title: 'Semana 4',
    desc: 'Ejercicios, reporte y mejoras iterativas.',
    href: 'https://github.com/',
  },
  {
    title: 'Semana 5',
    desc: 'Aplicación práctica con enfoque en seguridad.',
    href: 'https://github.com/',
  },
  {
    title: 'Semana 6',
    desc: 'Consolidación final y evidencia de resultados.',
    href: 'https://github.com/',
  },
]

export function WeeksSection() {
  return (
    <section id="semanas" className="relative scroll-mt-24">
      <div className="mx-auto max-w-6xl px-5 py-20 lg:py-28">
        <div className="flex items-end justify-between gap-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Evidencias del Curso</h2>
            <p className="mt-2 text-sm text-white/70">Semanas y actividades</p>
          </div>
        </div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          transition={{ staggerChildren: 0.06 }}
          className="mt-10 grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {weeks.map((w) => (
            <motion.div
              key={w.title}
              variants={{
                hidden: { opacity: 0, y: 14, filter: 'blur(6px)' },
                show: { opacity: 1, y: 0, filter: 'blur(0px)' },
              }}
              className="h-full"
            >
              <GlassCard
                className="group h-full p-6 transition"
                contentClassName="flex h-full flex-col"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-white">{w.title}</div>
                    <div className="mt-2 text-sm text-white/70">{w.desc}</div>
                  </div>
                </div>

                <div className="mt-auto pt-6">
                  <a
                    href={w.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 backdrop-blur-xl transition group-hover:border-white/20 group-hover:text-white"
                  >
                    Ver enlace <FiExternalLink className="opacity-80" />
                  </a>
                </div>

                <div className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100">
                  <div className="absolute -inset-12 bg-gradient-to-r from-fuchsia-500/12 via-violet-500/10 to-sky-400/10 blur-2xl" />
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
