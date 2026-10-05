import { createRouter, createWebHistory } from 'vue-router'

import Home from './pages/Home.vue'
import Full from './pages/Full.vue'
import Project from './pages/Project.vue'
import Newsletter from './pages/Newsletter.vue'

const routes = [
  { path: '/', name: 'home', component: Home },
  { path: '/full', name: 'full', component: Full },
  { path: '/newsletter', name: 'newsletter', component: Newsletter },
  { path: '/projects/:slug', name: 'project', component: Project, props: true },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
