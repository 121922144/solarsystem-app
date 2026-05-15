import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import UnoCSS from 'unocss/vite';
import { randomUUID } from 'node:crypto';
// import AutoImport from 'unplugin-auto-import/vite';
// import autoImports from './auto-imports';

/**
 * 把前端传入的 rate（兼容 "+0%" / "-5%" / "1.0" / "0.95"）转换为火山引擎需要的
 * speed_ratio（取值范围 [0.2, 3.0]，1.0 为默认语速）。
 */
function normalizeSpeedRatio(rate: string | undefined): number {
  if (!rate) return 1;
  const trimmed = rate.trim();
  // "+10%" / "-5%" 形式
  const percentMatch = trimmed.match(/^([+-]?)(\d+(?:\.\d+)?)\s*%$/);
  if (percentMatch) {
    const sign = percentMatch[1] === '-' ? -1 : 1;
    const pct = parseFloat(percentMatch[2]);
    const ratio = 1 + (sign * pct) / 100;
    return Math.min(3, Math.max(0.2, ratio));
  }
  // 直接的小数 / 整数
  const num = parseFloat(trimmed);
  if (Number.isFinite(num) && num > 0) {
    return Math.min(3, Math.max(0.2, num));
  }
  return 1;
}

/**
 * 字节火山引擎 TTS 代理：把前端 /api/tts 的请求转发到 火山引擎 REST API，
 * 把返回的 base64 音频解码成 mp3 流回前端，避免 KEY 暴露在前端 bundle。
 *
 * 接口文档：https://www.volcengine.com/docs/6561/79817
 */
function volcanoTTSPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'volcano-tts-proxy',
    configureServer(server) {
      server.middlewares.use('/api/tts', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method Not Allowed');
          return;
        }

        const appid = env.VOLCANO_TTS_APPID;
        const token = env.VOLCANO_TTS_ACCESS_TOKEN;
        const cluster = env.VOLCANO_TTS_CLUSTER || 'volcano_tts';
        const defaultVoice = env.VOLCANO_TTS_VOICE || 'BV001_streaming';

        if (
          !appid ||
          !token ||
          appid === 'your-volcano-appid' ||
          token === 'your-volcano-access-token'
        ) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(
            JSON.stringify({
              error:
                'VOLCANO_TTS_APPID / VOLCANO_TTS_ACCESS_TOKEN 未配置，请在 .env 中填入有效的火山引擎凭证后重启 dev server。',
            })
          );
          return;
        }

        try {
          // 收集请求体
          const chunks: Buffer[] = [];
          for await (const chunk of req) {
            chunks.push(chunk as Buffer);
          }
          const raw = Buffer.concat(chunks).toString('utf-8') || '{}';
          const body = JSON.parse(raw) as {
            text?: string;
            voice?: string;
            // style 在 Azure 才用，火山引擎忽略
            style?: string;
            // 语速："+0%" / "-10%" / "1.0" 都支持
            rate?: string;
          };
          const text = (body.text || '').trim();
          if (!text) {
            res.statusCode = 400;
            res.end('Empty text');
            return;
          }

          const voice = body.voice || defaultVoice;
          const speedRatio = normalizeSpeedRatio(body.rate);

          const reqid = randomUUID();

          const payload = {
            app: {
              appid,
              token, // 文档要求 body 里也带一份
              cluster,
            },
            user: {
              uid: 'solarsystem-app',
            },
            audio: {
              voice_type: voice,
              encoding: 'mp3',
              speed_ratio: speedRatio,
              volume_ratio: 1.0,
              pitch_ratio: 1.0,
            },
            request: {
              reqid,
              text,
              text_type: 'plain',
              operation: 'query',
            },
          };

          const volcanoRes = await fetch(
            'https://openspeech.bytedance.com/api/v1/tts',
            {
              method: 'POST',
              headers: {
                // 注意：火山引擎要求 "Bearer;" 后跟分号再跟 token（不是空格）
                Authorization: `Bearer;${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(payload),
            }
          );

          if (!volcanoRes.ok) {
            const errText = await volcanoRes.text();
            res.statusCode = volcanoRes.status;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(
              JSON.stringify({
                error: `Volcano TTS HTTP 错误: ${volcanoRes.status} ${errText.slice(
                  0,
                  300
                )}`,
              })
            );
            return;
          }

          const json = (await volcanoRes.json()) as {
            code?: number;
            message?: string;
            data?: string;
          };

          // 火山引擎成功 code 为 3000
          if (json.code !== 3000 || !json.data) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(
              JSON.stringify({
                error: `Volcano TTS 业务错误: code=${json.code} message=${
                  json.message || ''
                }`,
              })
            );
            return;
          }

          const audioBuf = Buffer.from(json.data, 'base64');
          res.statusCode = 200;
          res.setHeader('Content-Type', 'audio/mpeg');
          res.setHeader('Cache-Control', 'no-store');
          res.end(audioBuf);
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(
            JSON.stringify({
              error: `TTS 代理异常: ${(err as Error).message}`,
            })
          );
        }
      });
    },
  };
}

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
      volcanoTTSPlugin(env),
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
