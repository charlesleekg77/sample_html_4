import * as THREE from 'three'

/**
 * DOM-mirroring WebGL layer.
 *
 * The DOM is the layout source of truth. Any element carrying a `data-gl`
 * attribute is measured every frame and a matching quad is drawn in a
 * full-viewport canvas that sits above the page (z-10). This lets media,
 * white "sheets", pills and text all live in one 3D layer while the real
 * DOM keeps its hit areas, semantics and accessibility.
 *
 * Recognised attributes:
 *   data-gl        text | card | simple | sheet | pill | related | bar
 *   data-media     image url (textured quad)
 *   data-video     mp4 url (video-textured quad)
 *   data-color     solid colour for non-textured quads
 *   data-radius    corner radius in rem, or "full"
 *   data-opacity   extra opacity multiplier
 */

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uTexture;
  uniform vec2  uSize;
  uniform vec2  uUvScale;
  uniform vec2  uCenter;
  uniform vec4  uClip;      // left, top, right, bottom (screen px, y down)
  uniform vec3  uColor;
  uniform float uRadius;
  uniform float uOpacity;
  uniform float uHasTexture;
  uniform float uHasClip;

  float sdRound(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
  }

  void main() {
    vec2 p = (vUv - 0.5) * uSize;
    float r = min(uRadius, min(uSize.x, uSize.y) * 0.5);
    float d = sdRound(p, uSize * 0.5, r);
    float mask = 1.0 - smoothstep(-1.0, 1.0, d);

    if (uHasClip > 0.5) {
      vec2 world = uCenter + p;
      vec2 screen = vec2(world.x, -world.y);
      float cx = smoothstep(uClip.x - 1.0, uClip.x + 1.0, screen.x)
               * (1.0 - smoothstep(uClip.z - 1.0, uClip.z + 1.0, screen.x));
      float cy = smoothstep(uClip.y - 1.0, uClip.y + 1.0, screen.y)
               * (1.0 - smoothstep(uClip.w - 1.0, uClip.w + 1.0, screen.y));
      mask *= cx * cy;
    }

    vec4 col;
    if (uHasTexture > 0.5) {
      vec2 uv = (vUv - 0.5) * uUvScale + 0.5;
      col = texture2D(uTexture, uv);
    } else {
      col = vec4(uColor, 1.0);
    }

    float a = col.a * mask * uOpacity;
    if (a <= 0.001) discard;
    gl_FragColor = vec4(col.rgb, a);
  }
`

const RENDER_ORDER = {
  related: 0,
  sheet: 1,
  bar: 2,
  card: 3,
  simple: 4,
  pill: 5,
  text: 6,
}

function rootFontSize() {
  return parseFloat(getComputedStyle(document.documentElement).fontSize) || 10
}

function isDisplayed(el, cs) {
  if (cs.display === 'none' || cs.visibility === 'hidden') return false
  const r = el.getBoundingClientRect()
  return r.width > 0.5 && r.height > 0.5
}

function rasterizeText(el, dpr) {
  const cs = getComputedStyle(el)
  const rect = el.getBoundingClientRect()
  const W = Math.max(1, Math.round(rect.width))
  const H = Math.max(1, Math.round(rect.height))

  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(W * dpr))
  canvas.height = Math.max(1, Math.round(H * dpr))
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)

  const fontSize = parseFloat(cs.fontSize) || 14
  const lh = parseFloat(cs.lineHeight) || fontSize * 1.2
  ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${fontSize}px ${cs.fontFamily}`
  if ('letterSpacing' in ctx) {
    ctx.letterSpacing = !cs.letterSpacing || cs.letterSpacing === 'normal' ? '0px' : cs.letterSpacing
  }
  ctx.fillStyle = cs.color || '#ffffff'
  ctx.textBaseline = 'middle'

  let text = (el.innerText || '').replace(/\s+/g, ' ').trim()
  if (cs.textTransform === 'uppercase') text = text.toUpperCase()

  const words = text.split(' ').filter(Boolean)
  const lines = []
  let line = ''
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (line && ctx.measureText(test).width > W) {
      lines.push(line)
      line = word
    } else {
      line = test
    }
  }
  if (line) lines.push(line)

  const align = cs.textAlign
  lines.forEach((ln, i) => {
    const y = lh * (i + 0.5)
    let x = 0
    if (align === 'center') {
      ctx.textAlign = 'center'
      x = W / 2
    } else if (align === 'right') {
      ctx.textAlign = 'right'
      x = W
    } else {
      ctx.textAlign = 'left'
      x = 0
    }
    ctx.fillText(ln, x, y)
  })

  return canvas
}

