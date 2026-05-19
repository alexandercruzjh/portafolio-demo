import { motion } from 'framer-motion'
import { FiArrowRight, FiGithub, FiInstagram, FiLinkedin } from 'react-icons/fi'
import { Button } from '../components/ui/Button'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.12 },
  },
}

const item = {
  hidden: { opacity: 0, y: 18, filter: 'blur(6px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)' },
}

export function HomeSection() {
  return (
    <section id="inicio" className="relative scroll-mt-24">
      <div className="mx-auto max-w-6xl px-5 pt-28 pb-20 lg:pt-32 lg:pb-28">
        <div className="grid items-center gap-10 lg:grid-cols-12">
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.6 }}
            className="lg:col-span-6"
          >
            <motion.h1
              variants={item}
              className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl"
            >
              Lleva tu seguridad digital al siguiente nivel con un Pentesting de calidad
            </motion.h1>

            <motion.p
              variants={item}
              className="mt-5 max-w-xl text-base leading-relaxed text-white/75"
            >
              Hola!! Soy Alexander Cruz, estudiante de Ingeniería de Sistemas apasionado por la
              ciberseguridad, el pentesting y el desarrollo web. Me encanta crear soluciones seguras y
              explorar nuevas tecnologías. ¿Hablamos?
            </motion.p>

            <motion.div variants={item} className="mt-8 flex flex-wrap gap-3">
              <Button variant="ghost" href="https://linkedin.com/in/alexander-cruz-480526351" target="_blank" rel="noreferrer">
                <FiLinkedin /> LinkedIn <FiArrowRight className="opacity-80" />
              </Button>
              <Button variant="ghost" href="https://github.com/alexandercruzjh" target="_blank" rel="noreferrer">
                <FiGithub /> GitHub <FiArrowRight className="opacity-80" />
              </Button>
              <Button variant="ghost" href="https://www.instagram.com/alexandercruzjh/" target="_blank" rel="noreferrer">
                <FiInstagram /> Instagram <FiArrowRight className="opacity-80" />
              </Button>
              <Button
                variant="neon"
                href="#contacto"
                onClick={(e) => {
                  e.preventDefault()
                  document
                    .getElementById('contacto')
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
              >
                Contáctame <FiArrowRight className="opacity-80" />
              </Button>
            </motion.div>

            <motion.div
              variants={item}
              className="mt-10 grid grid-cols-2 gap-3 max-w-xl sm:grid-cols-3"
            >
              {[
                { k: 'Enfoque', v: 'Ciberseguridad' },
                { k: 'Stack', v: 'Laravel · JS' },
                { k: 'Meta', v: 'Pentester · Auditor' },
              ].map((x) => (
                <div
                  key={x.k}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-xl"
                >
                  <div className="text-xs text-white/60">{x.k}</div>
                  <div className="mt-1 text-sm text-white/85">{x.v}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          <div className="relative lg:col-span-6">
            
          </div>
        </div>
      </div>
    </section>
  )
}
