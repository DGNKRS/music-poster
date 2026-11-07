import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Полный адрес опубликованного сайта, например https://dgnkrs.github.io/music-poster/.
 * Нужен превью ссылки в Telegram: картинка в og:image должна быть с полным адресом.
 * На GitHub его передаёт workflow (.github/workflows/deploy.yml).
 */
const siteUrl = process.env.SITE_URL ?? ''

function siteUrlInHtml() {
  return {
    name: 'site-url-in-html',
    transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', siteUrl),
  }
}

// host: true + allowedHosts: true — чтобы dev-сервер открывался и по локальному
// адресу, и через превью-домен (в т.ч. в песочнице/контейнере).
export default defineConfig({
  // Относительные пути: сборка работает и в подпапке GitHub Pages, и в корне любого хостинга.
  base: './',
  plugins: [react(), siteUrlInHtml()],
  server: {
    host: true,
    port: 5173,
    strictPort: false,
    allowedHosts: true,
  },
  preview: {
    host: true,
    allowedHosts: true,
  },
})
