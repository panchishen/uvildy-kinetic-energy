#!/usr/bin/env node
/*
  Типографика видимых текстов index.html — без висячих предлогов и тире (правило проекта):
  - короткие предлоги, союзы и частицы привязываются неразрывным пробелом к следующему слову;
  - перед тире — неразрывный пробел (тире не начинает строку);
  - число не отрывается от единицы (10 кг, 5 %, 7 дней), № — от номера, инициалы — друг от друга;
  - телефон 8 (800) … не разрывается.
  Меняются только текстовые узлы: <script>, <style>, <svg>, <template> и атрибуты не трогаются.
  Повторный запуск ничего не меняет. Запуск из 03-code:  node tools/typograph.js
*/
const fs = require('fs');
const path = require('path');

const NBSP = ' ';
const file = path.resolve(__dirname, '..', 'index.html');
const html = fs.readFileSync(file, 'utf8');

const SHORT = ['в', 'во', 'к', 'ко', 'с', 'со', 'у', 'о', 'об', 'обо', 'и', 'а', 'но', 'на', 'по', 'за',
  'от', 'до', 'не', 'ни', 'из', 'без', 'для', 'при', 'про', 'над', 'под', 'или', 'что', 'как', 'это', 'то'];
const shortRe = new RegExp('(^|[\\s' + NBSP + '(«„"])(' + SHORT.join('|') + ') (?=\\S)', 'giu');
const UNITS = '%|₽|кг|г|см|мм|м|км|мин|ч|сек|дн(?:ей|я|ь)|день|лет|года?|раз|балл(?:ов|а)?|процедур[аы]?|видов|ноч(?:ей|и|ь)|минут|месяц(?:ев|а)?|мес\\.|чел\\.|случа(?:ях|ев)|отзыв(?:ов|ам|а)?|звезд[ыа]?';
const unitRe = new RegExp('(\\d) (?=(?:' + UNITS + ')(?![\\p{L}]))', 'gu');

function typograph(text) {
  let t = text;
  for (let i = 0; i < 2; i++) t = t.replace(shortRe, (m, pre, word) => pre + word + NBSP); // «и в» — подряд
  t = t.replace(/ (—|–)/g, NBSP + '$1');
  t = t.replace(/(\d) (?=\d{3}(?!\d))/g, '$1' + NBSP);                 // 8 000, 43 500
  t = t.replace(unitRe, '$1' + NBSP);
  t = t.replace(/№ (?=\d)/g, '№' + NBSP);
  t = t.replace(/(\p{Lu}\.) (?=\p{Lu}\.)/gu, '$1' + NBSP);                // С. Е.
  t = t.replace(/(\p{Lu}[\p{Ll}]+) (?=\p{Lu}\.\s?\p{Lu}\.)/gu, '$1' + NBSP); // Чернова С. Е.
  t = t.replace(/8 \(800\) /g, '8' + NBSP + '(800)' + NBSP);
  return t;
}

// Разбор: защищённые блоки целиком, у остального — только текст между тегами
const SKIP = /<(script|style|svg|template)\b[\s\S]*?<\/\1>/gi;
let out = '';
let last = 0;
let changed = 0;
const processChunk = chunk => chunk.replace(/>([^<]+)</g, (m, text) => {
  const t = typograph(text);
  if (t !== text) changed++;
  return '>' + t + '<';
});
for (const m of html.matchAll(SKIP)) {
  out += processChunk(html.slice(last, m.index)) + m[0];
  last = m.index + m[0].length;
}
out += processChunk(html.slice(last));

fs.writeFileSync(file, out);
console.log('текстовых узлов изменено: ' + changed);
