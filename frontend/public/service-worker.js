self.addEventListener('push', (event) => {
    console.log('[Service Worker] Push Received.');

    let data = { title: '새 메시지', contents: '메시지가 도착했습니다.' };

    if (event.data) {
        try {
            // 서버에서 보낸 JSON 데이터를 파싱 (NotificationService.java에서 보낸 Payload)
            data = event.data.json();
        } catch (e) {
            // 텍스트로 올 경우 대비
            data.contents = event.data.text();
        }
    }

    const title = data.title || 'Porti 알림';
    const options = {
        body: data.contents,
        icon: '/img/icons/android-chrome-192x192.png', // 앱 아이콘 경로
        badge: '/img/icons/favicon-32x32.png',        // 상태표시줄 작은 아이콘
        vibrate: [200, 100, 200],                     // 진동 패턴
        data: {
            url: '/chat' // 알림 클릭 시 이동할 URL
        }
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});