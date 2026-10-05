<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { DragScroll } from '../lib/dragScroll'
import { useGl } from '../lib/useGl'
import { bySlug, projects } from '../lib/store'

const props = defineProps({ slug: { type: String, required: true } })

useGl()

const router = useRouter()
const project = computed(() => bySlug(props.slug) || projects[0])

// Case-study cycle order, matching the "More work" nav on the original site.
const CYCLE = [
  'discoveryland',
  'griflan',
  'nathan-riley',
  'casa-di-solare',
  'the-lookback',
  'book-of-happiness',
  'dogelon-mars',
  'gil-huybrecht',
]
const cycleIndex = computed(() => {
  const i = CYCLE.indexOf(props.slug)
  return i === -1 ? 0 : i
})
const prev = computed(() => bySlug(CYCLE[(cycleIndex.value - 1 + CYCLE.length) % CYCLE.length]))
const next = computed(() => bySlug(CYCLE[(cycleIndex.value + 1) % CYCLE.length]))

function go(p) {
  if (p) router.push(`/projects/${p.slug}`)
}

// --- vertical media scroller -------------------------------------------
const mediaWrap = ref(null)
const mediaTrack = ref(null)
let scroller = null

function build() {
  scroller?.destroy()
  scroller = new DragScroll(mediaTrack.value, { axis: 'y', damping: 0.12, momentum: 8, snap: false })
  scroller.measure()
}

// --- horizontal sheet drag to reveal prev / next ------------------------
const dragOffset = ref(0)
let dragging = false
let startX = 0
let startOffset = 0

function clampPx(v) {
  return Math.max(-300, Math.min(300, v))
}
function sheetDown(e) {
  if (e.target.closest('[data-gl-clip]') || e.target.closest('a') || e.target.closest('button')) return
  dragging = true
  startX = e.clientX
  startOffset = dragOffset.value
  document.documentElement.classList.add('grabbing')
  e.currentTarget.setPointerCapture?.(e.pointerId)
}
function sheetMove(e) {
  if (!dragging) return
  dragOffset.value = clampPx(startOffset + (e.clientX - startX))
}
function sheetUp() {
  if (!dragging) return
  dragging = false
  document.documentElement.classList.remove('grabbing')
  if (dragOffset.value < -130) go(next.value)
  else if (dragOffset.value > 130) go(prev.value)
  dragOffset.value = 0
}

const prevX = computed(() => Math.max(0, dragOffset.value))
const nextX = computed(() => Math.max(0, -dragOffset.value))

onMounted(async () => {
  await nextTick()
  build()
  window.addEventListener('resize', build)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', build)
  scroller?.destroy()
})
watch(
  () => props.slug,
  async () => {
    await nextTick()
    dragOffset.value = 0
    build()
  },
)
</script>

<template>
  <main class="pointer-events-none fixed inset-0 z-20">
    <!-- semantic content -->
    <div class="sr-only">
      <h1>{{ project.title }}</h1>
      <p>{{ project.description }}</p>
      <p>Live site: {{ project.link }}</p>
      <p v-if="project.tags.length">Credits: {{ project.tags.map((t) => t.title).join(', ') }}</p>
    </div>

    <!-- prev / next panels, revealed by dragging the sheet -->
    <div
      data-gl="related"
      data-color="#ffffff"
      data-radius="20"
      class="pointer-events-none fixed inset-100 rounded-20 bg-white opacity-30"
      :style="{ transform: `translateX(calc(-100% - 9rem + ${prevX}px))` }"
    >
      <router-link
        :to="`/projects/${prev.slug}`"
        class="pointer-events-auto absolute inset-0 -right-25 cursor-pointer"
        :aria-label="`Previous project: ${prev.title}`"
      ></router-link>
    </div>
    <div
      data-gl="related"
      data-color="#ffffff"
      data-radius="20"
      class="pointer-events-none fixed inset-100 rounded-20 bg-white opacity-30"
      :style="{ transform: `translateX(calc(100% + 9rem - ${nextX}px))` }"
    >
      <router-link
        :to="`/projects/${next.slug}`"
        class="pointer-events-auto absolute inset-0 -left-25 cursor-pointer"
        :aria-label="`Next project: ${next.title}`"
      ></router-link>
    </div>

    <!-- the white case-study sheet -->
    <div
      data-gl="sheet"
      data-gl-clip
      data-color="#ffffff"
      data-radius="20"
      :data-id="project.slug"
      class="pointer-events-auto fixed inset-x-20 inset-y-15 flex flex-col gap-y-40 overflow-hidden rounded-15 px-10 s:inset-x-50 s:inset-y-20 s:flex-row s:items-start s:gap-x-100 s:rounded-20 s:pl-40 s:pr-120 s:pt-40"
      :style="{ transform: `translate3d(${dragOffset}px, 0, 0)` }"
      @pointerdown="sheetDown"
      @pointermove="sheetMove"
      @pointerup="sheetUp"
      @pointercancel="sheetUp"
    >
      <div class="flex flex-col items-start px-15 pt-40 s:flex-1 s:px-0 s:pt-0">
        <h1
          data-gl="text"
          class="relative whitespace-nowrap text-35 font-normal leading-none tracking-[-0.05em] text-black s:text-45"
        >
          {{ project.title }}
        </h1>
        <div
          data-gl="text"
          class="mt-15 max-w-[40rem] text-14 tracking-[-0.035em] text-black s:mt-20 s:text-16"
        >
          {{ project.description }}
        </div>

        <div class="mt-30 flex items-start gap-12 s:mt-45">
          <a
            data-gl="pill"
            data-color="#000000"
            :href="project.link"
            target="_blank"
            rel="noopener"
            :aria-label="`Visit ${project.title}`"
            class="pointer-events-auto relative inline-flex h-[2em] aspect-square items-center justify-center rounded-full bg-black px-2 text-white"
          >
            <span data-gl="text" class="text-16 text-white" aria-hidden="true">↗</span>
          </a>
          <div class="flex flex-wrap gap-4 s:gap-2">
            <span
              v-for="t in project.tags"
              :key="t.title"
              data-gl="pill"
              data-color="#eeeeee"
              class="relative inline-flex h-[2em] items-center rounded-full bg-paper px-[1.25em]"
            >
              <span data-gl="text" class="label whitespace-nowrap text-black">{{ t.title }}</span>
            </span>
          </div>
        </div>
      </div>

      <!-- vertical media column -->
      <div
        ref="mediaWrap"
        data-gl-clip
        class="relative w-full flex-1 overflow-hidden s:h-full s:w-700 s:flex-none"
      >
        <div ref="mediaTrack" class="flex flex-col items-center gap-y-30 s:gap-y-60">
          <div
            v-for="(m, i) in project.images"
            :key="i"
            data-gl="simple"
            data-radius="20"
            :data-media="m.video ? null : m.src"
            :data-video="m.video || null"
            class="w-full flex-none"
            :style="{ aspectRatio: `${m.width} / ${m.height}` }"
          ></div>
        </div>
      </div>

      <router-link
        to="/"
        data-gl="pill"
        data-color="#000000"
        aria-label="Close project"
        class="pointer-events-auto absolute right-15 bottom-15 inline-flex size-40 items-center justify-center rounded-full bg-black p-0 text-white s:right-30 s:top-30 s:bottom-auto s:size-45"
      >
        <span data-gl="text" class="text-16 text-white" aria-hidden="true">✕</span>
      </router-link>
    </div>
  </main>
</template>
