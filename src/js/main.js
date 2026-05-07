import $ from 'jquery';

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
$(document).on('click', '.js-sns-copy', function (e) {
  e.preventDefault();
  const url = window.location.href;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url);
  }
});

// ========================================
// Top: KAITA TOWN 70 STORIES カルーセル（ドラッグ・自動スクロール・モーダルスタブ）
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
  let dragExceeded = false;
  let slideHoverDepth = 0;
  let dragStartX = 0;
  let dragStartScroll = 0;
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

  $viewport.on('pointerdown', function (e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragging = true;
    dragExceeded = false;
    dragStartX = e.clientX;
    dragStartScroll = vp.scrollLeft;
    $viewport.addClass('is-dragging');
    try {
      vp.setPointerCapture(e.pointerId);
    } catch (_) {}
  });

  $viewport.on('pointermove', function (e) {
    if (!dragging) return;
    const dx = e.clientX - dragStartX;
    if (Math.abs(dx) > 8) dragExceeded = true;
    vp.scrollLeft = dragStartScroll + (dragStartX - e.clientX);
  });

  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    $viewport.removeClass('is-dragging');
    normalizeScroll();
    setTimeout(() => {
      dragExceeded = false;
    }, 80);
    try {
      if (e?.pointerId != null) vp.releasePointerCapture(e.pointerId);
    } catch (_) {}
  }

  $viewport.on('pointerup pointercancel', endDrag);

  $carousel.find('.js-story-prev').on('click', function () {
    stepBySlides(-1);
  });
  $carousel.find('.js-story-next').on('click', function () {
    stepBySlides(1);
  });

  $carousel.on('click', '.js-story-slide', function (e) {
    if (dragExceeded) {
      e.preventDefault();
      return;
    }
    const title = $(this).data('storyTitle') || '';
    $modalCaption.text(title);
    openStoryModal();
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
// story.html: 一覧カード → 詳細モーダル（ギャラリー差し替え）
// ========================================
(function initStoryPageModal() {
  const $modal = $('.js-story-page-modal');
  if (!$modal.length) return;

  const $mainImg = $modal.find('.js-story-page-modal-main');
  const $thumbs = $modal.find('.js-story-page-modal-thumbs');
  const $no = $modal.find('.js-story-page-modal-no');
  const $title = $modal.find('.js-story-page-modal-title');
  const $sub = $modal.find('.js-story-page-modal-sub');
  const $body = $modal.find('.js-story-page-modal-body');

  function openStoryPageModal(payload) {
    const urls = payload.gallery.filter(Boolean);
    const primary = urls[0] || '';
    $mainImg.attr('src', primary).attr('alt', '');
    $no.text(payload.no);
    $title.text(payload.title);

    const sub = payload.sub.trim();
    if (sub) {
      $sub.text(sub).removeClass('is-empty').removeAttr('hidden');
    } else {
      $sub.text('').addClass('is-empty').attr('hidden', 'hidden');
    }

    $body.text(payload.detail);

    $thumbs.empty();
    urls.forEach((src, i) => {
      const $btn = $('<button type="button" class="storyPageModal__thumbBtn"></button>');
      $btn.attr('aria-label', `写真 ${i + 1}`);
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
      $btn.on('click', function () {
        $mainImg.attr('src', src);
        $thumbs.find('.storyPageModal__thumbBtn').removeClass('is-active');
        $btn.addClass('is-active');
      });
      $thumbs.append($btn);
    });

    const scrollTop = $(window).scrollTop();
    $('body')
      .css('--scroll-top', `-${scrollTop}px`)
      .addClass('no-scroll');

    $modal.addClass('is-open').attr('aria-hidden', 'false');
  }

  function closeStoryPageModal() {
    if (!$modal.hasClass('is-open')) return;
    $modal.removeClass('is-open').attr('aria-hidden', 'true');
    const scrollTop = Math.abs(
      parseInt($('body').css('--scroll-top') || '0', 10)
    );
    $('body').removeClass('no-scroll').css('--scroll-top', '');
    $(window).scrollTop(scrollTop);
  }

  $('.js-story-page-card').on('click', function () {
    const $el = $(this);
    const galleryRaw = $el.attr('data-story-gallery') || '';
    openStoryPageModal({
      no: $el.attr('data-story-no') || '',
      title: $el.attr('data-story-title') || '',
      sub: ($el.attr('data-story-sub') || '').trim(),
      detail: $el.attr('data-story-detail') || '',
      gallery: galleryRaw.split('|').filter(Boolean)
    });
  });

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
