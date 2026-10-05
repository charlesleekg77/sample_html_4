import { reactive } from 'vue'
import projectsData from '../data/projects.json'

export const projects = projectsData

export const featured = projects
  .filter((p) => p.featured)
  .sort((a, b) => a.featured - b.featured)

export const allProjects = projects

export function bySlug(slug) {
  return projects.find((p) => p.slug === slug)
}

export function projectIndex(slug) {
  return projects.findIndex((p) => p.slug === slug)
}

export const state = reactive({
  profileOpen: false,
  newsletterOpen: false,
  loading: true,
  glReady: false,
  routeKey: 0,
})

export const site = {
  name: 'Jesper Landberg',
  role: 'design engineer',
  email: 'jesper@alpacka.studio',
  intro:
    'Jesper Landberg, Swedish design engineer, named Awwwards Independent of the Year in 2022 and 2024, building visually rich, motion-driven websites. Usually lead or sole developer, responsible for front-end architecture, animation, interaction and CMS, alongside international agencies and creative teams.',
  awards: '77 awards — 30× Awwwards, 40× FWA, 3× Webby, 2× Lovie',
  newsletter:
    'An occasional newsletter with insights and thoughts from a design engineer, drawn from over a decade of freelancing.',
  socials: [
    { label: 'Instagram', url: 'https://www.instagram.com/jesperlandberg222/' },
    { label: 'X', url: 'https://x.com/jesper_alpacka' },
    { label: 'LinkedIn', url: 'https://www.linkedin.com/in/jesper-landberg-ba2984256/' },
  ],
}
