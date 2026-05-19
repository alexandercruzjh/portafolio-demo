import { Header } from './components/Header'
import { MouseGlow } from './components/MouseGlow'
import { ParticleRocketCanvas } from './components/ParticleRocketCanvas'
import { ScrollProgress } from './components/ScrollProgress'
import { useActiveSection } from './hooks/useActiveSection'
import { AboutSection } from './sections/About'
import { ContactSection } from './sections/Contact'
import { CVSection } from './sections/CV'
import { HomeSection } from './sections/Home'
import { WeeksSection } from './sections/Weeks'
import { useMemo } from 'react'

export default function App() {
  const sectionIds = useMemo(() => ['inicio', 'sobre-mi', 'cv', 'semanas', 'contacto'], [])
  const active = useActiveSection(sectionIds)

  return (
    <div className="relative min-h-screen bg-cyber-grid">
      <ScrollProgress />
      <ParticleRocketCanvas />
      <MouseGlow />

      <Header activeId={active} />

      <main className="relative z-20">
        <HomeSection />
        <AboutSection />
        <CVSection />
        <WeeksSection />
        <ContactSection />

        <footer className="mx-auto max-w-6xl px-5 pb-14 pt-10">
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-2xl px-6 py-5 text-sm text-white/70">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                © {new Date().getFullYear()} Alexander Cruz — Portafolio Personal (Ciberseguridad & Fullstack)
              </div>
              <a
                className="text-white/70 hover:text-white transition"
                href="mailto:alexandercruzjh@gmail.com"
              >
                alexandercruzjh@gmail.com
              </a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
