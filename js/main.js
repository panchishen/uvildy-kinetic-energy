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

  /* ---------- Виджет бронирования: календарь, гости, форма «Менеджер подберёт номера» ---------- */
  var booking = document.querySelector('[data-booking]');
  var bookingModal = document.getElementById('booking-modal');
  if (booking) {
    var MONTHS = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
    var MONTHS_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    var DOW = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
    var mqPhone = window.matchMedia('(max-width: 767px)');
    var plural = function (n, one, few, many) {
      var m10 = n % 10, m100 = n % 100;
      if (m10 === 1 && m100 !== 11) return one;
      if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
      return many;
    };
    var dayStart = function (d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); };
    var addDays = function (d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); };
    var same = function (a, b) { return a && b && a.getTime() === b.getTime(); };
    var nightsBetween = function (a, b) { return Math.round((b - a) / 864e5); };

    var today = dayStart(new Date());
    // По умолчанию — как в макете: заезд через 2 дня, 7 ночей (минимум программы)
    var state = { in: addDays(today, 2), out: addDays(today, 9), adults: 2, children: 0, ages: [] };
    var mode = 'in';
    var hover = null;
    var view = new Date(state.in.getFullYear(), state.in.getMonth(), 1);
    var maxView = new Date(today.getFullYear(), today.getMonth() + 11, 1);

    var fields = {};
    booking.querySelectorAll('[data-booking-field]').forEach(function (f) { fields[f.dataset.bookingField] = f; });
    var pops = {};
    booking.querySelectorAll('[data-booking-pop]').forEach(function (p) { pops[p.dataset.bookingPop] = p; });
    var monthsBox = booking.querySelector('[data-cal-months]');
    var calPrev = booking.querySelector('[data-cal-prev]');
    var calNext = booking.querySelector('[data-cal-next]');
    var agesBox = booking.querySelector('[data-child-ages]');
    var calTitle = booking.querySelector('[data-cal-title]');
    var setMode = function (m) {
      mode = m;
      if (calTitle) calTitle.textContent = m === 'in' ? 'Дата заезда' : 'Дата выезда';
    };
    var ageTpl = booking.querySelector('[data-child-age-tpl]');

    var fmtDay = function (d) { return d.getDate() + ' ' + MONTHS_GEN[d.getMonth()] + ', ' + DOW[d.getDay()]; };
    var fmtShort = function (d) { return d.getDate() + ' ' + MONTHS_GEN[d.getMonth()].slice(0, 3); };
    var fmtRange = function () {
      if (!state.in) return 'не выбраны';
      if (!state.out) return 'с ' + state.in.getDate() + ' ' + MONTHS_GEN[state.in.getMonth()] + ', дата выезда не выбрана';
      var n = nightsBetween(state.in, state.out);
      var from = state.in.getMonth() === state.out.getMonth() ? String(state.in.getDate()) : state.in.getDate() + ' ' + MONTHS_GEN[state.in.getMonth()];
      return from + ' — ' + state.out.getDate() + ' ' + MONTHS_GEN[state.out.getMonth()] + ' · ' + n + ' ' + plural(n, 'ночь', 'ночи', 'ночей');
    };
    var fmtGuests = function (withAges) {
      var s = state.adults + ' ' + plural(state.adults, 'взрослый', 'взрослых', 'взрослых');
      if (state.children) {
        s += ', ' + state.children + ' ' + plural(state.children, 'ребёнок', 'ребёнка', 'детей');
        if (withAges) {
          var known = state.ages.filter(function (a) { return a !== null; });
          if (known.length) s += ' (' + known.map(function (a) { return a === 0 ? 'до 1 года' : a + ' ' + plural(a, 'год', 'года', 'лет'); }).join(', ') + ')';
        }
      }
      return s;
    };

    var setValue = function (key, text, empty) {
      var el = booking.querySelector('[data-booking-value="' + key + '"]');
      el.textContent = text;
      fields[key].classList.toggle('is-empty', !!empty);
    };
    var updateFields = function () {
      var inLabel = fields.in.querySelector('.widget-field__label');
      if (mqPhone.matches) {
        // На телефоне видно одно поле — в нём весь диапазон
        inLabel.textContent = 'Даты';
        if (!state.in) setValue('in', 'Выбрать', true);
        else setValue('in', state.out ? fmtShort(state.in) + ' — ' + fmtShort(state.out) : fmtShort(state.in) + ' — …', false);
      } else {
        inLabel.textContent = 'Дата заезда';
        setValue('in', state.in ? fmtDay(state.in) : 'Выбрать', !state.in);
      }
      setValue('out', state.out ? fmtDay(state.out) : 'Выбрать', !state.out);
      setValue('guests', fmtGuests(false), false);
    };

    /* Календарь: DOM месяцев строится при смене месяца, состояние дней — в paint() */
    var buildMonth = function (first) {
      var wrap = document.createElement('div');
      wrap.className = 'cal-month';
      var title = document.createElement('p');
      title.className = 'cal-month__title text-h4';
      title.textContent = MONTHS[first.getMonth()].charAt(0).toUpperCase() + MONTHS[first.getMonth()].slice(1) + ' ' + first.getFullYear();
      var dow = document.createElement('div');
      dow.className = 'cal-month__dow text-caption';
      dow.setAttribute('aria-hidden', 'true');
      ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'].forEach(function (t) { var s = document.createElement('span'); s.textContent = t; dow.appendChild(s); });
      var grid = document.createElement('div');
      grid.className = 'cal-month__grid';
      var offset = (first.getDay() + 6) % 7;
      for (var i = 0; i < offset; i++) grid.appendChild(document.createElement('span'));
      var days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
      for (var d = 1; d <= days; d++) {
        var date = new Date(first.getFullYear(), first.getMonth(), d);
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'cal-day';
        b.dataset.time = String(date.getTime());
        b.setAttribute('aria-label', fmtDay(date));
        b.innerHTML = '<span>' + d + '</span>';
        if (date < today) b.disabled = true;
        grid.appendChild(b);
      }
      wrap.appendChild(title);
      wrap.appendChild(dow);
      wrap.appendChild(grid);
      return wrap;
    };
    var renderCalendar = function () {
      monthsBox.innerHTML = '';
      monthsBox.appendChild(buildMonth(view));
      monthsBox.appendChild(buildMonth(new Date(view.getFullYear(), view.getMonth() + 1, 1)));
      calPrev.disabled = view <= new Date(today.getFullYear(), today.getMonth(), 1);
      calNext.disabled = view >= maxView;
      paint();
    };
    var paint = function () {
      var start = state.in ? state.in.getTime() : null;
      var end = state.in && (state.out || (mode === 'out' && hover && hover > state.in ? hover : null));
      monthsBox.querySelectorAll('.cal-day').forEach(function (b) {
        var t = Number(b.dataset.time);
        var isStart = t === start;
        var isEnd = end && t === end.getTime();
        b.classList.toggle('is-today', t === today.getTime());
        b.classList.toggle('is-start', isStart);
        b.classList.toggle('is-end', !!isEnd);
        b.classList.toggle('is-range', !!(end && t > start && t < end.getTime()));
        b.classList.toggle('has-range', !!(end && (isStart || isEnd)));
        b.setAttribute('aria-pressed', String(isStart || !!isEnd));
      });
    };

    /* Открытие / закрытие поповеров */
    var openKey = null;
    var setActiveField = function (key) {
      Object.keys(fields).forEach(function (k) {
        fields[k].classList.toggle('is-active', k === key);
        fields[k].setAttribute('aria-expanded', String(k === key));
      });
    };
    var closePops = function () {
      if (!openKey) return;
      Object.keys(pops).forEach(function (k) { pops[k].hidden = true; });
      openKey = null;
      hover = null;
      setActiveField(null);
      document.documentElement.classList.remove('is-booking-open');
      updateFields();
    };
    var openPop = function (key) {
      var popKey = key === 'guests' ? 'guests' : 'dates';
      Object.keys(pops).forEach(function (k) { pops[k].hidden = k !== popKey; });
      openKey = key;
      if (popKey === 'dates') {
        setMode(key === 'out' && state.in ? 'out' : 'in');
        var base = state.in || today;
        view = new Date(base.getFullYear(), base.getMonth(), 1);
        if (view > maxView) view = maxView;
        renderCalendar();
        pops.dates.style.setProperty('--pop-left', '0px');
      } else {
        pops.guests.style.setProperty('--pop-left', fields.guests.offsetLeft + 'px');
      }
      setActiveField(popKey === 'dates' ? (mqPhone.matches ? 'in' : mode) : key);
      // На телефоне поповер — лист снизу: не выше низа шапки (топбар может быть закрыт)
      if (mqPhone.matches) {
        var headerBottom = header ? Math.max(header.getBoundingClientRect().bottom, 0) : 0;
        pops[popKey].style.maxHeight = (window.innerHeight - headerBottom - booking.offsetHeight - 8) + 'px';
      } else {
        pops[popKey].style.maxHeight = '';
      }
      document.documentElement.classList.add('is-booking-open');
    };
    Object.keys(fields).forEach(function (key) {
      fields[key].addEventListener('click', function () {
        if (openKey === key) closePops(); else openPop(key);
      });
    });
    document.addEventListener('click', function (e) {
      if (openKey && !booking.contains(e.target)) closePops();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && openKey) {
        var back = fields[openKey];
        closePops();
        if (back) back.focus();
      }
    });

    booking.querySelectorAll('[data-pop-close]').forEach(function (b) {
      b.addEventListener('click', function () {
        var back = fields[openKey];
        closePops();
        if (back) back.focus();
      });
    });
    booking.querySelector('[data-cal-reset]').addEventListener('click', function () {
      state.in = null;
      state.out = null;
      hover = null;
      setMode('in');
      setActiveField('in');
      updateFields();
      paint();
    });
    calPrev.addEventListener('click', function () { view = new Date(view.getFullYear(), view.getMonth() - 1, 1); renderCalendar(); });
    calNext.addEventListener('click', function () { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); renderCalendar(); });
    monthsBox.addEventListener('click', function (e) {
      var b = e.target.closest('.cal-day');
      if (!b || b.disabled) return;
      var d = new Date(Number(b.dataset.time));
      if (mode === 'in' || !state.in) {
        // Из поля заезда выбираются обе даты подряд: после заезда календарь ждёт выезд
        state.in = d;
        if (!state.out || state.out <= d) state.out = null;
        setMode('out');
        setActiveField(mqPhone.matches ? 'in' : 'out');
        updateFields();
        paint();
      } else if (d <= state.in) {
        state.in = d;
        state.out = null;
        updateFields();
        paint();
      } else {
        state.out = d;
        closePops();
      }
    });
    monthsBox.addEventListener('mouseover', function (e) {
      var b = e.target.closest('.cal-day');
      if (mode !== 'out' || !state.in || state.out || !b || b.disabled) return;
      hover = new Date(Number(b.dataset.time));
      paint();
    });

    /* Гости: степперы и возраст детей */
    var syncAges = function () {
      while (state.ages.length < state.children) state.ages.push(null);
      state.ages.length = state.children;
      while (agesBox.children.length > state.children) agesBox.lastElementChild.remove();
      while (agesBox.children.length < state.children) {
        var idx = agesBox.children.length;
        var node = ageTpl.content.firstElementChild.cloneNode(true);
        var sel = node.querySelector('select');
        sel.value = state.ages[idx] === null ? '' : String(state.ages[idx]);
        sel.dataset.index = String(idx);
        node.querySelector('.field__label').textContent = 'Возраст ребёнка' + (state.children > 1 ? ' ' + (idx + 1) : '');
        agesBox.appendChild(node);
      }
      agesBox.querySelectorAll('.field__label').forEach(function (l, i) {
        l.textContent = 'Возраст ребёнка' + (state.children > 1 ? ' ' + (i + 1) : '');
      });
    };
    booking.querySelectorAll('[data-stepper]').forEach(function (st) {
      var key = st.dataset.stepper;
      var min = Number(st.dataset.min), max = Number(st.dataset.max);
      var val = st.querySelector('.stepper__value');
      var minus = st.querySelector('[data-step="-1"]');
      var plus = st.querySelector('[data-step="1"]');
      var sync = function () {
        val.textContent = String(state[key]);
        minus.disabled = state[key] <= min;
        plus.disabled = state[key] >= max;
      };
      st.addEventListener('click', function (e) {
        var b = e.target.closest('[data-step]');
        if (!b) return;
        state[key] = Math.min(max, Math.max(min, state[key] + Number(b.dataset.step)));
        sync();
        if (key === 'children') syncAges();
        updateFields();
      });
      sync();
    });
    agesBox.addEventListener('change', function (e) {
      if (e.target.dataset.index && e.target.value !== '') state.ages[Number(e.target.dataset.index)] = Number(e.target.value);
    });

    updateFields();
    mqPhone.addEventListener('change', function () { closePops(); updateFields(); });

    /* Форма «Менеджер подберёт номера»: её открывают «Найти номера» и все «Забронировать» */
    if (bookingModal && typeof bookingModal.showModal === 'function') {
      var modalForm = bookingModal.querySelector('form');
      var openModal = function () {
        closePops();
        if (modalForm.classList.contains('is-sent')) {
          modalForm.classList.remove('is-sent');
          modalForm.reset();
        }
        var dates = fmtRange();
        var guests = fmtGuests(true);
        bookingModal.querySelector('[data-summary="dates"]').textContent = dates;
        bookingModal.querySelector('[data-summary="guests"]').textContent = guests;
        bookingModal.querySelector('[data-summary-input="dates"]').value = dates;
        bookingModal.querySelector('[data-summary-input="guests"]').value = guests;
        bookingModal.showModal();
        document.documentElement.classList.add('is-modal-open');
      };
      document.querySelectorAll('[data-booking-open]').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          openModal();
        });
      });
      bookingModal.querySelector('[data-modal-close]').addEventListener('click', function () { bookingModal.close(); });
      bookingModal.addEventListener('click', function (e) {
        if (e.target !== bookingModal) return;
        var r = bookingModal.getBoundingClientRect();
        var inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
        if (!inside) bookingModal.close(); // клик по затемнению, а не по отступу окна
      });
      bookingModal.addEventListener('close', function () {
        document.documentElement.classList.remove('is-modal-open');
      });
    }
  }

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
