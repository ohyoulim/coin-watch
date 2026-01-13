import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Tauri가 기대하는 포트 및 설정
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
  },
  // Tauri 관련 환경 변수 접두사 설정
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    // Tauri는 모바일/데스크탑 환경이므로 적절한 타겟 설정
    target: process.env.TAURI_PLATFORM == 'windows' ? 'chrome105' : 'safari13',
    // 디버그 모드가 아닐 때만 압축
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    // 디버그 모드에서 소스맵 제공
    sourcemap: !!process.env.TAURI_DEBUG,
  },
})