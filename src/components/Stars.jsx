import { useEffect, useRef } from 'react'

const Stars = () => {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const DPR = window.devicePixelRatio || 1

    const resize = () => {
      canvas.width = window.innerWidth * DPR
      canvas.height = window.innerHeight * DPR
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
    }

    resize()
    window.addEventListener('resize', resize)

    /* ---------- Background Stars ---------- */
    class Star {
      constructor() {
        this.x = Math.random() * window.innerWidth
        this.y = Math.random() * window.innerHeight
        this.r = Math.random() * 0.6 + 0.4
        this.base = Math.random() * 0.4 + 0.4
        this.phase = Math.random() * Math.PI * 2
        this.speed = Math.random() * 0.01 + 0.003
      }

      update() {
        this.phase += this.speed
        this.a = this.base + Math.sin(this.phase) * 0.15
      }

      draw() {
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${this.a})`
        ctx.fill()
      }
    }

    /* ---------- Shooting Star ---------- */
    class ShootingStar {
      constructor() {
        this.x = 0
        this.y = 0

        const dx = window.innerWidth
        const dy = window.innerHeight
        const distance = Math.sqrt(dx * dx + dy * dy)
        const speed = 1200

        this.vx = (dx / distance) * speed
        this.vy = (dy / distance) * speed
        this.len = 80
        this.life = 0
        this.maxLife = 1.2
      }

      update(dt) {
        this.life += dt
        this.x += this.vx * dt
        this.y += this.vy * dt
      }

      draw() {
        const alpha =
          this.life < 0.1
            ? this.life / 0.1
            : (this.maxLife - this.life) / 0.4

        const normX = this.vx / Math.sqrt(this.vx * this.vx + this.vy * this.vy)
        const normY = this.vy / Math.sqrt(this.vx * this.vx + this.vy * this.vy)

        ctx.beginPath()
        ctx.moveTo(this.x, this.y)
        ctx.lineTo(this.x - normX * this.len, this.y - normY * this.len)
        ctx.strokeStyle = `rgba(255,255,255,${Math.max(alpha, 0)})`
        ctx.lineWidth = 1
        ctx.stroke()
      }

      dead() {
        return (
          this.life > this.maxLife ||
          this.x < -100 || this.x > window.innerWidth + 100 ||
          this.y < -100 || this.y > window.innerHeight + 100
        )
      }
    }

    const STAR_COUNT = Math.floor((window.innerWidth * window.innerHeight) / 1200)
    const stars = Array.from({ length: STAR_COUNT }, () => new Star())

    let meteor = null
    let nextMeteor = 0.5 + Math.random() * 0.8
    let last = performance.now()
    let rafId

    const animate = (now) => {
      const dt = (now - last) / 1000
      last = now

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)

      for (const s of stars) { s.update(); s.draw() }

      nextMeteor -= dt
      if (!meteor && nextMeteor <= 0) meteor = new ShootingStar()

      if (meteor) {
        meteor.update(dt)
        meteor.draw()
        if (meteor.dead()) {
          meteor = null
          nextMeteor = 0.5 + Math.random() * 1
        }
      }

      rafId = requestAnimationFrame(animate)
    }

    rafId = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'black',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  )
}

export default Stars
