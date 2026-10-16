#!/usr/bin/env node
/*
  Генерирует b/index.html (тема B «Тёплый курорт») из index.html (тема A).
  Разметка у тем одна (решение: различия только в токенах и фото), поэтому
  B не правится руками — после любой правки index.html запустить:

      node tools/build-theme-b.js

  Это не сборщик: сайт остаётся статическим, результат коммитится как есть.
*/
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

function replaceOnce(from, to) {
  if (!html.includes(from)) throw new Error('Не найдено в index.html: ' + from.slice(0, 80));
  html = html.replace(from, to);
}

// 1. Тема
replaceOnce('<html lang="ru" data-theme="deep">', '<html lang="ru" data-theme="b">');

// 2. Шрифты темы B: Lora 600 (+ курсив для цитаты), Golos Text 400/500/600
//    Адрес встречается трижды: preload, неблокирующий stylesheet и <noscript>.
const fontsA = /https:\/\/fonts\.googleapis\.com\/css2\?[^"]*/g;
if ((html.match(fontsA) || []).length !== 3) throw new Error('Ожидалось 3 ссылки на шрифты Google');
html = html.replace(fontsA, 'https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,600;1,600&family=Golos+Text:wght@400;500;600&display=swap&subset=cyrillic');

// 3. Относительные пути: страница лежит на уровень глубже
html = html
  .replace(/(href|src|srcset|data-video-src)="(css|js|assets)\//g, '$1="../$2/');

// 4. Фото и ролики темы B (снимки МРТ без суффикса темы).
//    Обложка review-video-1-b — первый кадр ролика B (tools/images.json).
html = html.replace(/assets\/img\/([a-z0-9-]+?)-a(-thumb)?(@2x)?\.webp/g, function (m, slot, thumb, retina) {
  return 'assets/img/' + slot + '-b' + (thumb || '') + (retina || '') + '.webp';
});
html = html.replace(/assets\/video\/([a-z0-9-]+?)-a\.mp4/g, 'assets/video/$1-b.mp4');

// 4a. Open Graph и canonical: адрес темы B и её превью-картинка
replaceOnce('<link rel="canonical" href="https://panchishen.github.io/uvildy-kinetic-energy/">',
            '<link rel="canonical" href="https://panchishen.github.io/uvildy-kinetic-energy/b/">');
replaceOnce('<meta property="og:url" content="https://panchishen.github.io/uvildy-kinetic-energy/">',
            '<meta property="og:url" content="https://panchishen.github.io/uvildy-kinetic-energy/b/">');
replaceOnce('assets/img/og-a.jpg', 'assets/img/og-b.jpg');

// 5. Настройки образца: активна тема «Тёплый курорт»
replaceOnce(
  '<a class="settings__chip is-active" href="./" aria-current="page" data-theme-link>Клиника у озера</a>\n        <a class="settings__chip" href="b/" data-theme-link>Тёплый курорт</a>',
  '<a class="settings__chip" href="../" data-theme-link>Клиника у озера</a>\n        <a class="settings__chip is-active" href="./" aria-current="page" data-theme-link>Тёплый курорт</a>'
);

// 6. Логотип ведёт на тему A (корень сайта образца)
html = html.replace('<a class="header__logo" href="./"', '<a class="header__logo" href="../"');

html = html.replace('<!DOCTYPE html>', '<!DOCTYPE html>\n<!-- Сгенерировано tools/build-theme-b.js из index.html — не править вручную -->');

fs.mkdirSync(path.join(root, 'b'), { recursive: true });
fs.writeFileSync(path.join(root, 'b', 'index.html'), html);

const missing = [...html.matchAll(/(?:src|href|srcset|data-video-src)="\.\.\/(assets\/[^" ]+)/g)]
  .map(m => m[1])
  .filter(p => !fs.existsSync(path.join(root, p)));
if (missing.length) {
  console.error('Нет файлов:\n' + [...new Set(missing)].join('\n'));
  process.exit(1);
}
console.log('b/index.html обновлён');
