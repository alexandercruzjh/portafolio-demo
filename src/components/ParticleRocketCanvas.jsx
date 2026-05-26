import { useEffect, useMemo, useRef } from 'react'

const ROCKET_SVG_URL = new URL('../assets/rocket.svg', import.meta.url).href
const SATELLITE_SVG_URL = new URL('../assets/satellite.svg', import.meta.url).href

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

function getQuality(w, h) {
  const area = Math.max(1, w * h)
  const cores = navigator.hardwareConcurrency || 4
  const perf = Math.max(0.55, Math.min(1, cores / 8))
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches

  let baseCount = area < 800 * 700 ? 700 : area < 1200 * 900 ? 900 : 1100
  if (reduced) baseCount = Math.round(baseCount * 0.7)
  const pointCount = Math.max(520, Math.min(1200, Math.round(baseCount * perf)))

  const ambientCount = Math.max(40, Math.round(90 * perf * (reduced ? 0.7 : 1)))
  const orbitersCount = reduced ? 5 : 8
  const glowRate = reduced ? 0.32 : 0.55
  const dprCap = reduced ? 1 : area > 1500 * 900 ? 1.25 : 1.5

  return {
    pointCount,
    ambientCount,
    orbitersCount,
    glowRate,
    dpr: Math.min(dprCap, window.devicePixelRatio || 1),
  }
}

function normalizePoints(pts, count, seed = 101) {
  if (pts.length === count) return pts
  const rnd = mulberry32(seed)
  const out = pts.slice(0, count)
  while (out.length < count && pts.length) {
    const p = pts[Math.floor(rnd() * pts.length)]
    out.push({
      ...p,
      x: p.x + (rnd() - 0.5) * 0.012,
      y: p.y + (rnd() - 0.5) * 0.012,
    })
  }
  return out
}

function makeSilhouettePoints({ count, seed, shapeFn, colorFn, weightFn }) {
  const pts = []
  const rnd = mulberry32(seed)
  let guard = 0
  while (pts.length < count && guard < count * 30) {
    guard += 1
    const x = rnd() * 2 - 1
    const y = rnd() * 2 - 1
    if (!shapeFn(x, y)) continue
    if (weightFn && rnd() > weightFn(x, y)) continue
    const tint = colorFn(x, y)
    pts.push({ x, y, color: { r: tint.r, g: tint.g, b: tint.b }, a: tint.a ?? 1 })
  }
  return pts
}

function genMoonPoints(count = 1200) {
  const rMax = 0.62
  const light = { x: -0.5, y: -0.2, z: 0.85 }
  const craterField = (nx, ny) => {
    const a = Math.abs(Math.sin(nx * 7.8 + ny * 5.1))
    const b = Math.abs(Math.sin(nx * 3.1 - ny * 8.4))
    const c = Math.abs(Math.cos(nx * 11.2 + ny * 2.3))
    return (a * 0.55 + b * 0.35 + c * 0.25) / 1.15
  }

  return makeSilhouettePoints({
    count,
    seed: 24,
    shapeFn: (x, y) => {
      const r2 = x * x + y * y
      return r2 <= rMax * rMax
    },
    weightFn: (x, y) => {
      const r = Math.sqrt(x * x + y * y) / rMax
      const rim = smoothstep(0.25, 0.98, r)
      const nx = x / rMax
      const ny = y / rMax
      const crater = craterField(nx, ny)
      const craterEdge = smoothstep(0.55, 0.9, crater)
      const lightDot = nx * light.x + ny * light.y + Math.sqrt(Math.max(0, 1 - r * r)) * light.z
      const lit = clamp01(lightDot * 0.6 + 0.5)
      const density = clamp01(0.42 + rim * 0.4 + craterEdge * 0.2) * lerp(0.85, 1, lit)
      return density
    },
    colorFn: (x, y) => {
      const r2 = x * x + y * y
      const z = Math.sqrt(Math.max(0, 1 - r2 / (rMax * rMax)))
      const nx = x / rMax
      const ny = y / rMax
      const nz = z
      const lightDot = nx * light.x + ny * light.y + nz * light.z
      const limb = smoothstep(0.08, 0.96, z)
      const shade = clamp01((0.3 + 0.7 * clamp01(lightDot * 0.7 + 0.3)) * lerp(0.35, 1, limb))

      const crater = craterField(nx, ny)
      const craterEdge = smoothstep(0.5, 0.9, crater)
      const craterDark = smoothstep(0.2, 0.6, crater)

      const base = lerp(120, 210, shade)
      const detail = base - craterDark * 28 + craterEdge * 18
      const a = lerp(0.88, 0.58, smoothstep(0.72, 0.99, Math.sqrt(r2) / rMax))

      return { r: detail, g: detail, b: detail + 8, a }
    },
  })
}

