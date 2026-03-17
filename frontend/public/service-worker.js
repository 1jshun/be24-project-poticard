self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Received.')

  // 1. 기본값 설정 (Payload: roomIdx, senderIdx, senderEmail, contents, contentsTime)
  let payload = {
    roomIdx: 0,
    senderIdx: 0,
    senderEmail: 'System',
    contents: '',
    contentsTime: Date.now(),
  }

  // 2. 데이터 파싱
  if (event.data) {
    try {
      payload = event.data.json()
      console.log('[Service Worker] Payload:', payload)
    } catch (e) {
      console.error('[Service Worker] JSON Parsing failed:', e)
      payload.contents = event.data.text()
    }
  }

  const title = payload.senderEmail || '새 메시지'
  const options = {
    body: payload.contents || '내용이 없습니다.',
    icon: '/img/icons/android-chrome-192x192.png',
    badge: '/img/icons/favicon-32x32.png',
    vibrate: [200, 100, 200],
    tag: `chat-room-${payload.roomIdx}`, // 방별로 알림 그룹화 (선택 사항)
    renotify: true,
    data: {
      url: '/chat',
      roomIdx: payload.roomIdx, // 클릭 시 해당 방으로 이동하기 위한 데이터
    },
  }

  const showNotification = self.registration.showNotification(title, options)

  const pushToClient = self.clients
    .matchAll({ type: 'window', includeUncontrolled: true })
    .then((clientList) => {
      clientList.forEach((client) => {
        client.postMessage({
          type: 'PUSH_RECEIVED',
          payload: {
            roomIdx: payload.roomIdx,
            senderIdx: payload.senderIdx,
            senderEmail: payload.senderEmail,
            contents: payload.contents,
            contentsTime: payload.contentsTime,
          },
        })
      })
    })

  event.waitUntil(Promise.all([showNotification, pushToClient]))
})

// 알림 클릭 시 처리
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        clientList[0].focus()
        return clientList[0].navigate('/chat')
      }
      return self.clients.openWindow('/chat')
    }),
  )
})
