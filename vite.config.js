import { defineConfig } from 'vite';

import { resolve } from 'path';

import handlebars from 'vite-plugin-handlebars';
import { cleanUrlsPlugin } from './scripts/vite-plugin-clean-urls.js';
import { buildUrlContext, htmlEntries, htmlFileToSlug } from './scripts/routes.js';

const pageData = {
  'index.html': {
    isHome: true,
    title: 'Main Page'
  },
  'about.html': {
    title: '海田町を知る | Kaitaful Fes'
  },
  'story.html': {
    title: '70 STORIES | Kaitaful Fes'
  },
  'event.html': {
    title: 'イベント一覧 | Kaitaful Fes'
  },
  'event_detail.html': {
    title:
      '海田町町制施行70周年記念事業第2弾 海田町防災フェア2026 | 70周年記念イベント | Kaitaful Days. 海田町町制施行70周年 特設サイト | 海田町'
  },
  'event_detail_01.html': {
    title:
      '海田町町制施行70周年記念事業第2弾 海田町防災フェア2026 | 70周年記念イベント | Kaitaful Days. 海田町町制施行70周年 特設サイト | 海田町'
  },
  'event_detail_02.html': {
    title:
      'ボランティア人間塾 | 70周年記念イベント | Kaitaful Days. 海田町町制施行70周年 特設サイト | 海田町'
  },
  'event_detail_03.html': {
    title:
      '第32回 かいた七夕さん | 70周年記念イベント | Kaitaful Days. 海田町町制施行70周年 特設サイト | 海田町'
  },
  'event_detail_04.html': {
    title:
      '親子防災講座/支援者向け体験講座 | 70周年記念イベント | Kaitaful Days. 海田町町制施行70周年 特設サイト | 海田町'
  },
  'event_detail_05.html': {
    title:
      '海田町 2DAYS イングリッシュレッスン | 70周年記念イベント | Kaitaful Days. 海田町町制施行70周年 特設サイト | 海田町'
  },
  'event_detail_06.html': {
    title:
      '盆踊りを楽しむつどい | 70周年記念イベント | Kaitaful Days. 海田町町制施行70周年 特設サイト | 海田町'
  },
  'event_detail_07.html': {
    title:
      '南堀川まつり | 70周年記念イベント | Kaitaful Days. 海田町町制施行70周年 特設サイト | 海田町'
  },
  'event_detail_08.html': {
    title:
      '第29回 海田小学校区グラウンドゴルフ大会 | 70周年記念イベント | Kaitaful Days. 海田町町制施行70周年 特設サイト | 海田町'
  },
  'event_detail_09.html': {
    title:
      '窪町自治会 日帰り旅行 | 70周年記念イベント | Kaitaful Days. 海田町町制施行70周年 特設サイト | 海田町'
  },
  'interview.html': {
    title: 'インタビュー一覧 | Kaitaful Fes'
  },
  'interview_detail.html': {
    title: 'インタビュー詳細 | Kaitaful Fes'
  },
  'interview_detail_01.html': {
    title: 'インタビュー詳細 | Kaitaful Fes'
  },
  'information.html': {
    title: 'インフォメーション一覧 | Kaitaful Fes'
  },
  'information_detail.html': {
    title: 'インフォメーション詳細 | Kaitaful Fes'
  },
  'entry.html': {
    title: '募集一覧 | Kaitaful Fes'
  },
  'entry_food.html': {
    title: '飲食マルシェ・キッチンカー 出店募集 | Kaitaful Fes'
  },
  'entry_job.html': {
    title: '海田こどもおしごと体験 出展企業募集 | Kaitaful Fes'
  },
  'entry_sponsor.html': {
    title: '協賛企業募集 | Kaitaful Fes'
  }
};

const root = 'src';

const rollupInput = Object.fromEntries(
  htmlEntries.map((file) => [
    htmlFileToSlug(file) || 'index',
    resolve(__dirname, root, file)
  ])
);

export default defineConfig({
  base: '/',
  server: {
    host: true
  },
  root,
  build: {
    outDir: '../dist',
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          let extType = assetInfo.name.split('.')[1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            extType = 'images';
          }
          if (extType === 'css') {
            return `assets/css/style.css`;
          }
          return `assets/${extType}/[name][extname]`;
        },
        chunkFileNames: 'assets/js/[name].js',
        entryFileNames: 'assets/js/[name].js',
        manualChunks: undefined
      },
      input: rollupInput
    }
  },
  plugins: [
    handlebars({
      partialDirectory: resolve(__dirname, root, 'components'),
      context(pagePath) {
        const pageName = pagePath.split('/').pop();
        return {
          ...(pageData[pageName] || { title: 'Kaitaful Fes' }),
          ...buildUrlContext(pageName)
        };
      }
    }),
    cleanUrlsPlugin({ root, outDir: resolve(__dirname, 'dist') })
  ]
});
