import { existsSync, mkdirSync, renameSync } from 'fs';
import { join, resolve } from 'path';

/** @type {readonly string[]} */
export const htmlEntries = [
  'index.html',
  'about.html',
  'story.html',
  'event.html',
  'event_detail.html',
  'event_detail_01.html',
  'event_detail_02.html',
  'event_detail_03.html',
  'event_detail_04.html',
  'event_detail_05.html',
  'event_detail_06.html',
  'event_detail_07.html',
  'event_detail_08.html',
  'event_detail_09.html',
  'interview.html',
  'interview_detail.html',
  'interview_detail_01.html',
  'information.html',
  'information_detail.html',
  'entry.html',
  'entry_food.html',
  'entry_job.html',
  'entry_sponsor.html'
];

/** Handlebars 用キー → ソース HTML ファイル名 */
export const pageRoutes = {
  home: 'index.html',
  about: 'about.html',
  story: 'story.html',
  event: 'event.html',
  eventDetail: 'event_detail.html',
  eventDetail01: 'event_detail_01.html',
  eventDetail02: 'event_detail_02.html',
  eventDetail03: 'event_detail_03.html',
  eventDetail04: 'event_detail_04.html',
  eventDetail05: 'event_detail_05.html',
  eventDetail06: 'event_detail_06.html',
  eventDetail07: 'event_detail_07.html',
  eventDetail08: 'event_detail_08.html',
  eventDetail09: 'event_detail_09.html',
  interview: 'interview.html',
  interviewDetail: 'interview_detail.html',
  interviewDetail01: 'interview_detail_01.html',
  information: 'information.html',
  informationDetail: 'information_detail.html',
  entry: 'entry.html',
  entryFood: 'entry_food.html',
  entryJob: 'entry_job.html',
  entrySponsor: 'entry_sponsor.html'
};

/**
 * about.html → about
 * event_detail_01.html → event-detail-01
 */
export function htmlFileToSlug(filename) {
  if (filename === 'index.html') return '';
  return filename.replace(/\.html$/, '').replace(/_/g, '-');
}

/**
 * about → about.html
 * event-detail-01 → event_detail_01.html
 */
export function slugToHtmlFile(slug) {
  if (!slug) return 'index.html';
  return `${slug.replace(/-/g, '_')}.html`;
}

/**
 * サイトルート基準のパス（/about/ 形式）
 * @param {string} _fromFile 未使用（将来の相対パス用に残す）
 * @param {string} toFile
 */
export function resolvePageUrl(_fromFile, toFile) {
  const toSlug = htmlFileToSlug(toFile);
  return toSlug ? `/${toSlug}/` : '/';
}

/**
 * @param {string} pageName index.html / about.html など
 */
export const siteOrigin = 'https://kaitafuldays.com';

export function canonicalUrl(htmlFile) {
  const slug = htmlFileToSlug(htmlFile);
  return slug ? `${siteOrigin}/${slug}/` : `${siteOrigin}/`;
}

export function buildUrlContext(pageName) {
  /** @type {Record<string, string>} */
  const url = {};

  for (const [key, target] of Object.entries(pageRoutes)) {
    url[key] = resolvePageUrl(pageName, target);
  }

  return {
    assetBase: '/',
    canonical: canonicalUrl(pageName),
    url
  };
}

/**
 * Vite dev: /about → /about.html
 */
export function cleanUrlPathname(pathname) {
  if (!pathname || pathname === '/') return pathname;

  const segments = pathname.split('/').filter(Boolean);
  if (segments.length !== 1) return pathname;

  const slug = segments[0];
  if (slug.includes('.')) return pathname;

  const htmlFile = slugToHtmlFile(slug);
  if (!htmlEntries.includes(htmlFile)) return pathname;

  return `/${htmlFile}`;
}

/**
 * ビルド後: dist/about.html → dist/about/index.html
 * @param {string} distDir
 */
export function restructureDistHtml(distDir) {
  for (const file of htmlEntries) {
    if (file === 'index.html') continue;

    const slug = htmlFileToSlug(file);
    const src = join(distDir, file);
    if (!existsSync(src)) continue;

    const dir = join(distDir, slug);
    mkdirSync(dir, { recursive: true });
    renameSync(src, join(dir, 'index.html'));
  }
}
