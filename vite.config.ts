import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      ignored: [
        '**/venv/**',
        '**/backend-api/**',
        '**/backend/**',
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/build/**',
        '**/__pycache__/**',
        '**/*.pyc',
        '**/alembic/**',
        '**/logs/**',
        '**/uploads/**',
        '**/exports/**',
        '**/.venv/**',
        '**/env/**'
      ]
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
