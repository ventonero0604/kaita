import $ from 'jquery';
import './scrollReveal.js';

// ========================================
// 共通: ハンバーガーメニュー
// ========================================
const $gnav = $('#globalNav');
const $panel = $gnav.find('.gnav__panel');

// メニューを開く
$('#menuBtn').on('click', function () {
  $gnav.addClass('is-open');
  $('body').addClass('gnav-open');
  const scrollTop = $(window).scrollTop();
  $('body')
    .css('--scroll-top', `-${scrollTop}px`)
    .addClass('no-scroll');
});

// メニューを閉じる
function closeNav() {
  // まずパネルのスライドアウトを開始
  $gnav.removeClass('is-open');

  // パネルのトランジション完了を待ってからコンテンツを再表示
  $panel.one('transitionend', function () {
    $('body').removeClass('gnav-open');
    const scrollTop = Math.abs(
      parseInt($('body').css('--scroll-top') || '0', 10)
    );
    $('body').removeClass('no-scroll').css('--scroll-top', '');
    $(window).scrollTop(scrollTop);
  });
}

$('#gnavClose').on('click', closeNav);
$('#gnavOverlay').on('click', closeNav);

// ========================================
// 共通: 横スクロール画像切り替え (flowing)
// ========================================
(function initFlowingSliders() {
  const INTERVAL = 1500; // 切り替え間隔 (ms)

  $('.js-flowing-slider').each(function () {
    const $slides = $(this).find('.js-flowing-slide');
    if ($slides.length <= 1) return;

    let currentIndex = 0;

    setInterval(function () {
      $slides.eq(currentIndex).removeClass('is-active');
      currentIndex = (currentIndex + 1) % $slides.length;
      $slides.eq(currentIndex).addClass('is-active');
    }, INTERVAL);
  });
})();

// ========================================
// 共通: ページトップへ戻る
// ========================================
$('#backToTop').on('click', function (e) {
  e.preventDefault();
  $('html, body').animate({ scrollTop: 0 }, 500);
});

// ========================================
// 共通: SNS リンクをコピー
// ========================================
(function initSnsCopyLink() {
  const TOOLTIP_VISIBLE_MS = 2500;
  const TOOLTIP_ANIM_MS = 300;
  let tooltipTimer = 0;
  let tooltipHideTimer = 0;

  function copyTextToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }

    return new Promise((resolve, reject) => {
      const $textarea = $('<textarea readonly></textarea>');
      $textarea.val(text).css({
        position: 'fixed',
        top: 0,
        left: '-9999px'
      });
      $('body').append($textarea);
      $textarea[0].select();
      try {
        const ok = document.execCommand('copy');
        $textarea.remove();
        if (ok) resolve();
        else reject(new Error('copy failed'));
      } catch (err) {
        $textarea.remove();
        reject(err);
      }
    });
  }

  function ensureCopyTooltip($btn) {
    const $item = $btn.closest('.sns__item');
    $item.addClass('sns__item--copy');
    let $tooltip = $item.find('.js-sns-copy-tooltip');
    if (!$tooltip.length) {
      $tooltip = $(
        '<span class="sns__tooltip js-sns-copy-tooltip" role="status" aria-live="polite" hidden>リンクをコピーしました</span>'
      );
      $item.append($tooltip);
    }
    return $tooltip;
  }

  function hideCopyTooltip($tooltip) {
    if (!$tooltip.length || !$tooltip.hasClass('is-visible')) return;

    $tooltip.removeClass('is-visible');
    window.clearTimeout(tooltipHideTimer);
    tooltipHideTimer = window.setTimeout(() => {
      $tooltip.attr('hidden', 'hidden').attr('aria-hidden', 'true');
    }, TOOLTIP_ANIM_MS);
  }

  function showCopyTooltip($tooltip) {
    if (!$tooltip.length) return;

    window.clearTimeout(tooltipTimer);
    window.clearTimeout(tooltipHideTimer);

    $tooltip.removeAttr('hidden').attr('aria-hidden', 'false');

    // 連続クリック時も入場アニメーションを再生
    if ($tooltip.hasClass('is-visible')) {
      $tooltip.removeClass('is-visible');
      void $tooltip[0].offsetWidth;
    }

    $tooltip.addClass('is-visible');
    tooltipTimer = window.setTimeout(() => hideCopyTooltip($tooltip), TOOLTIP_VISIBLE_MS);
  }

  $(document).on('click', '.js-sns-copy', function (e) {
    e.preventDefault();
    const $btn = $(this);
    const $tooltip = ensureCopyTooltip($btn);
    const url = window.location.href;

    copyTextToClipboard(url)
      .then(() => showCopyTooltip($tooltip))
      .catch(() => {
        window.prompt('以下のURLをコピーしてください', url);
      });
  });
})();

