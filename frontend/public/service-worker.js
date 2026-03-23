// 로그인 상태 (true: 로그인됨 → 알림 표시, false: 로그아웃 → 알림 미표시)
let isLoggedIn = true // 기본값: 알림 표시 (상태 미전달 시)

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SET_LOGIN_STATE') {
    isLoggedIn = !!event.data.isLoggedIn
    console.log('[Service Worker] isLoggedIn:', isLoggedIn)
  }
})

self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Received.')

  // 1. 기본값 설정 (Payload: roomIdx, senderIdx, senderEmail, contents, contentsTime)
  let payload = {
    roomIdx: 0,
    senderIdx: 0,
    senderEmail: 'SenderEmail',
    senderName: 'SenderName',
    senderProfileImage: 'SenderImage',
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

  // 로그아웃 상태면 팝업 알림 표시하지 않음
  if (!isLoggedIn) {
    console.log('[Service Worker] Skip notification (user logged out)')
    return
  }

  const title = payload.senderName || '새 메시지'
  const options = {
    body: payload.contents || '내용이 없습니다.',
    icon: '/img/icons/android-chrome-192x192.png',
    badge: '/img/icons/favicon-32x32.png',
    vibrate: [200, 100, 200],
    tag: `chat-room-${payload.roomIdx}`, // 방별로 알림 그룹화 (선택 사항)
    renotify: true,
    data: {
      url: '/chat',
      roomIdx: payload.roomIdx,
      senderIdx: payload.senderIdx ?? payload.senderId,
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
            senderName: payload.senderName,
            senderProfileImage: payload.senderProfileImage,
            contents: payload.contents,
            contentsTime: payload.contentsTime,
          },
        })
      })
    })

  event.waitUntil(Promise.all([showNotification, pushToClient]))
})

// 알림 클릭 시 처리 - senderId로 해당 채팅방으로 이동
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const { senderIdx } = event.notification.data || {}
  const chatUrl = senderIdx != null ? `/chat?senderId=${senderIdx}` : '/chat'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        clientList[0].focus()
        return clientList[0].navigate(chatUrl)
      }
      return self.clients.openWindow(chatUrl)
    }),
  )
})
