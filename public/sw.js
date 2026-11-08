const CACHE = 'modu-life-' + (self.__BUILD_ID || 'development');
const PRECACHE = self.__PRECACHE || ['/', '/pearl/', '/stall/', '/favicon.svg', '/manifest.webmanifest', '/models/manifest.json'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith('modu-life-') && key !== CACHE).map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  const range = url.pathname.startsWith('/audio/') && /^bytes=(\d*)-(\d*)$/.exec(request.headers.get('range') || '');
  if (range && (range[1] || range[2])) {
    event.respondWith(caches.match(url.pathname, { cacheName: CACHE }).then(async cached => {
      if (!cached) return fetch(request);
      const track = await cached.blob();
      const start = range[1] ? Number(range[1]) : Math.max(0, track.size - Number(range[2]));
      const end = range[1] && range[2] ? Math.min(track.size - 1, Number(range[2])) : track.size - 1;
      if (start > end) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${track.size}` } });
      return new Response(track.slice(start, end + 1), {
        status: 206,
        headers: {
          'Content-Type': track.type,
          'Content-Range': `bytes ${start}-${end}/${track.size}`,
          'Content-Length': String(end - start + 1),
          'Accept-Ranges': 'bytes',
        },
      });
    }));
    return;
  }

  function cacheResponse(key, response) {
    const copy = response.clone();
    event.waitUntil(caches.open(CACHE).then(cache => cache.put(key, copy)));
    return response;
  }

  if (request.mode === 'navigate' || url.pathname === '/models/manifest.json') {
    const entry = /^\/(pearl|stall)(?:\/|\/index\.html)?$/.exec(url.pathname);
    const key = request.mode === 'navigate' ? (entry ? '/' + entry[1] + '/' : '/') : request;
    event.respondWith(fetch(request).then(response =>
      response.ok ? cacheResponse(key, response) : response
    ).catch(() => caches.match(key, { ignoreVary: true })));
    return;
  }

  event.respondWith(caches.match(request, { ignoreVary: true }).then(cached =>
    cached || fetch(request).then(response =>
      response.ok && response.type === 'basic' ? cacheResponse(request, response) : response
    )
  ));
});
