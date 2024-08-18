// 确保 Service Worker 已注册
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
        // 发送消息到 SW
        return new Promise((resolve, reject) => {
            const messageChannel = new MessageChannel();
            messageChannel.port1.onmessage = (event) => {
                if (event.data.status === 'updated') {
                    resolve();
                } else if (event.data.status === 'error') {
                    reject(new Error(event.data.error));
                }
            };

            registration.active.postMessage(
                { type: 'CHECK_VERSION_AND_UPDATE_CACHE' },
                [messageChannel.port2]
            );
        }).then(() => {
            console.log('Cache updated successfully');
        }).catch((error) => {
            console.error('Cache update failed:', error);
        });
    }).catch(error => {
        console.error('Service Worker registration failed:', error);
    });
}