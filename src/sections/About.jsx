import { motion } from 'framer-motion'
import { GlassCard } from '../components/ui/GlassCard'

export function AboutSection() {
  return (
    <section id="sobre-mi" className="relative scroll-mt-24">
      <div className="mx-auto max-w-6xl px-5 py-20 lg:py-28">
        <div className="flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-3xl"
          >
            <GlassCard className="p-7 sm:p-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold tracking-tight">Sobre Mí</h2>
              </div>
              <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-white/75">
                ¡Hola! Soy Alexander Cruz, estudiante de Ingeniería de Sistemas en 9.º ciclo,
                apasionado por la ciberseguridad, el pentesting y el desarrollo web. Me encanta
                explorar el mundo de la tecnología, identificar vulnerabilidades y crear soluciones
                digitales seguras que aporten valor real a las personas y organizaciones.

                Cuento con conocimientos en Kali Linux, auditoría ISO 27001, SQL, Laravel,
                JavaScript, Git y redes Cisco, así como experiencia en el uso de herramientas como
                Wireshark y Burp Suite. A lo largo de mis proyectos académicos y personales, he
                desarrollado aplicaciones funcionales, seguras y adaptadas a las necesidades del
                usuario.

                Me caracterizo por mi capacidad de autogestión, trabajo en equipo y mentalidad de
                mejora continua. Mi objetivo es especializarme como pentester y contribuir al
                desarrollo de entornos digitales más seguros e innovadores.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {[
                  { t: 'Mentalidad', d: 'Mejora continua · Autogestión' },
                  { t: 'Áreas', d: 'Pentesting · Desarrollo web' },
                  { t: 'Herramientas', d: 'Burp · Wireshark · Nmap' },
                  { t: 'Normas', d: 'Scrum · ISO 27001 · Buenas prácticas' },
                ].map((x) => (
                  <div
                    key={x.t}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur-xl"
                  >
                    <div className="text-xs text-white/60">{x.t}</div>
                    <div className="mt-1 text-sm text-white/85">{x.d}</div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
