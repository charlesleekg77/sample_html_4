import fs from 'node:fs'
import path from 'node:path'

/**
 * Dev/preview middleware that mirrors the original site's "content for
 * non-browsers" behaviour:
 *   - append `.md` to any path to get the Markdown version
 *   - send `Accept: text/markdown` on an HTML route to get Markdown back
 *   - POST /api/subscribe accepts the newsletter form
 */
export function markdownAndApi(root) {
  const mdDir = path.join(root, 'public', 'md')

  const mapPath = (url) => {
    const clean = url.split('?')[0].replace(/\/+$/, '') || '/'
    if (clean === '/' || clean === '/index.md') return 'index.md'
    if (clean === '/full' || clean === '/full.md') return 'full.md'
    if (clean === '/newsletter' || clean === '/newsletter.md') return 'newsletter.md'
    const m = clean.match(/^\/projects\/([^/]+?)(?:\.md)?$/)
    if (m) return `${m[1]}.md`
    return null
  }

  const middleware = (req, res, next) => {
    const url = req.url.split('?')[0]

    if (url === '/api/subscribe' && req.method === 'POST') {
      let body = ''
      req.on('data', (c) => (body += c))
      req.on('end', () => {
        let email = ''
        try {
          email = JSON.parse(body).email
        } catch {
          email = new URLSearchParams(body).get('email')
        }
        const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '')
        res.statusCode = ok ? 200 : 400
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ ok }))
      })
      return
    }

    const wantsMd =
      url.endsWith('.md') ||
      (req.headers.accept || '').includes('text/markdown')

    if (wantsMd) {
      const file = mapPath(url)
      if (file) {
        const full = path.join(mdDir, file)
        if (fs.existsSync(full)) {
          res.statusCode = 200
          res.setHeader('Content-Type', 'text/markdown; charset=utf-8')
          res.setHeader('Link', '</index.md>; rel="alternate"; type="text/markdown"')
          res.end(fs.readFileSync(full))
          return
        }
      }
    }
    next()
  }

  return {
    name: 'markdown-and-api',
    configureServer(server) {
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    },
  }
}

export default markdownAndApi
