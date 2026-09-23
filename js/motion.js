// Анимации уровня «спокойный»: появление блоков при прокрутке (fade + сдвиг 24 px), один раз.
// GSAP + ScrollTrigger (CDN, defer). Первый экран не анимируется — не задерживаем LCP.
// Только transform и opacity: без layout shift. prefers-reduced-motion — только короткий fade без сдвига.
// Если GSAP не загрузился — страница остаётся статичной и полностью видимой.
(function () {
  'use strict';
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  // Группы появления. Селекторы не вкладываются друг в друга, иначе элемент анимировался бы дважды.
  var SINGLE = [
    'main section:not(.hero) .section-head',
    'main section:not(.hero) h2.text-h2:not(.section-head h2)',
    '.stage-block__head', '.stage-block__lead',
    '.b3__media', '.b3__text',
    '.b5__media', '.b5__text',
    '.b9__result', '.b9__video', '.b9__youth',
    '.b10__case', '.b10__help',
    '.b11__accordion', '.license-strip',
    '.b13__banner', '.b17__text', '.b17__media',
    '.b19__text', '.b19__media',
    '.b21__media', '.b21__body',
    '.b22__body', '.b24__media', '.b24__text',
    '.b25__strip', '.accordion--price',
    '.plaque', '.b29__banner', '.b31__card', '.b32__form'
  ].join(',');

  // Ряды карточек — появляются по очереди (шаг 60 мс)
  var ITEMS = [
    '.slider-track > *', '.b5__stages > *', '.b9__discs-cards > *',
    '.b17__gallery > *', '.b26__grid > *', '.b4__grid > *',
    '[data-accordion-exclusive] > .accordion__row'
  ].join(',');

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var from = reduce ? { autoAlpha: 0 } : { autoAlpha: 0, y: 24 };
  var dur = reduce ? 0.2 : 0.6;

  var candidates = gsap.utils.toArray(SINGLE).concat(gsap.utils.toArray(ITEMS));
  // элемент внутри другого анимируемого контейнера не анимируем второй раз
  var nested = function (el) {
    for (var a = el.parentElement; a; a = a.parentElement) if (candidates.indexOf(a) !== -1) return true;
    return false;
  };
  var all = candidates.filter(function (el, i) {
    if (candidates.indexOf(el) !== i || nested(el)) return false;
    // уже на экране при загрузке (например, после перехода по якорю) — не прячем
    return el.getBoundingClientRect().top > window.innerHeight;
  });
  if (!all.length) return;

  gsap.set(all, from);

  function reveal(batch) {
    gsap.to(batch, {
      autoAlpha: 1, y: 0,
      duration: dur,
      ease: 'power3.out',
      stagger: reduce ? 0 : 0.06,
      overwrite: true,
      // снимаем инлайн-transform, чтобы работали CSS-ховеры карточек
      clearProps: 'transform,opacity,visibility'
    });
  }

  ScrollTrigger.batch(all, {
    start: 'top 90%',
    once: true,
    onEnter: reveal,
    // элементы, которые проскочили переходом по якорю, появляются при прокрутке вверх
    onEnterBack: reveal
  });

  // высоты меняются после загрузки картинок и раскрытия аккордеонов
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
