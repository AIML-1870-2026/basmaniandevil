import { defineConfig } from 'vite'

export default defineConfig({
  base: '/basmaniandevil/OCP_AI_Project/ocp-matchmaker/',
  build: {
    rollupOptions: {
      input: 'index.src.html',
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
})
