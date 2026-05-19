import { useEffect, useMemo, useRef } from 'react'

const ROCKET_JPG_URL = new URL('../assets/rocket.jpg', import.meta.url).href

function clamp01(v) {
  return Math.max(0, Math.min(1, v))
}

function smoothstep(t) {
  const x = clamp01(t)
  return x * x * (3 - 2 * x)
}

function lerp(a, b, t) {
  return a + (b - a) * t
}

function mulberry32(seed) {
  let t = seed >>> 0
  return function () {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

function genFallbackRocketPoints(count = 1200) {
  // Silueta simple (fallback) si no hay /rocket.png
  const pts = []
  const rnd = mulberry32(42)
  while (pts.length < count) {
    const x = rnd() * 2 - 1
    const y = rnd() * 2 - 1

    // Cuerpo: cápsula + punta
    const body = Math.abs(x) < 0.22 && y > -0.55 && y < 0.55
    const nose = y > 0.45 && (x * x) / (0.22 * 0.22) + ((y - 0.65) * (y - 0.65)) / (0.35 * 0.35) < 1
    const fins = y < -0.18 && y > -0.62 && Math.abs(x) > 0.12 && Math.abs(x) < 0.46 && Math.abs(x) < (0.8 - Math.abs(y))
    const window = x * x + (y - 0.15) * (y - 0.15) < 0.04

    if (body || nose || fins || window) {
      const heat = clamp01((y + 0.65) * 1.1)
      const r = lerp(70, 255, heat)
      const g = lerp(120, 200, heat)
      const b = lerp(255, 120, heat)
      const tint = window ? { r: 120, g: 200, b: 255 } : { r, g, b }
      pts.push({ x, y, color: tint, a: 1 })
    }
  }
  return pts
}

async function sampleRocketImage(url, maxPoints = 1800) {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.src = url

  await new Promise((resolve, reject) => {
    img.onload = resolve
    img.onerror = reject
  })

  // Render en un tamaño moderado para muestreo estable (sin deformar silueta)
  const targetMax = 360
  const scale = Math.min(targetMax / img.width, targetMax / img.height)
  const w = Math.max(1, Math.round(img.width * scale))
  const h = Math.max(1, Math.round(img.height * scale))

  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('No canvas context')

  ctx.clearRect(0, 0, w, h)
  ctx.drawImage(img, 0, 0, w, h)
  const { data } = ctx.getImageData(0, 0, w, h)

  const readPixel = (x, y) => {
    const xi = Math.max(0, Math.min(w - 1, x))
    const yi = Math.max(0, Math.min(h - 1, y))
    const i = (yi * w + xi) * 4
    return { r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] }
  }

  // Color de “fondo” aproximado (promedio de esquinas). Esto ayuda cuando la imagen no tiene alpha
  // (p.ej. SVG/PNG opaco) y el fondo es un color plano.
  const c0 = readPixel(0, 0)
  const c1 = readPixel(w - 1, 0)
  const c2 = readPixel(0, h - 1)
  const c3 = readPixel(w - 1, h - 1)
  const bg = {
    r: (c0.r + c1.r + c2.r + c3.r) / 4,
    g: (c0.g + c1.g + c2.g + c3.g) / 4,
    b: (c0.b + c1.b + c2.b + c3.b) / 4,
    a: (c0.a + c1.a + c2.a + c3.a) / 4,
  }

  const bgOpaque = bg.a > 220

  // Si la imagen es opaca (p.ej. JPG), armamos una máscara de fondo por flood-fill desde bordes.
  // Esto suele recortar muchísimo mejor el sujeto (cohete) que un simple umbral de luminancia.
  let bgMask = null
  if (bgOpaque) {
    const distToBg = (r, g, b) => Math.abs(r - bg.r) + Math.abs(g - bg.g) + Math.abs(b - bg.b)
    const floodThreshold = 38
    const visited = new Uint8Array(w * h)
    const queue = new Int32Array(w * h)
    let head = 0
    let tail = 0

    const tryPush = (idx) => {
      if (visited[idx]) return
      const i = idx * 4
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const a = data[i + 3]
      if (a < 220) return
      if (distToBg(r, g, b) > floodThreshold) return
      visited[idx] = 1
      queue[tail++] = idx
    }

    // Seeds: bordes
    for (let x = 0; x < w; x++) {
      tryPush(x)
      tryPush((h - 1) * w + x)
    }
    for (let y = 0; y < h; y++) {
      tryPush(y * w)
      tryPush(y * w + (w - 1))
    }

    while (head < tail) {
      const idx = queue[head++]
      const x = idx % w
      const y = (idx / w) | 0

      if (x > 0) tryPush(idx - 1)
      if (x + 1 < w) tryPush(idx + 1)
      if (y > 0) tryPush(idx - w)
      if (y + 1 < h) tryPush(idx + w)
    }

    bgMask = visited
  }

  // Candidatos + bbox del objeto.
  // Nota: si la imagen no tiene alpha (fondo negro opaco), filtramos por luminancia.
  const candidates = []
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  const alphaThreshold = 50
  const lumThreshold = 14
  const bgDistThreshold = 34
  const pixelStep = Math.max(1, Math.floor(Math.max(w, h) / 420))

  for (let y = 0; y < h; y += pixelStep) {
    for (let x = 0; x < w; x += pixelStep) {
      const i = (y * w + x) * 4
      const a = data[i + 3]
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]

      const lum = (r + g + b) / 3
      if (a < alphaThreshold) continue

      const idx = y * w + x
      if (bgMask && bgMask[idx]) continue

      const dist = Math.abs(r - bg.r) + Math.abs(g - bg.g) + Math.abs(b - bg.b)
      const pxOpaque = a > 220

      const maxc = Math.max(r, g, b)
      const minc = Math.min(r, g, b)
      const sat = maxc - minc

      // Si todo es opaco, separar figura por distancia al color de fondo.
      // Si hay alpha, dejamos pasar más (pero filtramos lo casi-negro para evitar ruido).
      const isFg =
        bgOpaque && pxOpaque
          ? dist > bgDistThreshold && (lum >= lumThreshold || sat > 18)
          : lum >= lumThreshold || dist > 10
      if (!isFg) continue

      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
      candidates.push({ x, y, r, g, b, a })
    }
  }

  if (!candidates.length) return genFallbackRocketPoints(Math.min(1200, maxPoints))

  const bboxW = Math.max(1, maxX - minX)
  const bboxH = Math.max(1, maxY - minY)
  const cx = minX + bboxW * 0.5
  const cy = minY + bboxH * 0.5
  const denom = Math.max(bboxW, bboxH) * 0.5

  // Muestreo estratificado: preserva forma y distribución (menos “rejilla”)
  const rng = mulberry32(1337)
  const grid = Math.max(24, Math.floor(Math.sqrt(maxPoints)))
  const cellW = bboxW / grid
  const cellH = bboxH / grid
  const buckets = new Map()

  for (const cnd of candidates) {
    const gx = Math.floor((cnd.x - minX) / Math.max(1e-6, cellW))
    const gy = Math.floor((cnd.y - minY) / Math.max(1e-6, cellH))
    const key = `${gx}:${gy}`
    const arr = buckets.get(key)
    if (arr) arr.push(cnd)
    else buckets.set(key, [cnd])
  }

  const pts = []
  for (const arr of buckets.values()) {
    if (pts.length >= maxPoints) break
    pts.push(arr[Math.floor(rng() * arr.length)])
  }

  while (pts.length < maxPoints && candidates.length) {
    const cnd = candidates[Math.floor(rng() * candidates.length)]
    const lum = (cnd.r + cnd.g + cnd.b) / 3
    const pa = cnd.a / 255
    const keep = (0.25 + 0.75 * pa) * (0.35 + 0.65 * (lum / 255))
    if (rng() < keep) pts.push(cnd)
  }

  const out = []
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i]
    const nx = (p.x - cx) / denom
    const ny = -((p.y - cy) / denom)

    const lum = (p.r + p.g + p.b) / 3
    const warm = p.r > p.b && p.r > p.g
    const cold = p.b > p.r && p.b > p.g
    let cr
    let cg
    let cb

    if (lum > 230) {
      cr = 255
      cg = 255
      cb = 255
    } else if (warm) {
      cr = Math.max(p.r, 220)
      cg = Math.max(p.g, 135)
      cb = Math.min(p.b, 85)
    } else if (cold) {
      cr = Math.min(p.r, 125)
      cg = Math.max(p.g, 160)
      cb = Math.max(p.b, 240)
    } else {
      cr = Math.max(p.r, 175)
      cg = Math.min(p.g, 130)
      cb = Math.max(p.b, 225)
    }

    out.push({
      x: nx + (rng() - 0.5) * 0.012,
      y: ny + (rng() - 0.5) * 0.012,
      color: { r: cr, g: cg, b: cb },
      a: (p.a ?? 255) / 255,
    })
  }

  return out
}