class GLItem {
  constructor(el, layer) {
    this.el = el
    this.layer = layer
    this.type = el.dataset.gl
    this.color = el.dataset.color || '#000000'
    this.radiusRaw = el.dataset.radius ?? (this.type === 'pill' ? 'full' : '0')
    this.extraOpacity = parseFloat(el.dataset.opacity || '1')
    this.texture = null
    this.videoEl = null
    this.textSize = ''

    const geometry = new THREE.PlaneGeometry(1, 1)
    this.material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uTexture: { value: null },
        uSize: { value: new THREE.Vector2(1, 1) },
        uUvScale: { value: new THREE.Vector2(1, 1) },
        uCenter: { value: new THREE.Vector2(0, 0) },
        uClip: { value: new THREE.Vector4(0, 0, 0, 0) },
        uColor: { value: new THREE.Color(this.color) },
        uRadius: { value: 0 },
        uOpacity: { value: 1 },
        uHasTexture: { value: 0 },
        uHasClip: { value: 0 },
      },
    })
    this.mesh = new THREE.Mesh(geometry, this.material)
    this.mesh.renderOrder = RENDER_ORDER[this.type] ?? 3
    this.mesh.frustumCulled = false

    this.load()
  }

  load() {
    const src = this.el.dataset.media
    const video = this.el.dataset.video

    if (video) {
      const v = document.createElement('video')
      v.src = video
      v.muted = true
      v.loop = true
      v.playsInline = true
      v.crossOrigin = 'anonymous'
      v.autoplay = true
      v.preload = 'auto'
      this.videoEl = v
      const tex = new THREE.VideoTexture(v)
      tex.minFilter = THREE.LinearFilter
      tex.magFilter = THREE.LinearFilter
      this.texture = tex
      this.material.uniforms.uTexture.value = tex
      this.material.uniforms.uHasTexture.value = 1
      const play = () => v.play().catch(() => {})
      v.addEventListener('loadeddata', play)
      play()
    } else if (src) {
      const loader = new THREE.TextureLoader()
      loader.setCrossOrigin('anonymous')
      loader.load(
        src,
        (tex) => {
          tex.minFilter = THREE.LinearMipmapLinearFilter
          tex.magFilter = THREE.LinearFilter
          this.texture = tex
          this.material.uniforms.uTexture.value = tex
          this.material.uniforms.uHasTexture.value = 1
        },
        undefined,
        () => {},
      )
    }
  }

  syncText(rect, dpr) {
    const cs = getComputedStyle(this.el)
    const key = [
      Math.round(rect.width),
      Math.round(rect.height),
      dpr,
      this.el.innerText || '',
      cs.color,
      cs.fontSize,
      cs.fontWeight,
      cs.textTransform,
      cs.letterSpacing,
      cs.textAlign,
    ].join('|')
    if (key === this.textSize) return
    this.textSize = key
    const canvas = rasterizeText(this.el, dpr)
    if (!this.texture) {
      this.texture = new THREE.CanvasTexture(canvas)
      this.material.uniforms.uTexture.value = this.texture
    } else {
      this.texture.image = canvas
      this.texture.needsUpdate = true
    }
    this.material.uniforms.uHasTexture.value = 1
  }

  update(dpr) {
    const cs = getComputedStyle(this.el)
    if (!isDisplayed(this.el, cs)) {
      this.mesh.visible = false
      return
    }
    this.mesh.visible = true

    const rect = this.el.getBoundingClientRect()
    const w = rect.width
    const h = rect.height

    this.mesh.position.set(rect.left + w / 2, -(rect.top + h / 2), 0)
    this.mesh.scale.set(w, h, 1)

    const u = this.material.uniforms
    u.uSize.value.set(w, h)
    u.uCenter.value.set(this.mesh.position.x, this.mesh.position.y)

    const clipEl = this.el.closest('[data-gl-clip]')
    if (clipEl && clipEl !== this.el) {
      const cr = clipEl.getBoundingClientRect()
      u.uClip.value.set(cr.left, cr.top, cr.right, cr.bottom)
      u.uHasClip.value = 1
    } else {
      u.uHasClip.value = 0
    }

    const rf = rootFontSize()
    let radius = 0
    if (this.radiusRaw === 'full') radius = Math.min(w, h) / 2
    else radius = (parseFloat(this.radiusRaw) || 0) * rf
    u.uRadius.value = radius

    u.uOpacity.value = (parseFloat(cs.opacity) || 0) * this.extraOpacity

    if (this.type === 'text') {
      this.syncText(rect, dpr)
    } else if (this.texture && this.texture.image) {
      const img = this.texture.image
      const iw = img.videoWidth || img.naturalWidth || img.width
      const ih = img.videoHeight || img.naturalHeight || img.height
      if (iw && ih) {
        const pa = w / h
        const ta = iw / ih
        let sx = 1
        let sy = 1
        if (ta > pa) sx = pa / ta
        else sy = ta / pa
        u.uUvScale.value.set(sx, sy)
      }
    }
  }

  dispose() {
    this.mesh.geometry.dispose()
    this.material.dispose()
    if (this.texture) this.texture.dispose()
    if (this.videoEl) {
      this.videoEl.pause()
      this.videoEl.removeAttribute('src')
      this.videoEl.load()
    }
  }
}

