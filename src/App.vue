<script setup>
import { onMounted, onBeforeUnmount, ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import gl from './webgl/gl'
import { state, site } from './lib/store'

const route = useRoute()
const router = useRouter()
const glMount = ref(null)
const curtainUp = ref(false)
const email = ref('')
const status = ref('')
const busy = ref(false)

const isFeatured = computed(() => route.path === '/' || route.path.startsWith('/projects'))
const isFull = computed(() => route.path === '/full')

function toggleProfile() {
  state.newsletterOpen = false
  state.profileOpen = !state.profileOpen
}
function toggleNewsletter() {
  state.profileOpen = false
  state.newsletterOpen = !state.newsletterOpen
}
function closeOverlays() {
  state.profileOpen = false
  state.newsletterOpen = false
}

async function submit() {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    status.value = 'Enter a valid email address.'
    return
  }
  busy.value = true
  status.value = ''
  try {
    await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value }),
    })
    status.value = 'Thanks — check your inbox to confirm.'
    email.value = ''
  } catch {
    status.value = 'Something went wrong. Try again.'
  } finally {
    busy.value = false
  }
}

function onKey(e) {
  if (e.key === 'Escape') closeOverlays()
}

watch(
  () => route.fullPath,
  () => {
    // The intro doubles as the home hero: it sits over the featured run and
    // the Profile button simply toggles it.
    state.newsletterOpen = false
    state.profileOpen = route.path === '/'
    requestAnimationFrame(() => gl.refresh())
  },
)

onMounted(() => {
  gl.init(glMount.value)
  gl.refresh()
  setTimeout(() => gl.refresh(), 200)
  state.profileOpen = route.path === '/'
  window.addEventListener('keydown', onKey)

  // intro: hold the curtain briefly, then lift it
  const t = setTimeout(() => {
    curtainUp.value = true
    state.loading = false
    setTimeout(() => gl.refresh(), 60)
  }, 1500)
  onBeforeUnmount(() => clearTimeout(t))
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
})
</script>

