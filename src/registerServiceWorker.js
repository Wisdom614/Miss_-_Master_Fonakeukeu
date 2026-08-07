const UPDATE_CHECK_INTERVAL = 60 * 60 * 1000

export function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return

  let reloadingForUpdate = false

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloadingForUpdate) return

    reloadingForUpdate = true
    window.location.reload()
  })

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        updateViaCache: 'none',
      })

      const checkForUpdate = () => registration.update().catch(() => undefined)

      window.setInterval(checkForUpdate, UPDATE_CHECK_INTERVAL)
      window.addEventListener('focus', checkForUpdate)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') checkForUpdate()
      })
    } catch (error) {
      console.error('Unable to register the update service worker.', error)
    }
  }, { once: true })
}