class GLLayer {
  constructor() {
    this.items = []
    this.ready = false
    this.hidden = false
    this.dpr = Math.min(window.devicePixelRatio || 1, 2)
  }

  init(mountEl) {
    if (this.ready) return
    this.mountEl = mountEl

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(this.dpr)
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace
    this.renderer.setClearColor(0x000000, 0)
    mountEl.appendChild(this.renderer.domElement)

    this.scene = new THREE.Scene()
    this.camera = new THREE.OrthographicCamera(0, window.innerWidth, 0, -window.innerHeight, -1000, 1000)
    this.camera.position.z = 10

    this.onResize = () => this.resize()
    this.onVisibility = () => {
      this.hidden = document.hidden
    }
    window.addEventListener('resize', this.onResize)
    document.addEventListener('visibilitychange', this.onVisibility)

    document.documentElement.classList.add('gl-active')
    this.ready = true
    this.loop = this.loop.bind(this)
    requestAnimationFrame(this.loop)
  }

  resize() {
    if (!this.ready) return
    this.dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = window.innerWidth
    const h = window.innerHeight
    this.renderer.setPixelRatio(this.dpr)
    this.renderer.setSize(w, h)
    this.camera.left = 0
    this.camera.right = w
    this.camera.top = 0
    this.camera.bottom = -h
    this.camera.updateProjectionMatrix()
    for (const item of this.items) item.textSize = ''
  }

  register(el) {
    if (!el || el.__glItem) return
    const item = new GLItem(el, this)
    el.__glItem = item
    this.items.push(item)
    this.scene.add(item.mesh)
  }

  unregister(el) {
    const item = el && el.__glItem
    if (!item) return
    this.scene.remove(item.mesh)
    item.dispose()
    this.items = this.items.filter((i) => i !== item)
    delete el.__glItem
  }

  refresh(root = document) {
    if (!this.ready) return
    for (const el of root.querySelectorAll('[data-gl]')) this.register(el)
    for (const item of [...this.items]) {
      if (!document.contains(item.el)) this.unregister(item.el)
    }
  }

  clear() {
    for (const item of [...this.items]) this.unregister(item.el)
  }

  loop() {
    requestAnimationFrame(this.loop)
    if (!this.ready || this.hidden) return
    for (const item of this.items) item.update(this.dpr)
    this.renderer.render(this.scene, this.camera)
  }
}

export const gl = new GLLayer()
export default gl
