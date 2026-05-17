/**
 * トップページ: スクロール連動フェードイン（Intersection Observer）
 * 無効化: ?scrollReveal=off
 */

const STAGGER_MS = 90;
const THRESHOLD = 0.12;
const ROOT_MARGIN = '0px 0px -8% 0px';

const SECTION_RULES = [
  {
    match: '.flowing_wrapper',
    children: null
  },
  {
    match: '.concept',
    children: ['.concept__column']
  },
  {
    match: '.storyPromo',
    children: ['.storyPromo__text']
  },
  {
    match: '.storySection',
    children: ['.storySection__intro', '.storyCarousel', '.storyCarousel__footer']
  },
  {
    match: '.eventSection',
    children: ['.eventSection__intro', '.eventCard', '.eventSection .wrapper']
  },
  {
    match: '.specialMovie',
    children: [
      '.specialMovie__label',
      '.specialMovie__title',
      '.specialMovie__stage',
      '.specialMovie__copy'
    ]
  },
  {
    match: '.informationSection',
    children: [
      '.informationSection__sidebar',
      '.informationSection__listShell',
      '.informationSection__cta--mobile'
    ]
  },
  {
    match: '.kaitafulFesBand',
    children: ['.kaitafulFesBand__inner']
  },
  {
    match: '.countdownSection',
    children: ['.countdownSection__overlay']
  }
];

function isScrollRevealEnabled() {
  const params = new URLSearchParams(window.location.search);
  const param = params.get('scrollReveal');
  if (param === 'off' || param === '0') return false;
  if (param === 'on' || param === '1') return true;
  return true;
}

function isElementVisible(el) {
  if (!(el instanceof HTMLElement)) return false;
  if (el.closest('[hidden], [aria-hidden="true"]')) return false;
  return el.getClientRects().length > 0;
}

function collectRevealTargets(section, rule) {
  if (!rule.children) {
    return [section];
  }

  const nodes = [];
  rule.children.forEach((selector) => {
    section.querySelectorAll(selector).forEach((el) => {
      if (!isElementVisible(el)) return;
      if (nodes.includes(el)) return;
      nodes.push(el);
    });
  });

  return nodes;
}

function applyStaggerDelays(nodes) {
  nodes.forEach((el, index) => {
    el.style.setProperty('--scroll-reveal-delay', `${index * STAGGER_MS}ms`);
  });
}

function initScrollRevealObserver(elements) {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReduced) {
    elements.forEach((el) => el.classList.add('is-inview'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-inview');
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: THRESHOLD,
      rootMargin: ROOT_MARGIN
    }
  );

  elements.forEach((el) => {
    el.classList.add('scroll-reveal');
    observer.observe(el);
  });
}

function setupScrollReveal() {
  const main = document.querySelector('main.Top');
  if (!main || !isScrollRevealEnabled()) return;

  const elements = [];

  main.querySelectorAll(':scope > section').forEach((section) => {
    if (section.classList.contains('movie')) return;

    const rule = SECTION_RULES.find((item) => section.matches(item.match));
    if (!rule) {
      elements.push(section);
      return;
    }

    const targets = collectRevealTargets(section, rule);
    applyStaggerDelays(targets);
    elements.push(...targets);
  });

  if (!elements.length) return;

  initScrollRevealObserver(elements);
}

function runWhenPageReady(callback) {
  const run = () => {
    window.requestAnimationFrame(callback);
  };

  if (!document.documentElement.classList.contains('is-page-loading')) {
    run();
    return;
  }

  const observer = new MutationObserver(() => {
    if (document.documentElement.classList.contains('is-page-loading')) return;
    observer.disconnect();
    run();
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  });
}

runWhenPageReady(setupScrollReveal);
