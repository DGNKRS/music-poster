import { useCallback, useEffect, useState } from 'react'

/**
 * Номер открытой книги, связанный с адресом страницы: #lun, #freon, #dar-monolita.
 * По такой ссылке постер откроется сразу на нужной книге.
 */
export function useBookHash(books) {
  const fromHash = useCallback(() => {
    const id = decodeURIComponent(window.location.hash.slice(1))
    return books.findIndex((book) => book.id === id)
  }, [books])

  const [index, setIndex] = useState(() => Math.max(fromHash(), 0))

  // replaceState, а не новая запись: кнопка «Назад» уводит с постера, а не листает книги.
  useEffect(() => {
    const hash = `#${books[index].id}`
    if (window.location.hash !== hash) window.history.replaceState(null, '', hash)
    document.title = `${books[index].title.toUpperCase()} · литературно-музыкальный постер`
  }, [books, index])

  useEffect(() => {
    const onHashChange = () => {
      const next = fromHash()
      if (next >= 0) setIndex(next)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [fromHash])

  return [index, setIndex]
}
