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
replaceOnce('<html lang="ru">', '<html lang="ru" data-theme="b">');

// 2. Шрифты темы B: Lora 600 (+ курсив для цитаты), Golos Text 400/500/600
//    Адрес встречается трижды: preload, неблокирующий stylesheet и <noscript>.
const fontsA = /https:\/\/fonts\.googleapis\.com\/css2\?[^"]*/g;
if ((html.match(fontsA) || []).length !== 3) throw new Error('Ожидалось 3 ссылки на шрифты Google');
html = html.replace(fontsA, 'https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,600;1,600&family=Golos+Text:wght@400;500;600&display=swap&subset=cyrillic');

// 3. Относительные пути: страница лежит на уровень глубже
html = html
  .replace(/(href|src)="(css|js|assets)\//g, '$1="../$2/');

// 4. Фото темы B. Исключения: у review-video-1 нет кадра B (в макете B стоит кадр A),
//    снимки МРТ без суффикса темы.
html = html.replace(/assets\/img\/([a-z0-9-]+?)-a(-thumb)?\.webp/g, function (m, slot, thumb) {
  if (slot === 'review-video-1') return m;
  return 'assets/img/' + slot + '-b' + (thumb || '') + '.webp';
});

// 4a. Open Graph и canonical: адрес темы B и её превью-картинка
replaceOnce('<link rel="canonical" href="https://panchishen.github.io/uvildy-kinetic-energy/">',
            '<link rel="canonical" href="https://panchishen.github.io/uvildy-kinetic-energy/b/">');
replaceOnce('<meta property="og:url" content="https://panchishen.github.io/uvildy-kinetic-energy/">',
            '<meta property="og:url" content="https://panchishen.github.io/uvildy-kinetic-energy/b/">');
replaceOnce('assets/img/og-a.jpg', 'assets/img/og-b.jpg');

// 5. Переключатель тем: активен «Вариант 2»
replaceOnce(
  '<a class="theme-switch__opt is-active" href="./" aria-current="page">Вариант 1</a>\n  <a class="theme-switch__opt" href="b/">Вариант 2</a>',
  '<a class="theme-switch__opt" href="../">Вариант 1</a>\n  <a class="theme-switch__opt is-active" href="./" aria-current="page">Вариант 2</a>'
);

// 6. Логотип ведёт на тему A (корень сайта образца)
html = html.replace('<a class="header__logo" href="./"', '<a class="header__logo" href="../"');

html = html.replace('<!DOCTYPE html>', '<!DOCTYPE html>\n<!-- Сгенерировано tools/build-theme-b.js из index.html — не править вручную -->');

fs.mkdirSync(path.join(root, 'b'), { recursive: true });
fs.writeFileSync(path.join(root, 'b', 'index.html'), html);

const missing = [...html.matchAll(/(?:src|href)="\.\.\/(assets\/[^"]+)"/g)]
  .map(m => m[1])
  .filter(p => !fs.existsSync(path.join(root, p)));
if (missing.length) {
  console.error('Нет файлов:\n' + [...new Set(missing)].join('\n'));
  process.exit(1);
}
console.log('b/index.html обновлён');
