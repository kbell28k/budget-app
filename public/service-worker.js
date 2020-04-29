const FILES_TO_CACHE = [
    "/",
    "/index.html",
    "/index.js",
    "/db.js",
    "/style.css"];

    const CACHE_NAME = 'precache-v1';
    const DATA_CACHE_NAME = 'data-cache-v1';

    self.addEventListener('install', event => {
        event.waitUntil(
            caches.open(CACHE_NAME).then(cache =>{
                console.log('Successful cache');
                return cache.addAll(FILES_TO_CACHE);
            })
        );
        self.skipWaiting();
    });

    // The activate handler takes care of cleaning up old caches.
    self.addEventListener('activate', event => {
        event.waitUntil(
            caches.keys().then(keyList => {
                return Promise.all(
                    keyList.map( key => {
                        if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
                            console.log('Removing old cache data', key);
                            return caches.delete(key);
                        }
                    })
                );
            })
        );
        self.clients.claim();
    });

    self.addEventListener('fetch',  event =>{
        if (event.request.url.includes('/api/')) {
            console.log('[Service Worker] Fetch (data)', event.request.url);

            event.respondWith(
                caches.open(DATA_CACHE_NAME).then(cache => {
                    return fetch(event.request)
                        .then(response  => {
                            if (response.status === 200) {
                                cache.put(event.request.url, response.clone());
                            }
                            return response;
                        })
                        .catch(err => {
                            return cache.match(event.request);
                        });
                })
            );

            return;
        }

        event.respondWith(
            caches.open(CACHE_NAME).then( cache => {
                return cache.match(event.request).then(response => {
                    return response || fetch(event.request)
                });

            })
        );
    });
