import { useEffect, useState } from 'react'

/**
 * Браузеры не дают запустить звук, пока человек ни разу не взаимодействовал
 * со страницей. Хук сообщает, снят ли этот запрет.
 */
export function useUserActivation() {
  const [active, setActive] = useState(() => navigator.userActivation?.hasBeenActive ?? false)

  useEffect(() => {
    if (active) return
    const unlock = () => setActive(true)
    window.addEventListener('pointerdown', unlock)
    window.addEventListener('keydown', unlock)
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [active])

  return active
}
