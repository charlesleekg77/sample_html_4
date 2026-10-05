<script setup>
import { ref } from 'vue'
import { useGl } from '../lib/useGl'
import { allProjects } from '../lib/store'

useGl()

const hovered = ref(null)

function isInternal(p) {
  return Boolean(p.featured)
}
function href(p) {
  return isInternal(p) ? `/projects/${p.slug}` : p.link
}
function enter(p) {
  hovered.value = p
}
function leave() {
  hovered.value = null
}
</script>

<template>
  <main data-gl-shield class="fixed inset-0 overflow-hidden">
    <div class="sr-only">
      <h1>Index — every project by Jesper Landberg</h1>
      <p>
        The full catalogue, featured or not. A featured project has a case study on this site; the rest
        are listed by name, with the client's own site linked where there is one.
      </p>
    </div>

    <!-- hover preview -->
    <div
      class="pointer-events-none fixed inset-0 z-20 flex items-center justify-center"
      aria-hidden="true"
    >
      <div
        data-gl="card"
        data-radius="20"
        :data-media="hovered && !hovered.video ? hovered.src : null"
        :data-id="hovered ? hovered.slug : null"
        :data-video="hovered && hovered.video ? hovered.video : null"
        class="h-[38svh] max-h-[46rem] w-[70vw] max-w-[70rem] transition-opacity duration-500 ease-out"
        :style="{
          aspectRatio: hovered ? `${hovered.width} / ${hovered.height}` : '16 / 10',
          opacity: hovered ? 1 : 0,
        }"
      ></div>
    </div>

    <div class="absolute inset-0">
      <div
        class="mx-auto flex min-h-full max-w-[42rem] flex-wrap content-center items-center justify-center gap-x-24 gap-y-6 px-20 s:max-w-[90rem]"
      >
        <span v-for="(p, i) in allProjects" :key="p.slug" class="relative flex">
          <a
            :href="href(p)"
            :target="isInternal(p) ? undefined : '_blank'"
            :rel="isInternal(p) ? undefined : 'noopener'"
            data-gl="text"
            class="pointer-events-auto cursor-pointer whitespace-nowrap text-18 leading-none tracking-[-0.05em] transition-opacity duration-300 s:text-30"
            :class="hovered && hovered.slug !== p.slug ? 'opacity-30' : 'opacity-100'"
            @mouseenter="enter(p)"
            @mouseleave="leave"
            @focus="enter(p)"
            @blur="leave"
          >
            {{ p.title }}
          </a>
          <span
            v-if="i < allProjects.length - 1"
            class="pointer-events-none absolute left-full top-1/2 ml-12 -translate-x-1/2 -translate-y-1/2 text-8 leading-none"
            aria-hidden="true"
          >
            ●
          </span>
        </span>
      </div>
    </div>

  </main>
</template>
