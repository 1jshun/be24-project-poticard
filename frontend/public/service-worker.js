self.addEventListener('push', function(event) {
    console.log('ServiceWorker Push Received');

    let data = {};
    if (event.data) {
        // 서버에서 보낸 JSON 데이터 파싱.
        data = event.data.json();
    }
})