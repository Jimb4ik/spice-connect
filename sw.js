// Service Worker for Lumina Cache Management
const CACHE_NAME = 'lumina-v2.0.0';
const CACHE_URLS = [
    '/',
    '/index.html',
    '/main.html',
    '/explore.html',
    '/connections.html',
    '/inbox.html',
    '/browse.html',
    '/member.html',
    '/identity.html',
    '/credits.html',
    '/inventory.html',
    '/preferences.html',
    '/guests.html',
    '/favicon/favicon-lumina-v2.png',
    '/js/auth-manager.js',
    '/js/cache-buster.js',
    '/js/main.js',
    '/js/user-profile.js',
    '/js/header-avatar.js',
    '/js/match-utils.js',
    '/js/search-page.js',
    '/js/messages-extension.js',
    '/js/photo-manager.js',
    '/js/dashboard.js'
];

// Install Service Worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(CACHE_URLS);
            })
            .then(() => {
                return self.skipWaiting();
            })
    );
});

// Activate Service Worker
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            return self.clients.claim();
        })
    );
});

// Fetch Strategy
self.addEventListener('fetch', event => {
    if (event.request.url.includes('/api/') || 
        event.request.url.includes('cdn.tailwindcss.com') ||
        event.request.url.includes('fonts.googleapis.com') ||
        event.request.url.includes('fonts.gstatic.com') ||
        !event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }

                return fetch(event.request)
                    .then(response => {
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    });
            })
            .catch(() => {
                if (event.request.destination === 'document') {
                    return caches.match('/index.html');
                }
            })
    );
});

// Message Handling
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => caches.delete(cacheName))
                );
            }).then(() => {
                event.ports[0].postMessage({ success: true });
            })
        );
    }
});