function genSaturnPoints(count = 1200) {
  const rnd = mulberry32(64)
  const points = []
  const rMax = 0.48
  const ringOuter = 0.92
  const ringInner = 0.62

  const push = (x, y, color, a = 1) => {
    points.push({ x, y, color, a })
  }

  const planetCount = Math.round(count * 0.55)
  const ringCount = count - planetCount

  for (let i = 0; i < planetCount; i++) {
    const angle = rnd() * Math.PI * 2
    const r = Math.sqrt(rnd()) * rMax
    const x = Math.cos(angle) * r
    const y = Math.sin(angle) * r
    const z = Math.sqrt(Math.max(0, rMax * rMax - r * r)) / rMax
    const light = clamp01((x * -0.35 + y * -0.15 + z * 0.9) * 0.6 + 0.55)
    const shade = lerp(140, 220, light)
    const band = 1 - Math.abs(y / rMax)
    const tint = lerp(0.85, 1.05, band)
    push(x, y, { r: shade * 1.05 * tint, g: shade * tint, b: shade * 0.9 * tint }, 0.9)
  }

  for (let i = 0; i < ringCount; i++) {
    const angle = rnd() * Math.PI * 2
    const ringR = lerp(ringInner, ringOuter, Math.sqrt(rnd()))
    const x = Math.cos(angle) * ringR
    const y = Math.sin(angle) * ringR * 0.32
    const depth = smoothstep(0.2, 0.9, Math.abs(Math.cos(angle)))
    const glow = lerp(160, 230, depth)
    push(x, y, { r: glow, g: glow * 0.95, b: glow * 0.85 }, lerp(0.7, 0.95, depth))
  }

  return points
}

function genRocketPoints(count = 1200) {
  return makeSilhouettePoints({
    count,
    seed: 42,
    shapeFn: (x, y) => {
      const taper = lerp(0.22, 0.14, smoothstep(-0.6, 0.4, y))
      const body = Math.abs(x) < taper && y > -0.62 && y < 0.4
      const nose = y >= 0.32 && (x * x) / (0.16 * 0.16) + ((y - 0.56) * (y - 0.56)) / (0.24 * 0.24) < 1
      const belly = (x * x) / (0.22 * 0.22) + ((y + 0.1) * (y + 0.1)) / (0.38 * 0.38) < 1
      const fins = y < -0.18 && y > -0.6 && Math.abs(x) > 0.12 && Math.abs(x) < 0.45 && Math.abs(x) < (0.92 + y)
      const nozzle = Math.abs(x) < 0.095 && y < -0.58 && y > -0.76
      const flame = y < -0.74 && y > -0.95 && Math.abs(x) < 0.1 + (y + 0.95) * 0.6
      const window = x * x + (y - 0.12) * (y - 0.12) < 0.03
      const stripe = Math.abs(x) < 0.15 && y > -0.05 && y < 0.05
      return body || nose || belly || fins || nozzle || flame || window || stripe
    },
    weightFn: (x, y) => {
      const edge = Math.abs(x) / 0.46
      const taper = smoothstep(0.2, 1, edge)
      const core = smoothstep(0.75, 0.15, edge)
      const band = smoothstep(-0.7, -0.1, y) * smoothstep(0.55, -0.2, y)
      const density = clamp01(0.28 + core * 0.45 + band * 0.08 - taper * 0.2)
      return density
    },
    colorFn: (x, y) => {
      const heat = clamp01((y + 0.85) * 1.2)
      const cool = clamp01((0.5 - y) * 0.8)
      const window = x * x + (y - 0.12) * (y - 0.12) < 0.035
      const flame = y < -0.74 && y > -0.93 && Math.abs(x) < 0.12 + (y + 0.93) * 0.55
      if (window) return { r: 130, g: 210, b: 255, a: 0.95 }
      if (flame) return { r: lerp(255, 180, heat), g: lerp(180, 80, heat), b: 80, a: 0.95 }

      const r = lerp(90, 230, heat)
      const g = lerp(130, 200, heat)
      const b = lerp(220, 140, heat)
      const stripe = Math.abs(x) < 0.16 && ((y > -0.1 && y < 0.02) || (y > 0.18 && y < 0.3))
      const sr = stripe ? 245 : r
      const sg = stripe ? 245 : g
      const sb = stripe ? 255 : b
      const a = lerp(0.9, 0.75, cool)
      return { r: sr, g: sg, b: sb, a }
    },
  })
}

