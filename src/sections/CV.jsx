import { motion } from 'framer-motion'
import { GlassCard } from '../components/ui/GlassCard'

const fade = {
  hidden: { opacity: 0, y: 14, filter: 'blur(6px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)' },
}

function Pill({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/75">
      {children}
    </span>
  )
}

export function CVSection() {
  return (
    <section id="cv" className="relative scroll-mt-24">
      <div className="mx-auto max-w-6xl px-5 py-20 lg:py-28">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
          </div>
          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-6">
              <h2 className="text-2xl font-semibold tracking-tight">Currículum</h2>
              <p className="mt-3 text-sm text-white/70">
                Perfil orientado a ciberseguridad, pentesting y desarrollo web.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Pill>eJPT</Pill>
                <Pill>ISO 27001</Pill>
                <Pill>OSINT</Pill>
                <Pill>Análisis de Vulnerabilidades</Pill>
                <Pill>Laravel</Pill>
                <Pill>Wordpress</Pill>
              </div>
            </div>

            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.25 }}
              transition={{ staggerChildren: 0.08 }}
              className="mt-4 grid gap-4"
            >
              <motion.div variants={fade}>
                <GlassCard className="p-6">
                  <h3 className="text-sm font-semibold text-white">Formación</h3>
                  <div className="mt-3 space-y-1 text-sm text-white/75">
                    <div>Ingeniería de Sistemas — Universidad Nacional del Centro del Perú</div>
                    <div className="text-white/60">9.º ciclo (2022 – Actualidad)</div>
                  </div>
                </GlassCard>
              </motion.div>

              <motion.div variants={fade}>
                <GlassCard className="p-6">
                  <h3 className="text-sm font-semibold text-white">Experiencia</h3>
                  <ul className="mt-3 space-y-2 text-sm text-white/75">
                    <li>
                      <div>Practicante en Transformación Digital y Gestión de Datos — OTI UNCP</div>
                    </li>
                    <li>
                      <div>Administrador Web WordPress - </div>
                    </li>
                    <li>
                      <div>Operador - </div>
                    </li>
                  </ul>
                </GlassCard>
              </motion.div>

              <motion.div variants={fade}>
                <GlassCard className="p-6">
                  <h3 className="text-sm font-semibold text-white">Certificaciones</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[
                      'eJPT Junior Penetration Tester - INE',
                      'Ethical Hacking - UNI',
                      'ISO 27001 - UNI',
                      'Pentester Junior - CFC Security',
                      'Git & GitHub - Oracle + Alura',
                      'Prompt Engineering IA - Oracle + Alura',
                      'Scrum Fundamentals - ScrumStudy',
                    ].map((c) => (
                      <Pill key={c}>{c}</Pill>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>

              <motion.div variants={fade}>
                <GlassCard className="p-6">
                  <h3 className="text-sm font-semibold text-white">Habilidades</h3>
                  <div className="mt-4 grid gap-4 sm:grid-cols-3">
                    <div>
                      <div className="text-xs text-white/60">Ciberseguridad</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {['Pentesting', 'Linux', 'OSINT', 'ISO 27001' , 'Análisis de Vulnerabilidades'].map((x) => (
                          <Pill key={x}>{x}</Pill>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-white/60">Desarrollo</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {['Laravel', 'PHP', 'JavaScript', 'MySQL'].map((x) => (
                          <Pill key={x}>{x}</Pill>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-white/60">Herramientas</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {['Burp Suite', 'Wireshark', 'Nmap', 'Git'].map((x) => (
                          <Pill key={x}>{x}</Pill>
                        ))}
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
