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
    '/leaflet/',
    '/resources/'
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
                console.log(`Deleted cached file: ${request.url}`);
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
        console.error('Failed to fetch cache version:', error);
        return cacheVersion; // 如果获取版本号失败，返回当前版本号
    }
}

// 更新缓存，删除旧版本并缓存最新资源
async function updateCache() {
    const newCacheVersion = await fetchCacheVersion();
    if (newCacheVersion !== cacheVersion) {
        console.log(`缓存更新: 本地 ${cacheVersion} --> 最新 ${newCacheVersion}`);
        cacheVersion = newCacheVersion;

        await caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== cacheVersion) {
                        console.log(`删除过时缓存: ${cacheName}`);
                        return caches.delete(cacheName);
                    }
                })
            );
        });

        const cache = await caches.open(cacheVersion);
        console.log('启用最新缓存:', cacheVersion);
        await Promise.allSettled(
            urlsToCache.map(url => {
                // 不缓存 version.json
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
}

// 安装阶段：缓存初始资源
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(cacheVersion)
            .then((cache) => {
                console.log('Opened cache');
                return Promise.allSettled(
                    urlsToCache.map(url => {
                        // 不缓存 version.json
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
            })
    );
});

// 拦截 fetch 请求，优先从缓存中获取资源，若未命中则从网络获取并缓存
self.addEventListener('fetch', (event) => {
    // 不缓存 version.json 文件
    if (event.request.url.includes(VERSION_URL)) {
        return fetch(event.request);
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(event.request).then((networkResponse) => {
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                    return networkResponse;
                }

                const responseClone = networkResponse.clone();

                caches.open(cacheVersion).then(async (cache) => {
                    await cache.put(event.request, responseClone);
                    await cleanUpCache(cache); // 缓存新文件后清理超出大小限制的部分
                });

                return networkResponse;
            }).catch((error) => {
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