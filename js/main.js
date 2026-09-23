// «Энергия движения» — базовое поведение UI. Анимации (GSAP/ScrollTrigger) — отдельная сессия.
(function () {
  'use strict';

  /* ---------- Топбар (акции) ---------- */
  var topbar = document.getElementById('topbar');
  if (topbar) {
    var slides = Array.prototype.slice.call(topbar.querySelectorAll('[data-topbar-slide]'));
    var dots = topbar.querySelectorAll('[data-topbar-dots] .dots__item');
    var current = 0;
    var timer = null;

    function showSlide(i) {
      slides.forEach(function (el, idx) {
        el.hidden = idx !== i;
      });
      dots.forEach(function (el, idx) {
        el.classList.toggle('is-active', idx === i);
      });
      current = i;
    }

    function nextSlide() {
      showSlide((current + 1) % slides.length);
    }

    function prevSlide() {
      showSlide((current - 1 + slides.length) % slides.length);
    }

    function startAutoplay() {
      stopAutoplay();
      var delay = parseInt(topbar.dataset.autoplay, 10) || 5000;
      timer = setInterval(nextSlide, delay);
    }

    function stopAutoplay() {
      if (timer) clearInterval(timer);
    }

    var prevBtn = topbar.querySelector('[data-topbar-prev]');
    var nextBtn = topbar.querySelector('[data-topbar-next]');
    var closeBtn = topbar.querySelector('[data-topbar-close]');

    if (prevBtn) prevBtn.addEventListener('click', function () { prevSlide(); startAutoplay(); });
    if (nextBtn) nextBtn.addEventListener('click', function () { nextSlide(); startAutoplay(); });
    if (closeBtn) closeBtn.addEventListener('click', function () {
      stopAutoplay();
      topbar.classList.add('is-hidden');
    });

    if (slides.length > 1 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      startAutoplay();
    }
  }

  /* ---------- Шапка: тень при прокрутке ---------- */
  var header = document.getElementById('site-header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-stuck', window.scrollY > 4);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Мега-меню ---------- */
  var megaToggle = document.querySelector('[data-mega-toggle]');
  var megaMenu = document.querySelector('[data-mega-menu]');
  if (megaToggle && megaMenu) {
    function closeMega() {
      megaMenu.classList.remove('is-open');
      megaToggle.setAttribute('aria-expanded', 'false');
    }
    function toggleMega() {
      var isOpen = megaMenu.classList.toggle('is-open');
      megaToggle.setAttribute('aria-expanded', String(isOpen));
    }
    megaToggle.addEventListener('click', toggleMega);
    document.addEventListener('click', function (e) {
      if (!header.contains(e.target)) closeMega();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMega();
    });
  }

  /* ---------- Кнопка «наверх» ---------- */
  var toTop = document.getElementById('to-top');
  if (toTop) {
    var heroSection = document.querySelector('main');
    var toggleToTop = function () {
      toTop.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.8);
    };
    toggleToTop();
    window.addEventListener('scroll', toggleToTop, { passive: true });
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    });
  }

  /* ---------- Галерея первого экрана: миниатюры ---------- */
  var heroThumbs = document.querySelectorAll('[data-hero-thumbs] .hero-thumb');
  var heroMain = document.querySelector('#hero-title')
    ? document.querySelector('main img[width="690"]')
    : null;
  if (heroThumbs.length && heroMain) {
    heroThumbs.forEach(function (thumb) {
      thumb.addEventListener('click', function () {
        heroThumbs.forEach(function (t) {
          t.classList.remove('is-active');
          t.style.opacity = '.6';
          t.style.border = '0';
        });
        thumb.classList.add('is-active');
        thumb.style.opacity = '1';
        thumb.style.border = '2px solid var(--color-action-primary)';
        var thumbImg = thumb.querySelector('img');
        if (thumbImg) {
          heroMain.src = thumbImg.src.replace('-thumb.webp', '.webp');
        }
      });
    });
  }

  /* ---------- Якорное меню: активный пункт по прокрутке ---------- */
  var anchorLinks = document.querySelectorAll('.anchor-chip');
  if (anchorLinks.length) {
    var targets = Array.prototype.map.call(anchorLinks, function (link) {
      return document.querySelector(link.getAttribute('href'));
    });
    var setActive = function () {
      var pos = window.scrollY + 140;
      var activeIndex = 0;
      targets.forEach(function (target, idx) {
        if (target && target.offsetTop <= pos) activeIndex = idx;
      });
      anchorLinks.forEach(function (link, idx) {
        link.classList.toggle('is-active', idx === activeIndex);
      });
    };
    setActive();
    window.addEventListener('scroll', setActive, { passive: true });
  }
})();
