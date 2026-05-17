/**
 * トップページ オープニング（カーテン wipe）
 * デフォルト ON
 * OFF: ?loading=off または localStorage kaita-loading=off
 * ON:  ?loading=on  または localStorage kaita-loading=on（明示時のみ）
 */

const STORAGE_KEY = 'kaita-loading';

const TIMING = {
  logoMinMs: 1100, // ロゴフェードイン（0.15s delay + 0.9s）完了まで
  coverMs: 750,
  revealMs: 850,
  coverHoldMs: 120
};

function sleep(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function waitForWindowLoad() {
  if (document.readyState === 'complete') return Promise.resolve();
  return new Promise((resolve) => {
    window.addEventListener('load', resolve, { once: true });
  });
}

function getLoadingPreference() {
  const params = new URLSearchParams(window.location.search);
  const param = params.get('loading');

  if (param === 'off' || param === '0' || params.get('noLoading') === '1') {
    return false;
  }
  if (param === 'on' || param === '1') {
    return true;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'off') return false;
  if (stored === 'on') return true;

  return true;
}

function setLoadingPreference(enabled) {
  window.localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off');
}

function finishLoading(loader) {
  loader.classList.add('is-done');
  loader.setAttribute('aria-hidden', 'true');
  document.documentElement.classList.remove('is-page-loading');

  window.setTimeout(() => {
    loader.remove();
  }, 200);
}

async function runPageLoading(loader) {
  document.documentElement.classList.add('is-page-loading');

  const logoStart = performance.now();

  await Promise.all([waitForWindowLoad(), sleep(TIMING.logoMinMs)]);

  const logoElapsed = performance.now() - logoStart;
  if (logoElapsed < TIMING.logoMinMs) {
    await sleep(TIMING.logoMinMs - logoElapsed);
  }

  loader.classList.add('is-covering');
  await sleep(TIMING.coverMs + TIMING.coverHoldMs);

  loader.classList.remove('is-covering');
  loader.classList.add('is-covered');
  loader.classList.add('is-revealing');
  document.documentElement.classList.remove('is-page-loading');
  await sleep(TIMING.revealMs);

  finishLoading(loader);
}

function initLoadingDevToggle() {
  const btn = document.querySelector('.js-loading-dev-toggle');
  const label = document.querySelector('.js-loading-dev-toggle-label');
  if (!btn || !label) return;

  btn.removeAttribute('hidden');

  const updateLabel = () => {
    const enabled = getLoadingPreference();
    label.textContent = enabled ? 'ON' : 'OFF';
  };

  updateLabel();

  btn.addEventListener('click', () => {
    const next = !getLoadingPreference();
    setLoadingPreference(next);
    updateLabel();
    window.location.reload();
  });
}

function initPageLoading() {
  const loader = document.querySelector('.js-page-loading');
  if (!loader) return;

  if (import.meta.env.DEV) {
    initLoadingDevToggle();
  }

  if (!getLoadingPreference()) {
    finishLoading(loader);
    return;
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    finishLoading(loader);
    return;
  }

  runPageLoading(loader).catch(() => {
    finishLoading(loader);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPageLoading);
} else {
  initPageLoading();
}
