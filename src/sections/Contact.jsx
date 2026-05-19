import { motion } from 'framer-motion'
import { useState } from 'react'
import { FiArrowRight, FiMail } from 'react-icons/fi'
import { GlassCard } from '../components/ui/GlassCard'
import { Button } from '../components/ui/Button'

const fade = {
  hidden: { opacity: 0, y: 14, filter: 'blur(6px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)' },
}

function buildMailto({ to, name, email, subject, message }) {
  const safeSubject = subject?.trim() || 'Nuevo mensaje desde el portafolio'

  const body = [
    `Nombre: ${name || ''}`,
    `Email: ${email || ''}`,
    '',
    'Mensaje:',
    message || '',
  ].join('\n')

  const qs = new URLSearchParams({
    subject: safeSubject,
    body,
  })

  return `mailto:${to}?${qs.toString()}`
}

export function ContactSection() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')

  const onSubmit = (e) => {
    e.preventDefault()

    const url = buildMailto({
      to: 'alexandercruz@ejemplo.com',
      name,
      email,
      subject,
      message,
    })

    window.location.href = url
  }

  return (
    <section id="contacto" className="relative scroll-mt-24">
      <div className="mx-auto max-w-6xl px-5 py-20 lg:py-28">
        <div className="flex items-end justify-between gap-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Contacto</h2>
            <p className="mt-2 text-sm text-white/70">
              Envíame un mensaje y se preparará un correo automáticamente.
            </p>
          </div>
        </div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          transition={{ staggerChildren: 0.08 }}
          className="mt-10 grid gap-6 lg:grid-cols-12"
        >
          <motion.div variants={fade} className="lg:col-span-7">
            <GlassCard className="p-6 sm:p-7">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-white">Formulario</div>
                  <div className="mt-1 text-sm text-white/70">
                    Al enviar, se abrirá tu cliente de correo con el mensaje armado.
                  </div>
                </div>
                <div className="h-10 w-10 rounded-xl border border-white/10 bg-white/5 grid place-items-center">
                  <FiMail className="text-white/80" />
                </div>
              </div>

              <form onSubmit={onSubmit} className="mt-6 grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-xs text-white/60">Nombre</span>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-white/35 outline-none focus:border-white/20"
                      placeholder="Tu nombre"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-xs text-white/60">Email</span>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      type="email"
                      className="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-white/35 outline-none focus:border-white/20"
                      placeholder="tu@email.com"
                    />
                  </label>
                </div>

                <label className="grid gap-2">
                  <span className="text-xs text-white/60">Asunto</span>
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-white/35 outline-none focus:border-white/20"
                    placeholder="Pentesting, proyecto, propuesta..."
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-xs text-white/60">Mensaje</span>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={6}
                    className="resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none focus:border-white/20"
                    placeholder="Cuéntame qué necesitas..."
                  />
                </label>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <Button as="button" type="submit" variant="neon">
                    Enviar <FiArrowRight className="opacity-80" />
                  </Button>
                  <div className="text-xs text-white/55">
                    Si no se abre el correo, revisa tu app predeterminada.
                  </div>
                </div>
              </form>
            </GlassCard>
          </motion.div>

          <motion.div variants={fade} className="lg:col-span-5">
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
