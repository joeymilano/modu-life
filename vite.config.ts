import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { createHash } from 'node:crypto';
const homeArt = [
  '/art/title/shanghai-stories.webp',
  '/art/title/shanghai-stories-mobile.webp',
  '/art/shanghai-streets/first-night-arrival.webp',
  '/art/corners/bund.webp',
];

const offlinePrecache = {
  name: 'modu-offline-precache',
  apply: 'build' as const,
  closeBundle() {
    const root = resolve('dist');
    const walk = (dir: string): string[] => readdirSync(dir, {withFileTypes: true})
      .flatMap(entry => entry.isDirectory() ? walk(resolve(dir, entry.name)) : [resolve(dir, entry.name)]);
    const worker = readFileSync(resolve('public/sw.js'), 'utf8');
    const hash = createHash('sha256').update(worker);
    const pack = new Map<string,number>();
    for (const file of walk(root).sort()) {
      const path = relative(root, file).replaceAll('\\', '/');
      if (path === 'sw.js' || path.endsWith('.map') || path.startsWith('_')) continue;
      const content = readFileSync(file);
      hash.update(path).update(content);
      const url = ('/' + path).replace(/index\.html$/, '');
      pack.set(url, content.length);
    }

    const index = readFileSync(resolve(root, 'index.html'), 'utf8');
    const entryAssets = Array.from(index.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g), match => match[1]);
    const core = ['/', '/favicon.svg', '/manifest.webmanifest', ...homeArt, ...entryAssets,
      ...Array.from(pack.keys()).filter(url => /^\/(brand|icons)\//.test(url))];
    const precache = Array.from(new Set(core));
    for (const url of precache) {
      if (!pack.has(url)) throw new Error(`Offline shell asset is missing: ${url}`);
    }
    const files = Array.from(pack.keys()).filter(url => !/^\/(?:robots\.txt|sitemap\.xml|(?:.*-)?social\.(?:png|jpg))$/.test(url));
    const bytes = files.reduce((sum, url) => sum + pack.get(url)!, 0);
    const buildId = hash.update(JSON.stringify(precache)).digest('hex').slice(0, 12);
    writeFileSync(resolve(root, 'sw.js'),
      `self.__BUILD_ID=${JSON.stringify(buildId)};self.__PRECACHE=${JSON.stringify(precache)};self.__OFFLINE_PACK=${JSON.stringify({files, bytes})};\n${worker}`);
  }
};

export default defineConfig({
  plugins: [react(), offlinePrecache],
  build: {
    chunkSizeWarningLimit: 1250,
    rollupOptions: {
      input: { main: resolve('index.html'), pearl: resolve('pearl/index.html'), stall: resolve('stall/index.html') },
      output: {
        onlyExplicitManualChunks: true,
        manualChunks(id) {
          if (/\/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'react-vendor';
          if (/\/node_modules\/(three|three-stdlib|meshoptimizer|@react-three)\//.test(id)) return 'three-vendor';
        },
      },
    },
  },
});
