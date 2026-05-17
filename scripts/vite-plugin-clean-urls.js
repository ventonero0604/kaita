import { existsSync } from 'fs';
import { join, resolve } from 'path';
import {
  cleanUrlPathname,
  htmlEntries,
  htmlFileToSlug,
  restructureDistHtml
} from './routes.js';

function attachCleanUrlMiddleware(server, srcRoot) {
  server.middlewares.use((req, _res, next) => {
    const raw = req.url ?? '/';
    const [pathname, search = ''] = raw.split('?');
    const rewritten = cleanUrlPathname(pathname);

    if (rewritten !== pathname) {
      const target = join(srcRoot, rewritten.replace(/^\//, ''));
      if (existsSync(target)) {
        req.url = `${rewritten}${search ? `?${search}` : ''}`;
      }
    }

    next();
  });
}

/**
 * 開発: /about → about.html
 * 本番: dist/about.html → dist/about/index.html
 */
export function cleanUrlsPlugin({ root, outDir }) {
  const srcRoot = resolve(root);
  const distRoot = resolve(outDir);

  return {
    name: 'clean-urls',
    configureServer(server) {
      attachCleanUrlMiddleware(server, srcRoot);
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, _res, next) => {
        const raw = req.url ?? '/';
        const [pathname, search = ''] = raw.split('?');
        if (pathname === '/' || pathname.includes('.')) return next();

        const slug = pathname.replace(/\/$/, '').replace(/^\//, '');
        const indexPath = join(distRoot, slug, 'index.html');
        if (slug && existsSync(indexPath)) {
          req.url = `/${slug}/index.html${search ? `?${search}` : ''}`;
        }

        next();
      });
    },
    closeBundle() {
      restructureDistHtml(distRoot);
    }
  };
}

export { htmlFileToSlug, htmlEntries };
