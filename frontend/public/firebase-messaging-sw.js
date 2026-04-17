// public/firebase-messaging-sw.js
// This file MUST be placed in the /public folder so it's served at the root URL
importScripts('https://www.gstatic.com/firebasejs/10.6.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.6.0/firebase-messaging-compat.js')

// Config is injected at build time or set here directly
// Replace with your real values - this file is public, so only use public keys
firebase.initializeApp({
  apiKey:            self.__FIREBASE_API_KEY__            || 'YOUR_API_KEY',
  authDomain:        self.__FIREBASE_AUTH_DOMAIN__        || 'YOUR_PROJECT.firebaseapp.com',
  projectId:         self.__FIREBASE_PROJECT_ID__         || 'YOUR_PROJECT_ID',
  messagingSenderId: self.__FIREBASE_MESSAGING_SENDER_ID__|| 'YOUR_SENDER_ID',
  appId:             self.__FIREBASE_APP_ID__             || 'YOUR_APP_ID'
})

const messaging = firebase.messaging()

// Handle background push messages
messaging.onBackgroundMessage(payload => {
  const { title, body } = payload.notification || {}
  const link = payload.fcmOptions?.link || '/'

  self.registration.showNotification(title || 'Disk Media', {
    body:  body || '',
    icon:  '/logo-192.png',
    badge: '/badge-72.png',
    data:  { link },
    actions: [{ action: 'open', title: 'Open' }]
  })
})

// Open link when notification is clicked
self.addEventListener('notificationclick', event => {
  event.notification.close()
  const link = event.notification.data?.link || '/'
  event.waitUntil(clients.openWindow(link))
})
