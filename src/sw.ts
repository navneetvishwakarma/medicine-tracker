/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { StaleWhileRevalidate } from 'workbox-strategies'

declare let self: ServiceWorkerGlobalScope

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// SPA fallback — all navigation requests return index.html
registerRoute(
  new NavigationRoute(
    ({ request }) =>
      fetch(request).catch(() =>
        caches.match('/index.html').then(
          (r) =>
            r ??
            new Response(
              '<!DOCTYPE html><html><body><p>You are offline. Open the app while connected to cache it.</p></body></html>',
              { status: 200, headers: { 'Content-Type': 'text/html' } },
            ),
        ),
      ),
  ),
)

// Stale-while-revalidate for Google Fonts
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new StaleWhileRevalidate({ cacheName: 'google-fonts-stylesheets' }),
)

// Notification click — focus or open app
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((c) => c.url.includes(self.location.origin))
        if (existing) return existing.focus()
        return self.clients.openWindow('/')
      }),
  )
})

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Medicine Reminder', {
      body: data.body ?? 'Time to take your medicine.',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: data.tag ?? 'reminder',
    }),
  )
})