// ========================================
// Story: 深いリンク用 (?story=01 / #story-01)
// ========================================
function normalizeStoryNo(value) {
  if (value == null || value === '') return '';
  const n = parseInt(String(value).replace(/\D/g, ''), 10);
  if (!n || n < 1) return '';
  return String(n).padStart(2, '0');
}

function getStoryNoFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get('story');
  if (fromQuery) return normalizeStoryNo(fromQuery);

  const hash = window.location.hash.replace(/^#/, '');
  const hashMatch = hash.match(/^story-?(\d{1,2})$/i);
  if (hashMatch) return normalizeStoryNo(hashMatch[1]);

  return '';
}

function buildStoryPageUrl(storyNo) {
  const no = normalizeStoryNo(storyNo);
  if (!no) return './story.html';
  return `./story.html?story=${encodeURIComponent(no)}`;
}

function getStoryNoFromSlide($slide) {
  const attrNo = $slide.attr('data-story-no');
  if (attrNo) return normalizeStoryNo(attrNo);

  const legacyId = $slide.attr('data-story-id') || $slide.data('storyId');
  if (legacyId) return normalizeStoryNo(legacyId);

  return '';
}

// ========================================
// Top: KAITA TOWN 70 STORIES カルーセル（ドラッグ・自動スクロール）
// ========================================
(function initStoryCarousel() {
  const $carousel = $('.js-story-carousel');
  if (!$carousel.length) return;

  const $viewport = $carousel.find('.js-story-viewport');
  const $track = $carousel.find('.js-story-track');
  const $modal = $('.js-story-modal');
  const $modalCaption = $modal.find('.js-story-modal-caption');

  const vp = $viewport[0];
  const AUTO_SPEED_PX_MS = 0.035;
  let halfCycle = 0;
  let dragging = false;
  let pointerActive = false;
  let didDrag = false;
  let slideHoverDepth = 0;
  let dragStartX = 0;
  let dragStartScroll = 0;
  let activePointerId = null;
  let $pointerDownSlide = null;
  let suppressSlideClick = false;
  const DRAG_THRESHOLD_PX = 10;
  let rafId = 0;
  let lastTs = performance.now();

  function shuffleTrackChildren() {
    const els = $track.children('.js-story-slide').detach().toArray();
    for (let i = els.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [els[i], els[j]] = [els[j], els[i]];
    }
    els.forEach((el) => $track.append(el));
  }

  function duplicateSlidesForLoop() {
    const originals = $track.children('.js-story-slide').toArray();
    originals.forEach((node) => {
      $track.append($(node).clone(true)[0]);
    });
  }

  function measureHalfCycle() {
    halfCycle = $track[0].scrollWidth / 2 || 0;
  }

  function normalizeScroll() {
    if (halfCycle <= 0) return;
    let sl = vp.scrollLeft;
    while (sl >= halfCycle - 1) sl -= halfCycle;
    while (sl < 0) sl += halfCycle;
    vp.scrollLeft = sl;
  }

  function stepBySlides(dir) {
    const $first = $track.children('.js-story-slide').first();
    if (!$first.length) return;
    const cs = getComputedStyle($track[0]);
    const gap = parseFloat(cs.columnGap || cs.gap) || 0;
    const w = $first.outerWidth();
    const delta = (w + gap) * dir;
    vp.scrollLeft += delta;
    normalizeScroll();
  }

  shuffleTrackChildren();
  duplicateSlidesForLoop();

  window.addEventListener('load', () => {
    measureHalfCycle();
    normalizeScroll();
  });
  measureHalfCycle();

  const ro =
    typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => {
          measureHalfCycle();
          normalizeScroll();
        })
      : null;
  ro?.observe($track[0]);

  function tick(now) {
    const dt = Math.min(48, now - lastTs);
    lastTs = now;

    if (!dragging && slideHoverDepth === 0 && halfCycle > 0) {
      vp.scrollLeft += AUTO_SPEED_PX_MS * dt;
      if (vp.scrollLeft >= halfCycle - 0.5) {
        vp.scrollLeft -= halfCycle;
      }
    }

    rafId = requestAnimationFrame(tick);
  }

  rafId = requestAnimationFrame(tick);

  $carousel.on('mouseenter', '.js-story-slide', function () {
    slideHoverDepth++;
  });
  $carousel.on('mouseleave', '.js-story-slide', function () {
    slideHoverDepth = Math.max(0, slideHoverDepth - 1);
  });

  function navigateFromSlide($slide) {
    const storyNo = getStoryNoFromSlide($slide);
    if (storyNo) {
      window.location.assign(buildStoryPageUrl(storyNo));
      return true;
    }

    if (!$modal.length) return false;
    const title = $slide.data('storyTitle') || '';
    $modalCaption.text(title);
    openStoryModal();
    return true;
  }

  $viewport.on('pointerdown', function (e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    pointerActive = true;
    dragging = false;
    didDrag = false;
    activePointerId = e.pointerId;
    dragStartX = e.clientX;
    dragStartScroll = vp.scrollLeft;
    $pointerDownSlide = $(e.target).closest('.js-story-slide');
  });

  $viewport.on('pointermove', function (e) {
    if (!pointerActive || e.pointerId !== activePointerId) return;

    const dx = e.clientX - dragStartX;
    if (!dragging && Math.abs(dx) >= DRAG_THRESHOLD_PX) {
      dragging = true;
      didDrag = true;
      $pointerDownSlide = null;
      $viewport.addClass('is-dragging');
      try {
        vp.setPointerCapture(e.pointerId);
      } catch (_) {}
    }

    if (!dragging) return;
    vp.scrollLeft = dragStartScroll + (dragStartX - e.clientX);
  });

  function endPointer(e) {
    if (!pointerActive || (e && e.pointerId !== activePointerId)) return;

    pointerActive = false;
    activePointerId = null;

    if (dragging) {
      dragging = false;
      $viewport.removeClass('is-dragging');
      normalizeScroll();
      try {
        if (e?.pointerId != null) vp.releasePointerCapture(e.pointerId);
      } catch (_) {}
    } else if ($pointerDownSlide && $pointerDownSlide.length && !didDrag) {
      suppressSlideClick = true;
      navigateFromSlide($pointerDownSlide);
      window.setTimeout(() => {
        suppressSlideClick = false;
      }, 400);
    }

    $pointerDownSlide = null;
    didDrag = false;
  }

  $viewport.on('pointerup pointercancel', endPointer);

  $carousel.on('click', '.js-story-slide', function (e) {
    if (suppressSlideClick) {
      e.preventDefault();
      return;
    }
    navigateFromSlide($(this));
  });

  $carousel.find('.js-story-prev').on('click', function () {
    stepBySlides(-1);
  });
  $carousel.find('.js-story-next').on('click', function () {
    stepBySlides(1);
  });

  function openStoryModal() {
    $modal.addClass('is-open').attr('aria-hidden', 'false');
    const scrollTop = $(window).scrollTop();
    $('body')
      .css('--scroll-top', `-${scrollTop}px`)
      .addClass('no-scroll');
  }

  function closeStoryModal() {
    $modal.removeClass('is-open').attr('aria-hidden', 'true');
    const scrollTop = Math.abs(parseInt($('body').css('--scroll-top') || '0', 10));
    $('body').removeClass('no-scroll').css('--scroll-top', '');
    $(window).scrollTop(scrollTop);
  }

  $modal.on('click', '.js-story-modal-close', closeStoryModal);

  $(document).on('keydown', function (e) {
    if (e.key === 'Escape' && $modal.hasClass('is-open')) closeStoryModal();
  });
})();

