<script setup>
import { onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useGl } from '../lib/useGl'
import { state, site } from '../lib/store'

useGl()

onMounted(async () => {
  await nextTick()
  state.newsletterOpen = true
})
onBeforeUnmount(() => {
  state.newsletterOpen = false
})
</script>

<template>
  <main class="fixed inset-0 overflow-hidden">
    <div class="sr-only">
      <h1>Newsletter — Jesper Landberg</h1>
      <p>{{ site.newsletter }}</p>
      <p>
        Signing up is a form on this page. It posts an email address to /api/subscribe and confirmation
        is by email.
      </p>
    </div>
  </main>
</template>