<template>
  <div class="bg-black">
    <!-- WebGL layer: DOM-mirrored quads are drawn here -->
    <div ref="glMount" class="gl"></div>

    <!-- semantic fallback / SEO content for the shell -->
    <p class="sr-only">
      Jesper Landberg, design engineer. Featured work, full project index, case studies and newsletter.
    </p>

    <!-- Pages -->
    <router-view v-slot="{ Component }">
      <transition name="page" mode="out-in">
        <component :is="Component" :key="route.path" />
      </transition>
    </router-view>

    <!-- Fixed chrome -->
    <div class="pointer-events-none fixed inset-0 z-40 flex flex-col justify-between px-40 py-25 s:px-80 s:py-40 text-white">
      <div class="flex items-start justify-between">
        <router-link
          to="/"
          data-gl="text"
          class="label pointer-events-auto relative cursor-pointer before:absolute before:-inset-15"
        >
          {{ site.name }}
        </router-link>
        <button
          type="button"
          data-gl="text"
          :aria-expanded="state.profileOpen"
          class="label pointer-events-auto relative before:absolute before:-inset-15 transition-opacity duration-300 ease-out hover:opacity-60"
          @click="toggleProfile"
        >
          {{ state.profileOpen ? 'Close' : 'Profile' }}
        </button>
      </div>

      <div class="relative flex justify-start">
        <nav class="label relative pointer-events-auto flex gap-x-5 before:absolute before:-inset-15" aria-label="Project views">
          <router-link
            to="/"
            data-gl="text"
            class="relative transition-opacity duration-500 ease-out"
            :class="isFeatured ? 'opacity-100' : 'opacity-50 hover:opacity-100'"
            :aria-current="isFeatured ? 'page' : undefined"
          >
            Featured
          </router-link>
          <span aria-hidden="true">/</span>
          <router-link
            to="/full"
            data-gl="text"
            class="relative transition-opacity duration-500 ease-out"
            :class="isFull ? 'opacity-100' : 'opacity-50 hover:opacity-100'"
            :aria-current="isFull ? 'page' : undefined"
          >
            Full
          </router-link>
        </nav>
        <button
          type="button"
          data-gl="text"
          :aria-expanded="state.newsletterOpen"
          class="label pointer-events-auto absolute bottom-0 right-0 before:absolute before:-inset-15 transition-opacity duration-300 ease-out hover:opacity-60"
          @click="toggleNewsletter"
        >
          Newsletter
        </button>
      </div>
    </div>

    <!-- Profile overlay -->
    <div
      class="pointer-events-none fixed left-1/2 top-1/2 z-40 w-420 -translate-x-1/2 -translate-y-1/2 s:w-600"
      :class="{ inert: !state.profileOpen }"
      :aria-hidden="!state.profileOpen"
    >
      <div
        data-gl-shield
        class="absolute inset-x-20 top-1/2 flex -translate-y-1/2 flex-col items-center text-center text-white transition-opacity duration-500 ease-out"
        :class="state.profileOpen ? 'opacity-100' : 'opacity-0'"
      >
        <p data-gl="text" class="text-14 leading-14 tracking-[-0.02em] max-w-[35rem] s:max-w-[45rem]">
          {{ site.intro }}
        </p>
        <p data-gl="text" class="label opacity-60 mt-25 s:mt-30">{{ site.awards }}</p>
        <ul class="mt-25 flex list-none flex-wrap items-center justify-center gap-x-20 gap-y-8 s:mt-30">
          <li v-for="s in site.socials" :key="s.label">
            <a
              data-gl="text"
              :href="s.url"
              target="_blank"
              rel="noopener"
              class="label pointer-events-auto block"
              :class="{ 'pointer-events-none': !state.profileOpen }"
            >
              {{ s.label }}
            </a>
          </li>
          <li>
            <a
              data-gl="text"
              :href="`mailto:${site.email}`"
              class="label pointer-events-auto block"
              :class="{ 'pointer-events-none': !state.profileOpen }"
            >
              Email
            </a>
          </li>
        </ul>
      </div>
    </div>

    <!-- Newsletter overlay -->
    <div
      class="pointer-events-none fixed left-1/2 top-1/2 z-40 w-420 -translate-x-1/2 -translate-y-1/2 s:w-600"
      :class="{ inert: !state.newsletterOpen }"
      :aria-hidden="!state.newsletterOpen"
    >
      <div
        data-gl-shield
        class="absolute inset-x-20 top-1/2 flex -translate-y-1/2 flex-col items-center text-center text-white transition-opacity duration-500 ease-out"
        :class="state.newsletterOpen ? 'opacity-100' : 'opacity-0'"
      >
        <p data-gl="text" class="text-14 leading-14 tracking-[-0.02em] max-w-[30rem] s:max-w-[32.5rem]">
          {{ site.newsletter }}
        </p>
        <form
          class="pointer-events-auto mt-25 flex w-full max-w-[26rem] items-center gap-x-8 s:mt-30 s:max-w-[32rem]"
          :aria-busy="busy"
          novalidate
          @submit.prevent="submit"
        >
          <div class="relative flex h-40 w-full min-w-0 flex-1 items-center rounded-full bg-black px-20 s:h-45">
            <input
              v-model="email"
              type="email"
              name="email"
              autocomplete="email"
              autocapitalize="off"
              autocorrect="off"
              spellcheck="false"
              enterkeyhint="send"
              aria-label="Email address"
              placeholder="Email address"
              :disabled="!state.newsletterOpen"
              class="relative z-1 h-full w-full border-0 bg-transparent text-14 tracking-[-0.02em] text-white outline-none placeholder:text-white/40"
            />
          </div>
          <button
            type="submit"
            aria-label="Subscribe"
            :disabled="busy || !state.newsletterOpen"
            class="relative size-40 flex-none rounded-full bg-white text-black transition-opacity disabled:opacity-40 s:size-45"
          >
            <span class="absolute inset-0 flex items-center justify-center text-16">→</span>
          </button>
          <input name="company" tabindex="-1" autocomplete="off" aria-hidden="true" class="hidden" />
        </form>
        <p role="status" aria-live="polite" class="label mt-15 min-h-[1.2em] w-full text-center opacity-60">
          {{ status }}
        </p>
      </div>
    </div>

    <!-- Loader -->
    <div class="pointer-events-none fixed inset-0 z-40 flex items-center justify-center">
      <div class="flex gap-x-8">
        <div
          v-for="i in 3"
          :key="i"
          data-gl="bar"
          data-color="#ffffff"
          class="h-5 rounded-[2rem] transition-all ease-out"
          :style="{
            width: state.loading ? (i === 1 ? '8rem' : i === 2 ? '6rem' : '4rem') : '2rem',
            transitionDuration: '900ms',
            transitionDelay: `${(i - 1) * 120}ms`,
          }"
        ></div>
      </div>
    </div>

    <!-- Curtain -->
    <div
      class="fixed inset-0 z-99 bg-black transition-transform duration-1000 ease-out"
      :class="curtainUp ? '-translate-y-full' : 'translate-y-0'"
      aria-hidden="true"
    ></div>
  </div>
</template>

<style scoped>
.inert {
  pointer-events: none;
}
.page-enter-active,
.page-leave-active {
  transition: opacity 500ms cubic-bezier(0.22, 1, 0.36, 1);
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
}
</style>
