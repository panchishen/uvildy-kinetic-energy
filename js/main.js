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
    var megaIcon = megaToggle.querySelector('use');
    // На узких экранах меню — панель на всю высоту под шапкой, страница под ней не прокручивается
    function setMega(isOpen) {
      if (isOpen) {
        var bottom = header.getBoundingClientRect().bottom;
        megaMenu.style.setProperty('--mega-top', Math.max(Math.round(bottom), 0) + 'px');
      }
      megaMenu.classList.toggle('is-open', isOpen);
      megaToggle.setAttribute('aria-expanded', String(isOpen));
      document.documentElement.classList.toggle('is-menu-open', isOpen);
      // крестик — только на узких экранах, где меню закрывает страницу; на десктопе иконка как в макете
      if (megaIcon) megaIcon.setAttribute('href', isOpen && window.matchMedia('(max-width: 1023px)').matches ? '#icon-x' : '#icon-menu');
    }
    function closeMega() {
      if (megaMenu.classList.contains('is-open')) setMega(false);
    }
    function toggleMega() {
      setMega(!megaMenu.classList.contains('is-open'));
    }
    megaMenu.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeMega();
    });
    megaToggle.addEventListener('click', toggleMega);
    document.addEventListener('click', function (e) {
      if (!header.contains(e.target)) closeMega();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMega();
    });
  }

  /* ---------- Панель мессенджеров: на узких экранах сворачивается в одну кнопку ---------- */
  var messenger = document.querySelector('[data-messenger]');
  if (messenger) {
    var messengerToggle = messenger.querySelector('[data-messenger-toggle]');
    var messengerIcon = messengerToggle.querySelector('use');
    var setMessenger = function (isOpen) {
      messenger.classList.toggle('is-open', isOpen);
      messengerToggle.setAttribute('aria-expanded', String(isOpen));
      messengerIcon.setAttribute('href', isOpen ? '#icon-x' : '#icon-message-circle');
    };
    messengerToggle.addEventListener('click', function () {
      setMessenger(!messenger.classList.contains('is-open'));
    });
    document.addEventListener('click', function (e) {
      if (!messenger.contains(e.target)) setMessenger(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setMessenger(false);
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

  /* ---------- Блок 4: список показаний ---------- */
  var indicationButtons = document.querySelectorAll('[data-indication]');
  if (indicationButtons.length) {
    var panels = document.querySelectorAll('[data-indication-panel]');
    var indicationImage = document.querySelector('[data-indication-image]');
    indicationButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = btn.dataset.indication;
        indicationButtons.forEach(function (b) {
          b.classList.toggle('is-active', b === btn);
          b.setAttribute('aria-selected', String(b === btn));
        });
        panels.forEach(function (p) {
          p.hidden = p.dataset.indicationPanel !== idx;
        });
        if (indicationImage) {
          indicationImage.src = indicationImage.getAttribute('src').replace(/indications-\d+-/, 'indications-' + (Number(idx) + 1) + '-');
        }
      });
    });
  }

  /* ---------- Слайдеры карточек (блоки 6, 7, 7а, 8, …) ---------- */
  document.querySelectorAll('[data-slider]').forEach(function (track) {
    var row = track.nextElementSibling;
    if (!row) return;
    var prevBtn = row.querySelector('[data-slider-prev]');
    var nextBtn = row.querySelector('[data-slider-next]');
    if (!prevBtn || !nextBtn) return;

    function step() {
      var card = track.firstElementChild;
      var gap = parseFloat(getComputedStyle(track).gap) || 24;
      return card ? card.getBoundingClientRect().width + gap : 300;
    }
    function updateButtons() {
      prevBtn.disabled = track.scrollLeft <= 4;
      nextBtn.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 4;
    }
    prevBtn.addEventListener('click', function () {
      track.scrollBy({ left: -step(), behavior: 'smooth' });
    });
    nextBtn.addEventListener('click', function () {
      track.scrollBy({ left: step(), behavior: 'smooth' });
    });
    track.addEventListener('scroll', updateButtons, { passive: true });
    updateButtons();
  });

  /* ---------- Аккордеоны (блоки 9, 11, 25, 28) ---------- */
  document.querySelectorAll('[data-accordion]').forEach(function (group) {
    var exclusive = group.hasAttribute('data-accordion-exclusive');
    var rows = group.querySelectorAll('.accordion__row');
    rows.forEach(function (row) {
      var head = row.querySelector('.accordion__head');
      var toggleIcon = row.querySelector('.accordion__toggle use');
      if (!head) return;
      head.addEventListener('click', function () {
        var willOpen = !row.classList.contains('is-open');
        if (exclusive) {
          rows.forEach(function (r) {
            r.classList.remove('is-open');
            r.querySelector('.accordion__head').setAttribute('aria-expanded', 'false');
            var icon = r.querySelector('.accordion__toggle use');
            if (icon) icon.setAttribute('href', '#icon-plus');
          });
        }
        row.classList.toggle('is-open', willOpen);
        head.setAttribute('aria-expanded', String(willOpen));
        if (toggleIcon) toggleIcon.setAttribute('href', willOpen ? '#icon-minus' : '#icon-plus');
      });
    });
  });

  /* ---------- Табы кейсов МРТ (блок 10) ---------- */
  document.querySelectorAll('.tabs-row').forEach(function (tabs) {
    var buttons = tabs.querySelectorAll('.tab-chip');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        buttons.forEach(function (b) {
          var active = b === btn;
          b.classList.toggle('is-active', active);
          b.setAttribute('aria-selected', String(active));
          var panel = document.getElementById(b.getAttribute('aria-controls'));
          if (panel) panel.hidden = !active;
        });
      });
    });
  });

  /* ---------- Мнения врачей (блок 21) ---------- */
  var opinions = document.querySelector('[data-opinions]');
  if (opinions) {
    var opinionParts = opinions.querySelectorAll('[data-opinion-slide]');
    var opinionDots = opinions.querySelectorAll('.dots__item');
    var opinionPrev = opinions.querySelector('[data-opinion-prev]');
    var opinionNext = opinions.querySelector('[data-opinion-next]');
    var opinionIndex = 0;
    var showOpinion = function (i) {
      opinionIndex = i;
      opinionParts.forEach(function (el) {
        el.hidden = Number(el.dataset.opinionSlide) !== i;
      });
      opinionDots.forEach(function (d, idx) {
        d.classList.toggle('is-active', idx === i);
      });
      opinionPrev.disabled = i === 0;
      opinionNext.disabled = i === opinionDots.length - 1;
    };
    opinionPrev.addEventListener('click', function () { showOpinion(Math.max(opinionIndex - 1, 0)); });
    opinionNext.addEventListener('click', function () { showOpinion(Math.min(opinionIndex + 1, opinionDots.length - 1)); });
  }

  /* ---------- Декоративные формы: имитация отправки (без бэкенда) ---------- */
  document.querySelectorAll('[data-decorative-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      form.classList.add('is-sent');
    });
  });

  /* ---------- Переключатель тем (презентация): под шапкой + сохранение прокрутки ---------- */
  var themeSwitch = document.querySelector('[data-theme-switch]');
  if (themeSwitch) {
    var placeSwitch = function () {
      var headerEl = document.getElementById('site-header');
      var bottom = headerEl ? Math.max(headerEl.getBoundingClientRect().bottom, 0) : 0;
      themeSwitch.style.setProperty('--theme-switch-top', Math.round(bottom + 12) + 'px');
    };
    placeSwitch();
    window.addEventListener('scroll', placeSwitch, { passive: true });
    window.addEventListener('resize', placeSwitch);
    var closeTopbarBtn = document.querySelector('[data-topbar-close]');
    if (closeTopbarBtn) closeTopbarBtn.addEventListener('click', function () { requestAnimationFrame(placeSwitch); });

    themeSwitch.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        try { sessionStorage.setItem('themeSwitchY', String(window.scrollY)); } catch (e) {}
      });
    });
    try {
      var savedY = sessionStorage.getItem('themeSwitchY');
      if (savedY !== null) {
        sessionStorage.removeItem('themeSwitchY');
        window.scrollTo({ top: parseInt(savedY, 10) || 0, behavior: 'instant' });
        placeSwitch();
      }
    } catch (e) {}
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
