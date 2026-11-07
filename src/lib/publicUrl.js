/**
 * Адрес файла из папки public с учётом того, где опубликован сайт.
 * На GitHub Pages постер живёт в подпапке (/music-poster/), поэтому пути от корня
 * вида '/covers/…' там не открылись бы. Сборка идёт с base: './', и пути становятся относительными.
 */
export function publicUrl(path) {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`
}
