import {defineConfig} from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({plugins:[react()],base:'./',build:{rollupOptions:{output:{manualChunks:{fontkit:["@pdf-lib/fontkit"],pdf:["pdf-lib"]}}}},test:{environment:'node',include:['tests/**/*.test.ts']}});
