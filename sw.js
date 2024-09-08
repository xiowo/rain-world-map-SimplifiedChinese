// sw.js

// 定义要缓存的文件列表
const urlsToCache = [
    '/',
    '/index.html',
    '/rw-map.html',
    '/map.html',
    '/region-map.html',
    '/rw.css',
    '/slugcats.json',
    '/global.js',
    '/beziero.js',
    '/embed.jpg',
];

const VERSION_URL = '/version.json';

// 获取本地缓存的版本号
async function getCacheVersion() {
    const cache = await caches.open('RWMSC-version-cache');
    const response = await cache.match('cacheVersion');
    if (response) {
        return response.text();
    }
    return null; // 本地没有缓存版本
}

// 将版本号保存到缓存中
async function setCacheVersion(version) {
    const cache = await caches.open('RWMSC-version-cache');
    await cache.put('cacheVersion', new Response(version));
}

// 获取最新的版本号
async function fetchCacheVersion() {
    try {
        const response = await fetch(VERSION_URL);
        const data = await response.json();
        return data.cacheVersion;
    } catch (error) {
        console.error('无法获取缓存版本:', error);
        throw error; // 无法获取版本号时抛出错误
    }
}

// 更新缓存，删除旧版本并缓存最新资源
async function updateCache() {
    let currentCacheVersion = await getCacheVersion();

    if (!currentCacheVersion) {
        console.log('本地没有缓存版本，直接更新到最新版');
        currentCacheVersion = await fetchCacheVersion();
    }

    const newCacheVersion = await fetchCacheVersion();

    console.log(`当前缓存版本: ${currentCacheVersion}`);
    console.log(`最新缓存版本: ${newCacheVersion}`);

    if (newCacheVersion !== currentCacheVersion) {
        console.log(`缓存更新: 本地 ${currentCacheVersion} --> 最新 ${newCacheVersion}`);

        // 删除旧版本缓存
        const cacheNames = await caches.keys();
        await Promise.all(
            cacheNames.map((cacheName) => {
                if (cacheName !== `RWMSC-${newCacheVersion}` && cacheName !== 'RWMSC-version-cache') {
                    console.log(`删除过时缓存: ${cacheName}`);
                    return caches.delete(cacheName);
                }
            })
        );

        // 创建并填充新版本缓存
        const cache = await caches.open(`RWMSC-${newCacheVersion}`);
        console.log('启用最新缓存:', `RWMSC-${newCacheVersion}`);

        await cacheResources(cache, urlsToCache);

        // 保存新的缓存版本号到 caches
        await setCacheVersion(newCacheVersion);
    } else {
        console.log('缓存版本未更改，无需更新');
    }
}

// 缓存资源文件
async function cacheResources(cache, urls) {
    await Promise.allSettled(
        urls.map(url => {
            if (url === VERSION_URL) {
                return Promise.resolve();
            }

            return fetch(url)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`${url} failed with status ${response.status}`);
                    }
                    return cache.put(url, response);
                })
                .catch(error => console.error('Fetching failed for:', url, error));
        })
    );
}

// 安装阶段：缓存初始资源
self.addEventListener('install', (event) => {
    event.waitUntil(
        fetchCacheVersion().then(async (newCacheVersion) => {
            const cache = await caches.open(`RWMSC-${newCacheVersion}`);
            console.log('已启用缓存');
            await cacheResources(cache, urlsToCache);
            await setCacheVersion(newCacheVersion);
        })
    );
});

// 拦截 fetch 请求，优先从缓存中获取资源，若未命中则从网络获取并缓存
self.addEventListener('fetch', (event) => {
    const requestURL = new URL(event.request.url);

    if (!requestURL.pathname.startsWith('/mod-map/')) {
        return;
    }

    if (event.request.url.includes(VERSION_URL)) {
        event.respondWith(fetch(event.request));
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(event.request)
                    .then(async (networkResponse) => {
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }

                        const responseClone = networkResponse.clone();
                        const cacheName = `RWMSC-${await getCacheVersion()}`;
                        const cache = await caches.open(cacheName);

                        await cache.put(event.request, responseClone);

                        return networkResponse;
                    })
                    .catch((error) => {
                        console.error('Fetch failed:', error);
                        return new Response('Network error occurred', { status: 408 });
                    });
            })
    );
});

// 监听消息事件，处理页面发来的版本号检查和缓存更新请求
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'CHECK_VERSION_AND_UPDATE_CACHE') {
        updateCache().then(() => {
            event.ports[0].postMessage({ status: 'updated' });
        }).catch(error => {
            console.error('Failed to update cache:', error);
            event.ports[0].postMessage({ status: 'error', error: error.message });
        });
    }
});