async function sampleSvgRocketPoints(url, maxPoints = 1400, colorFn, fallbackFn) {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.src = url

  await new Promise((resolve, reject) => {
    img.onload = resolve
    img.onerror = reject
  })

  const targetMax = 520
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

  const candidates = []
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  const alphaThreshold = 12
  const pixelStep = Math.max(1, Math.floor(Math.max(w, h) / 520))

  const isEdge = (x, y) => {
    const i = (y * w + x) * 4
    const a = data[i + 3]
    if (a < alphaThreshold) return false
    const left = x > 0 ? data[(y * w + (x - 1)) * 4 + 3] : 0
    const right = x + 1 < w ? data[(y * w + (x + 1)) * 4 + 3] : 0
    const up = y > 0 ? data[((y - 1) * w + x) * 4 + 3] : 0
    const down = y + 1 < h ? data[((y + 1) * w + x) * 4 + 3] : 0
    return left < alphaThreshold || right < alphaThreshold || up < alphaThreshold || down < alphaThreshold
  }

  for (let y = 0; y < h; y += pixelStep) {
    for (let x = 0; x < w; x += pixelStep) {
      const i = (y * w + x) * 4
      const a = data[i + 3]
      if (a < alphaThreshold) continue
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
      candidates.push({ x, y, a, edge: isEdge(x, y) })
    }
  }

  if (!candidates.length) return fallbackFn ? fallbackFn(Math.min(1200, maxPoints)) : []

  const bboxW = Math.max(1, maxX - minX)
  const bboxH = Math.max(1, maxY - minY)
  const cx = minX + bboxW * 0.5
  const cy = minY + bboxH * 0.5
  const denom = Math.max(bboxW, bboxH) * 0.5

  const rng = mulberry32(733)
  const grid = Math.max(28, Math.floor(Math.sqrt(maxPoints)))
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
    const edgePick = arr.find((p) => p.edge)
    pts.push(edgePick ?? arr[Math.floor(rng() * arr.length)])
  }

  while (pts.length < maxPoints && candidates.length) {
    const cnd = candidates[Math.floor(rng() * candidates.length)]
    const keep = cnd.edge ? 0.9 : 0.55
    if (rng() < keep) pts.push(cnd)
  }

  const out = []
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i]
    const nx = (p.x - cx) / denom
    const ny = -((p.y - cy) / denom)

    const tint = colorFn ? colorFn(nx, ny, p.a / 255) : { r: 180, g: 200, b: 230, a: 0.85 }

    out.push({
      x: nx + (rng() - 0.5) * (p.edge ? 0.004 : 0.01),
      y: ny + (rng() - 0.5) * (p.edge ? 0.004 : 0.01),
      color: { r: tint.r, g: tint.g, b: tint.b },
      a: tint.a ?? 1,
    })
  }

  return out
}

function addLaunchPlume(points, count, seed = 515) {
  const rnd = mulberry32(seed)
  const plume = []
  const plumeCount = Math.max(0, Math.round(count * 0.18))
  for (let i = 0; i < plumeCount; i++) {
    const t = rnd()
    const radius = 0.12 * (1 + t * 1.8)
    const angle = rnd() * Math.PI * 2
    const x = Math.cos(angle) * radius + (rnd() - 0.5) * 0.06
    const y = -0.78 - t * 0.55
    const heat = clamp01(1 - t)
    plume.push({
      x,
      y,
      color: {
        r: lerp(255, 220, heat),
        g: lerp(190, 90, heat),
        b: lerp(120, 80, heat),
      },
      a: lerp(0.85, 0.55, t),
    })
  }
  return points.concat(plume)
}

