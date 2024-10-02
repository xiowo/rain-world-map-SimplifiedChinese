// sw.js for 主站点

// 定义要缓存的文件列表
const urlsToCache = [
    '/',
    '/index.html',
    '/rw-map.html',
    '/map.html',
    '/rw.css',
    '/slugcats.json',
    '/global.js',
    '/beziero.js',
    '/leaflet/leaflet.js',
    '/embed.jpg',
];

const VERSION_URL = '/version.json';
let cacheVersion = 'RWMSC版本号-0.0.0'; // 初始版本号，使用独特前缀 RWMSC

// 定义需要过滤的域名，资源文件不会被缓存或拦截
const blockedDomains = [
    'raw.githubusercontent.com',
    'rw.xiowo.us.kg',
    'raw.gitmirror.com',
];

// 从 caches 中读取 cacheVersion
async function getCacheVersion() {
    const cache = await caches.open('version-cache-RWMSC'); // 使用特定的版本缓存名称
    const response = await cache.match('cacheVersion');
    if (response) {
        return response.text();
    }
    return '0.0.0';
}

// 将 cacheVersion 保存到 caches
async function setCacheVersion(version) {
    const cache = await caches.open('version-cache-RWMSC'); // 使用特定的版本缓存名称
    await cache.put('cacheVersion', new Response(version));
}

// 获取最新的版本号，并更新缓存名称
async function fetchCacheVersion() {
    try {
        const response = await fetch(VERSION_URL);
        const data = await response.json();
        cacheVersion = `RWMSC版本号-${data.cacheVersion}`; // 从 version.json 获取版本号并动态设置缓存名称
        return data.cacheVersion;
    } catch (error) {
        console.error('无法获取缓存版本:', error);
        return cacheVersion.split('-')[1]; // 如果获取版本号失败，返回当前缓存中的版本号
    }
}

// 更新缓存，删除旧版本并缓存最新资源
async function updateCache() {
    const newCacheVersion = await fetchCacheVersion();
    const currentCacheVersion = await getCacheVersion();

    if (newCacheVersion !== currentCacheVersion) {
        console.log(`缓存更新: 本地 ${currentCacheVersion} --> 最新 ${newCacheVersion}`);

        const cacheNames = await caches.keys();
        await Promise.all(
            cacheNames.map((cacheName) => {
                // 仅删除与当前站点相关的缓存，防止删除其他站点的缓存
                if (cacheName.startsWith('RWMSC版本号') && cacheName !== cacheVersion && cacheName !== 'version-cache-RWMSC') {
                    console.log(`删除过时缓存: ${cacheName}`);
                    return caches.delete(cacheName);
                }
            })
        );

        const cache = await caches.open(cacheVersion);
        console.log('启用最新缓存:', cacheVersion);

        await cacheResources(cache, urlsToCache);

        // 保存新的缓存版本号到 caches
        await setCacheVersion(newCacheVersion);
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
    );
});

// 拦截 fetch 请求，优先从缓存中获取资源，若未命中则从网络获取并缓存
self.addEventListener('fetch', (event) => {
    const requestURL = new URL(event.request.url);

    // 仅处理 HTTP 和 HTTPS 请求
    if (requestURL.protocol !== 'http:' && requestURL.protocol !== 'https:') {
        return;
    }

    // 检查请求的域名是否在过滤名单中
    const matchedDomain = blockedDomains.find(domain => requestURL.hostname.includes(domain));
    if (matchedDomain) {
        // 打印过滤的域名
        console.log(`Skipping cache for domain: ${matchedDomain}`);
        event.respondWith(fetch(event.request));
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
                        });

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