// ========================================
// Top: SPECIAL MOVIE（サムネ・再生ボタンはデザインアセット）
// ========================================
(function initSpecialMovie() {
  const $stage = $('.js-special-movie');
  if (!$stage.length) return;

  const videoEl = $stage.find('.js-special-movie-video')[0];
  if (!videoEl) return;

  $stage.on('click', '.js-special-movie-play', function () {
    if (!videoEl) return;
    videoEl.controls = true;
    $stage.addClass('is-playing');
    const playPromise = videoEl.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(function () {});
    }
  });

  $(videoEl).on('ended', function () {
    videoEl.controls = false;
    videoEl.currentTime = 0;
    $stage.removeClass('is-playing');
  });
})();

// ========================================
// Top: 公開カウントダウン（2026/11/1 00:00:00）
// ========================================
(function initLaunchCountdown() {
  const $section = $('.js-launch-countdown');
  if (!$section.length) return;

  const $bg = $section.find('.js-launch-countdown-bg');
  const timerEl = $section.find('.countdownSection__timer')[0];
  if (!timerEl) return;

  const target = new Date(timerEl.dataset.deadline || '2026-11-01T00:00:00+09:00');
  const $days = $('#launchCountdownDays');
  const $hours = $('#launchCountdownHours');
  const $minutes = $('#launchCountdownMinutes');
  const $seconds = $('#launchCountdownSeconds');
  const pad = (n) => String(n).padStart(2, '0');

  function updateCountdown() {
    const now = new Date();
    const diff = target.getTime() - now.getTime();
    if (diff <= 0) {
      $days.text('0');
      $hours.text('00');
      $minutes.text('00');
      $seconds.text('00');
      return false;
    }

    const total = Math.floor(diff / 1000);
    const days = Math.floor(total / 86400);
    const hours = Math.floor((total % 86400) / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    $days.text(days);
    $hours.text(pad(hours));
    $minutes.text(pad(minutes));
    $seconds.text(pad(seconds));
    return true;
  }

  updateCountdown();
  const countdownTimer = setInterval(function () {
    if (!updateCountdown()) clearInterval(countdownTimer);
  }, 1000);

  const images = [
    '00.png',
    '01.png',
    '02.png',
    '03.png',
    '04.png',
    '05.png',
    '06.png',
    '07.png',
    '08.png',
    '09.png',
    '10.png',
    '11.png',
    '12.png',
    '13.png',
    '14.png',
  ];
  const animations = [
    'anim-zoomIn',
    'anim-zoomOut',
    'anim-slideLeft',
    'anim-slideRight',
  ];
  let currentIndex = -1;

  function showNextBackground() {
    if (!$bg.length || !images.length) return;

    let nextIndex;
    do {
      nextIndex = Math.floor(Math.random() * images.length);
    } while (nextIndex === currentIndex && images.length > 1);
    currentIndex = nextIndex;

    const img = document.createElement('img');
    img.src = `./img/countdown/${images[currentIndex]}`;
    img.className = 'countdownSection__bgImage';
    img.classList.add(animations[Math.floor(Math.random() * animations.length)]);
    $bg[0].appendChild(img);
    void img.offsetWidth;
    img.classList.add('is-active');

    const existing = $bg[0].querySelectorAll('.countdownSection__bgImage');
    if (existing.length > 1) {
      const oldImage = existing[0];
      oldImage.classList.remove('is-active');
      setTimeout(function () {
        if (oldImage.parentNode === $bg[0]) oldImage.remove();
      }, 1300);
    }
  }

  showNextBackground();
  setInterval(showNextBackground, 4500);
})();

// ========================================
// story.html: 一覧カード → 詳細モーダル（ギャラリー・記事内画像）
// ========================================
(function initStoryPageModal() {
  const $modal = $('.js-story-page-modal');
  if (!$modal.length) return;

  const $html = $('html');
  const $panel = $modal.find('.storyPageModal__panel');
  const $modalBody = $modal.find('.storyPageModal__body');
  const $modalAside = $modal.find('.storyPageModal__aside');

  const $track = $modal.find('.js-story-page-modal-track');
  const $thumbs = $modal.find('.js-story-page-modal-thumbs');
  const $no = $modal.find('.js-story-page-modal-no');
  const $title = $modal.find('.js-story-page-modal-title');
  const $sub = $modal.find('.js-story-page-modal-sub');
  const $body = $modal.find('.js-story-page-modal-body');

  let activeSlide = 0;

  function escapeHtml(text) {
    return $('<div>').text(text).html();
  }

  function resolveGalleryUrls(rawUrls, fallbackSrc) {
    const urls = rawUrls.filter(Boolean);
    if (urls.length >= 2) return urls.slice(0, 3);

    const primary = urls[0] || fallbackSrc || '';
    if (!primary) return [];

    if (urls.length === 1) {
      const variants = [primary];
      const match = primary.match(/^(.*)(\.[a-z0-9]+)$/i);
      if (match) {
        const [, stem, ext] = match;
        ['_2', '_3', '_02', '_03'].forEach((suffix) => {
          const candidate = `${stem}${suffix}${ext}`;
          if (!variants.includes(candidate)) variants.push(candidate);
        });
      }
      if (variants.length >= 2) return variants.slice(0, 3);
    }

    return [primary, primary, primary];
  }

  function parseFigures(raw) {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function detailToParagraphs(detailHtml) {
    if (!detailHtml) return '';
    return detailHtml
      .split(/<br\s*\/?>\s*<br\s*\/?>/i)
      .map((chunk) => chunk.trim())
      .filter(Boolean)
      .map((chunk) => `<p>${chunk}</p>`)
      .join('');
  }

  function buildFigureHtml(figure) {
    if (!figure || !figure.src) return '';
    const src = escapeHtml(figure.src);
    const img = `<img src="${src}" alt="" loading="lazy" decoding="async">`;
    const media = figure.href
      ? `<a href="${escapeHtml(figure.href)}" class="storyPageModal__figureLink">${img}</a>`
      : img;
    const caption = figure.caption
      ? `<figcaption>${escapeHtml(figure.caption)}</figcaption>`
      : '';
    return `<figure class="storyPageModal__figure">${media}${caption}</figure>`;
  }

  function buildArticleHtml(detailHtml, figures) {
    const paragraphs = detailToParagraphs(detailHtml);
    if (!figures.length) return paragraphs;

    const figureBlocks = figures.map(buildFigureHtml).join('');
    const $wrap = $('<div>').html(paragraphs);
    const $ps = $wrap.find('p');
    if ($ps.length >= 2) {
      $ps.eq(1).after(figureBlocks);
    } else {
      $wrap.append(figureBlocks);
    }
    return $wrap.html();
  }

  function setActiveSlide(index) {
    const count = $track.children().length;
    if (!count) return;
    activeSlide = Math.max(0, Math.min(index, count - 1));
    $track.css('transform', `translate3d(-${activeSlide * 100}%, 0, 0)`);
    $thumbs.find('.storyPageModal__thumbBtn').each(function (i) {
      const $btn = $(this);
      const isActive = i === activeSlide;
      $btn.toggleClass('is-active', isActive).attr('aria-selected', isActive ? 'true' : 'false');
    });
  }

  function buildGallery(urls) {
    $track.empty();
    $thumbs.empty();

    urls.forEach((src, i) => {
      const $slide = $('<div class="storyPageModal__slide"></div>');
      $slide.append(
        $('<img>', {
          class: 'storyPageModal__slideImg',
          src,
          alt: '',
          decoding: 'async'
        })
      );
      $track.append($slide);

      const $btn = $('<button type="button" class="storyPageModal__thumbBtn" role="tab"></button>');
      $btn.attr({
        'aria-label': `写真 ${i + 1}`,
        'aria-selected': i === 0 ? 'true' : 'false'
      });
      $btn.append(
        $('<img>', {
          src,
          alt: '',
          width: 56,
          height: 56,
          decoding: 'async'
        })
      );
      if (i === 0) $btn.addClass('is-active');
      $btn.on('click', () => setActiveSlide(i));
      $thumbs.append($btn);
    });

    setActiveSlide(0);
  }

  function setStoryUrlParam(storyNo) {
    const url = new URL(window.location.href);
    const no = normalizeStoryNo(storyNo);
    if (no) {
      url.searchParams.set('story', no);
    } else {
      url.searchParams.delete('story');
    }
    history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  }

  function getPayloadFromCard($el) {
    const galleryRaw = $el.attr('data-story-gallery') || '';
    const thumbSrc = $el.find('.storyPageCard__thumb img').attr('src') || '';
    return {
      no: $el.attr('data-story-no') || '',
      title: $el.attr('data-story-title') || '',
      sub: ($el.attr('data-story-sub') || '').trim(),
      detail: $el.attr('data-story-detail') || '',
      gallery: galleryRaw.split('|').filter(Boolean),
      figures: parseFigures($el.attr('data-story-figures') || ''),
      thumb: thumbSrc
    };
  }

  function openStoryPageModal(payload) {
    const galleryUrls = resolveGalleryUrls(payload.gallery, payload.thumb);
    buildGallery(galleryUrls);

    $no.text(payload.no);
    $title.text(payload.title);

    const sub = payload.sub.trim();
    if (sub) {
      $sub.text(sub).removeClass('is-empty').removeAttr('hidden');
    } else {
      $sub.text('').addClass('is-empty').attr('hidden', 'hidden');
    }

    $body.html(buildArticleHtml(payload.detail, payload.figures));

    if ($panel.length) $panel[0].scrollTop = 0;
    if ($modalBody.length) $modalBody[0].scrollTop = 0;
    if ($modalAside.length) $modalAside[0].scrollTop = 0;

    $html.addClass('is-story-page-modal-open');
    $modal.addClass('is-open').attr('aria-hidden', 'false');
  }

  function openStoryFromCard($el) {
    if (!$el.length) return;
    openStoryPageModal(getPayloadFromCard($el));
    setStoryUrlParam($el.attr('data-story-no'));
  }

  function closeStoryPageModal() {
    if (!$modal.hasClass('is-open')) return;
    $modal.removeClass('is-open').attr('aria-hidden', 'true');
    $html.removeClass('is-story-page-modal-open');
    setStoryUrlParam('');
  }

  function openStoryFromUrl() {
    const storyNo = getStoryNoFromUrl();
    if (!storyNo) return;

    const $card = $(`.js-story-page-card[data-story-no="${storyNo}"]`);
    if (!$card.length) return;

    openStoryFromCard($card.first());
    $card[0].scrollIntoView({ block: 'nearest', behavior: 'instant' });
  }

  $('.js-story-page-card').on('click', function () {
    openStoryFromCard($(this));
  });

  openStoryFromUrl();

  $modal.on('click', '.js-story-page-modal-close', function (e) {
    e.preventDefault();
    closeStoryPageModal();
  });

  $(document).on('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (!$modal.hasClass('is-open')) return;
    closeStoryPageModal();
  });
})();

// ========================================
// story.html: 並び替えタブの見た目トグル（スタブ）
// ========================================
(function initStorySortChoices() {
  const $choices = $('.storyPage__sortChoices');
  if (!$choices.length) return;

  $choices.on('click', '.storyPage__sortChoice', function () {
    const $btn = $(this);
    $choices.find('.storyPage__sortChoice').removeClass('is-active').attr('aria-selected', 'false');
    $btn.addClass('is-active').attr('aria-selected', 'true');
  });
})();
