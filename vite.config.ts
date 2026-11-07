import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { createHash } from 'node:crypto';
const offlinePrecache = {
  name: 'modu-offline-precache',
  apply: 'build' as const,
  closeBundle() {
    const root=resolve('dist');
    const walk=(dir:string):string[]=>readdirSync(dir,{withFileTypes:true}).flatMap(f=>f.isDirectory()?walk(resolve(dir,f.name)):[resolve(dir,f.name)]);
    const files=walk(root).filter(f=>!f.endsWith('/sw.js')&&!f.endsWith('.map')&&!['_headers','_redirects','_routes.json'].includes(relative(root,f))).sort();
    const buildId=createHash('sha256');for(const file of files)buildId.update(readFileSync(file));
    const urls=['/',...files.map(file=>'/'+relative(root,file).replaceAll('\\','/')).map(path=>path==='/pearl/index.html'?'/pearl/':path)];
    writeFileSync(resolve(root,'sw.js'),'self.__BUILD_ID='+JSON.stringify(buildId.digest('hex').slice(0,12))+';self.__PRECACHE='+JSON.stringify(urls)+';\n'+readFileSync(resolve('public/sw.js'),'utf8'));
  }
};
export default defineConfig({
  plugins: [react(), offlinePrecache],
  build: {
    chunkSizeWarningLimit: 1250,
    rollupOptions: {
      input: { main: resolve('index.html'), pearl: resolve('pearl/index.html') },
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
