import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import UnoCSS from 'unocss/vite';
// import AutoImport from 'unplugin-auto-import/vite';
// import autoImports from './auto-imports';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '');

  return {
    server: {
      host: '0.0.0.0',
    },
    resolve: {
      alias: {
        '@': '/src',
        images: '/src/assets/images',
      },
    },
    plugins: [
      react(),
      UnoCSS(),
      // AutoImport({
      //   imports: [
      //     'react',
      //     {
      //       'react-router-dom': [...autoImports['react-router-dom']],
      //       '@arco-design/web-react': [...autoImports['@arco-design/web-react']],
      //     },
      //   ],
      //   dts: 'src/auto-imports.d.ts',
      //   eslintrc: {
      //     enabled: true,
      //     filepath: './.eslintrc-auto-import.json',
      //   },
      // }),
    ],
    // 定义全局常量替换
    define: {
      __APP_ENV__: JSON.stringify(env),
    },
  };
});
