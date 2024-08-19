// sw.js

// 定义要缓存的文件列表
const urlsToCache = [
    '/',
    '/index.html',
    '/rw-map.html',
    '/map.html',
    '/region-map.html',
    '/slugcats.json',
    '/global.js',
    '/beziero.js',
    '/embed.jpg',
];

const VERSION_URL = '/version.json';
let cacheVersion = '0.0.0';
const MAX_CACHE_SIZE = 10 * 1024 * 1024; // 10MB

// 计算缓存大小
async function getCacheSize(cache) {
    let totalSize = 0;
    const requests = await cache.keys();
    for (const request of requests) {
        const response = await cache.match(request);
        if (response) {
            const blob = await response.blob();
            totalSize += blob.size;
        }
    }
    return totalSize;
}

// 清理超出大小限制的缓存
async function cleanUpCache(cache) {
    const requests = await cache.keys();
    let totalSize = await getCacheSize(cache);

    // 删除过时的 PNG 文件，排除 /resources/ 目录下的文件
    for (const request of requests) {
        if (totalSize <= MAX_CACHE_SIZE) break;

        const url = new URL(request.url);
        if (url.pathname.endsWith('.png') && !url.pathname.startsWith('/resources/')) {
            const response = await cache.match(request);
            if (response) {
                const blob = await response.blob();
                totalSize -= blob.size;
                await cache.delete(request);
                console.log(`已删除缓存文件: ${request.url}`);
            }
        }
    }
}

// 获取最新的版本号
async function fetchCacheVersion() {
    try {
        const response = await fetch(VERSION_URL);
        const data = await response.json();
        return data.cacheVersion;
    } catch (error) {
        console.error('无法获取缓存版本:', error);
        return cacheVersion; // 如果获取版本号失败，返回当前版本号
    }
}

// 更新缓存，删除旧版本并缓存最新资源
async function updateCache() {
    const newCacheVersion = await fetchCacheVersion();
    if (newCacheVersion !== cacheVersion) {
        console.log(`缓存更新: 本地 ${cacheVersion} --> 最新 ${newCacheVersion}`);
        cacheVersion = newCacheVersion;

        const cacheNames = await caches.keys();
        await Promise.all(
            cacheNames.map((cacheName) => {
                if (cacheName !== cacheVersion) {
                    console.log(`删除过时缓存: ${cacheName}`);
                    return caches.delete(cacheName);
                }
            })
        );

        const cache = await caches.open(cacheVersion);
        console.log('启用最新缓存:', cacheVersion);

        await cacheResources(cache, urlsToCache);
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
        caches.open(cacheVersion)
            .then((cache) => {
                console.log('已启用缓存');
                return cacheResources(cache, urlsToCache);
            })
            .catch((error) => console.error('缓存安装失败:', error))
    );
});

// 拦截 fetch 请求，优先从缓存中获取资源，若未命中则从网络获取并缓存
self.addEventListener('fetch', (event) => {
    const requestURL = new URL(event.request.url);

    // 仅处理 HTTP 和 HTTPS 请求
    if (requestURL.protocol !== 'http:' && requestURL.protocol !== 'https:') {
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
                    .then((networkResponse) => {
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }

                        const responseClone = networkResponse.clone();
                        caches.open(cacheVersion).then(async (cache) => {
                            await cache.put(event.request, responseClone);
                            await cleanUpCache(cache); // 缓存新文件后清理超出大小限制的部分
                        });

                        return networkResponse;
                    })
                    .catch((error) => {
                        console.error('Fetch 失败:', error);
                        return new Response('Network error occurred', { status: 408 });
                    });
            })
            .catch((error) => {
                console.error('缓存匹配失败:', error);
                return new Response('Cache match failed', { status: 500 });
            })
    );
});

// 监听消息事件，处理页面发来的版本号检查和缓存更新请求
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'CHECK_VERSION_AND_UPDATE_CACHE') {
        updateCache().then(() => {
            event.ports[0].postMessage({ status: 'updated' });
        }).catch((error) => {
            console.error('更新缓存失败:', error);
            event.ports[0].postMessage({ status: 'error', error: error.message });
        });
    }
});