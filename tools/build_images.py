"""Сборка картинок страницы из исходников (../../assets/img/*.jpg) в assets/img/*.webp.

Для каждого слота делается две версии:
  name.webp     — 1x: под самый большой размер блока на странице (замер на 1440 / 1024 / 768 / 375),
  name@2x.webp  — 2x: для экранов с повышенной плотностью пикселей (ретина); если исходник
                  не даёт хотя бы +15 % к 1x, версия 2x не делается.
Кадрирование — по центру, в пропорциях текущего слота (как в макете).

Запуск из 03-code:  python tools/build_images.py
Нужен Pillow с поддержкой WebP.
"""
import json
import os
import sys

from PIL import Image, ImageEnhance, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.normpath(os.path.join(ROOT, '..', 'assets', 'img'))
OUT_DIR = os.path.join(ROOT, 'assets', 'img')
MANIFEST = os.path.join(ROOT, 'tools', 'images.json')

QUALITY = 82
MIN_GAIN = 1.15  # 2x делается, только если он хотя бы на 15 % больше 1x


def center_crop(img, aspect):
    w, h = img.size
    if w / h > aspect:
        nw = round(h * aspect)
        left = (w - nw) // 2
        return img.crop((left, 0, left + nw, h))
    nh = round(w / aspect)
    top = (h - nh) // 2
    return img.crop((0, top, w, top + nh))


def apply_ops(img, ops):
    """Производные кадры (кейсы МРТ 2–3): отражение, вырез в долях, контраст / яркость."""
    for op in ops or []:
        kind = op[0]
        if kind == 'hflip':
            img = ImageOps.mirror(img)
        elif kind == 'crop':  # ('crop', x, y, w, h) в долях от размера
            _, x, y, w, h = op
            W, H = img.size
            img = img.crop((round(x * W), round(y * H), round((x + w) * W), round((y + h) * H)))
        elif kind == 'contrast':
            img = ImageEnhance.Contrast(img).enhance(op[1])
        elif kind == 'brightness':
            img = ImageEnhance.Brightness(img).enhance(op[1])
    return img


def save(img, size, path):
    img.resize(size, Image.LANCZOS).save(path, 'WEBP', quality=QUALITY, method=6)


def main():
    with open(MANIFEST, encoding='utf-8') as f:
        slots = json.load(f)
    report = []
    for slot in slots:
        src_path = os.path.join(SRC_DIR, slot['src'])
        img = Image.open(src_path).convert('RGB')
        img = apply_ops(img, slot.get('ops'))
        aspect = slot['w'] / slot['h']
        img = center_crop(img, aspect)
        max_w = img.size[0]
        need = slot['need']  # нужная ширина в CSS-пикселях (максимум по всем экранам)
        w1 = min(max(need, slot['w']), max_w)
        w2 = min(need * 2, max_w)
        out1 = os.path.join(OUT_DIR, slot['out'] + '.webp')
        out2 = os.path.join(OUT_DIR, slot['out'] + '@2x.webp')
        save(img, (w1, round(w1 / aspect)), out1)
        has2x = w2 >= w1 * MIN_GAIN
        if has2x:
            save(img, (w2, round(w2 / aspect)), out2)
        elif os.path.exists(out2):
            os.remove(out2)
        report.append((slot['out'], w1, w2 if has2x else None))
    with open(os.path.join(ROOT, 'tools', 'images-2x.json'), 'w', encoding='utf-8') as f:
        json.dump(sorted(r[0] for r in report if r[2]), f, ensure_ascii=False, indent=0)
    for name, w1, w2 in report:
        print(f'{name:24} 1x {w1:5}  2x {w2 or "-"}')
    print(f'{len(report)} слотов, с 2x: {sum(1 for r in report if r[2])}')


if __name__ == '__main__':
    sys.exit(main())
