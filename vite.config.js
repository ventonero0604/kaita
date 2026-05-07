import { defineConfig } from 'vite';

import { resolve } from 'path';

//handlebarsプラグインimport
import handlebars from 'vite-plugin-handlebars';

//HTML上で出し分けたい各ページごとの情報
const pageData = {
  'index.html': {
    isHome: true,
    title: 'Main Page',
    ctaHref: './interview.html',
    eventCtaHref: './event.html'
  },
  'interview.html': {
    isHome: false,
    title: 'インタビュー一覧 | Kaitaful Fes'
  },
  'interview_detail.html': {
    isHome: false,
    title: 'インタビュー詳細 | Kaitaful Fes',
    ctaHref: './interview.html'
  },
  'event.html': {
    isHome: false,
    title: 'イベント一覧 | Kaitaful Fes'
  },
  'event_detail.html': {
    isHome: false,
    title: 'イベント詳細 | Kaitaful Fes',
    eventCtaHref: './event.html'
  },
  'story.html': {
    isHome: false,
    title: '70 STORIES | Kaitaful Fes'
  },
  'information.html': {
    isHome: false,
    title: 'インフォメーション一覧 | Kaitaful Fes'
  },
  'information_detail.html': {
    isHome: false,
    title: 'インフォメーション詳細 | Kaitaful Fes'
  },
  'about.html': {
    isHome: false,
    title: '海田町を知る | Kaitaful Fes'
  },
};

const root = 'src';

export default defineConfig({
  base: './',
  server: {
    host: true //IPアドレスを有効化
  },
  root: root, //開発ディレクトリ設定
  build: {
    outDir: '../dist', //出力場所の指定
    rollupOptions: {
      //ファイル出力設定
      output: {
        assetFileNames: assetInfo => {
          let extType = assetInfo.name.split('.')[1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            extType = 'images';
          }
          //ビルド時のCSS名を明記してコントロールする
          if (extType === 'css') {
            return `assets/css/style.css`;
          }
          return `assets/${extType}/[name][extname]`;
        },
        chunkFileNames: 'assets/js/[name].js',
        entryFileNames: 'assets/js/[name].js',
        // 単一のバンドルを生成
        manualChunks: undefined
      },
      input: {
        index: resolve(__dirname, root, 'index.html'),
        interview: resolve(__dirname, root, 'interview.html'),
        interview_detail: resolve(__dirname, root, 'interview_detail.html'),
        event: resolve(__dirname, root, 'event.html'),
        event_detail: resolve(__dirname, root, 'event_detail.html'),
        story: resolve(__dirname, root, 'story.html'),
        information: resolve(__dirname, root, 'information.html'),
        information_detail: resolve(__dirname, root, 'information_detail.html'),
        about: resolve(__dirname, root, 'about.html')
      }
    }
  },
  /*
    プラグインの設定を追加
  */
  plugins: [
    handlebars({
      //コンポーネントの格納ディレクトリを指定
      partialDirectory: resolve(__dirname, root, 'components'),
      //各ページ情報の読み込み
      context(pagePath) {
        const pageName = pagePath.split('/').pop();
        return pageData[pageName];
      }
    })
  ]
});