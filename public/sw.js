const CACHE_PREFIX = 'modu-life-';
const CACHE = CACHE_PREFIX + (self.__BUILD_ID || 'development');
const PRECACHE = self.__PRECACHE || ['/'];
const PACK = self.__OFFLINE_PACK || { files: [], bytes: 0 };
const DOWNLOAD_BATCH = 6;
const matchOptions = { ignoreVary: true };

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    // The previous build can still supply visited scenes during an offline upgrade.
    const older = (await caches.keys()).filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE);
    await Promise.all(older.slice(0, -1).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

function packStatus(phase, done = 0) {
  return { phase, done, total: PACK.files.length, bytes: PACK.bytes };
}

async function pendingPackFiles(cache) {
  const stored = new Set((await cache.keys()).map(request => request.url));
  return PACK.files.filter(path => !stored.has(new URL(path, self.location.origin).href));
}

let packJob;
let progress = packStatus('downloading');
const listeners = new Set();

function publish(phase, done) {
  progress = packStatus(phase, done);
  for (const port of listeners) port.postMessage(progress);
}

async function preparePack(cache) {
  const remaining = await pendingPackFiles(cache);
  let done = PACK.files.length - remaining.length;
  publish('downloading', done);
  for (let start = 0; start < remaining.length; start += DOWNLOAD_BATCH) {
    const results = await Promise.allSettled(remaining.slice(start, start + DOWNLOAD_BATCH).map(async path => {
      const response = await fetch(path, { cache: 'no-cache' });
      const html = response.headers.get('content-type')?.includes('text/html');
      if (!response.ok || (!path.endsWith('/') && html)) throw new Error('Missing offline asset');
      await cache.put(path, response);
      done++;
    }));
    if (results.some(result => result.status === 'rejected')) {
      publish('retry', done);
      return;
    }
    publish('downloading', done);
  }
  publish('ready', done);
}

self.addEventListener('message', event => {
  const port = event.ports[0];
  const command = event.data?.moduOffline;
  if (!port || !PACK.files.length || (command !== 'status' && command !== 'download')) return;
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    if (!packJob && command === 'status') {
      const remaining = await pendingPackFiles(cache);
      if (!packJob) {
        const done = PACK.files.length - remaining.length;
        port.postMessage(packStatus(remaining.length ? 'idle' : 'ready', done));
        return;
      }
    }
    listeners.add(port);
    if (packJob) {
      port.postMessage(progress);
      return packJob;
    }
    progress = packStatus('downloading', progress.done);
    packJob = preparePack(cache).catch(() => publish('retry', progress.done)).finally(() => {
      listeners.clear();
      packJob = undefined;
    });
    return packJob;
  })().catch(() => port.postMessage(packStatus('retry'))));
});

async function fallback(cache, key) {
  return await cache.match(key, matchOptions) ?? await caches.match(key, matchOptions) ?? Response.error();
}

async function audioRange(cached, range) {
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
}

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  const range = url.pathname.startsWith('/audio/') && /^bytes=(\d*)-(\d*)$/.exec(request.headers.get('range') || '');
  const page = /^\/(pearl|stall)(?:\/|\/index\.html)?$/.exec(url.pathname);
  const onlineFirst = request.mode === 'navigate' || url.pathname === '/models/manifest.json';
  const key = request.mode === 'navigate' ? (page ? '/' + page[1] + '/' : '/') : request;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (range && (range[1] || range[2])) {
      const cached = await cache.match(url.pathname, matchOptions);
      if (cached) return audioRange(cached, range);
      try { return await fetch(request); } catch {
        const older = await caches.match(url.pathname, matchOptions);
        return older ? audioRange(older, range) : Response.error();
      }
    }
    if (!onlineFirst) {
      const cached = await cache.match(key, matchOptions);
      if (cached) return cached;
    }
    try {
      const response = await fetch(request);
      const html = response.headers.get('content-type')?.includes('text/html');
      if (!onlineFirst && (response.status === 404 || html)) return fallback(cache, key);
      if (response.ok && response.type === 'basic' && (!html || request.mode === 'navigate')) {
        event.waitUntil(cache.put(key, response.clone()).catch(() => {}));
      }
      return response;
    } catch {
      return fallback(cache, key);
    }
  })());
});