function genAntennaPoints(count = 1200) {
  return makeSilhouettePoints({
    count,
    seed: 84,
    shapeFn: (x, y) => {
      const base = Math.abs(x) < 0.38 && y < -0.68 && y > -0.88
      const mast = Math.abs(x) < 0.05 && y > -0.68 && y < 0.55
      const tip = (x * x + (y - 0.62) * (y - 0.62)) < 0.03
      const dish = (x - 0.18) * (x - 0.18) + (y - 0.05) * (y - 0.05) < 0.23 * 0.23 && x > -0.08 && y > -0.2
      const arc1 = (() => {
        const d = Math.hypot(x - 0.02, y - 0.62)
        return d > 0.22 && d < 0.28 && x > 0.04 && y > 0.46
      })()
      const arc2 = (() => {
        const d = Math.hypot(x - 0.02, y - 0.62)
        return d > 0.32 && d < 0.38 && x > 0.06 && y > 0.44
      })()
      return base || mast || tip || dish || arc1 || arc2
    },
    colorFn: (_x, y) => {
      const cool = clamp01((y + 0.9) * 0.9)
      return {
        r: lerp(90, 160, cool),
        g: lerp(150, 220, cool),
        b: lerp(210, 255, cool),
      }
    },
  })
}

function genContactPoints(count = 1200) {
  return makeSilhouettePoints({
    count,
    seed: 128,
    shapeFn: (x, y) => {
      const bubble = Math.abs(x) < 0.55 && y > -0.02 && y < 0.46
      const tail = y < -0.02 && y > -0.34 && Math.abs(x) < (y + 0.34) * 0.9 + 0.05
      const cut = (Math.abs(x) > 0.53 && y > 0.4) || (Math.abs(x) > 0.52 && y < 0.05)
      return (bubble || tail) && !cut
    },
    colorFn: (_x, y) => {
      const warm = clamp01((y + 0.7) * 0.95)
      return {
        r: lerp(120, 255, warm),
        g: lerp(120, 200, warm),
        b: lerp(200, 255, warm),
      }
    },
  })
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
      shapes: { rocket: [], antenna: [], contact: [] },
      particles: [],
      bg: [],
      ambient: [],
      quality: null,
      ready: false,
      t0: performance.now(),
      tops: { home: 0, about: 0, cv: 0, weeks: 0, contact: 0 },
      rocketSmooth: 0,
      antennaSmooth: 0,
      contactSmooth: 0,
      rocketXNormSmooth: 0.72,
      lastT: 0,
    }

    const resize = () => {
      w = Math.floor(window.innerWidth)
      h = Math.floor(window.innerHeight)
      const q = getQuality(w, h)
      state.quality = q
      const dpr = q.dpr
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
      const pointCount = state.quality?.pointCount ?? 900
      let moonPts
      let rocketPts
      let saturnPts
      try {
        moonPts = genMoonPoints(pointCount)
        rocketPts = await sampleSvgRocketPoints(ROCKET_SVG_URL, pointCount, (nx, ny, a) => {
          const heat = clamp01((ny + 0.85) * 1.15)
          const cool = clamp01((0.45 - ny) * 0.9)
          const r = lerp(90, 235, heat)
          const g = lerp(130, 205, heat)
          const b = lerp(220, 145, heat)
          const alpha = lerp(0.9, 0.7, cool) * a
          return { r, g, b, a: alpha }
        }, genRocketPoints)
        rocketPts = addLaunchPlume(rocketPts, pointCount)
        saturnPts = genSaturnPoints(pointCount)
      } catch {
        moonPts = genMoonPoints(pointCount)
        rocketPts = addLaunchPlume(genRocketPoints(pointCount), pointCount)
        saturnPts = genSaturnPoints(pointCount)
      }

      if (destroyed) return

      const normalizedMoon = normalizePoints(moonPts, pointCount, 111)
      const normalizedRocket = normalizePoints(rocketPts, pointCount, 112)
      const normalizedSaturn = normalizePoints(saturnPts, pointCount, 113)

      state.shapes = {
        rocket: normalizedMoon,
        antenna: normalizedRocket,
        contact: normalizedSaturn,
      }
      state.points = normalizedMoon

      const n = pointCount
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
          bgRand: rnd(),
          color: normalizedRocket[i].color,
          a: normalizedRocket[i].a ?? 1,
        }
      })

      state.bg = new Array(n).fill(0).map(() => ({
        x: rnd() * w,
        y: rnd() * h,
      }))

      const ambientCount = state.quality?.ambientCount ?? 80
      state.ambient = new Array(ambientCount).fill(0).map(() => ({
        x: rnd() * w,
        y: rnd() * h,
        vx: (rnd() - 0.5) * 0.24,
        vy: (rnd() - 0.5) * 0.16,
        s: 0.6 + rnd() * 1.1,
        a: 0.12 + rnd() * 0.18,
        hue: rnd() < 0.5 ? '168,85,247' : '56,189,248',
      }))

      state.ready = true
    }

    resize()
    measure()
    initParticles()

    const onResize = () => {
      const prevCount = state.quality?.pointCount
      resize()
      measure()
      if (state.ready && prevCount && state.quality?.pointCount !== prevCount) {
        state.ready = false
        initParticles()
      }
    }

    window.addEventListener('resize', onResize)

    const orbitersCount = state.quality?.orbitersCount ?? 8
    const orbiters = new Array(orbitersCount).fill(0).map((_, i) => ({
      a: (i / orbitersCount) * Math.PI * 2,
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
      const disassembleStart = state.tops.about - vh * 0.85
      const disassembleEnd = state.tops.about - vh * 0.10
      const rebuildStart = state.tops.cv - vh * 0.85
      const rebuildEnd = state.tops.cv - vh * 0.05
      const dissolveStart = state.tops.weeks - vh * 0.85
      const dissolveEnd = state.tops.weeks - vh * 0.10
      const contactBuildStart = state.tops.contact - vh * 0.85
      const contactBuildEnd = state.tops.contact - vh * 0.05

      const rocketFactor = y < disassembleStart
        ? 1
        : y < disassembleEnd
          ? 1 - smoothstep((y - disassembleStart) / Math.max(1, disassembleEnd - disassembleStart))
          : 0

      const antennaFactor = y < rebuildStart
        ? 0
        : y < rebuildEnd
          ? smoothstep((y - rebuildStart) / Math.max(1, rebuildEnd - rebuildStart))
          : y < dissolveStart
            ? 1
            : y < dissolveEnd
              ? 1 - smoothstep((y - dissolveStart) / Math.max(1, dissolveEnd - dissolveStart))
              : 0

      const contactFactor = y < contactBuildStart
        ? 0
        : y < contactBuildEnd
          ? smoothstep((y - contactBuildStart) / Math.max(1, contactBuildEnd - contactBuildStart))
          : 1

      // Suavizado temporal para que las siluetas no hagan “saltitos” al scroll
      const k = 1 - Math.exp(-dt / 90)
      state.rocketSmooth += (rocketFactor - state.rocketSmooth) * k
      state.antennaSmooth += (antennaFactor - state.antennaSmooth) * k
      state.contactSmooth += (contactFactor - state.contactSmooth) * k
      const rf = state.rocketSmooth
      const af = state.antennaSmooth
      const cf = state.contactSmooth
      const shapeTotal = rf + af + cf
      const transitionIntensity = Math.min(1, Math.abs(rf - af) + Math.abs(af - cf) + Math.abs(cf - rf))
      const step = shapeTotal > 0 && shapeTotal < 1 && transitionIntensity > 0.15 ? 4 : 1

      const antennaEntry = y < rebuildStart
        ? 0
        : y < rebuildEnd
          ? smoothstep((y - rebuildStart) / Math.max(1, rebuildEnd - rebuildStart))
          : 1
      const contactEntry = y < contactBuildStart
        ? 0
        : y < contactBuildEnd
          ? smoothstep((y - contactBuildStart) / Math.max(1, contactBuildEnd - contactBuildStart))
          : 1

      const rocketX = w * 0.72
      const antennaX = w * 0.33 + lerp(-w * 0.3, 0, antennaEntry)
      const contactX = w * 0.67 + lerp(-w * 0.3, 0, contactEntry)

      const floatA = 0.00085
      const floatX = Math.cos(t * floatA) * 7
      const floatY = Math.sin(t * floatA * 1.08) * 10
      const rocketY = h * 0.52 + floatY
      const antennaY = h * 0.52 + floatY * 0.4
      const contactY = h * 0.52 + floatY * 0.5

      const mx = mouseRef.current.x - 0.5
      const my = mouseRef.current.y - 0.5
      const parX = mx * 18
      const parY = my * 12

      const baseScale = Math.min(w, h)
      const rocketScale = baseScale * 0.26
      const antennaScale = baseScale * 0.3
      const contactScale = baseScale * 0.28

      const sparseBg = (y >= disassembleEnd && y < rebuildStart) || (y >= dissolveEnd && y < contactBuildStart)
      const bgDensity = sparseBg ? 0.08 : 0.95

      // Partículas ambiente (siempre presentes)
      ctx.globalCompositeOperation = 'lighter'
      const ambientMix = lerp(0.6, 1, bgDensity)
      for (const a of state.ambient) {
        a.x += a.vx
        a.y += a.vy
        if (a.x < -30) a.x = w + 30
        if (a.x > w + 30) a.x = -30
        if (a.y < -30) a.y = h + 30
        if (a.y > h + 30) a.y = -30
        ctx.fillStyle = `rgba(${a.hue},${a.a * ambientMix})`
        ctx.beginPath()
        ctx.arc(a.x, a.y, a.s, 0, Math.PI * 2)
        ctx.fill()
      }

      // Dibujo de partículas
      ctx.globalCompositeOperation = 'lighter'

      for (let i = 0; i < state.particles.length; i += step) {
        const p = state.particles[i]
        const ptRocket = state.shapes.rocket[i]
        const ptAntenna = state.shapes.antenna[i]
        const ptContact = state.shapes.contact[i]

        // Mezcla orgánica por partícula: evita que “aparezca la silueta” de golpe
        // Cada partícula entra/sale con un desfase distinto.
        // Importante: cuando rf≈0 (modo fondo) no debe “asomarse” la silueta.
        const local = smoothstep((shapeTotal - p.phase) / 0.10)
        // Nunca 0 o 1 absolutos: integración con el fondo
        const mix = shapeTotal > 0 ? 0.02 + local * 0.94 : 0

        const weightTotal = Math.max(1e-6, rf + af + cf)
        const wRocket = rf / weightTotal
        const wAntenna = af / weightTotal
        const wContact = cf / weightTotal

        const targetRocketX = rocketX + parX + floatX + ptRocket.x * rocketScale
        const targetRocketY = rocketY + parY + ptRocket.y * rocketScale
        const targetAntennaX = antennaX + parX * 0.7 + ptAntenna.x * antennaScale
        const targetAntennaY = antennaY + parY * 0.6 + ptAntenna.y * antennaScale
        const targetContactX = contactX + parX * 0.7 + ptContact.x * contactScale
        const targetContactY = contactY + parY * 0.6 + ptContact.y * contactScale

        const targetShapeX = targetRocketX * wRocket + targetAntennaX * wAntenna + targetContactX * wContact
        const targetShapeY = targetRocketY * wRocket + targetAntennaY * wAntenna + targetContactY * wContact

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

        const tx = lerp(targetBgX, targetShapeX + jx, mix)
        const ty = lerp(targetBgY, targetShapeY + jy, mix)

        const stiffness = lerp(0.03, 0.055, mix)
        const damping = lerp(0.86, 0.92, mix)
        p.vx = (p.vx + (tx - p.x) * stiffness) * damping
        p.vy = (p.vy + (ty - p.y) * stiffness) * damping
        p.x += p.vx
        p.y += p.vy

        // color shift: disperso más frío
        const cool = { r: 150, g: 170, b: 255 }
        const cr = lerp(
          cool.r,
          ptRocket.color.r * wRocket + ptAntenna.color.r * wAntenna + ptContact.color.r * wContact,
          mix,
        )
        const cg = lerp(
          cool.g,
          ptRocket.color.g * wRocket + ptAntenna.color.g * wAntenna + ptContact.color.g * wContact,
          mix,
        )
        const cb = lerp(
          cool.b,
          ptRocket.color.b * wRocket + ptAntenna.color.b * wAntenna + ptContact.color.b * wContact,
          mix,
        )

        // Alpha más cinematográfica: en transición se integra al fondo, sin “recortar” la forma
        const shapeDensity = lerp(0.05, 0.85, smoothstep(shapeTotal / 0.5))
        const mixBoost = lerp(0.45, 0.9, smoothstep((mix - 0.05) / 0.25))
        const density = bgDensity * shapeDensity * mixBoost
        const densityMask = p.bgRand < density ? 1 : 0
        const glow = (0.16 + mix * 0.22) * densityMask
        const shapeAlpha = weightTotal > 0.001
          ? (ptRocket.a ?? 1) * wRocket + (ptAntenna.a ?? 1) * wAntenna + (ptContact.a ?? 1) * wContact
          : 1
        const alpha = (0.22 + mix * 0.62) * shapeAlpha * densityMask

        // glow (solo una parte de las particulas para aligerar)
        if (p.bgRand < (state.quality?.glowRate ?? 0.5)) {
          ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha * glow})`
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size * 2.4, 0, Math.PI * 2)
          ctx.fill()
        }

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
