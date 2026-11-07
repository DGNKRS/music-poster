/**
 * Какой плеер включать у треков, где есть и Spotify, и Яндекс Музыка.
 * По умолчанию Spotify; если человек переключился на Яндекс, выбор запоминается в браузере.
 */
const KEY = 'poster:player'

export function prefersYandex() {
  try {
    return window.localStorage.getItem(KEY) === 'yandex'
  } catch {
    return false
  }
}

export function setPrefersYandex(on) {
  try {
    window.localStorage.setItem(KEY, on ? 'yandex' : 'spotify')
  } catch {
    // Хранилище может быть недоступно (приватный режим): выбор действует до закрытия окошка.
  }
}
