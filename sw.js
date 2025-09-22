// Service Worker для управления кешем
const CACHE_NAME = 'lavrilo-v1.0.16';
const CACHE_URLS = [
    '/',
    '/index.html',
    '/main.html',
    '/wallet.html',
    '/matches.html',
    '/user-profile.html',
    '/css/app-styles.css',
    '/css/dashboard.css',
    '/css/wallet.css',
    '/css/matches.css',
    '/css/user-profile.css',
    '/js/auth-manager.js',
    '/js/cache-buster.js',
    '/js/wallet.js',
    '/js/main.js',
    '/js/user-profile.js'
];

// Установка Service Worker
self.addEventListener('install', event => {
    console.log('[SW] Installing Service Worker...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Caching app shell');
                return cache.addAll(CACHE_URLS);
            })
            .then(() => {
                console.log('[SW] Service Worker installed successfully');
                return self.skipWaiting(); // Активируем новый SW немедленно
            })
    );
});

// Активация Service Worker
self.addEventListener('activate', event => {
    console.log('[SW] Activating Service Worker...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('[SW] Service Worker activated');
            return self.clients.claim(); // Берем контроль над всеми клиентами
        })
    );
});

// Обработка запросов
self.addEventListener('fetch', event => {
    // Пропускаем API запросы и внешние ресурсы
    if (event.request.url.includes('/api/') || 
        event.request.url.includes('fonts.googleapis.com') ||
        event.request.url.includes('fonts.gstatic.com') ||
        !event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Возвращаем из кеша если есть
                if (response) {
                    console.log('[SW] Serving from cache:', event.request.url);
                    return response;
                }

                // Иначе загружаем из сети
                console.log('[SW] Fetching from network:', event.request.url);
                return fetch(event.request)
                    .then(response => {
                        // Проверяем что ответ валидный
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Клонируем ответ для кеша
                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    });
            })
            .catch(() => {
                // Fallback для HTML страниц
                if (event.request.destination === 'document') {
                    return caches.match('/index.html');
                }
            })
    );
});

// Обработка сообщений от клиента
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        console.log('[SW] Received SKIP_WAITING message');
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        console.log('[SW] Clearing cache on request');
        event.waitUntil(
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => caches.delete(cacheName))
                );
            }).then(() => {
                console.log('[SW] All caches cleared');
                event.ports[0].postMessage({ success: true });
            })
        );
    }
});