export function ParticleRocketCanvas({ sectionRefs }) {
  const canvasRef = useRef(null)
  const mouseRef = useRef({ x: 0.5, y: 0.35 })

  const ids = useMemo(() => {
    return {
      home: 'inicio',
      about: 'sobre-mi',
      cv: 'cv',
      weeks: 'semanas',
      contact: 'contacto',
      ...(sectionRefs?.ids ?? {}),
    }
  }, [sectionRefs])

  useEffect(() => {
    const onMove = (e) => {
      mouseRef.current.x = e.clientX / Math.max(1, window.innerWidth)
      mouseRef.current.y = e.clientY / Math.max(1, window.innerHeight)
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = 0
    let h = 0
    let raf = 0
    let destroyed = false

    const rnd = mulberry32(7)

    const state = {
      points: [],
      particles: [],
      bg: [],
      ambient: [],
      ready: false,
      t0: performance.now(),
      tops: { home: 0, about: 0, cv: 0, weeks: 0, contact: 0 },
      rocketSmooth: 0,
      rocketXNormSmooth: 0.72,
      lastT: 0,
    }

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      w = Math.floor(window.innerWidth)
      h = Math.floor(window.innerHeight)
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const measure = () => {
      const getTop = (id) => {
        const el = document.getElementById(id)
        if (!el) return 0
        const r = el.getBoundingClientRect()
        return r.top + window.scrollY
      }

      state.tops.home = getTop(ids.home)
      state.tops.about = getTop(ids.about)
      state.tops.cv = getTop(ids.cv)
      state.tops.weeks = getTop(ids.weeks)
      state.tops.contact = getTop(ids.contact)
    }

    const initParticles = async () => {
      let pts
      try {
        pts = await sampleRocketImage(ROCKET_JPG_URL, 1700)
      } catch {
        pts = genFallbackRocketPoints(1200)
      }

      if (destroyed) return

      state.points = pts

      const n = pts.length
      state.particles = new Array(n).fill(0).map((_, i) => {
        return {
          x: rnd() * w,
          y: rnd() * h,
          vx: 0,
          vy: 0,
          size: 1.0 + rnd() * 1.4,
          seed: rnd() * 1000,
          phase: rnd(),
          band: 0.45 + rnd() * 0.35,
          jitter: 6 + rnd() * 14,
          color: pts[i].color,
          a: pts[i].a ?? 1,
        }
      })

      state.bg = new Array(n).fill(0).map(() => ({
        x: rnd() * w,
        y: rnd() * h,
      }))

      state.ambient = new Array(170).fill(0).map(() => ({
        x: rnd() * w,
        y: rnd() * h,
        vx: (rnd() - 0.5) * 0.25,
        vy: (rnd() - 0.5) * 0.18,
        s: 0.6 + rnd() * 1.2,
        a: 0.12 + rnd() * 0.18,
        hue: rnd() < 0.5 ? '168,85,247' : '56,189,248',
      }))

      state.ready = true
    }

    resize()
    measure()
    initParticles()

    const onResize = () => {
      resize()
      measure()
    }

    window.addEventListener('resize', onResize)

    const orbiters = new Array(14).fill(0).map((_, i) => ({
      a: (i / 14) * Math.PI * 2,
      r: 70 + rnd() * 90,
      s: 0.003 + rnd() * 0.004,
      o: 0.35 + rnd() * 0.45,
    }))

    const loop = (t) => {
      raf = requestAnimationFrame(loop)
      if (!state.ready) {
        ctx.clearRect(0, 0, w, h)
        return
      }

      const dt = state.lastT ? Math.min(48, Math.max(10, t - state.lastT)) : 16
      state.lastT = t

      // trailing / cinematic persistence
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = 'rgba(0,0,0,0.28)'
      ctx.fillRect(0, 0, w, h)

      const y = window.scrollY
      const vh = Math.max(1, window.innerHeight)

      // Ventanas de transición (orgánicas) alrededor de los cortes entre secciones
      // Ventanas ajustadas para que, al llegar a cada sección, el cohete ya esté en el estado pedido.
      // (El armado/desarmado ocurre un poco antes, en el scroll previo.)
      const disassembleStart = state.tops.about - vh * 0.85
      const disassembleEnd = state.tops.about - vh * 0.10
      const rebuildStart = state.tops.cv - vh * 0.85
      const rebuildEnd = state.tops.cv - vh * 0.05
      const dissolveStart = state.tops.weeks - vh * 0.85
      const dissolveEnd = state.tops.weeks - vh * 0.10
      const contactBuildStart = state.tops.contact - vh * 0.85
      const contactBuildEnd = state.tops.contact - vh * 0.05

      let rocketFactor
      if (y < disassembleStart) rocketFactor = 1
      else if (y < disassembleEnd) {
        rocketFactor = 1 - smoothstep((y - disassembleStart) / Math.max(1, disassembleEnd - disassembleStart))
      } else if (y < rebuildStart) {
        rocketFactor = 0
      } else if (y < rebuildEnd) {
        rocketFactor = smoothstep((y - rebuildStart) / Math.max(1, rebuildEnd - rebuildStart))
      } else if (y < dissolveStart) {
        rocketFactor = 1
      } else if (y < dissolveEnd) {
        rocketFactor = 1 - smoothstep((y - dissolveStart) / Math.max(1, dissolveEnd - dissolveStart))
      } else if (y < contactBuildStart) {
        rocketFactor = 0
      } else if (y < contactBuildEnd) {
        rocketFactor = smoothstep((y - contactBuildStart) / Math.max(1, contactBuildEnd - contactBuildStart))
      } else {
        rocketFactor = 1
      }

      // Suavizado temporal para que el cohete no haga “saltitos” al scroll
      const k = 1 - Math.exp(-dt / 150)
      state.rocketSmooth += (rocketFactor - state.rocketSmooth) * k
      const rf = state.rocketSmooth

      // Posición horizontal por sección: Home (derecha) → CV (izquierda) → Contacto (derecha)
      let rocketXNormTarget
      if (y < rebuildStart) {
        rocketXNormTarget = 0.72
      } else if (y < rebuildEnd) {
        rocketXNormTarget = lerp(0.72, 0.28, smoothstep((y - rebuildStart) / Math.max(1, rebuildEnd - rebuildStart)))
      } else if (y < contactBuildStart) {
        rocketXNormTarget = 0.28
      } else if (y < contactBuildEnd) {
        rocketXNormTarget = lerp(
          0.28,
          0.72,
          smoothstep((y - contactBuildStart) / Math.max(1, contactBuildEnd - contactBuildStart)),
        )
      } else {
        rocketXNormTarget = 0.72
      }

      const kx = 1 - Math.exp(-dt / 220)
      state.rocketXNormSmooth += (rocketXNormTarget - state.rocketXNormSmooth) * kx
      const rocketX = w * state.rocketXNormSmooth
      const floatA = 0.00085
      const floatX = Math.cos(t * floatA) * 7 * rf
      const floatY = Math.sin(t * floatA * 1.08) * 10 * rf
      const rocketY = h * 0.52 + floatY

      const mx = mouseRef.current.x - 0.5
      const my = mouseRef.current.y - 0.5
      const parX = mx * 18 * rf
      const parY = my * 12 * rf

      const scale = Math.min(w, h) * 0.26

      // Partículas ambiente (siempre presentes)
      ctx.globalCompositeOperation = 'lighter'
      for (const a of state.ambient) {
        a.x += a.vx
        a.y += a.vy
        if (a.x < -30) a.x = w + 30
        if (a.x > w + 30) a.x = -30
        if (a.y < -30) a.y = h + 30
        if (a.y > h + 30) a.y = -30
        ctx.fillStyle = `rgba(${a.hue},${a.a})`
        ctx.beginPath()
        ctx.arc(a.x, a.y, a.s, 0, Math.PI * 2)
        ctx.fill()
      }

      // Dibujo de partículas
      ctx.globalCompositeOperation = 'lighter'

      for (let i = 0; i < state.particles.length; i++) {
        const p = state.particles[i]
        const pt = state.points[i]

        // Mezcla orgánica por partícula: evita que “aparezca la silueta” de golpe
        // Cada partícula entra/sale con un desfase distinto.
        // Importante: cuando rf≈0 (modo fondo) no debe “asomarse” la silueta.
        const local = smoothstep((rf - p.phase) / 0.10)
        // Nunca 0 o 1 absolutos: integración con el fondo
        const mix = 0.02 + local * 0.94

        const targetRocketX = rocketX + parX + floatX + pt.x * scale
        const targetRocketY = rocketY + parY + pt.y * scale

        // background target con drift
        const b = state.bg[i]
        const drift = Math.sin((t * 0.001 + p.seed) * 1.2) * 14
        const drift2 = Math.cos((t * 0.0011 + p.seed) * 1.1) * 10
        const targetBgX = b.x + drift
        const targetBgY = b.y + drift2

        // Dispersión controlada: cuando se construye/desarma, la forma se “rompe” un poco
        const j = (1 - mix) * p.jitter + 1.5
        const jx = Math.sin(p.seed + t * 0.0014) * j
        const jy = Math.cos(p.seed + t * 0.0012) * (j * 0.75)

        const tx = lerp(targetBgX, targetRocketX + jx, mix)
        const ty = lerp(targetBgY, targetRocketY + jy, mix)

        const stiffness = lerp(0.021, 0.035, mix)
        const damping = lerp(0.84, 0.90, mix)
        p.vx = (p.vx + (tx - p.x) * stiffness) * damping
        p.vy = (p.vy + (ty - p.y) * stiffness) * damping
        p.x += p.vx
        p.y += p.vy

        // color shift: disperso más frío
        const cool = { r: 150, g: 170, b: 255 }
        const cr = lerp(cool.r, p.color.r, mix)
        const cg = lerp(cool.g, p.color.g, mix)
        const cb = lerp(cool.b, p.color.b, mix)

        // Alpha más cinematográfica: en transición se integra al fondo, sin “recortar” la forma
        const glow = 0.16 + mix * 0.22
        const alpha = (0.22 + mix * 0.62) * (pt.a ?? 1)

        // glow
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha * glow})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 2.4, 0, Math.PI * 2)
        ctx.fill()

        // core
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      }

      // Orbiters alrededor del cohete cuando está armado
      if (rf > 0.65) {
        const o = (rf - 0.65) / 0.35
        const oo = clamp01(o)
        for (const orb of orbiters) {
          orb.a += orb.s
          const ox = rocketX + parX + floatX + Math.cos(orb.a) * orb.r
          const oy = rocketY + parY + Math.sin(orb.a * 1.2) * (orb.r * 0.55)

          ctx.fillStyle = `rgba(56,189,248,${0.10 * orb.o * oo})`
          ctx.beginPath()
          ctx.arc(ox, oy, 6, 0, Math.PI * 2)
          ctx.fill()

          ctx.fillStyle = `rgba(244,114,182,${0.12 * orb.o * oo})`
          ctx.beginPath()
          ctx.arc(ox, oy, 2.2, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // Sutil “halo” del cohete
      if (rf > 0.25) {
        const hf = smoothstep((rf - 0.25) / 0.75)
        const r = 260 * hf
        const g = ctx.createRadialGradient(rocketX + parX + floatX, rocketY + parY, 0, rocketX + parX + floatX, rocketY + parY, r)
        g.addColorStop(0, `rgba(168,85,247,${0.12 * hf})`)
        g.addColorStop(0.55, `rgba(56,189,248,${0.06 * hf})`)
        g.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(rocketX + parX + floatX, rocketY + parY, r, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    raf = requestAnimationFrame(loop)

    const interval = window.setInterval(measure, 800)

    return () => {
      destroyed = true
      window.removeEventListener('resize', onResize)
      window.clearInterval(interval)
      cancelAnimationFrame(raf)
    }
  }, [ids])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
    />
  )
}
