import { useEffect, useMemo, useState } from 'react'

export function useActiveSection(sectionIds) {
  const ids = useMemo(
    () => (Array.isArray(sectionIds) ? sectionIds.filter(Boolean) : []),
    [sectionIds],
  )
  const [active, setActive] = useState(ids[0] ?? 'inicio')

  useEffect(() => {
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean)

    if (!elements.length) return

    const ratios = new Map()

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry?.target?.id
          if (!id) continue

          ratios.set(id, entry.isIntersecting ? entry.intersectionRatio ?? 0 : 0)
        }

        let nextId = null
        let nextRatio = 0

        for (const id of ids) {
          const r = ratios.get(id) ?? 0
          if (r > nextRatio) {
            nextRatio = r
            nextId = id
          }
        }

        if (!nextId) return
        setActive((prev) => (prev === nextId ? prev : nextId))
      },
      {
        root: null,
        rootMargin: '-35% 0px -55% 0px',
        threshold: [0, 0.05, 0.1, 0.2, 0.35, 0.5],
      },
    )

    for (const el of elements) io.observe(el)

    return () => io.disconnect()
  }, [ids])

  return active
}
