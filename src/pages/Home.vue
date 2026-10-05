<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { DragScroll } from '../lib/dragScroll'
import { useGl } from '../lib/useGl'
import { featured, site } from '../lib/store'

useGl()

const router = useRouter()
const track = ref(null)
let scroller = null
let axis = null

function mediaOf(p) {
  return p.video ? { video: p.video } : { media: p.src }
}

function open(p) {
  router.push(`/projects/${p.slug}`)
}

function build() {
  const next = window.innerWidth >= 650 ? 'x' : 'y'
  if (next === axis && scroller) return
  axis = next
  scroller?.destroy()
  scroller = new DragScroll(track.value, {
    axis,
    damping: 0.11,
    momentum: 9,
    wheelFactor: axis === 'x' ? 1 : 1,
  })
  scroller.measure()
}

onMounted(() => {
  build()
  window.addEventListener('resize', build)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', build)
  scroller?.destroy()
})
</script>

<template>
  <main class="fixed inset-0 overflow-hidden">
    <!-- semantic content for search + screen readers -->
    <div class="sr-only">
      <h1>Jesper Landberg — design engineer</h1>
      <p>{{ site.intro }}</p>
      <p>{{ site.awards }}</p>
      <h2>Featured work</h2>
      <ul>
        <li v-for="p in featured" :key="p.slug">
          <router-link :to="`/projects/${p.slug}`">{{ p.title }}</router-link> — {{ p.description }}
        </li>
      </ul>
      <h2>Elsewhere</h2>
      <ul>
        <li><router-link to="/full">Full index — every project by name</router-link></li>
        <li><router-link to="/newsletter">Newsletter</router-link></li>
        <li v-for="s in site.socials" :key="s.label">
          <a :href="s.url" target="_blank" rel="noopener">{{ s.label }}</a>
        </li>
        <li><a :href="`mailto:${site.email}`">{{ site.email }}</a></li>
      </ul>
    </div>

    <!-- horizontal (desktop) / vertical (mobile) draggable run -->
    <div class="absolute left-0 top-0 w-full s:top-1/2 s:-translate-y-1/2">
      <div
        ref="track"
        class="flex flex-col gap-y-20 px-20 s:flex-row s:gap-x-10 s:px-0"
      >
        <article
          v-for="p in featured"
          :key="p.slug"
          :data-id="p.slug"
          data-gl="card"
          data-radius="20"
          :data-media="mediaOf(p).media || null"
          :data-video="mediaOf(p).video || null"
          class="group relative w-full flex-none cursor-pointer rounded-15 s:h-[43.5svh] s:max-h-[55rem] s:w-auto s:rounded-20"
          :style="{ aspectRatio: `${p.width} / ${p.height}` }"
          @click="open(p)"
        >
          <p class="pointer-events-none absolute inset-x-10 bottom-10 flex items-end justify-between s:inset-x-20">
            <span class="whitespace-nowrap text-16 tracking-[-0.05em] drop-shadow-[0_1px_8px_rgba(0,0,0,0.5)] s:text-18">
              {{ p.title }}
            </span>
            <span
              class="relative inline-flex size-25 items-center justify-center rounded-full bg-black text-16 text-white opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100 s:size-25"
              aria-hidden="true"
            >
              ↗
            </span>
          </p>
        </article>
      </div>
    </div>

    <p class="sr-only">Drag or scroll to move through the featured projects.</p>
  </main>
</template>
