/**
 * Kinetic drag / wheel scroller.
 *
 * There is no native scrolling anywhere on this site: body is fixed and
 * overflow hidden. Instead one element (the "track") is translated and every
 * input source - pointer drag, wheel, touch - feeds a single target offset
 * that the rendered position eases toward. On idle it snaps to the nearest
 * child (a card, or a media block).
 */
export class DragScroll {
  constructor(el, opts = {}) {
    this.el = el
    this.axis = opts.axis || 'x'
    this.damping = opts.damping ?? 0.1
    this.momentum = opts.momentum ?? 9
    this.snap = opts.snap !== false
    this.wheelFactor = opts.wheelFactor ?? 1
    this.onProgress = opts.onProgress || null
    this.getSnapTargets = opts.getSnapTargets || null
    this.enabled = true

    this.pos = 0
    this.target = 0
    this.vel = 0
    this.dragging = false
    this.moved = 0
    this.pointerId = null
    this.startPos = 0
    this.startPointer = 0
    this.lastPointer = 0
    this.lastTime = 0
    this.idleTimer = 0
    this.snapTargets = [0]

    this._frame = this._frame.bind(this)
    this._bind()

    this.el.style.willChange = 'transform'
    this._alive = true
    requestAnimationFrame(this._frame)
  }

  get viewSize() {
    const p = this.el.parentElement
    return this.axis === 'x' ? p.clientWidth : p.clientHeight
  }
  get contentSize() {
    return this.axis === 'x' ? this.el.scrollWidth : this.el.scrollHeight
  }
  get min() {
    return Math.min(0, this.viewSize - this.contentSize)
  }
  get max() {
    return 0
  }

  clamp(v) {
    return Math.max(this.min, Math.min(this.max, v))
  }

  computeSnapTargets() {
    if (this.getSnapTargets) return this.getSnapTargets(this)
    const kids = [...this.el.children].filter((c) => c.offsetWidth || c.offsetHeight)
    if (!kids.length) return [0]
    const view = this.viewSize
    if (this.axis === 'x') {
      return kids.map((k) => this.clamp(-(k.offsetLeft + k.offsetWidth / 2 - view / 2)))
    }
    return kids.map((k) => this.clamp(-k.offsetTop))
  }

  measure() {
    this.snapTargets = this.computeSnapTargets()
  }

  reset(animateTo = 0) {
    this.measure()
    this.target = this.clamp(animateTo)
  }

  nearestTarget(v) {
    let best = this.snapTargets[0] ?? 0
    let bestD = Infinity
    for (const t of this.snapTargets) {
      const d = Math.abs(t - v)
      if (d < bestD) {
        bestD = d
        best = t
      }
    }
    return best
  }

  scheduleSnap(delay = 140) {
    clearTimeout(this.idleTimer)
    if (!this.snap) return
    this.idleTimer = setTimeout(() => {
      if (this.dragging) return
      this.target = this.nearestTarget(this.target)
    }, delay)
  }

  _bind() {
    const el = this.el
    this._onDown = (e) => {
      if (!this.enabled) return
      if (e.button !== undefined && e.button !== 0) return
      this.measure()
      this.dragging = true
      this.moved = 0
      this.vel = 0
      this.pointerId = e.pointerId
      this.startPointer = this.axis === 'x' ? e.clientX : e.clientY
      this.startPos = this.target
      this.lastPointer = this.startPointer
      this.lastTime = performance.now()
      document.documentElement.classList.add('grabbing')
      el.setPointerCapture?.(e.pointerId)
    }
    this._onMove = (e) => {
      if (!this.dragging || e.pointerId !== this.pointerId) return
      const p = this.axis === 'x' ? e.clientX : e.clientY
      const delta = p - this.startPointer
      this.moved = Math.max(this.moved, Math.abs(delta))
      this.target = this.clamp(this.startPos - delta)
      const now = performance.now()
      const dt = Math.max(1, now - this.lastTime)
      this.vel = ((p - this.lastPointer) / dt) * 16
      this.lastPointer = p
      this.lastTime = now
    }
    this._onUp = (e) => {
      if (!this.dragging || (e.pointerId !== undefined && e.pointerId !== this.pointerId)) return
      this.dragging = false
      document.documentElement.classList.remove('grabbing')
      this.target = this.clamp(this.target - this.vel * this.momentum)
      this.vel = 0
      this.scheduleSnap()
    }
    this._onWheel = (e) => {
      if (!this.enabled) return
      e.preventDefault()
      const d = this.axis === 'x' ? e.deltaY + e.deltaX : e.deltaY
      this.target = this.clamp(this.target + d * this.wheelFactor)
      this.scheduleSnap(180)
    }
    this._onClickCapture = (e) => {
      if (this.moved > 8) {
        e.preventDefault()
        e.stopPropagation()
        this.moved = 0
      }
    }

    el.addEventListener('pointerdown', this._onDown)
    el.addEventListener('pointermove', this._onMove)
    el.addEventListener('pointerup', this._onUp)
    el.addEventListener('pointercancel', this._onUp)
    el.addEventListener('wheel', this._onWheel, { passive: false })
    el.addEventListener('click', this._onClickCapture, true)

    document.documentElement.classList.add('grabbable')
  }

  _frame() {
    if (!this._alive) return
    requestAnimationFrame(this._frame)
    if (!this.enabled) return

    if (this.dragging) {
      // target is driven directly by the pointer
    } else if (Math.abs(this.vel) > 0.05) {
      this.target = this.clamp(this.target - this.vel * 0.35)
      this.vel *= 0.9
    }

    this.pos += (this.target - this.pos) * this.damping
    if (Math.abs(this.target - this.pos) < 0.05) this.pos = this.target

    const p = this.pos
    this.el.style.transform =
      this.axis === 'x' ? `translate3d(${p}px, 0, 0)` : `translate3d(0, ${p}px, 0)`

    if (this.onProgress) {
      const span = Math.abs(this.min) || 1
      this.onProgress(Math.max(0, Math.min(1, -this.pos / span)), this.pos)
    }
  }

  destroy() {
    this.enabled = false
    this._alive = false
    clearTimeout(this.idleTimer)
    const el = this.el
    el.removeEventListener('pointerdown', this._onDown)
    el.removeEventListener('pointermove', this._onMove)
    el.removeEventListener('pointerup', this._onUp)
    el.removeEventListener('pointercancel', this._onUp)
    el.removeEventListener('wheel', this._onWheel)
    el.removeEventListener('click', this._onClickCapture, true)
    document.documentElement.classList.remove('grabbable', 'grabbing')
  }
}

export default DragScroll
